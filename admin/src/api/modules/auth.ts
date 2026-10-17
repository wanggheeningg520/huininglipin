// ============================================================
// 鉴权 API
// ============================================================
import { http } from '@/api/request'
import type { LoginResult, AdminUserInfo } from '@/types'

/** 登录 */
export function login(username: string, password: string): Promise<LoginResult> {
  return http.post<LoginResult>('auth/login', { username, password })
}

/** 获取当前用户信息 */
export function getUserInfo(): Promise<{ user: AdminUserInfo; permissions: string[] }> {
  return http.get('auth/info')
}

/** 退出登录 */
export function logout(): Promise<null> {
  return http.post<null>('auth/logout')
}