import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ErrorCode } from '../constants/error-code';
import { BusinessException } from '../exceptions/business.exception';
import { CurrentAdminPayload } from '../decorators/current-user.decorator';

/**
 * RBAC 角色权限守卫（对应 design.md 2.5.3 鉴权与 RBAC + spec.md 4.3 规则2）
 * 校验 @Roles('product:write') 权限标识，无权限返回 10003
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const admin = request.user as CurrentAdminPayload | undefined;
    if (!admin || !admin.permissions) {
      throw new BusinessException(ErrorCode.FORBIDDEN);
    }
    // 拥有任一所需权限即放行
    const ok = required.some((p) => admin.permissions.includes(p) || admin.permissions.includes('*'));
    if (!ok) {
      throw new BusinessException(ErrorCode.FORBIDDEN, '无操作权限');
    }
    return true;
  }
}