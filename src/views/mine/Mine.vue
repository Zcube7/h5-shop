<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import UserAvatar from '@/components/UserAvatar.vue'
import { getOrderCounts } from '@/api/order'
import { resetMockData } from '@/api/user'
import { USE_MOCK } from '@/config'
import { useUserStore } from '@/stores/user'
import { maskPhone } from '@/utils/format'

const router = useRouter()
const user = useUserStore()
const profile = computed(() => user.profile)
const counts = ref({ all: 0, pending: 0, completed: 0, refunded: 0 })

async function refresh() {
  const [, c] = await Promise.all([user.fetch().catch(() => null), getOrderCounts().catch(() => null)])
  if (c) counts.value = c
}
onMounted(refresh)

const badge = (n) => (n > 0 ? n : undefined)

async function onReset() {
  try {
    await showConfirmDialog({ title: '重置模拟数据', message: '会清空本机保存的所有订单和个人信息，确定吗？' })
  } catch {
    return
  }
  await resetMockData()
  await refresh()
  showToast('已重置')
}
</script>

<template>
  <div class="tab-page mine">
    <div class="head" @click="router.push('/mine/profile')">
      <UserAvatar :name="profile?.nickname || ''" :color="profile?.avatarColor" :size="60" />
      <div class="who">
        <div class="name">{{ profile?.nickname || '加载中…' }}</div>
        <div class="meta">
          ID {{ profile?.id }} · {{ profile?.phone ? maskPhone(profile.phone) : '未绑定手机' }}
        </div>
        <div v-if="profile?.bio" class="bio">{{ profile.bio }}</div>
      </div>
      <van-icon name="arrow" class="arrow" />
    </div>

    <div class="card orders">
      <div class="orders-head">
        <span class="card-title">我的订单</span>
        <span class="all" @click="router.push('/orders')">全部订单 <van-icon name="arrow" /></span>
      </div>
      <van-grid :border="false" :column-num="3">
        <van-grid-item icon="pending-payment" text="待付款" :badge="badge(counts.pending)" to="/orders?status=pending" />
        <van-grid-item icon="passed" text="已完成" to="/orders?status=completed" />
        <van-grid-item icon="after-sale" text="已退款" to="/orders?status=refunded" />
      </van-grid>
    </div>

    <van-cell-group inset class="menu">
      <van-cell title="个人信息" icon="contact-o" is-link to="/mine/profile" />
      <van-cell title="全部订单" icon="orders-o" is-link :value="`${counts.all} 单`" to="/orders" />
      <van-cell title="联系客服" icon="service-o" is-link @click="showToast('演示版暂无客服')" />
      <van-cell v-if="USE_MOCK" title="重置模拟数据" icon="replay" is-link @click="onReset" />
    </van-cell-group>

    <p class="foot">演示版 v0.1 · 数据只保存在本机浏览器</p>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 28px 18px 40px;
  color: #fff;
  background: linear-gradient(135deg, var(--brand), var(--brand-2));
}
.who {
  flex: 1;
  min-width: 0;
}
.name {
  font-size: 19px;
  font-weight: 600;
}
.meta {
  margin-top: 4px;
  font-size: 12px;
  opacity: 0.88;
}
.bio {
  margin-top: 4px;
  overflow: hidden;
  font-size: 12px;
  white-space: nowrap;
  text-overflow: ellipsis;
  opacity: 0.88;
}
.arrow {
  opacity: 0.8;
}
.orders {
  position: relative;
  margin-top: -24px;
  padding: 12px 4px 4px;
}
.orders-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
}
.orders-head .card-title {
  margin: 0;
}
.all {
  font-size: 12px;
  color: var(--text-3);
}
.menu {
  margin-top: 10px;
}
.foot {
  margin: 24px 0;
  font-size: 12px;
  text-align: center;
  color: var(--text-3);
}
</style>
