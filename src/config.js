// 运行配置，统一从 .env 读取
const env = import.meta.env || {}

export const USE_MOCK = env.VITE_USE_MOCK !== 'false'
export const API_BASE = env.VITE_API_BASE || '/api'
export const PAY_MODE = env.VITE_PAY_MODE || 'mock'

export const SHOP_NAME = '小店'
