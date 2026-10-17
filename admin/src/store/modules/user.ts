// ============================================================
// 用户 Store - 管理员信息 / token / 权限
// ============================================================
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getToken, setToken, removeToken } from '@/utils/auth'
import { login as loginApi, logout as logoutApi } from '@/api/modules/auth'
import type { AdminUserInfo, MenuNode, LoginResult } from '@/types'

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(getToken())
  const userInfo = ref<AdminUserInfo | null>(null)
  const permissions = ref<string[]>([])
  const menus = ref<MenuNode[]>([])
  const roles = ref<string[]>([])

  /** 登录 */
  async function login(username: string, password: string): Promise<LoginResult> {
    const res = await loginApi(username, password)
    token.value = res.token
    userInfo.value = res.user
    permissions.value = res.permissions
    menus.value = res.menus
    roles.value = res.user.roles
    setToken(res.token)
    return res
  }

  /** 退出 */
  async function logout(): Promise<void> {
    try {
      await logoutApi()
    } catch {
      // ignore
    }
    reset()
  }

  /** 重置 */
  function reset(): void {
    token.value = null
    userInfo.value = null
    permissions.value = []
    menus.value = []
    roles.value = []
    removeToken()
  }

  /** 是否有某权限 */
  function hasPermission(perm: string): boolean {
    if (!perm) return true
    // 超管通配
    if (permissions.value.includes('*') || permissions.value.includes(perm)) return true
    // 通配匹配 product:write 匹配 product:*
    const wildcard = perm.split(':')[0] + ':*'
    return permissions.value.includes(wildcard)
  }

  return {
    token, userInfo, permissions, menus, roles,
    login, logout, reset, hasPermission
  }
}, {
  persist: {
    key: 'hn_admin_user',
    pick: ['userInfo', 'permissions', 'menus', 'roles']
  }
})