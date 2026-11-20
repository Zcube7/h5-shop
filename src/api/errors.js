// 接口错误。真后端约定返回 { code, message, data }，code !== 0 即失败
export class ApiError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

export const ERR = {
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  STATE: 409, // 订单状态不允许这个操作
  NETWORK: -1,
}
