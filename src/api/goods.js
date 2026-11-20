import { get } from './request'

/** 首页轮播：[{ id, title, image, link: { type: 'goods'|'category', id } }] */
export const getBanners = () => get('/banners')

/** 商品分类：[{ id, name }] */
export const getCategories = () => get('/categories')

/**
 * 商品流（分页）。不传 categoryId = 首页推荐
 * @returns {Promise<{list: any[], page: number, size: number, total: number, hasMore: boolean}>}
 */
export const getGoodsFeed = ({ categoryId, page = 1, size = 10 } = {}, opts) =>
  get('/goods/feed', { categoryId, page, size }, opts)

/** 商品详情 */
export const getGoodsDetail = (id) => get('/goods/detail', { id })
