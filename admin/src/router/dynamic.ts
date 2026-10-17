// ============================================================
// 动态路由生成 - 根据后端返回的菜单列表递归生成路由
// ============================================================
import type { RouteRecordRaw } from 'vue-router'
import type { MenuNode } from '@/types'

// 使用 Vite 的 glob 预加载 views 下所有组件
const modules = import.meta.glob('/src/views/**/*.vue')

/** 将组件路径映射为懒加载函数 */
function resolveComponent(component: string): (() => Promise<unknown>) | undefined {
  // component 形如 'dashboard/index'、'product/list'
  const full = `/src/views/${component}.vue`
  if (modules[full]) {
    return modules[full] as () => Promise<unknown>
  }
  // 兜底：尝试 index
  const alt = `/src/views/${component}/index.vue`
  if (modules[alt]) {
    return modules[alt] as () => Promise<unknown>
  }
  return undefined
}

/** 递归生成路由 */
export function generateRoutesFromMenus(menus: MenuNode[]): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []
  for (const menu of menus) {
    // directory 类型仅作为分组，不生成路由
    if (menu.type === 'directory') {
      if (menu.children && menu.children.length) {
        routes.push(...generateRoutesFromMenus(menu.children))
      }
      continue
    }
    if (menu.type !== 'menu') continue
    if (!menu.component) continue

    const component = resolveComponent(menu.component)
    if (!component) {
      // eslint-disable-next-line no-console
      console.warn(`[router] 组件未找到: ${menu.component}，菜单: ${menu.name}`)
      continue
    }

    routes.push({
      path: menu.path,
      name: menu.path.replace(/\//g, '-').replace(/^-/, ''),
      component,
      meta: {
        title: menu.name,
        icon: menu.icon,
        permission: menu.permission,
        keepAlive: true
      }
    })
  }
  return routes
}