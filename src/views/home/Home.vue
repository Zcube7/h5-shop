<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import WaterfallList from '@/components/WaterfallList.vue'
import { useKeepScroll } from '@/composables/useKeepScroll'
import { getBanners, getGoodsFeed } from '@/api/goods'
import { SHOP_NAME } from '@/config'

defineOptions({ name: 'Home' }) // keep-alive 按名字缓存

const router = useRouter()
const scrollEl = ref(null)
useKeepScroll(scrollEl)

const banners = ref([])
onMounted(async () => {
  banners.value = await getBanners().catch(() => [])
})

function openBanner(b) {
  if (b.link?.type === 'goods') router.push(`/goods/${b.link.id}`)
  else if (b.link?.type === 'category') router.push({ path: '/category', query: { cid: b.link.id } })
}

const fetchFeed = (page) => getGoodsFeed({ page, size: 10 }, { silent: true })
</script>

<template>
  <div ref="scrollEl" class="tab-page home">
    <header class="home-header">
      <span class="logo">{{ SHOP_NAME }}</span>
      <span class="slogan">虚拟好物 · 付款秒发货</span>
    </header>

    <div class="banner-wrap">
      <van-swipe v-if="banners.length" class="banner" :autoplay="3000" indicator-color="#fff" lazy-render>
        <van-swipe-item v-for="b in banners" :key="b.id" @click="openBanner(b)">
          <img :src="b.image" :alt="b.title" />
        </van-swipe-item>
      </van-swipe>
      <div v-else class="banner banner-skeleton" />
    </div>

    <div class="section-title">为你推荐</div>
    <WaterfallList :fetcher="fetchFeed" />
  </div>
</template>

<style scoped>
.home-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 12px 16px 4px;
  background: linear-gradient(180deg, #fff1eb, var(--page-bg));
}
.logo {
  font-size: 20px;
  font-weight: 700;
  color: var(--brand);
}
.slogan {
  font-size: 12px;
  color: var(--text-3);
}
.banner-wrap {
  padding: 8px 12px 0;
}
.banner {
  overflow: hidden;
  aspect-ratio: 75 / 32;
  border-radius: var(--radius);
  transform: translateZ(0); /* 让 iOS 上圆角裁切生效 */
}
.banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.banner-skeleton {
  background: #e9e9ec;
}
.section-title {
  padding: 14px 16px 10px;
  font-size: 16px;
  font-weight: 600;
}
</style>
