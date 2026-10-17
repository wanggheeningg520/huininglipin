import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { CurrentAdminPayload } from '../../../common/decorators/current-user.decorator';

/**
 * 后台 JWT 策略（对应 design.md 2.2.1 鉴权方案 + 2.5.3 RBAC）
 * 解析 token 中的 adminId/username/roleIds/permissions
 */
@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('ADMIN_JWT_SECRET', 'dev-admin-jwt-secret'),
    });
  }

  validate(payload: any): CurrentAdminPayload {
    return {
      adminId: payload.adminId,
      username: payload.username,
      realName: payload.realName,
      roleIds: payload.roleIds || [],
      permissions: payload.permissions || [],
    };
  }
}