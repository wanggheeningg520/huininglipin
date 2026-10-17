// ============================================================
// axios 请求封装
// - baseURL 注入（VITE_API_BASE_URL = /api/v1/admin）
// - token 自动注入 Authorization: Bearer <token>
// - mock 模式切换（VITE_USE_MOCK）
// - 401 跳登录、403 提示无权限、业务 code≠0 提示错误
// - 统一响应体 {code, message, data}
// ============================================================
import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { getToken, removeToken } from '@/utils/auth'
import type { ApiResponse } from '@/types'
import { mockRequest } from './mock'

NProgress.configure({ showSpinner: false, trickleSpeed: 200 })

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1/admin'

const service: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    NProgress.start()
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    NProgress.done()
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    NProgress.done()
    const res = response.data as ApiResponse
    // 二进制流直接返回
    if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
      return response
    }
    if (res.code === 0) {
      return res
    }
    // 业务错误
    if (res.code === 10002 || res.code === 10003) {
      // token 失效或无权限
      handleAuthError(res.code, res.message)
      return Promise.reject(new Error(res.message || '鉴权失败'))
    }
    ElMessage.error(res.message || '请求失败')
    return Promise.reject(new Error(res.message || '请求失败'))
  },
  (error) => {
    NProgress.done()
    const status = error?.response?.status
    if (status === 401) {
      handleAuthError(10002, '登录已过期，请重新登录')
    } else if (status === 403) {
      ElMessage.error('无权限访问')
    } else if (status === 429) {
      ElMessage.error('请求过于频繁，请稍后再试')
    } else {
      ElMessage.error(error?.response?.data?.message || error.message || '网络异常')
    }
    return Promise.reject(error)
  }
)

let isReloginShown = false
function handleAuthError(_code: number, message: string): void {
  if (isReloginShown) return
  isReloginShown = true
  ElMessageBox.confirm(message, '提示', {
    confirmButtonText: '重新登录',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      removeToken()
      window.location.href = '/admin/'
    })
    .catch(() => {})
    .finally(() => {
      isReloginShown = false
    })
}

// ---------- 对外封装 ----------
export interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  params?: Record<string, unknown>
  data?: Record<string, unknown> | unknown
  responseType?: 'blob' | 'arraybuffer' | 'json'
  silent?: boolean // 静默模式，不弹错误提示
}

/** 统一请求函数，返回 data 部分 */
export async function request<T = unknown>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', params, data, responseType } = options

  // Mock 模式
  if (USE_MOCK) {
    const res = await mockRequest(method, url, params || {}, (data as Record<string, unknown>) || {})
    if (res.code !== 0) {
      if (!options.silent) ElMessage.error(res.message)
      throw new Error(res.message)
    }
    return res.data as T
  }

  // 真实请求
  const config: AxiosRequestConfig = { url, method, params, data, responseType }
  const res = await service.request<ApiResponse<T>>(config)
  return res.data
}

/** 便捷方法 */
export const http = {
  get: <T = unknown>(url: string, params?: Record<string, unknown>, opts?: Partial<RequestOptions>) =>
    request<T>({ url, method: 'GET', params, ...opts }),
  post: <T = unknown>(url: string, data?: unknown, opts?: Partial<RequestOptions>) =>
    request<T>({ url, method: 'POST', data, ...opts }),
  put: <T = unknown>(url: string, data?: unknown, opts?: Partial<RequestOptions>) =>
    request<T>({ url, method: 'PUT', data, ...opts }),
  patch: <T = unknown>(url: string, data?: unknown, opts?: Partial<RequestOptions>) =>
    request<T>({ url, method: 'PATCH', data, ...opts }),
  del: <T = unknown>(url: string, params?: Record<string, unknown>, opts?: Partial<RequestOptions>) =>
    request<T>({ url, method: 'DELETE', params, ...opts })
}

export default service