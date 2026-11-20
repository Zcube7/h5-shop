<script setup>
import { computed } from 'vue'
import { STATUS_ACTIONS, STATUS_META } from '@/constants/order'
import { useOrderActions } from '@/composables/useOrderActions'
import { formatPrice, formatTime } from '@/utils/format'

const props = defineProps({ order: { type: Object, required: true } })
const emit = defineEmits(['changed'])

const actions = useOrderActions()
const meta = computed(() => STATUS_META[props.order.status])
const can = (a) => STATUS_ACTIONS[props.order.status].includes(a)

async function run(fn) {
  const updated = await fn(props.order)
  if (updated) emit('changed', updated)
}
</script>

<template>
  <div class="order-card" @click="actions.view(order)">
    <div class="head">
      <span class="time">{{ formatTime(order.createdAt) }}</span>
      <span class="status" :style="{ color: meta.color }">{{ meta.text }}</span>
    </div>
    <div class="goods">
      <img :src="order.goods.image.url" alt="" />
      <div class="info">
        <div class="title ellipsis-2">{{ order.goods.title }}</div>
        <div class="muted">¥{{ formatPrice(order.goods.price) }} × {{ order.quantity }}</div>
      </div>
    </div>
    <div class="sum">
      实付 <span class="price"><small>¥</small>{{ formatPrice(order.amount) }}</span>
    </div>
    <div class="btns" @click.stop>
      <van-button v-if="can('cancel')" size="small" round @click="run(actions.cancel)">取消订单</van-button>
      <van-button v-if="can('pay')" size="small" round type="primary" @click="actions.pay(order)">去支付</van-button>
      <van-button v-if="can('refund')" size="small" round @click="run(actions.refund)">申请退款</van-button>
      <van-button v-if="order.status === 'completed'" size="small" round type="primary" plain @click="actions.view(order)">
        查看交付
      </van-button>
      <van-button v-if="order.status !== 'completed' && can('rebuy')" size="small" round @click="actions.rebuy(order)">
        再次购买
      </van-button>
    </div>
  </div>
</template>

<style scoped>
.order-card {
  margin: 10px 12px;
  padding: 12px;
  background: var(--card-bg);
  border-radius: var(--radius);
}
.head {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}
.time {
  color: var(--text-3);
}
.status {
  font-weight: 600;
}
.goods {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}
.goods img {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 6px;
}
.info {
  flex: 1;
  min-width: 0;
  font-size: 13px;
}
.info .muted {
  margin-top: 6px;
  font-size: 12px;
}
.sum {
  margin-top: 8px;
  font-size: 12px;
  text-align: right;
}
.sum .price {
  font-size: 15px;
}
.btns {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 10px;
}
.btns:empty {
  display: none;
}
</style>
