// ============================================================
// 系统设置 API
// ============================================================
import { http } from '@/api/request'
import type { PageResult, MenuNode } from '@/types'
import type {
  MockRole, MockAdminUser, MockSysConfig, MockAuditLog
} from '@/api/mock/system'
import { mockDashboardStats } from '@/api/mock/system'

export type Role = MockRole
export type AdminUser = MockAdminUser
export type SysConfig = MockSysConfig
export type AuditLog = MockAuditLog
export type DashboardStats = typeof mockDashboardStats

// ---------- 数据看板 ----------
export function getDashboardStats(): Promise<DashboardStats> {
  return http.get<DashboardStats>('dashboard/stats')
}

// ---------- 角色 ----------
export function getRoleList(): Promise<Role[]> {
  return http.get<Role[]>('system/role')
}
export function createRole(data: Partial<Role>): Promise<Role> {
  return http.post<Role>('system/role', data)
}
export function updateRole(id: number, data: Partial<Role>): Promise<Role> {
  return http.put<Role>(`system/role/${id}`, data)
}
export function deleteRole(id: number): Promise<null> {
  return http.del<null>(`system/role/${id}`)
}

// ---------- 管理员 ----------
export function getAdminList(): Promise<AdminUser[]> {
  return http.get<AdminUser[]>('system/admin')
}
export function createAdmin(data: Partial<AdminUser>): Promise<AdminUser> {
  return http.post<AdminUser>('system/admin', data)
}
export function updateAdmin(id: number, data: Partial<AdminUser>): Promise<AdminUser> {
  return http.put<AdminUser>(`system/admin/${id}`, data)
}

// ---------- 菜单 ----------
export function getMenuTree(): Promise<MenuNode[]> {
  return http.get<MenuNode[]>('system/menu')
}

// ---------- 系统参数 ----------
export function getSysConfigList(): Promise<SysConfig[]> {
  return http.get<SysConfig[]>('system/config')
}
export function updateSysConfig(list: SysConfig[]): Promise<null> {
  return http.put<null>('system/config', list)
}

// ---------- 审计日志 ----------
export function getAuditLogList(params: { operator?: string; module?: string; page?: number; pageSize?: number }): Promise<PageResult<AuditLog>> {
  return http.get<PageResult<AuditLog>>('system/audit-log', params as Record<string, unknown>)
}

// ---------- OSS ----------
export function getUploadToken(): Promise<{ uploadToken: string; expire: number; dir: string; host: string }> {
  return http.get('oss/upload-token')
}