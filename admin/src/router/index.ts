// ============================================================
// 路由实例 + 全局守卫
// - beforeEach: 校验 token → 无 token 跳登录 → 有 token 但无动态路由则生成 → 校验权限
// - afterEach: 设置标题
// ============================================================
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'
import { staticRoutes, layoutRoute } from './routes'
import { useUserStore } from '@/store/modules/user'
import { usePermissionStore } from '@/store/modules/permission'
import { getToken } from '@/utils/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...staticRoutes, layoutRoute, { path: '/:path(.*)*', name: 'NotFound', component: () => import('@/views/error/404.vue'), meta: { hidden: true } }],
  scrollBehavior: () => ({ top: 0 })
})

// 是否已添加动态路由
let dynamicAdded = false

router.beforeEach(async (to, _from, next) => {
  NProgress.start()
  const token = getToken()

  // 设置标题
  const title = (to.meta.title as string) || ''
  document.title = title ? `${title} · 慧宁甄选后台` : '慧宁甄选后台'

  // 登录页直接放行
  if (to.path === '/login') {
    if (token) {
      next('/dashboard')
      return
    }
    next()
    return
  }

  // 无 token 跳登录
  if (!token) {
    next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    return
  }

  // 已有 token 但未生成动态路由
  if (!dynamicAdded) {
    const userStore = useUserStore()
    const permissionStore = usePermissionStore()
    // 若 store 中无菜单（刷新后），从 persist 恢复或重新登录
    if (!userStore.menus.length) {
      // 持久化数据会在 pinia 初始化时恢复，若仍无则跳登录
      next('/login')
      return
    }
    const dynamicRoutes = permissionStore.generateRoutes(userStore.menus)
    dynamicRoutes.forEach((r) => {
      router.addRoute('Layout', r as RouteRecordRaw)
    })
    dynamicAdded = true
    // 重新导航，确保新路由生效
    next({ ...to, replace: true })
    return
  }

  // 权限校验
  const userStore = useUserStore()
  const requiredPerm = to.meta.permission as string | undefined
  if (requiredPerm && !userStore.hasPermission(requiredPerm)) {
    next('/403')
    return
  }

  next()
})

router.afterEach(() => {
  NProgress.done()
})

/** 重置动态路由（退出登录时调用） */
export function resetRouter(): void {
  const permissionStore = usePermissionStore()
  permissionStore.reset()
  dynamicAdded = false
  // 移除所有动态路由
  const allRoutes = router.getRoutes()
  allRoutes.forEach((r) => {
    if (r.name && r.name !== 'Login' && r.name !== 'Forbidden' && r.name !== 'NotFound' && r.name !== 'Layout' && r.name !== 'Redirect') {
      router.removeRoute(r.name)
    }
  })
}

export default router