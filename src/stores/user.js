import { defineStore } from 'pinia'
import { getProfile, updateProfile } from '@/api/user'

// 个人信息：「我的」页和编辑页共用
export const useUserStore = defineStore('user', {
  state: () => ({ profile: null }),
  actions: {
    async fetch() {
      this.profile = await getProfile()
      return this.profile
    },
    async update(patch) {
      this.profile = await updateProfile(patch)
      return this.profile
    },
  },
})
