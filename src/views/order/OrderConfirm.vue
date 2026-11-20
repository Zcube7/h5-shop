<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getGoodsDetail } from '@/api/goods'
import { createOrder } from '@/api/order'
import { DELIVER_TYPE_TEXT } from '@/constants/order'
import { formatPrice } from '@/utils/format'
import { goBack } from '@/utils/nav'

const route = useRoute()
const router = useRouter()

const goods = ref(null)
const loading = ref(true)
const qty = ref(1)
const remark = ref('')
const submitting = ref(false)

const total = computed(() => (goods.value ? goods.value.price * qty.value : 0))

onMounted(async () => {
  try {
    goods.value = await getGoodsDetail(route.query.goodsId)
    const q = parseInt(route.query.qty, 10)
    qty.value = Number.isFinite(q) ? Math.min(Math.max(q, 1), goods.value.limit) : 1
  } catch {
    goods.value = null
  } finally {
    loading.value = false
  }
})

async function submit() {
  if (submitting.value) return
  submitting.value = true
  try {
    const order = await createOrder({ goodsId: goods.value.id, quantity: qty.value, remark: remark.value })
    // 用 replace：从订单页返回时直接回到商品详情，不会回到这里重复下单
    router.replace({ path: `/order/${order.id}`, query: { pay: '1' } })
  } catch {
    submitting.value = false
  }
}
</script>

<template>
  <div class="page-with-bar">
    <van-nav-bar title="确认订单" left-arrow fixed placeholder @click-left="goBack(router)" />

    <template v-if="goods">
      <van-notice-bar left-icon="info-o" :scrollable="false" wrapable>
        虚拟商品，付款后自动发货，无需填写收货地址。
      </van-notice-bar>

      <div class="card goods">
        <img :src="goods.image.url" alt="" />
        <div class="info">
          <div class="title ellipsis-2">{{ goods.title }}</div>
          <div class="muted">{{ goods.subtitle }}</div>
          <div class="price"><small>¥</small>{{ formatPrice(goods.price) }}</div>
        </div>
      </div>

      <van-cell-group inset>
        <van-cell title="购买数量" :label="`每单最多 ${goods.limit} 件`" center>
          <template #value>
            <van-stepper v-model="qty" :min="1" :max="goods.limit" integer />
          </template>
        </van-cell>
        <van-cell title="交付方式" :value="`自动发货 · ${DELIVER_TYPE_TEXT[goods.deliverType]}`" />
        <van-field v-model="remark" label="备注" placeholder="选填，最多 50 字" maxlength="50" />
      </van-cell-group>

      <van-cell-group inset class="sum">
        <van-cell title="商品金额" :value="`¥${formatPrice(total)}`" />
        <van-cell title="优惠" value="-¥0.00" />
      </van-cell-group>

      <van-submit-bar
        :price="total"
        button-text="提交订单"
        :loading="submitting"
        safe-area-inset-bottom
        @submit="submit"
      />
    </template>

    <van-loading v-else-if="loading" class="state" vertical>加载中...</van-loading>
    <van-empty v-else description="商品不存在或已下架">
      <van-button round type="primary" to="/home">回首页</van-button>
    </van-empty>
  </div>
</template>

<style scoped>
.goods {
  display: flex;
  gap: 12px;
}
.goods img {
  width: 88px;
  height: 88px;
  object-fit: cover;
  border-radius: 8px;
}
.info {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  font-size: 14px;
}
.info .muted {
  margin-top: 4px;
  font-size: 12px;
}
.info .price {
  margin-top: auto;
  font-size: 16px;
}
.sum {
  margin-top: 10px;
}
.state {
  padding: 80px 0;
}
</style>
