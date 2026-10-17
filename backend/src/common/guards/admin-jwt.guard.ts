import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ErrorCode } from '../constants/error-code';
import { BusinessException } from '../exceptions/business.exception';

/**
 * 后台 JWT 鉴权守卫（对应 design.md 2.2.1 鉴权方案）
 * 校验后台 token，解析 adminId/roleIds/permissions
 */
@Injectable()
export class AdminJwtAuthGuard extends AuthGuard('admin-jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest<T>(err: any, user: any): T {
    if (err || !user) {
      throw new BusinessException(ErrorCode.UNAUTHORIZED);
    }
    return user as T;
  }
}