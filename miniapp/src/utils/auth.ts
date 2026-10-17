// =============================================================================
// 登录态工具
// =============================================================================

import { STORAGE_KEYS } from './constants';

/** 获取 token */
export function getToken(): string | null {
  try {
    return uni.getStorageSync(STORAGE_KEYS.TOKEN) || null;
  } catch {
    return null;
  }
}

/** 设置 token */
export function setToken(token: string): void {
  uni.setStorageSync(STORAGE_KEYS.TOKEN, token);
}

/** 清除 token */
export function clearToken(): void {
  uni.removeStorageSync(STORAGE_KEYS.TOKEN);
  uni.removeStorageSync(STORAGE_KEYS.USER_INFO);
}

/** 是否已登录 */
export function isLoggedIn(): boolean {
  return !!getToken();
}

/** 登录拦截：未登录跳登录页，返回是否已登录 */
export function requireAuth(): boolean {
  if (isLoggedIn()) return true;
  uni.navigateTo({ url: '/pages/login/index' });
  return false;
}

/** 微信 wx.login 获取 code */
export function wxLogin(): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: (res) => resolve(res.code),
      fail: (err) => reject(new Error(err.errMsg || 'wx.login 失败'))
    });
  });
}