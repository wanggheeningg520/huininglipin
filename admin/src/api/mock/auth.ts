// ============================================================
// Mock 数据 - 登录鉴权
// ============================================================
import type { LoginResult, MenuNode } from '@/types'

/** 一期菜单树（对应 design.md 2.5.2，不含卡券/企业/分销） */
export const mockMenus: MenuNode[] = [
  {
    id: 1, parentId: null, name: '数据看板', path: '/dashboard', component: 'dashboard/index',
    icon: 'Odometer', sort: 1, permission: 'dashboard:view', type: 'menu', visible: true
  },
  {
    id: 2, parentId: null, name: '商品管理', path: '/product', icon: 'Goods', sort: 2,
    permission: 'product:*', type: 'directory', visible: true,
    children: [
      { id: 21, parentId: 2, name: '分类管理', path: '/product/category', component: 'product/category', icon: 'Files', sort: 1, permission: 'product:category:*', type: 'menu', visible: true },
      { id: 22, parentId: 2, name: '商品列表', path: '/product/list', component: 'product/list', icon: 'ShoppingCart', sort: 2, permission: 'product:list', type: 'menu', visible: true },
      { id: 23, parentId: 2, name: '库存管理', path: '/product/stock', component: 'product/stock', icon: 'Box', sort: 3, permission: 'product:stock', type: 'menu', visible: true }
    ]
  },
  {
    id: 3, parentId: null, name: '订单管理', path: '/order', icon: 'List', sort: 3,
    permission: 'order:*', type: 'directory', visible: true,
    children: [
      { id: 31, parentId: 3, name: '零售单', path: '/order/list', component: 'order/list', icon: 'Document', sort: 1, permission: 'order:list', type: 'menu', visible: true },
      { id: 32, parentId: 3, name: '退款审核', path: '/order/refund', component: 'order/refund', icon: 'RefreshLeft', sort: 2, permission: 'order:refund', type: 'menu', visible: true }
    ]
  },
  {
    id: 4, parentId: null, name: '内容运营', path: '/content', icon: 'Picture', sort: 4,
    permission: 'content:*', type: 'directory', visible: true,
    children: [
      { id: 41, parentId: 4, name: '节日日历', path: '/content/festival', component: 'content/festival', icon: 'Calendar', sort: 1, permission: 'content:festival', type: 'menu', visible: true },
      { id: 42, parentId: 4, name: 'Banner管理', path: '/content/banner', component: 'content/banner', icon: 'PictureFilled', sort: 2, permission: 'content:banner', type: 'menu', visible: true },
      { id: 43, parentId: 4, name: '精选推荐', path: '/content/recommend', component: 'content/recommend', icon: 'Star', sort: 3, permission: 'content:recommend', type: 'menu', visible: true },
      { id: 44, parentId: 4, name: '专题管理', path: '/content/topic', component: 'content/topic', icon: 'Collection', sort: 4, permission: 'content:topic', type: 'menu', visible: true },
      { id: 45, parentId: 4, name: '公告管理', path: '/content/notice', component: 'content/notice', icon: 'Bell', sort: 5, permission: 'content:notice', type: 'menu', visible: true }
    ]
  },
  {
    id: 5, parentId: null, name: '会员管理', path: '/member/list', component: 'member/list',
    icon: 'User', sort: 5, permission: 'member:list', type: 'menu', visible: true
  },
  {
    id: 6, parentId: null, name: '系统设置', path: '/system', icon: 'Setting', sort: 6,
    permission: 'system:*', type: 'directory', visible: true,
    children: [
      { id: 61, parentId: 6, name: '角色管理', path: '/system/role', component: 'system/role', icon: 'UserFilled', sort: 1, permission: 'system:role', type: 'menu', visible: true },
      { id: 62, parentId: 6, name: '管理员', path: '/system/admin', component: 'system/admin', icon: 'Avatar', sort: 2, permission: 'system:admin', type: 'menu', visible: true },
      { id: 63, parentId: 6, name: '菜单管理', path: '/system/menu', component: 'system/menu', icon: 'Menu', sort: 3, permission: 'system:menu', type: 'menu', visible: true },
      { id: 64, parentId: 6, name: '系统参数', path: '/system/config', component: 'system/config', icon: 'Tools', sort: 4, permission: 'system:config', type: 'menu', visible: true },
      { id: 65, parentId: 6, name: '审计日志', path: '/system/audit-log', component: 'system/audit-log', icon: 'DocumentCopy', sort: 5, permission: 'system:audit', type: 'menu', visible: true }
    ]
  }
]

/** 所有权限标识集合（超管） */
export const allPermissions: string[] = [
  'dashboard:view',
  'product:category:*', 'product:list', 'product:write', 'product:stock', 'product:presale', 'product:status',
  'order:list', 'order:detail', 'order:ship', 'order:export', 'order:refund', 'order:refund:audit',
  'content:festival', 'content:banner', 'content:recommend', 'content:topic', 'content:notice',
  'member:list', 'member:detail',
  'system:role', 'system:admin', 'system:menu', 'system:config', 'system:audit'
]

export function mockLogin(username: string, _password: string): LoginResult {
  return {
    token: 'mock-token-' + username + '-' + Date.now(),
    user: {
      id: 1,
      username,
      realName: username === 'admin' ? '超级管理员' : '运营人员',
      phone: '138****8888',
      status: '启用',
      roles: ['超级管理员'],
      permissions: allPermissions
    },
    menus: mockMenus,
    permissions: allPermissions
  }
}