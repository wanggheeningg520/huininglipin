import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 当前登录用户装饰器（对应 design.md 2.2.1 鉴权方案）
 * 从 request.user 注入，由 JwtGuard / AdminJwtGuard 解析后填充
 */
export interface CurrentUserPayload {
  userId: number;
  openid?: string;
  unionid?: string;
  phone?: string | null;
}

export interface CurrentAdminPayload {
  adminId: number;
  username: string;
  realName?: string;
  roleIds: number[];
  permissions: string[];
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserPayload;
    return data ? user?.[data] : user;
  },
);

export const CurrentAdmin = createParamDecorator(
  (data: keyof CurrentAdminPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const admin = request.user as CurrentAdminPayload;
    return data ? admin?.[data] : admin;
  },
);