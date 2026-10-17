import { registerAs } from '@nestjs/config';

/** 阿里云 OSS 配置 */
export default registerAs('oss', () => ({
  region: process.env.OSS_REGION || 'oss-cn-beijing',
  bucket: process.env.OSS_BUCKET || 'huining-mall',
  accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
  cdnDomain: process.env.OSS_CDN_DOMAIN || '',
}));