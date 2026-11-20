// 所有接口的统一出口。页面只调 api/*.js，不关心数据来自假数据还是真后端。
import { showToast } from 'vant'
import { API_BASE, USE_MOCK } from '@/config'
import { ApiError, ERR } from './errors'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let mockServer = null
async function callMock(method, path, data) {
  if (!mockServer) {
    const { getMockServer } = await import('@/mock/server.js')
    mockServer = getMockServer()
  }
  await sleep(200 + Math.random() * 300) // 模拟网络延迟，让加载态能被看到
  return mockServer.handle(method, path, data)
}

// 真后端约定：GET 参数走 query，POST 走 JSON body；返回 { code: 0, data, message }
async function callHttp(method, path, data) {
  let url = API_BASE + path
  const init = { method, headers: {} }
  if (method === 'GET' && data) {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(data)) if (v !== undefined && v !== null && v !== '') qs.append(k, v)
    const s = qs.toString()
    if (s) url += `?${s}`
  } else if (data) {
    init.headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(data)
  }
  let res
  try {
    res = await fetch(url, init)
  } catch {
    throw new ApiError(ERR.NETWORK, '网络异常，请稍后重试')
  }
  const body = await res.json().catch(() => null)
  if (!res.ok || !body) throw new ApiError(res.status || ERR.NETWORK, body?.message || `请求失败（${res.status}）`)
  if (body.code !== 0) throw new ApiError(body.code, body.message || '请求失败')
  return body.data
}

/**
 * @param {'GET'|'POST'} method
 * @param {string} path
 * @param {object} [data]
 * @param {{silent?: boolean}} [opts] silent=true 时出错不弹提示，由调用方自己处理
 */
export async function request(method, path, data, { silent = false } = {}) {
  try {
    return USE_MOCK ? await callMock(method, path, data) : await callHttp(method, path, data)
  } catch (err) {
    if (!silent) showToast(err?.message || '请求失败')
    throw err
  }
}

export const get = (path, data, opts) => request('GET', path, data, opts)
export const post = (path, data, opts) => request('POST', path, data, opts)
