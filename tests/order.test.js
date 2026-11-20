import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryStorage } from '../src/mock/db.js'
import { createMockServer, PAY_TIMEOUT_MS } from '../src/mock/server.js'
import { mulberry32 } from '../src/mock/seed.js'

let storage, clock, api

const make = () => createMockServer({ storage, now: () => clock, random: mulberry32(7) })

beforeEach(() => {
  storage = createMemoryStorage()
  clock = Date.UTC(2026, 10, 20, 2, 0, 0)
  api = make()
})

const create = (goodsId = 'g001', quantity = 1) => api.handle('POST', '/orders/create', { goodsId, quantity })
const expectErr = (fn, code) => {
  try {
    fn()
  } catch (e) {
    expect(e.name).toBe('ApiError')
    expect(e.code).toBe(code)
    return e
  }
  throw new Error('expected ApiError')
}

describe('下单', () => {
  it('新订单是待付款，金额 = 单价 × 数量，15 分钟后过期', () => {
    const g = api.handle('GET', '/goods/detail', { id: 'g002' })
    const o = create('g002', 3)
    expect(o.status).toBe('pending')
    expect(o.amount).toBe(g.price * 3)
    expect(Number.isInteger(o.amount)).toBe(true)
    expect(o.expireAt - o.createdAt).toBe(PAY_TIMEOUT_MS)
    expect(o.deliverables).toEqual([])
  })

  it('数量越界、商品不存在都拒绝', () => {
    expectErr(() => create('g001', 0), 400)
    expectErr(() => create('g001', 6), 400)
    expectErr(() => create('g001', 1.5), 400)
    expectErr(() => create('nope', 1), 404)
  })
})

describe('状态流转', () => {
  it('待付款 → 支付 → 已完成，并按数量生成交付内容', () => {
    const o = create('g001', 2)
    const paid = api.handle('POST', '/orders/pay', { orderId: o.id })
    expect(paid.status).toBe('completed')
    expect(paid.paidAt).toBe(clock)
    expect(paid.deliverables).toHaveLength(2)
    expect(paid.deliverables[0].fields[0].label).toBe('兑换码')
    expect(paid.deliverables[0].fields[0].value).toMatch(/^[A-Z0-9]{4}(-[A-Z0-9]{4}){3}$/)
  })

  it('下载链接类、账号类商品交付两项内容', () => {
    const link = api.handle('POST', '/orders/pay', { orderId: create('g046').id }) // c4 在线课程
    expect(link.deliverables[0].fields.map((f) => f.label)).toEqual(['下载链接', '提取码'])
    const text = api.handle('POST', '/orders/pay', { orderId: create('g120').id }) // c8 账号服务
    expect(text.deliverables[0].fields.map((f) => f.label)).toEqual(['账号', '初始密码'])
  })

  it('重复支付被拒绝', () => {
    const o = create()
    api.handle('POST', '/orders/pay', { orderId: o.id })
    expectErr(() => api.handle('POST', '/orders/pay', { orderId: o.id }), 409)
  })

  it('待付款可取消；取消后不能再支付或退款', () => {
    const o = create()
    const c = api.handle('POST', '/orders/cancel', { orderId: o.id })
    expect(c.status).toBe('cancelled')
    expect(c.cancelReason).toBe('用户主动取消')
    expectErr(() => api.handle('POST', '/orders/pay', { orderId: o.id }), 409)
    expectErr(() => api.handle('POST', '/orders/refund', { orderId: o.id }), 409)
  })

  it('已完成可退款；待付款不能退款；已完成不能取消；已退款是终态', () => {
    const o = create()
    expectErr(() => api.handle('POST', '/orders/refund', { orderId: o.id }), 409)
    api.handle('POST', '/orders/pay', { orderId: o.id })
    expectErr(() => api.handle('POST', '/orders/cancel', { orderId: o.id }), 409)
    const r = api.handle('POST', '/orders/refund', { orderId: o.id, reason: '买错了' })
    expect(r.status).toBe('refunded')
    expect(r.refundReason).toBe('买错了')
    expectErr(() => api.handle('POST', '/orders/refund', { orderId: o.id }), 409)
    expectErr(() => api.handle('POST', '/orders/pay', { orderId: o.id }), 409)
  })

  it('订单不存在返回 404', () => {
    expectErr(() => api.handle('POST', '/orders/pay', { orderId: 'x' }), 404)
    expectErr(() => api.handle('GET', '/orders/detail', { id: 'x' }), 404)
  })
})

describe('超时', () => {
  it('差 1 毫秒到期还能付；到期后读订单即变已取消，再付被拒', () => {
    const a = create()
    const b = create('g002')
    clock += PAY_TIMEOUT_MS - 1
    expect(api.handle('POST', '/orders/pay', { orderId: a.id }).status).toBe('completed')
    clock += 1
    const got = api.handle('GET', '/orders/detail', { id: b.id })
    expect(got.status).toBe('cancelled')
    expect(got.cancelReason).toMatch(/超时/)
    expect(got.cancelledAt).toBe(b.expireAt)
    expectErr(() => api.handle('POST', '/orders/pay', { orderId: b.id }), 409)
  })
})

describe('列表与统计', () => {
  it('按状态筛选、按时间倒序、分页', () => {
    const ids = []
    for (let i = 0; i < 12; i++) {
      clock += 1000
      ids.push(create(`g00${(i % 9) + 1}`).id)
    }
    api.handle('POST', '/orders/pay', { orderId: ids[0] })
    api.handle('POST', '/orders/pay', { orderId: ids[1] })
    api.handle('POST', '/orders/refund', { orderId: ids[1] })
    api.handle('POST', '/orders/cancel', { orderId: ids[2] })

    const p1 = api.handle('GET', '/orders/list', { status: 'all', page: 1, size: 10 })
    expect(p1.total).toBe(12)
    expect(p1.list).toHaveLength(10)
    expect(p1.hasMore).toBe(true)
    expect(p1.list[0].id).toBe(ids[11]) // 最新的在前
    const p2 = api.handle('GET', '/orders/list', { status: 'all', page: 2, size: 10 })
    expect(p2.list).toHaveLength(2)
    expect(p2.hasMore).toBe(false)

    expect(api.handle('GET', '/orders/list', { status: 'pending' }).total).toBe(9)
    expect(api.handle('GET', '/orders/list', { status: 'completed' }).list.map((o) => o.id)).toEqual([ids[0]])
    expect(api.handle('GET', '/orders/counts')).toEqual({ all: 12, pending: 9, completed: 1, cancelled: 1, refunded: 1 })
  })

  it('订单落在存储里，重新创建服务（= 刷新页面）后还在；重置后清空', () => {
    const o = create()
    api = make()
    expect(api.handle('GET', '/orders/detail', { id: o.id }).status).toBe('pending')
    api.handle('POST', '/dev/reset')
    expect(api.handle('GET', '/orders/counts').all).toBe(0)
  })

  it('返回的是副本，改它不影响存储', () => {
    const o = create()
    o.status = 'completed'
    expect(api.handle('GET', '/orders/detail', { id: o.id }).status).toBe('pending')
  })
})

describe('个人信息', () => {
  it('能改昵称等字段，id 不可改，非法值拒绝', () => {
    const p = api.handle('POST', '/user/profile', { nickname: '  阿星 ', phone: '13800000000', id: 'hack' })
    expect(p.nickname).toBe('阿星')
    expect(p.phone).toBe('13800000000')
    expect(p.id).toBe('10001')
    expectErr(() => api.handle('POST', '/user/profile', { nickname: '' }), 400)
    expectErr(() => api.handle('POST', '/user/profile', { phone: '123' }), 400)
    expectErr(() => api.handle('POST', '/user/profile', { email: 'a@b' }), 400)
    expectErr(() => api.handle('POST', '/user/profile', { nickname: '一二三四五六七八九十十一十' }), 400)
    expect(api.handle('GET', '/user/profile').nickname).toBe('阿星')
  })
})

describe('商品', () => {
  it('120 件商品、8 个分类，推荐流分页拼起来不重不漏', () => {
    expect(api.handle('GET', '/categories')).toHaveLength(8)
    const seen = []
    let page = 1
    let res
    do {
      res = api.handle('GET', '/goods/feed', { page, size: 10 })
      seen.push(...res.list.map((g) => g.id))
      page += 1
    } while (res.hasMore)
    expect(seen).toHaveLength(120)
    expect(new Set(seen).size).toBe(120)
  })

  it('分类流只含该分类', () => {
    const res = api.handle('GET', '/goods/feed', { categoryId: 'c3', page: 1, size: 50 })
    expect(res.total).toBe(15)
    expect(res.list.every((g) => g.categoryId === 'c3')).toBe(true)
  })

  it('商品数据跨实例稳定（固定种子）', () => {
    const a = api.handle('GET', '/goods/feed', { page: 1 }).list.map((g) => [g.id, g.price, g.image.h])
    const b = make().handle('GET', '/goods/feed', { page: 1 }).list.map((g) => [g.id, g.price, g.image.h])
    expect(a).toEqual(b)
  })
})
