import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WechatAuthService } from './wechat-auth.service';
import { WechatPayService } from './wechat-pay.service';
import { WechatMsgService } from './wechat-msg.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [WechatAuthService, WechatPayService, WechatMsgService],
  exports: [WechatAuthService, WechatPayService, WechatMsgService],
})
export class WechatModule {}