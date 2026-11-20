<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showImagePreview, showToast } from 'vant'
import { getGoodsDetail } from '@/api/goods'
import { DELIVER_TYPE_TEXT } from '@/constants/order'
import { formatPrice, formatSales } from '@/utils/format'
import { goBack } from '@/utils/nav'

const route = useRoute()
const router = useRouter()

const goods = ref(null)
const loading = ref(true)
const current = ref(0)

onMounted(async () => {
  try {
    goods.value = await getGoodsDetail(route.params.id)
  } catch {
    goods.value = null
  } finally {
    loading.value = false
  }
})

const preview = (i) => showImagePreview({ images: goods.value.images, startPosition: i })
const buy = () => router.push({ path: '/order/confirm', query: { goodsId: goods.value.id } })
</script>

<template>
  <div class="page-with-bar">
    <van-nav-bar title="商品详情" left-arrow fixed placeholder @click-left="goBack(router)" />

    <template v-if="goods">
      <van-swipe class="gallery" :loop="false" @change="current = $event">
        <van-swipe-item v-for="(src, i) in goods.images" :key="i" @click="preview(i)">
          <img :src="src" :alt="goods.title" />
        </van-swipe-item>
        <template #indicator>
          <div class="indicator">{{ current + 1 }}/{{ goods.images.length }}</div>
        </template>
      </van-swipe>

      <div class="card">
        <div class="price-row">
          <span class="price big"><small>¥</small>{{ formatPrice(goods.price) }}</span>
          <span class="origin">¥{{ formatPrice(goods.originPrice) }}</span>
          <span class="sales">已售 {{ formatSales(goods.sales) }}</span>
        </div>
        <h1 class="title">{{ goods.title }}</h1>
        <div class="tags">
          <van-tag v-for="t in goods.tags" :key="t" plain type="primary">{{ t }}</van-tag>
        </div>
      </div>

      <van-cell-group inset>
        <van-cell title="发货" value="付款后自动发货" />
        <van-cell title="交付内容" :value="DELIVER_TYPE_TEXT[goods.deliverType]" />
        <van-cell title="限购" :value="`每单最多 ${goods.limit} 件`" />
        <van-cell title="分类" :value="goods.categoryName" is-link :to="`/category?cid=${goods.categoryId}`" />
      </van-cell-group>

      <div class="card">
        <h3 class="card-title">商品说明</h3>
        <p v-for="(p, i) in goods.description" :key="i" class="para">{{ p }}</p>
      </div>

      <div class="card">
        <h3 class="card-title">购买须知</h3>
        <ol class="notice">
          <li v-for="(n, i) in goods.notice" :key="i">{{ n }}</li>
        </ol>
      </div>

      <van-action-bar safe-area-inset-bottom>
        <van-action-bar-icon icon="home-o" text="首页" to="/home" />
        <van-action-bar-icon icon="service-o" text="客服" @click="showToast('演示版暂无客服')" />
        <van-action-bar-button type="danger" text="立即购买" @click="buy" />
      </van-action-bar>
    </template>

    <van-loading v-else-if="loading" class="state" vertical>加载中...</van-loading>
    <van-empty v-else description="商品不存在或已下架">
      <van-button round type="primary" to="/home">回首页</van-button>
    </van-empty>
  </div>
</template>

<style scoped>
.gallery {
  aspect-ratio: 1;
  background: #fff;
}
.gallery img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.indicator {
  position: absolute;
  right: 12px;
  bottom: 12px;
  padding: 2px 8px;
  font-size: 12px;
  color: #fff;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 10px;
}
.price-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.price.big {
  font-size: 24px;
}
.origin {
  font-size: 12px;
  color: var(--text-3);
  text-decoration: line-through;
}
.sales {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-3);
}
.title {
  margin: 8px 0;
  font-size: 17px;
  line-height: 1.4;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.para {
  margin: 0 0 8px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-2);
}
.notice {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.8;
  color: var(--text-2);
}
.state {
  padding: 80px 0;
}
</style>
