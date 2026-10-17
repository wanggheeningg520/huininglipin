import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * 微信订阅消息封装（对应 design.md 2.1.2 wechat-msg.service）
 */
@Injectable()
export class WechatMsgService {
  private readonly logger = new Logger(WechatMsgService.name);
  constructor(private readonly config: ConfigService) {}

  /** 发送订阅消息（发货通知/退款通知等） */
  async sendSubscribeMessage(params: {
    openid: string;
    templateId: string;
    data: Record<string, { value: string }>;
    page?: string;
  }): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();
      const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`;
      await axios.post(url, {
        touser: params.openid,
        template_id: params.templateId,
        page: params.page || 'pages/home/index',
        data: params.data,
      }, { timeout: 5000 });
    } catch (e) {
      this.logger.warn(`订阅消息发送失败: ${(e as Error).message}`);
    }
  }

  private async getAccessToken(): Promise<string> {
    const appid = this.config.get<string>('wechat.appid');
    const secret = this.config.get<string>('wechat.secret');
    const { data } = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
      params: { grant_type: 'client_credential', appid, secret },
      timeout: 5000,
    });
    return data.access_token as string;
  }
}