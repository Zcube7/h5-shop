// 模拟后端：按 "METHOD /path" 分发。订单状态机和交付逻辑都在这里，
// 换成真后端后这些规则应由服务端实现，页面只认接口返回的结果。
import { ApiError, ERR } from '../api/errors.js'
import { ORDER_STATUS as S } from '../constants/order.js'
import { AVATAR_COLORS } from '../constants/user.js'
import { createDb, defaultStorage } from './db.js'
import { getCatalog, getDetailImages, getGoodsDescription } from './seed.js'

export const PAY_TIMEOUT_MS = 15 * 60 * 1000

// 允许的状态跳转
export const TRANSITIONS = {
  [S.PENDING]: [S.COMPLETED, S.CANCELLED],
  [S.COMPLETED]: [S.REFUNDED],
  [S.CANCELLED]: [],
  [S.REFUNDED]: [],
}

const DEFAULT_PROFILE = {
  id: '10001',
  nickname: '小店顾客',
  avatarColor: AVATAR_COLORS[0],
  phone: '',
  email: '',
  bio: '',
  joinedAt: Date.UTC(2026, 0, 1),
}

const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)))
const fail = (code, msg) => {
  throw new ApiError(code, msg)
}

export function createMockServer({ storage = defaultStorage(), now = () => Date.now(), random = Math.random } = {}) {
  const db = createDb(storage)
  const catalog = getCatalog()

  const randStr = (len, chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789') =>
    Array.from({ length: len }, () => chars[Math.floor(random() * chars.length)]).join('')

  // ---------- 订单存取 ----------
  const loadOrders = () => db.load('orders', [])
  const saveOrders = (orders) => db.save('orders', orders)

  // 读订单时顺手把超时未付的改成已取消（假数据里不需要定时器）
  function settleExpired(order) {
    if (order.status === S.PENDING && now() >= order.expireAt) {
      order.status = S.CANCELLED
      order.cancelledAt = order.expireAt
      order.cancelReason = '超时未支付，系统自动取消'
      return true
    }
    return false
  }

  function allOrders() {
    const orders = loadOrders()
    let changed = false
    for (const o of orders) changed = settleExpired(o) || changed
    if (changed) saveOrders(orders)
    return orders
  }

  function mutateOrder(orderId, fn) {
    const orders = allOrders()
    const order = orders.find((o) => o.id === orderId)
    if (!order) fail(ERR.NOT_FOUND, '订单不存在')
    fn(order)
    saveOrders(orders)
    return order
  }

  function transition(order, to) {
    if (!TRANSITIONS[order.status].includes(to)) {
      const msg = {
        [S.CANCELLED]: '订单已取消',
        [S.REFUNDED]: '订单已退款',
        [S.COMPLETED]: '订单已支付',
        [S.PENDING]: '订单尚未支付',
      }[order.status]
      fail(ERR.STATE, msg)
    }
    order.status = to
  }

  function newOrderId() {
    const d = new Date(now())
    const p = (n, l = 2) => String(n).padStart(l, '0')
    const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
    return `${stamp}${randStr(4, '0123456789')}`
  }

  /**
   * 唯一的交付入口：付款成功后调用，按商品类型生成交付内容。
   * 接真支付后，由支付回调来调用它，页面不用改。
   */
  function deliverOrder(order) {
    const type = order.goods.deliverType
    const groups = []
    for (let i = 0; i < order.quantity; i++) {
      let fields
      if (type === 'code') {
        fields = [{ label: '兑换码', value: [4, 4, 4, 4].map((n) => randStr(n)).join('-') }]
      } else if (type === 'link') {
        fields = [
          { label: '下载链接', value: `https://pan.example.com/s/${randStr(10, 'abcdefghijkmnpqrstuvwxyz23456789')}` },
          { label: '提取码', value: randStr(4, 'abcdefghijkmnpqrstuvwxyz23456789') },
        ]
      } else {
        fields = [
          { label: '账号', value: `u${randStr(8, '0123456789')}@mail.example.com` },
          { label: '初始密码', value: randStr(10, 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789') },
        ]
      }
      groups.push({ title: order.quantity > 1 ? `第 ${i + 1} 份` : '', fields })
    }
    order.deliverables = groups
    order.deliveredAt = now()
  }

  // ---------- 商品 ----------
  function findGoods(id) {
    const g = catalog.goodsById.get(id)
    if (!g) fail(ERR.NOT_FOUND, '商品不存在或已下架')
    return g
  }

  const toCard = ({ id, categoryId, title, subtitle, price, originPrice, sales, tags, image }) => ({
    id, categoryId, title, subtitle, price, originPrice, sales, tags, image,
  })

  // ---------- 个人信息 ----------
  const loadProfile = () => ({ ...DEFAULT_PROFILE, ...db.load('profile', {}) })

  function validateProfile(p) {
    const nickname = String(p.nickname ?? '').trim()
    if (!nickname) fail(ERR.BAD_REQUEST, '昵称不能为空')
    if (Array.from(nickname).length > 12) fail(ERR.BAD_REQUEST, '昵称最多 12 个字')
    if (p.phone && !/^1\d{10}$/.test(p.phone)) fail(ERR.BAD_REQUEST, '手机号格式不正确')
    if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) fail(ERR.BAD_REQUEST, '邮箱格式不正确')
    if (p.bio && Array.from(p.bio).length > 50) fail(ERR.BAD_REQUEST, '个性签名最多 50 个字')
    if (p.avatarColor && !AVATAR_COLORS.includes(p.avatarColor)) fail(ERR.BAD_REQUEST, '头像颜色不可用')
    return { ...p, nickname }
  }

  // ---------- 路由表 ----------
  const routes = {
    'GET /banners': () => catalog.banners,

    'GET /categories': () => catalog.categories,

    'GET /goods/feed': ({ categoryId, page = 1, size = 10 } = {}) => {
      const source = categoryId ? catalog.goods.filter((g) => g.categoryId === categoryId) : catalog.recommend
      const p = Math.max(1, Number(page))
      const s = Math.min(50, Math.max(1, Number(size)))
      const list = source.slice((p - 1) * s, p * s).map(toCard)
      return { list, page: p, size: s, total: source.length, hasMore: p * s < source.length }
    },

    'GET /goods/detail': ({ id } = {}) => {
      const g = findGoods(id)
      const cat = catalog.categories.find((c) => c.id === g.categoryId)
      return {
        ...toCard(g),
        categoryName: cat?.name || '',
        stock: g.stock,
        limit: g.limit,
        deliverType: g.deliverType,
        images: getDetailImages(g),
        description: getGoodsDescription(g, cat?.name || ''),
        notice: [
          '付款成功后系统自动发货，可在「我的 - 订单」里查看交付内容。',
          '虚拟商品发货后如未使用，可在订单详情申请退款。',
          '本页面为演示数据，不会真实扣款。',
        ],
      }
    },

    'POST /orders/create': ({ goodsId, quantity = 1, remark = '' } = {}) => {
      const g = findGoods(goodsId)
      const qty = Number(quantity)
      if (!Number.isInteger(qty) || qty < 1 || qty > g.limit) fail(ERR.BAD_REQUEST, `购买数量需在 1 ~ ${g.limit} 之间`)
      if (Array.from(String(remark)).length > 50) fail(ERR.BAD_REQUEST, '备注最多 50 个字')
      const t = now()
      const order = {
        id: newOrderId(),
        status: S.PENDING,
        goods: { id: g.id, title: g.title, image: g.image, price: g.price, deliverType: g.deliverType },
        quantity: qty,
        amount: g.price * qty,
        remark: String(remark).trim(),
        createdAt: t,
        expireAt: t + PAY_TIMEOUT_MS,
        paidAt: null,
        deliveredAt: null,
        cancelledAt: null,
        cancelReason: '',
        refundedAt: null,
        refundReason: '',
        deliverables: [],
      }
      const orders = allOrders()
      orders.unshift(order)
      saveOrders(orders)
      return order
    },

    // 模拟「支付渠道扣款成功 + 支付回调」：校验 → 已完成 → 交付
    'POST /orders/pay': ({ orderId } = {}) =>
      mutateOrder(orderId, (o) => {
        transition(o, S.COMPLETED)
        o.paidAt = now()
        deliverOrder(o)
      }),

    'POST /orders/cancel': ({ orderId } = {}) =>
      mutateOrder(orderId, (o) => {
        transition(o, S.CANCELLED)
        o.cancelledAt = now()
        o.cancelReason = '用户主动取消'
      }),

    'POST /orders/refund': ({ orderId, reason = '' } = {}) =>
      mutateOrder(orderId, (o) => {
        transition(o, S.REFUNDED)
        o.refundedAt = now()
        o.refundReason = String(reason).trim() || '用户申请退款'
      }),

    'GET /orders/list': ({ status = 'all', page = 1, size = 10 } = {}) => {
      const source = allOrders().filter((o) => status === 'all' || o.status === status)
      const p = Math.max(1, Number(page))
      const s = Math.min(50, Math.max(1, Number(size)))
      return { list: source.slice((p - 1) * s, p * s), page: p, size: s, total: source.length, hasMore: p * s < source.length }
    },

    'GET /orders/detail': ({ id } = {}) => {
      const o = allOrders().find((x) => x.id === id)
      if (!o) fail(ERR.NOT_FOUND, '订单不存在')
      return o
    },

    'GET /orders/counts': () => {
      const counts = { all: 0, [S.PENDING]: 0, [S.COMPLETED]: 0, [S.CANCELLED]: 0, [S.REFUNDED]: 0 }
      for (const o of allOrders()) {
        counts.all += 1
        counts[o.status] += 1
      }
      return counts
    },

    'GET /user/profile': () => loadProfile(),

    'POST /user/profile': (patch = {}) => {
      const allowed = ['nickname', 'avatarColor', 'phone', 'email', 'bio']
      const merged = { ...loadProfile() }
      for (const k of allowed) if (k in patch) merged[k] = patch[k]
      const valid = validateProfile(merged)
      const { id, joinedAt, ...rest } = valid
      db.save('profile', rest)
      return loadProfile()
    },

    // 开发辅助：清空本地订单和个人信息
    'POST /dev/reset': () => {
      db.resetAll()
      return true
    },
  }

  return {
    handle(method, path, data) {
      const fn = routes[`${method.toUpperCase()} ${path}`]
      if (!fn) fail(ERR.NOT_FOUND, `接口不存在：${method} ${path}`)
      return clone(fn(data))
    },
  }
}

let instance = null
export function getMockServer() {
  if (!instance) instance = createMockServer()
  return instance
}
