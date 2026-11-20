<script setup>
import { nextTick, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import OrderCard from '@/components/OrderCard.vue'
import { listOrders } from '@/api/order'
import { ORDER_TABS } from '@/constants/order'
import { goBack } from '@/utils/nav'

const route = useRoute()
const router = useRouter()

const validKeys = ORDER_TABS.map((t) => t.key)
const active = ref(validKeys.includes(route.query.status) ? route.query.status : 'all')

const listRef = ref(null)
const list = ref([])
const loading = ref(false)
const finished = ref(false)
const error = ref(false)
const refreshing = ref(false)

let page = 1
let seq = 0 // 切 Tab 时丢弃上一个 Tab 还没回来的请求

async function onLoad() {
  const my = ++seq
  try {
    const res = await listOrders({ status: active.value, page }, { silent: true })
    if (my !== seq) return
    list.value = page === 1 ? res.list : list.value.concat(res.list)
    page += 1
    finished.value = !res.hasMore
  } catch {
    if (my === seq) error.value = true
  } finally {
    if (my === seq) {
      loading.value = false
      refreshing.value = false
    }
  }
}

function reset() {
  seq += 1
  page = 1
  list.value = []
  finished.value = false
  error.value = false
  loading.value = false
  nextTick(() => listRef.value?.check())
}

function onTab(name) {
  router.replace({ path: '/orders', query: { status: name } })
  window.scrollTo({ top: 0 })
  reset()
}

const onRefresh = () => reset()

// 卡片上做了操作（取消/退款）后，就地更新；不再属于当前 Tab 的移出列表
function onChanged(updated) {
  const i = list.value.findIndex((o) => o.id === updated.id)
  if (i < 0) return
  if (active.value !== 'all' && updated.status !== active.value) list.value.splice(i, 1)
  else list.value.splice(i, 1, updated)
}
</script>

<template>
  <div class="order-list">
    <van-nav-bar title="我的订单" left-arrow fixed placeholder @click-left="goBack(router, '/mine')" />
    <van-tabs v-model:active="active" sticky :offset-top="46" @change="onTab">
      <van-tab v-for="t in ORDER_TABS" :key="t.key" :name="t.key" :title="t.title" />
    </van-tabs>

    <van-pull-refresh v-model="refreshing" class="body" @refresh="onRefresh">
      <van-list
        ref="listRef"
        v-model:loading="loading"
        v-model:error="error"
        :finished="finished"
        :finished-text="list.length ? '没有更多了' : ''"
        error-text="加载失败，点击重试"
        @load="onLoad"
      >
        <OrderCard v-for="o in list" :key="o.id" :order="o" @changed="onChanged" />
      </van-list>
      <van-empty v-if="finished && !list.length" image="search" description="暂无订单">
        <van-button round type="primary" to="/home">去逛逛</van-button>
      </van-empty>
    </van-pull-refresh>
  </div>
</template>

<style scoped>
.order-list {
  min-height: 100vh;
}
.body {
  min-height: calc(100vh - 90px);
}
</style>
