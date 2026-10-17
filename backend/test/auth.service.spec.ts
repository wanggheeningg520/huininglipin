import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../src/modules/member/services/auth.service';
import { UserEntity } from '../src/infrastructure/database/entities/member/user.entity';
import { WechatAuthService } from '../src/infrastructure/wechat/wechat-auth.service';
import { ErrorCode } from '../src/common/constants/error-code';

/**
 * 会员鉴权服务单元测试（对应 design.md 2.2.2 接口18/19）
 * 覆盖：微信登录（code2Session 失败/新用户自动创建/老用户匹配/JWT 签发）、手机号绑定
 */
describe('AuthService', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<Repository<UserEntity>>;
  let wechatAuth: jest.Mocked<WechatAuthService>;
  let jwt: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(UserEntity), useValue: mockRepo() },
        { provide: WechatAuthService, useValue: { code2Session: jest.fn(), getPhoneNumber: jest.fn() } },
        { provide: JwtService, useValue: { sign: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(UserEntity)) as jest.Mocked<Repository<UserEntity>>;
    wechatAuth = module.get(WechatAuthService) as jest.Mocked<WechatAuthService>;
    jwt = module.get(JwtService) as jest.Mocked<JwtService>;
  });

  function mockRepo() {
    return {
      find: jest.fn(), findOne: jest.fn(), findAndCount: jest.fn(), count: jest.fn(),
      create: jest.fn((e: any) => e), save: jest.fn(async (e: any) => e),
      update: jest.fn(async () => undefined), delete: jest.fn(async () => undefined),
    };
  }

  describe('login - 微信登录', () => {
    it('code2Session 失败时抛 WECHAT_LOGIN_FAIL', async () => {
      wechatAuth.code2Session.mockRejectedValue(new Error('invalid code'));
      await expect(service.login('bad_code')).rejects.toMatchObject({
        bizCode: ErrorCode.WECHAT_LOGIN_FAIL,
      });
    });

    it('新用户：自动创建并签发 JWT', async () => {
      wechatAuth.code2Session.mockResolvedValue({
        openid: 'wx_openid_new', unionid: 'wx_unionid', sessionKey: 'sk',
      });
      userRepo.findOne.mockResolvedValue(null); // 老用户不存在
      userRepo.save.mockResolvedValue({
        id: 1, openid: 'wx_openid_new', unionid: 'wx_unionid', nickname: null, avatar: null, phone: null,
      } as any);
      jwt.sign.mockReturnValue('jwt_token');

      const result = await service.login('valid_code');

      expect(userRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        openid: 'wx_openid_new',
        unionid: 'wx_unionid',
      }));
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 1, openid: 'wx_openid_new', unionid: 'wx_unionid', phone: null },
        { expiresIn: '7d' },
      );
      expect(result.token).toBe('jwt_token');
      expect(result.user.id).toBe(1);
    });

    it('老用户：匹配 openid 不重复创建', async () => {
      wechatAuth.code2Session.mockResolvedValue({
        openid: 'wx_openid_old', sessionKey: 'sk',
      });
      const existingUser = {
        id: 100, openid: 'wx_openid_old', unionid: null, nickname: '张三', avatar: 'a.jpg', phone: '13800000000',
      } as any;
      userRepo.findOne.mockResolvedValue(existingUser);
      jwt.sign.mockReturnValue('jwt_token_old');

      const result = await service.login('valid_code');

      expect(userRepo.create).not.toHaveBeenCalled();
      expect(result.user.nickname).toBe('张三');
      expect(result.user.phone).toBe('13800000000');
    });

    it('JWT payload 包含 userId/openid/unionid/phone', async () => {
      wechatAuth.code2Session.mockResolvedValue({ openid: 'op', sessionKey: 'sk' });
      userRepo.findOne.mockResolvedValue({
        id: 5, openid: 'op', unionid: 'un', phone: '139', nickname: 'n', avatar: 'a',
      } as any);
      jwt.sign.mockReturnValue('t');

      await service.login('code');

      const payload = jwt.sign.mock.calls[0][0];
      expect(payload).toEqual({ userId: 5, openid: 'op', unionid: 'un', phone: '139' });
    });

    it('unionid 缺失时 user.unionid 存 null', async () => {
      wechatAuth.code2Session.mockResolvedValue({ openid: 'op', sessionKey: 'sk' });
      userRepo.findOne.mockResolvedValue(null);
      userRepo.save.mockResolvedValue({ id: 1, openid: 'op', unionid: null, nickname: null, avatar: null, phone: null } as any);
      jwt.sign.mockReturnValue('t');

      await service.login('code');

      const created = userRepo.create.mock.calls[0][0];
      expect(created.unionid).toBeNull();
    });
  });

  describe('bindPhone - 手机号绑定', () => {
    it('getPhoneNumber 失败时抛 WECHAT_LOGIN_FAIL', async () => {
      wechatAuth.getPhoneNumber.mockRejectedValue(new Error('code expired'));
      await expect(service.bindPhone(1, 'bad_code')).rejects.toMatchObject({
        bizCode: ErrorCode.WECHAT_LOGIN_FAIL,
      });
    });

    it('成功获取手机号后更新 user', async () => {
      wechatAuth.getPhoneNumber.mockResolvedValue('13800000000');
      const phone = await service.bindPhone(1, 'valid_code');
      expect(phone).toBe('13800000000');
      expect(userRepo.update).toHaveBeenCalledWith(1, { phone: '13800000000' });
    });
  });
});