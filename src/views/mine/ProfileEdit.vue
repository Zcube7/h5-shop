<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import UserAvatar from '@/components/UserAvatar.vue'
import { AVATAR_COLORS } from '@/constants/user'
import { useUserStore } from '@/stores/user'
import { goBack } from '@/utils/nav'

const router = useRouter()
const user = useUserStore()

const form = reactive({ nickname: '', avatarColor: AVATAR_COLORS[0], phone: '', email: '', bio: '' })
const ready = ref(false)
const saving = ref(false)

onMounted(async () => {
  const p = user.profile || (await user.fetch().catch(() => null))
  if (p) Object.assign(form, { nickname: p.nickname, avatarColor: p.avatarColor, phone: p.phone, email: p.email, bio: p.bio })
  ready.value = true
})

// 前端只做格式提示，服务端会再校验一次
const rules = {
  nickname: [{ required: true, message: '请填写昵称' }],
  phone: [{ validator: (v) => !v || /^1\d{10}$/.test(v), message: '手机号格式不正确' }],
  email: [{ validator: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), message: '邮箱格式不正确' }],
}

async function onSubmit() {
  saving.value = true
  try {
    await user.update({ ...form })
    showToast('已保存')
    goBack(router, '/mine')
  } catch {
    /* request 已弹提示 */
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <van-nav-bar title="个人信息" left-arrow fixed placeholder @click-left="goBack(router, '/mine')" />

    <template v-if="ready">
      <div class="card avatar-card">
        <UserAvatar :name="form.nickname" :color="form.avatarColor" :size="72" />
        <div class="swatches">
          <span
            v-for="c in AVATAR_COLORS"
            :key="c"
            class="swatch"
            :class="{ on: c === form.avatarColor }"
            :style="{ background: c }"
            @click="form.avatarColor = c"
          />
        </div>
        <div class="muted tip">头像用昵称首字显示，点上面的颜色换底色</div>
      </div>

      <van-form @submit="onSubmit">
        <van-cell-group inset>
          <van-field v-model.trim="form.nickname" name="nickname" label="昵称" placeholder="1~12 个字" maxlength="12" :rules="rules.nickname" />
          <van-field v-model.trim="form.phone" name="phone" type="tel" label="手机号" placeholder="选填" maxlength="11" :rules="rules.phone" />
          <van-field v-model.trim="form.email" name="email" label="邮箱" placeholder="选填" :rules="rules.email" />
          <van-field
            v-model="form.bio"
            name="bio"
            type="textarea"
            label="个性签名"
            placeholder="选填"
            rows="2"
            autosize
            maxlength="50"
            show-word-limit
          />
          <van-cell title="用户 ID" :value="user.profile?.id" />
        </van-cell-group>
        <div class="submit">
          <van-button round block type="primary" native-type="submit" :loading="saving">保存</van-button>
        </div>
      </van-form>
    </template>
    <van-loading v-else class="state" vertical>加载中...</van-loading>
  </div>
</template>

<style scoped>
.avatar-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 12px 14px;
}
.swatches {
  display: flex;
  gap: 12px;
  margin-top: 14px;
}
.swatch {
  width: 26px;
  height: 26px;
  border: 3px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px #ebedf0;
}
.swatch.on {
  box-shadow: 0 0 0 2px var(--text-1);
}
.tip {
  margin-top: 10px;
  font-size: 12px;
}
.submit {
  margin: 24px 16px;
}
.state {
  padding: 80px 0;
}
</style>
