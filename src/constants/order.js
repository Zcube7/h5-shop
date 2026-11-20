// 订单状态（虚拟商品：付款即自动交付，没有发货/收货环节）
export const ORDER_STATUS = {
  PENDING: 'pending', // 待付款
  COMPLETED: 'completed', // 已完成（已自动交付）
  CANCELLED: 'cancelled', // 已取消（主动取消或超时）
  REFUNDED: 'refunded', // 已退款
}

export const STATUS_META = {
  pending: { text: '待付款', title: '等待付款', color: '#ff8f1f' },
  completed: { text: '已完成', title: '交易完成', color: '#07c160' },
  cancelled: { text: '已取消', title: '订单已取消', color: '#969799' },
  refunded: { text: '已退款', title: '已退款', color: '#1989fa' },
}

// 订单列表顶部的筛选 Tab；「已取消」只出现在「全部」里
export const ORDER_TABS = [
  { key: 'all', title: '全部' },
  { key: 'pending', title: '待付款' },
  { key: 'completed', title: '已完成' },
  { key: 'refunded', title: '已退款' },
]

// 每个状态下用户能做的操作（页面据此显示按钮；真正的校验在服务端）
export const STATUS_ACTIONS = {
  pending: ['cancel', 'pay'],
  completed: ['refund', 'rebuy'],
  cancelled: ['rebuy'],
  refunded: ['rebuy'],
}

export const DELIVER_TYPE_TEXT = {
  code: '兑换码',
  link: '下载链接',
  text: '账号信息',
}
