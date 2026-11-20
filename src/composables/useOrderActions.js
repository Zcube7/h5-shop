import { showConfirmDialog, showToast } from 'vant'
import { useRouter } from 'vue-router'
import { cancelOrder, refundOrder } from '@/api/order'

/**
 * 订单列表和订单详情共用的操作。
 * cancel / refund 返回更新后的订单；用户点了「再想想」或接口失败（已弹过提示）返回 null。
 */
export function useOrderActions() {
  const router = useRouter()

  async function confirm(title, message, confirmButtonText) {
    try {
      await showConfirmDialog({ title, message, confirmButtonText, cancelButtonText: '再想想' })
      return true
    } catch {
      return false
    }
  }

  async function cancel(order) {
    if (!(await confirm('取消订单', '确定要取消这个订单吗？', '取消订单'))) return null
    try {
      const o = await cancelOrder(order.id)
      showToast('订单已取消')
      return o
    } catch {
      return null
    }
  }

  async function refund(order) {
    if (!(await confirm('申请退款', '退款后，这个订单的兑换码 / 链接将失效。确定退款吗？', '确定退款'))) return null
    try {
      const o = await refundOrder(order.id)
      showToast('退款成功')
      return o
    } catch {
      return null
    }
  }

  // 去订单详情页并自动弹出收银台
  const pay = (order) => router.push({ path: `/order/${order.id}`, query: { pay: '1' } })

  const rebuy = (order) =>
    router.push({ path: '/order/confirm', query: { goodsId: order.goods.id, qty: String(order.quantity) } })

  const view = (order) => router.push(`/order/${order.id}`)

  return { cancel, refund, pay, rebuy, view }
}
