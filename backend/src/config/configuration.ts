import { registerAs } from '@nestjs/config';

/**
 * 应用配置加载（对应 design.md 2.6.2 .env.example）
 * 通过 @nestjs/config 注入 ConfigService，区分开发/测试/生产
 */
export default registerAs('app', () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.APP_PORT || '3000', 10),
  name: process.env.APP_NAME || 'huining-gift-mall',
  isProd: process.env.NODE_ENV === 'production',
  isDev: process.env.NODE_ENV === 'development',
}));