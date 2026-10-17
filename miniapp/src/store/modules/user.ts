// =============================================================================
// 用户 Store
// 对应 design.md 2.4.3 useUserStore
// =============================================================================

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { login as apiLogin, fetchUserInfo, bindPhone as apiBindPhone } from '@/api/modules/member';
import { setToken, clearToken, wxLogin } from '@/utils/auth';
import { STORAGE_KEYS } from '@/utils/constants';
import type { UserInfoVO } from '@/api/types';

export const useUserStore = defineStore('user', () => {
  // ---------- state ----------
  const token = ref<string>('');
  const userInfo = ref<UserInfoVO | null>(null);

  // ---------- getters ----------
  const isLogged = computed(() => !!token.value);
  const nickname = computed(() => userInfo.value?.nickname || '未登录');
  const avatar = computed(() => userInfo.value?.avatar || '');
  const phone = computed(() => userInfo.value?.phone || '');

  // ---------- actions ----------
  /** 微信登录 */
  async function login() {
    const code = await wxLogin();
    const res = await apiLogin(code);
    token.value = res.token;
    setToken(res.token);
    userInfo.value = {
      id: res.user.id,
      nickname: res.user.nickname,
      avatar: res.user.avatar,
      phone: res.user.phone,
      level: 1,
      points: 0
    };
    uni.setStorageSync(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo.value));
    return res;
  }

  /** 拉取用户信息 */
  async function fetchProfile() {
    const info = await fetchUserInfo();
    userInfo.value = info;
    uni.setStorageSync(STORAGE_KEYS.USER_INFO, JSON.stringify(info));
    return info;
  }

  /** 绑定手机号 */
  async function bindPhone(code: string) {
    const res = await apiBindPhone(code);
    if (userInfo.value) {
      userInfo.value.phone = res.phone;
    }
    return res;
  }

  /** 退出登录 */
  function logout() {
    token.value = '';
    userInfo.value = null;
    clearToken();
  }

  /** 从本地存储恢复 */
  function restore() {
    const t = uni.getStorageSync(STORAGE_KEYS.TOKEN);
    if (t) token.value = t;
    const info = uni.getStorageSync(STORAGE_KEYS.USER_INFO);
    if (info) {
      try { userInfo.value = JSON.parse(info); } catch { /* ignore */ }
    }
  }

  return {
    token, userInfo, isLogged, nickname, avatar, phone,
    login, fetchProfile, bindPhone, logout, restore
  };
}, {
  persist: {
    key: STORAGE_KEYS.TOKEN,
    paths: ['token']
  }
});