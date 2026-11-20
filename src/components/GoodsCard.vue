<script setup>
import { useRouter } from 'vue-router'
import { formatPrice, formatSales } from '@/utils/format'

const props = defineProps({ goods: { type: Object, required: true } })
const router = useRouter()
const open = () => router.push(`/goods/${props.goods.id}`)
</script>

<template>
  <div class="goods-card" @click="open">
    <img
      class="cover"
      :src="goods.image.url"
      :style="{ aspectRatio: `${goods.image.w} / ${goods.image.h}` }"
      loading="lazy"
      :alt="goods.title"
    />
    <div class="body">
      <div class="title ellipsis-2">{{ goods.title }}</div>
      <div class="tags">
        <span class="tag">自动发货</span>
        <span class="sub">{{ goods.subtitle }}</span>
      </div>
      <div class="row">
        <span class="price"><small>¥</small>{{ formatPrice(goods.price) }}</span>
        <span class="sales">已售 {{ formatSales(goods.sales) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 文字区高度固定（标题固定占两行），瀑布流估算的卡片高度才准 */
.goods-card {
  overflow: hidden;
  margin-bottom: 8px;
  background: var(--card-bg);
  border-radius: var(--radius);
}
.cover {
  width: 100%;
  object-fit: cover;
  background: #eee;
}
.body {
  padding: 8px 8px 10px;
}
.title {
  height: 36px;
  font-size: 13px;
  line-height: 18px;
}
.tags {
  display: flex;
  gap: 4px;
  height: 18px;
  margin-top: 4px;
  overflow: hidden;
  font-size: 10px;
  line-height: 16px;
  white-space: nowrap;
}
.tag {
  padding: 0 4px;
  color: var(--brand);
  border: 1px solid currentColor;
  border-radius: 3px;
}
.sub {
  color: var(--text-3);
}
.row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  height: 20px;
  margin-top: 6px;
}
.row .price {
  font-size: 16px;
}
.sales {
  font-size: 11px;
  color: var(--text-3);
}
</style>
