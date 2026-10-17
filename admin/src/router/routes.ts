// ============================================================
// 静态路由 - 登录页 / 404 / 无权限
// ============================================================
import type { RouteRecordRaw } from 'vue-router'

export const staticRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true }
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/error/403.vue'),
    meta: { title: '无权限', hidden: true }
  },
  {
    path: '/redirect/:path(.*)',
    name: 'Redirect',
    component: () => import('@/views/redirect/index.vue'),
    meta: { hidden: true }
  }
]

/** 布局路由壳（动态路由挂载于此 children） */
export const layoutRoute: RouteRecordRaw = {
  path: '/',
  name: 'Layout',
  component: () => import('@/layout/index.vue'),
  redirect: '/dashboard',
  children: []
}