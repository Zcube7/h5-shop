import { get, post } from './request'

/** 下单，返回待付款的订单 */
export const createOrder = ({ goodsId, quantity, remark }) => post('/orders/create', { goodsId, quantity, remark })

/** 支付。mock 模式下 = 模拟扣款成功 + 支付回调；返回已完成（含交付内容）的订单 */
export const payOrder = (orderId) => post('/orders/pay', { orderId })

export const cancelOrder = (orderId) => post('/orders/cancel', { orderId })

export const refundOrder = (orderId, reason) => post('/orders/refund', { orderId, reason })

/** 订单列表（分页）。status: all | pending | completed | cancelled | refunded */
export const listOrders = ({ status = 'all', page = 1, size = 10 } = {}, opts) =>
  get('/orders/list', { status, page, size }, opts)

export const getOrder = (id) => get('/orders/detail', { id })

/** 各状态订单数：{ all, pending, completed, cancelled, refunded } */
export const getOrderCounts = () => get('/orders/counts', undefined, { silent: true })
