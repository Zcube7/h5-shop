<script setup>
import { computed, onActivated, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import WaterfallList from '@/components/WaterfallList.vue'
import { useKeepScroll } from '@/composables/useKeepScroll'
import { getCategories, getGoodsFeed } from '@/api/goods'

defineOptions({ name: 'Category' })

const route = useRoute()
const router = useRouter()
const scrollEl = ref(null)
const { resetScroll } = useKeepScroll(scrollEl)

const categories = ref([])
const activeCid = ref('')
const activeIndex = computed({
  get: () => Math.max(0, categories.value.findIndex((c) => c.id === activeCid.value)),
  set: (i) => select(categories.value[i]?.id),
})
const activeName = computed(() => categories.value.find((c) => c.id === activeCid.value)?.name || '')

function select(cid) {
  if (!cid || cid === activeCid.value) return
  activeCid.value = cid
  resetScroll()
  // 把当前分类写进地址，刷新或分享链接时还停在这个分类
  if (route.query.cid !== cid) router.replace({ path: '/category', query: { cid } })
}

onMounted(async () => {
  categories.value = await getCategories().catch(() => [])
  const fromQuery = categories.value.find((c) => c.id === route.query.cid)
  select((fromQuery || categories.value[0])?.id)
})

// 从别的页面带 ?cid= 跳进来（比如首页 banner、详情页的分类）时切过去。
// 页面被缓存时这个 watch 仍在跑，所以只在当前就是分类页时响应；
// 点底部 Tab 进来不带 cid，则保持上次的分类。
watch(
  () => route.query.cid,
  (cid) => {
    if (route.name === 'Category' && cid && categories.value.length) select(cid)
  },
)

// 点底部 Tab 回来时地址不带 cid，补上当前分类，刷新页面后还停在这里
onActivated(() => {
  if (activeCid.value && !route.query.cid) router.replace({ path: '/category', query: { cid: activeCid.value } })
})

const fetchFeed = (page) => getGoodsFeed({ categoryId: activeCid.value, page, size: 10 }, { silent: true })
</script>

<template>
  <div class="tab-page category">
    <van-sidebar v-model="activeIndex" class="side">
      <van-sidebar-item v-for="c in categories" :key="c.id" :title="c.name" />
    </van-sidebar>

    <div ref="scrollEl" class="main">
      <div class="main-head">{{ activeName }}</div>
      <WaterfallList v-if="activeCid" :fetcher="fetchFeed" :reset-key="activeCid" />
    </div>
  </div>
</template>

<style scoped>
.category {
  display: flex;
  overflow: hidden; /* 左右两栏各自滚动 */
}
.side {
  flex: none;
  width: 84px;
  height: 100%;
  overflow-y: auto;
  background: var(--van-sidebar-background, #f7f8fa);
}
.main {
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
.main-head {
  padding: 12px 12px 8px;
  font-size: 15px;
  font-weight: 600;
}
</style>
