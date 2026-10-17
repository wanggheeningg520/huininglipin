// =============================================================================
// uni.request 封装
// 对应 design.md 2.4.4 请求封装
// 功能：baseURL 注入 + token 自动注入 + 幂等键 + loading 管理 + 统一错误处理
// =============================================================================

import { ErrorCode, STORAGE_KEYS } from '@/utils/constants';
import type { ApiResponse } from './types';

// ---------- 环境配置 ----------
const BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '/api/v1';
export const USE_MOCK: boolean = (import.meta.env.VITE_USE_MOCK ?? 'true') === 'true';

// ---------- 请求选项 ----------
export interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  params?: Record<string, any>;
  header?: Record<string, string>;
  /** 是否显示 loading（默认 true） */
  loading?: boolean;
  /** 静默模式：不 toast 错误 */
  silent?: boolean;
  /** 是否需要鉴权（默认 true） */
  auth?: boolean;
  /** 是否注入幂等键（创建订单等） */
  idempotent?: boolean;
  /** 自定义 mock 处理函数 */
  mock?: () => Promise<any>;
}

// ---------- token 存取（轻量，避免循环依赖 store）----------
function getToken(): string | null {
  try {
    return uni.getStorageSync(STORAGE_KEYS.TOKEN) || null;
  } catch {
    return null;
  }
}

function clearToken() {
  try {
    uni.removeStorageSync(STORAGE_KEYS.TOKEN);
    uni.removeStorageSync(STORAGE_KEYS.USER_INFO);
  } catch {
    /* ignore */
  }
}

// ---------- 幂等键生成 ----------
function genIdempotencyKey(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `hn_${ts}_${rand}`;
}

// ---------- 跳转登录 ----------
let isRedirecting = false;
function redirectToLogin() {
  if (isRedirecting) return;
  isRedirecting = true;
  clearToken();
  uni.reLaunch({
    url: '/pages/login/index',
    complete: () => {
      isRedirecting = false;
    }
  });
}

// ---------- toast 封装 ----------
function toast(message: string) {
  if (!message) return;
  uni.showToast({ title: message, icon: 'none', duration: 2500 });
}

// ---------- 拼接 query string ----------
function buildQuery(params?: Record<string, any>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}

// ---------- 核心请求函数 ----------
export function request<T = any>(options: RequestOptions): Promise<T> {
  const {
    url,
    method = 'GET',
    data,
    params,
    header = {},
    loading = true,
    silent = false,
    auth = true,
    idempotent = false,
    mock
  } = options;

  // mock 模式：优先走 mock 函数
  if (USE_MOCK && mock) {
    return mock().then((d) => d as T);
  }

  // 显示 loading
  if (loading) {
    uni.showLoading({ title: '加载中', mask: true });
  }

  // 注入 token
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...header };
  if (auth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  // 注入幂等键
  if (idempotent) {
    headers['X-Idempotency-Key'] = genIdempotencyKey();
  }

  const fullUrl = `${BASE_URL}${url}${buildQuery(params)}`;

  return new Promise<T>((resolve, reject) => {
    uni.request({
      url: fullUrl,
      method,
      data,
      header: headers,
      success: (res) => {
        const statusCode = res.statusCode;
        const body = res.data as ApiResponse<T>;

        // HTTP 状态码处理
        if (statusCode === 401) {
          if (!silent) toast('登录已过期，请重新登录');
          redirectToLogin();
          reject(new Error('UNAUTHORIZED'));
          return;
        }
        if (statusCode === 403) {
          if (!silent) toast('无权限访问');
          reject(new Error('FORBIDDEN'));
          return;
        }
        if (statusCode === 429) {
          if (!silent) toast('操作太频繁，请稍后再试');
          reject(new Error('RATE_LIMIT'));
          return;
        }
        if (statusCode < 200 || statusCode >= 300) {
          if (!silent) toast('网络异常，请重试');
          reject(new Error(`HTTP_${statusCode}`));
          return;
        }

        // 业务码处理
        if (body && typeof body === 'object' && 'code' in body) {
          if (body.code === ErrorCode.SUCCESS) {
            resolve(body.data);
            return;
          }
          // 未授权
          if (body.code === ErrorCode.UNAUTHORIZED) {
            if (!silent) toast(body.message || '请先登录');
            redirectToLogin();
            reject(new Error(String(body.code)));
            return;
          }
          // 其他业务错误
          if (!silent) toast(body.message || '操作失败');
          reject(Object.assign(new Error(body.message || '操作失败'), { code: body.code }));
          return;
        }

        // 非标准响应体直接返回
        resolve(body as unknown as T);
      },
      fail: (err) => {
        if (!silent) toast('网络异常，请重试');
        reject(new Error(err.errMsg || 'NETWORK_ERROR'));
      },
      complete: () => {
        if (loading) {
          uni.hideLoading();
        }
      }
    });
  });
}

// ---------- 便捷方法 ----------
export const http = {
  get<T = any>(url: string, params?: Record<string, any>, opts?: Partial<RequestOptions>): Promise<T> {
    return request<T>({ url, method: 'GET', params, ...opts });
  },
  post<T = any>(url: string, data?: any, opts?: Partial<RequestOptions>): Promise<T> {
    return request<T>({ url, method: 'POST', data, ...opts });
  },
  put<T = any>(url: string, data?: any, opts?: Partial<RequestOptions>): Promise<T> {
    return request<T>({ url, method: 'PUT', data, ...opts });
  },
  patch<T = any>(url: string, data?: any, opts?: Partial<RequestOptions>): Promise<T> {
    return request<T>({ url, method: 'PATCH', data, ...opts });
  },
  delete<T = any>(url: string, opts?: Partial<RequestOptions>): Promise<T> {
    return request<T>({ url, method: 'DELETE', ...opts });
  }
};