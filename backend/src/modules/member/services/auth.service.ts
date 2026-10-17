import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../../infrastructure/database/entities/member/user.entity';
import { WechatAuthService } from '../../../infrastructure/wechat/wechat-auth.service';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { ErrorCode } from '../../../common/constants/error-code';

/**
 * 会员鉴权服务（对应 design.md 2.2.2 接口18/19）
 * code2Session 获取 openid/unionid，自动创建或匹配 user，签发 JWT
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
    private readonly wechatAuth: WechatAuthService,
    private readonly jwt: JwtService,
  ) {}

  /** 微信登录 */
  async login(code: string): Promise<{ token: string; user: any }> {
    let session: { openid: string; unionid?: string; sessionKey: string };
    try {
      session = await this.wechatAuth.code2Session(code);
    } catch (e) {
      throw new BusinessException(ErrorCode.WECHAT_LOGIN_FAIL, (e as Error).message);
    }
    // 查询或创建 user
    let user = await this.userRepo.findOne({ where: { openid: session.openid } });
    if (!user) {
      user = this.userRepo.create({
        openid: session.openid,
        unionid: session.unionid || null,
        nickname: null,
        avatar: null,
        phone: null,
      });
      user = await this.userRepo.save(user);
    }
    const token = this.jwt.sign(
      { userId: user.id, openid: user.openid, unionid: user.unionid, phone: user.phone },
      { expiresIn: '7d' },
    );
    return {
      token,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        phone: user.phone,
      },
    };
  }

  /** 手机号授权绑定 */
  async bindPhone(userId: number, code: string): Promise<string> {
    let phone: string;
    try {
      phone = await this.wechatAuth.getPhoneNumber(code);
    } catch (e) {
      throw new BusinessException(ErrorCode.WECHAT_LOGIN_FAIL, (e as Error).message);
    }
    await this.userRepo.update(userId, { phone });
    return phone;
  }
}