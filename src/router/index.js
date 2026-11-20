import { createRouter, createWebHashHistory } from 'vue-router'
import { SHOP_NAME } from '@/config'
import Home from '@/views/home/Home.vue'

// meta.tabbar = 显示底部切换栏的一级页面
const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', name: 'Home', component: Home, meta: { tabbar: true, title: '首页' } },
  { path: '/category', name: 'Category', component: () => import('@/views/category/Category.vue'), meta: { tabbar: true, title: '分类' } },
  { path: '/mine', name: 'Mine', component: () => import('@/views/mine/Mine.vue'), meta: { tabbar: true, title: '我的' } },
  { path: '/mine/profile', name: 'ProfileEdit', component: () => import('@/views/mine/ProfileEdit.vue'), meta: { title: '个人信息' } },
  { path: '/goods/:id', name: 'GoodsDetail', component: () => import('@/views/goods/GoodsDetail.vue'), meta: { title: '商品详情' } },
  { path: '/order/confirm', name: 'OrderConfirm', component: () => import('@/views/order/OrderConfirm.vue'), meta: { title: '确认订单' } },
  { path: '/orders', name: 'OrderList', component: () => import('@/views/order/OrderList.vue'), meta: { title: '我的订单' } },
  { path: '/order/:id', name: 'OrderDetail', component: () => import('@/views/order/OrderDetail.vue'), meta: { title: '订单详情' } },
  { path: '/:pathMatch(.*)*', redirect: '/home' },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  // 二级页用整页滚动，进来时回到顶部；Tab 页有自己的滚动容器，由 useKeepScroll 负责
  scrollBehavior: () => ({ top: 0 }),
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} - ${SHOP_NAME}` : SHOP_NAME
})

export default router
