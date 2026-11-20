<script setup>
// 收银台。mock 模式下给出「模拟支付成功 / 失败」两个按钮；
// 以后接真支付时，把 onPay 换成「拿支付参数 → 拉起支付 → 等回调」，其余不变。
import { ref, watch } from 'vue'
import { showToast } from 'vant'
import { payOrder } from '@/api/order'
import { PAY_MODE } from '@/config'
import { formatPrice } from '@/utils/format'

const props = defineProps({
  show: { type: Boolean, default: false },
  order: { type: Object, default: null },
})
const emit = defineEmits(['update:show', 'success', 'expired'])

const paying = ref(false)
const remain = ref(0)

watch(
  () => props.show,
  (v) => {
    if (v && props.order) remain.value = Math.max(0, props.order.expireAt - Date.now())
  },
  { immediate: true },
)

const close = () => emit('update:show', false)

async function onPay() {
  paying.value = true
  try {
    const o = await payOrder(props.order.id)
    close()
    emit('success', o)
  } catch {
    /* request 已经弹过提示 */
  } finally {
    paying.value = false
  }
}

function onFail() {
  showToast('模拟支付失败，订单仍为待付款，可以重试')
}

function onExpired() {
  close()
  emit('expired')
}
</script>

<template>
  <van-popup
    :show="show"
    position="bottom"
    round
    closeable
    safe-area-inset-bottom
    :close-on-click-overlay="!paying"
    @update:show="emit('update:show', $event)"
  >
    <div v-if="order" class="pay-panel">
      <div class="title">收银台</div>
      <div class="amount"><small>¥</small>{{ formatPrice(order.amount) }}</div>
      <div class="countdown">
        支付剩余
        <van-count-down v-if="show" :time="remain" format="mm:ss" class="cd" @finish="onExpired" />
      </div>

      <van-cell-group inset class="method">
        <van-cell title="模拟钱包" label="演示用，不会真实扣款" icon="balance-pay">
          <template #right-icon><van-icon name="success" color="var(--brand)" /></template>
        </van-cell>
      </van-cell-group>

      <div v-if="PAY_MODE === 'mock'" class="actions">
        <van-button type="primary" block round :loading="paying" loading-text="支付中..." @click="onPay">
          模拟支付成功
        </van-button>
        <van-button block round plain type="primary" :disabled="paying" @click="onFail">模拟支付失败</van-button>
        <van-button block round :disabled="paying" @click="close">稍后支付</van-button>
      </div>
      <div v-else class="actions muted">真实支付尚未接入（VITE_PAY_MODE=real）</div>
    </div>
  </van-popup>
</template>

<style scoped>
.pay-panel {
  padding: 20px 0 16px;
  text-align: center;
}
.title {
  font-size: 16px;
  font-weight: 600;
}
.amount {
  margin-top: 16px;
  font-size: 32px;
  font-weight: 700;
}
.amount small {
  font-size: 18px;
}
.countdown {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-3);
}
.cd {
  display: inline-block;
  --van-count-down-text-color: var(--brand);
  --van-count-down-font-size: 12px;
}
.method {
  margin-top: 18px;
  text-align: left;
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 16px 0;
}
</style>
