// 固定种子生成的商品库：8 个分类 × 15 件 = 120 件。刷新页面后 id 和内容都不变。
import { placeholder } from './placeholder.js'

export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// [名称, 基础价(分)] × [规格, 价格倍数]
const CATEGORY_DEFS = [
  {
    id: 'c1', name: '会员订阅', hue: 350, deliverType: 'code',
    bases: [['视频会员', 1500], ['音乐会员', 1200], ['网盘会员', 1000], ['阅读会员', 900], ['有声书会员', 1100]],
    specs: [['月卡', 1], ['季卡', 2.8], ['年卡', 10]],
    slogans: ['全端通用', '到账秒开通', '可叠加续期'],
  },
  {
    id: 'c2', name: '游戏点卡', hue: 265, deliverType: 'code',
    bases: [['通用点卡', 100], ['手游充值卡', 100], ['端游月卡', 100]],
    specs: [['30元', 29], ['50元', 48], ['100元', 96], ['200元', 192], ['500元', 478]],
    slogans: ['官方渠道', '9.6 折', '24 小时自动发卡'],
  },
  {
    id: 'c3', name: '软件激活', hue: 210, deliverType: 'code',
    bases: [['图片编辑器', 3900], ['视频剪辑工具', 5900], ['PDF 工具箱', 2900], ['思维导图', 3500], ['笔记软件', 2500]],
    specs: [['个人版', 1], ['专业版', 2.2], ['终身版', 4.5]],
    slogans: ['正版授权', '一机一码', '免费升级'],
  },
  {
    id: 'c4', name: '在线课程', hue: 160, deliverType: 'link',
    bases: [['Python 入门', 4900], ['Excel 函数实战', 3900], ['PS 零基础', 4500], ['摄影构图课', 5900], ['英语口语课', 6900]],
    specs: [['体验课', 0.2], ['完整课', 1], ['进阶训练营', 2.5]],
    slogans: ['随时随地学', '永久回看', '配套练习'],
  },
  {
    id: 'c5', name: '模板素材', hue: 28, deliverType: 'link',
    bases: [['工作汇报 PPT', 1900], ['简历模板', 990], ['海报模板', 1500], ['Logo 素材', 2900], ['图标包', 1200]],
    specs: [['单套', 1], ['合集', 3], ['年度会员', 8]],
    slogans: ['可商用', '源文件可编辑', '每周上新'],
  },
  {
    id: 'c6', name: '电子书', hue: 45, deliverType: 'link',
    bases: [['经典小说', 600], ['历史读物', 800], ['心理学', 900], ['理财入门', 700], ['编程实战', 1500]],
    specs: [['精选 10 本', 1], ['精选 30 本', 2.5], ['全集', 6]],
    slogans: ['多格式', '支持 Kindle', '高清排版'],
  },
  {
    id: 'c7', name: '字体素材', hue: 190, deliverType: 'link',
    bases: [['手写字体', 2900], ['书法字体', 3900], ['圆体', 2500], ['宋体变体', 2200], ['英文字体', 1900]],
    specs: [['单款', 1], ['10 款合集', 5], ['商用授权', 12]],
    slogans: ['TTF/OTF', '中英文全字库', '设计师精选'],
  },
  {
    id: 'c8', name: '账号服务', hue: 120, deliverType: 'text',
    bases: [['邮箱托管', 990], ['云笔记空间', 690], ['网站域名', 2900], ['图床空间', 590], ['博客主机', 1990]],
    specs: [['1 个月', 1], ['6 个月', 5], ['12 个月', 9]],
    slogans: ['即开即用', '稳定可靠', '7×24 客服'],
  },
]

// 价格取整到 x.90 元的样子
const roundPrice = (cents) => Math.max(90, Math.round(cents / 100) * 100 - 10)

function buildGoods(rng) {
  const goods = []
  let n = 0
  for (const cat of CATEGORY_DEFS) {
    for (const [baseName, basePrice] of cat.bases) {
      for (const [spec, mult] of cat.specs) {
        n += 1
        const id = `g${String(n).padStart(3, '0')}`
        const title = `${baseName} · ${spec}`
        const price = roundPrice(basePrice * mult)
        const originPrice = roundPrice(price * (1.2 + rng() * 0.5))
        const w = 300
        const h = Math.round(w * (1 + rng() * 0.55)) // 宽高比 1 ~ 1.55，瀑布流才有错落
        const slogan = cat.slogans[Math.floor(rng() * cat.slogans.length)]
        const hue = (cat.hue + Math.floor(rng() * 30) - 15 + 360) % 360
        goods.push({
          id,
          categoryId: cat.id,
          title,
          subtitle: slogan,
          price,
          originPrice,
          sales: Math.floor(rng() ** 2 * 30000),
          stock: 999,
          limit: 5, // 每单最多买几件
          deliverType: cat.deliverType,
          tags: ['自动发货', slogan],
          hue,
          image: { url: placeholder({ w, h, hue, title, sub: slogan, mark: cat.name[0] }), w, h },
        })
      }
    }
  }
  return goods
}

// 首页推荐流：所有商品打乱（固定种子，所以每次顺序一样）
function shuffled(list, rng) {
  const arr = list.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function buildBanners(goods) {
  const pick = (id) => goods.find((g) => g.id === id)
  const defs = [
    { title: '会员年卡 限时 8 折', sub: '视频 / 音乐 / 网盘 一站开通', hue: 350, link: { type: 'goods', id: pick('g003').id } },
    { title: '游戏点卡 9.6 折', sub: '24 小时自动发卡', hue: 265, link: { type: 'category', id: 'c2' } },
    { title: '新课上架', sub: 'Python / Excel / PS 零基础', hue: 160, link: { type: 'category', id: 'c4' } },
    { title: '设计素材合集', sub: '模板 · 字体 · 图标 可商用', hue: 28, link: { type: 'category', id: 'c5' } },
  ]
  return defs.map((d, i) => ({
    id: `b${i + 1}`,
    title: d.title,
    image: placeholder({ w: 750, h: 320, hue: d.hue, title: d.title, sub: d.sub, layout: 'banner' }),
    link: d.link,
  }))
}

let cache = null

export function getCatalog() {
  if (cache) return cache
  const rng = mulberry32(20261120)
  const goods = buildGoods(rng)
  cache = {
    categories: CATEGORY_DEFS.map(({ id, name, hue }) => ({ id, name, hue })),
    goods,
    goodsById: new Map(goods.map((g) => [g.id, g])),
    recommend: shuffled(goods, rng),
    banners: buildBanners(goods),
  }
  return cache
}

// 详情页的多张图：主图 + 两张不同色的方图（用到时才生成）
export function getDetailImages(g) {
  const extra = [40, -40].map((d, i) =>
    placeholder({
      w: 600,
      h: 600,
      hue: (g.hue + d + 360) % 360,
      title: g.title,
      sub: i === 0 ? '付款后自动发货' : g.subtitle,
      mark: g.title[0],
    }),
  )
  return [g.image.url, ...extra]
}

export function getGoodsDescription(g, categoryName) {
  return [
    `「${g.title}」属于${categoryName}类虚拟商品，付款成功后系统立即自动交付，无需等待。`,
    `交付方式：${{ code: '兑换码，复制后到对应平台兑换', link: '下载链接 + 提取码', text: '账号与初始密码，登录后请及时修改' }[g.deliverType]}。`,
    `本商品为演示数据，页面中的价格、销量、兑换码均为随机生成。`,
  ]
}
