import { get, post } from './request'

export const getProfile = () => get('/user/profile')

/** 修改个人信息：{ nickname?, avatarColor?, phone?, email?, bio? } */
export const updateProfile = (patch) => post('/user/profile', patch)

/** 开发辅助：清空本地假数据（订单、个人信息） */
export const resetMockData = () => post('/dev/reset')
