import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

/**
 * C 端 JWT 策略（对应 design.md 2.2.1 鉴权方案）
 * 解析 token 中的 userId/openid/unionid
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'dev-jwt-secret'),
    });
  }

  validate(payload: any): CurrentUserPayload {
    return {
      userId: payload.userId,
      openid: payload.openid,
      unionid: payload.unionid,
      phone: payload.phone,
    };
  }
}