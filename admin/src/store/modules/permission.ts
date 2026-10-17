// ============================================================
// 权限 Store - 动态路由 / 菜单过滤
// ============================================================
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import type { MenuNode } from '@/types'
import { useUserStore } from './user'
import { generateRoutesFromMenus } from '@/router/dynamic'

export const usePermissionStore = defineStore('permission', () => {
  const dynamicRoutes = ref<RouteRecordRaw[]>([])
  const isRoutesGenerated = ref(false)

  /** 根据菜单生成动态路由 */
  function generateRoutes(menus: MenuNode[]): RouteRecordRaw[] {
    const routes = generateRoutesFromMenus(menus)
    dynamicRoutes.value = routes
    isRoutesGenerated.value = true
    return routes
  }

  /** 过滤菜单（按权限） */
  function filterMenus(menus: MenuNode[]): MenuNode[] {
    const userStore = useUserStore()
    return menus
      .filter((m) => m.visible && (m.type === 'menu' || m.type === 'directory'))
      .filter((m) => userStore.hasPermission(m.permission))
      .map((m) => ({ ...m, children: m.children ? filterMenus(m.children) : undefined }))
      .filter((m) => m.type === 'menu' || (m.children && m.children.length > 0))
      .sort((a, b) => a.sort - b.sort)
  }

  function reset(): void {
    dynamicRoutes.value = []
    isRoutesGenerated.value = false
  }

  return { dynamicRoutes, isRoutesGenerated, generateRoutes, filterMenus, reset }
})