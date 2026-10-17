import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * 微信登录封装（对应 design.md 2.1.2 wechat-auth.service）
 * code2Session 获取 openid/unionid
 */
@Injectable()
export class WechatAuthService {
  private readonly logger = new Logger(WechatAuthService.name);

  constructor(private readonly config: ConfigService) {}

  /** code2Session：通过 wx.login 的 code 换取 openid + session_key */
  async code2Session(code: string): Promise<{ openid: string; unionid?: string; sessionKey: string }> {
    const appid = this.config.get<string>('wechat.appid');
    const secret = this.config.get<string>('wechat.secret');
    if (!appid || !secret) {
      throw new Error('微信小程序 appid/secret 未配置');
    }
    const url = 'https://api.weixin.qq.com/sns/jscode2session';
    const { data } = await axios.get(url, {
      params: { appid, secret, js_code: code, grant_type: 'authorization_code' },
      timeout: 5000,
    });
    if (data.errcode) {
      this.logger.error(`code2Session 失败: ${data.errcode} ${data.errmsg}`);
      throw new Error(`微信登录失败: ${data.errmsg}`);
    }
    return {
      openid: data.openid,
      unionid: data.unionid,
      sessionKey: data.session_key,
    };
  }

  /** getPhoneNumber：通过 getPhoneNumber 的 code 换取手机号 */
  async getPhoneNumber(code: string): Promise<string> {
    const accessToken = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`;
    const { data } = await axios.post(url, { code }, { timeout: 5000 });
    if (data.errcode) {
      throw new Error(`获取手机号失败: ${data.errmsg}`);
    }
    return data.phone_info.phoneNumber as string;
  }

  /** 获取 access_token（生产环境应缓存，此处简化） */
  private async getAccessToken(): Promise<string> {
    const appid = this.config.get<string>('wechat.appid');
    const secret = this.config.get<string>('wechat.secret');
    const url = 'https://api.weixin.qq.com/cgi-bin/token';
    const { data } = await axios.get(url, {
      params: { grant_type: 'client_credential', appid, secret },
      timeout: 5000,
    });
    if (data.errcode) {
      throw new Error(`获取 access_token 失败: ${data.errmsg}`);
    }
    return data.access_token as string;
  }
}