// ============================================================
// 通用类型定义
// ============================================================

/** 后端统一响应体 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
  traceId?: string
}

/** 分页响应 */
export interface PageResult<T = unknown> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/** 分页查询参数 */
export interface PageQuery {
  page?: number
  pageSize?: number
}

/** 菜单/路由节点（后端返回） */
export interface MenuNode {
  id: number
  parentId: number | null
  name: string
  path: string
  component?: string | null
  icon?: string | null
  sort: number
  permission: string
  type: 'menu' | 'button' | 'directory'
  visible: boolean
  children?: MenuNode[]
}

/** 管理员信息 */
export interface AdminUserInfo {
  id: number
  username: string
  realName: string
  phone: string
  status: '启用' | '停用'
  roles: string[]
  permissions: string[]
}

/** 登录响应 */
export interface LoginResult {
  token: string
  user: AdminUserInfo
  menus: MenuNode[]
  permissions: string[]
}