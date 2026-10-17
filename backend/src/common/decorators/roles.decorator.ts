import { SetMetadata } from '@nestjs/common';

/**
 * 角色权限装饰器（对应 design.md 2.5.3 鉴权与 RBAC）
 * 用法：@Roles('product:write')
 */
export const ROLES_KEY = 'roles';
export const Roles = (...permissions: string[]) => SetMetadata(ROLES_KEY, permissions);