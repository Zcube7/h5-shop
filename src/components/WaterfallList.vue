<script setup>
// 双列瀑布流 + 滚到底自动加载下一页。首页、分类页共用。
// van-list 会自动找最近的可滚动父元素来判断「是否到底」。
import { nextTick, ref, watch } from 'vue'
import { appendToColumns, createColumns, estimateCardHeight } from '@/utils/waterfall'
import GoodsCard from './GoodsCard.vue'

const props = defineProps({
  /** (page: number) => Promise<{ list: any[], hasMore: boolean }> */
  fetcher: { type: Function, required: true },
  /** 变化时清空重来（比如切换分类） */
  resetKey: { type: [String, Number], default: '' },
})

const GAP = 8 // 和样式里的间距保持一致
const CARD_INFO_H = 36 + 4 + 18 + 6 + 20 + 18 + GAP // GoodsCard 文字区高度 + 卡片间距

const rootEl = ref(null)
const listRef = ref(null)
const columns = ref(createColumns())
const loading = ref(false)
const finished = ref(false)
const error = ref(false)
const empty = ref(false)

let page = 1
let seq = 0 // 每次请求/重置都 +1，用来丢弃过期的返回（快速切分类时）

const colWidth = () => {
  const w = rootEl.value?.clientWidth
  return w ? (w - GAP * 3) / 2 : 170
}

async function onLoad() {
  const my = ++seq
  try {
    const res = await props.fetcher(page)
    if (my !== seq) return
    const w = colWidth()
    columns.value = appendToColumns(columns.value, res.list, (it) => estimateCardHeight(it, w, CARD_INFO_H))
    empty.value = page === 1 && res.list.length === 0
    page += 1
    finished.value = !res.hasMore
  } catch {
    if (my === seq) error.value = true
  } finally {
    if (my === seq) loading.value = false
  }
}

function reset() {
  seq += 1
  page = 1
  columns.value = createColumns()
  finished.value = false
  error.value = false
  empty.value = false
  loading.value = false
  nextTick(() => listRef.value?.check())
}

watch(() => props.resetKey, reset)
defineExpose({ reset })
</script>

<template>
  <div ref="rootEl" class="waterfall">
    <van-list
      ref="listRef"
      v-model:loading="loading"
      v-model:error="error"
      :finished="finished"
      :finished-text="empty ? '' : '没有更多了'"
      error-text="加载失败，点击重试"
      @load="onLoad"
    >
      <div class="cols">
        <div v-for="(col, i) in columns" :key="i" class="col">
          <GoodsCard v-for="g in col.items" :key="g.id" :goods="g" />
        </div>
      </div>
      <van-empty v-if="empty" image="search" description="这里还没有商品" />
    </van-list>
  </div>
</template>

<style scoped>
.cols {
  display: flex;
  gap: 8px;
  padding: 0 8px;
  align-items: flex-start;
}
.col {
  flex: 1;
  min-width: 0;
}
</style>
