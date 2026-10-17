import { registerAs } from '@nestjs/config';

/** 微信小程序 + 微信支付 v3 配置 */
export default registerAs('wechat', () => ({
  appid: process.env.WECHAT_APPID || '',
  secret: process.env.WECHAT_SECRET || '',
  pay: {
    mchid: process.env.WECHAT_PAY_MCHID || '',
    serialNo: process.env.WECHAT_PAY_SERIAL_NO || '',
    privateKeyPath: process.env.WECHAT_PAY_PRIVATE_KEY_PATH || '',
    apiV3: process.env.WECHAT_PAY_APIV3 || '',
    notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL || '',
  },
}));