<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import PayPanel from '@/components/PayPanel.vue'
import { getOrder } from '@/api/order'
import { STATUS_ACTIONS, STATUS_META } from '@/constants/order'
import { useOrderActions } from '@/composables/useOrderActions'
import { copyText } from '@/utils/clipboard'
import { formatPrice, formatTime } from '@/utils/format'
import { goBack } from '@/utils/nav'

const route = useRoute()
const router = useRouter()
const actions = useOrderActions()

const order = ref(null)
const loading = ref(true)
const showPay = ref(false)
const remain = ref(0)

const meta = computed(() => STATUS_META[order.value?.status] || {})
const can = (a) => !!order.value && STATUS_ACTIONS[order.value.status].includes(a)
const revoked = computed(() => order.value?.status === 'refunded')

function setOrder(o) {
  order.value = o
  remain.value = o.status === 'pending' ? Math.max(0, o.expireAt - Date.now()) : 0
}

async function load() {
  try {
    setOrder(await getOrder(route.params.id))
  } catch {
    order.value = null
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await load()
  // 从确认订单页 / 订单列表「去支付」过来，自动弹出收银台；随后去掉 ?pay=1，刷新页面不会再弹
  if (route.query.pay === '1') {
    if (order.value?.status === 'pending') showPay.value = true
    router.replace({ path: route.path })
  }
})

function onPaid(o) {
  setOrder(o)
  showToast({ type: 'success', message: '支付成功\n已自动发货' })
  window.scrollTo({ top: 0 })
}

async function run(fn) {
  const updated = await fn(order.value)
  if (updated) setOrder(updated)
}
</script>

<template>
  <div class="page-with-bar">
    <van-nav-bar title="订单详情" left-arrow fixed placeholder @click-left="goBack(router, '/orders')" />

    <template v-if="order">
      <div class="status-head" :style="{ background: meta.color }">
        <div class="st-title">{{ meta.title }}</div>
        <div class="st-sub">
          <template v-if="order.status === 'pending'">
            剩余
            <van-count-down :time="remain" format="mm:ss" class="cd" @finish="load" />
            后订单自动取消
          </template>
          <template v-else-if="order.status === 'completed'">已自动发货，交付内容见下方</template>
          <template v-else-if="order.status === 'cancelled'">{{ order.cancelReason }}</template>
          <template v-else>{{ order.refundReason }} · 款项已原路退回</template>
        </div>
      </div>

      <div v-if="order.deliverables.length" class="card deliver" :class="{ revoked }">
        <h3 class="card-title">
          交付内容
          <van-tag v-if="revoked" type="default">已失效</van-tag>
        </h3>
        <div v-for="(g, gi) in order.deliverables" :key="gi" class="group">
          <div v-if="g.title" class="group-title">{{ g.title }}</div>
          <div v-for="f in g.fields" :key="f.label" class="field">
            <span class="label">{{ f.label }}</span>
            <span class="value">{{ f.value }}</span>
            <van-button v-if="!revoked" size="mini" round plain type="primary" @click="copyText(f.value)">复制</van-button>
          </div>
        </div>
      </div>

      <div class="card goods" @click="router.push(`/goods/${order.goods.id}`)">
        <img :src="order.goods.image.url" alt="" />
        <div class="info">
          <div class="title ellipsis-2">{{ order.goods.title }}</div>
          <div class="muted">¥{{ formatPrice(order.goods.price) }} × {{ order.quantity }}</div>
        </div>
        <div class="amount">
          <span class="muted">实付</span>
          <span class="price"><small>¥</small>{{ formatPrice(order.amount) }}</span>
        </div>
      </div>

      <van-cell-group inset class="info-cells">
        <van-cell title="订单编号" :value="order.id" is-link arrow-direction="" @click="copyText(order.id, '订单号已复制')">
          <template #right-icon><van-icon name="description-o" class="copy-icon" /></template>
        </van-cell>
        <van-cell title="下单时间" :value="formatTime(order.createdAt)" />
        <van-cell v-if="order.paidAt" title="支付时间" :value="formatTime(order.paidAt)" />
        <van-cell v-if="order.paidAt" title="支付方式" value="模拟钱包" />
        <van-cell v-if="order.cancelledAt" title="取消时间" :value="formatTime(order.cancelledAt)" />
        <van-cell v-if="order.refundedAt" title="退款时间" :value="formatTime(order.refundedAt)" />
        <van-cell v-if="order.remark" title="备注" :value="order.remark" />
      </van-cell-group>

      <div class="fixed-bottom-bar">
        <van-button v-if="can('cancel')" round @click="run(actions.cancel)">取消订单</van-button>
        <van-button v-if="can('pay')" round type="primary" @click="showPay = true">去支付</van-button>
        <van-button v-if="can('refund')" round @click="run(actions.refund)">申请退款</van-button>
        <van-button v-if="can('rebuy')" round type="primary" plain @click="actions.rebuy(order)">再次购买</van-button>
      </div>
    </template>

    <van-loading v-else-if="loading" class="state" vertical>加载中...</van-loading>
    <van-empty v-else description="订单不存在">
      <van-button round type="primary" to="/orders">查看全部订单</van-button>
    </van-empty>

    <PayPanel v-model:show="showPay" :order="order" @success="onPaid" @expired="load" />
  </div>
</template>

<style scoped>
.status-head {
  padding: 22px 20px 26px;
  color: #fff;
}
.st-title {
  font-size: 20px;
  font-weight: 600;
}
.st-sub {
  margin-top: 6px;
  font-size: 13px;
  opacity: 0.92;
}
.cd {
  display: inline-block;
  --van-count-down-text-color: #fff;
  --van-count-down-font-size: 13px;
  font-weight: 600;
}
.deliver .card-title {
  display: flex;
  align-items: center;
  gap: 6px;
}
.group + .group {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #ebedf0;
}
.group-title {
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--text-3);
}
.field {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
}
.field .label {
  flex: none;
  width: 56px;
  color: var(--text-3);
}
.field .value {
  flex: 1;
  min-width: 0;
  font-family: Menlo, Consolas, monospace;
  word-break: break-all;
}
.revoked .value {
  color: var(--text-3);
  text-decoration: line-through;
}
.goods {
  display: flex;
  gap: 10px;
  align-items: center;
}
.goods img {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 6px;
}
.goods .info {
  flex: 1;
  min-width: 0;
  font-size: 13px;
}
.goods .info .muted {
  margin-top: 6px;
  font-size: 12px;
}
.amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 12px;
}
.amount .price {
  font-size: 16px;
}
.info-cells {
  margin-top: 10px;
}
.copy-icon {
  margin-left: 4px;
  font-size: 16px;
  line-height: inherit;
  color: var(--text-3);
}
.state {
  padding: 80px 0;
}
</style>
