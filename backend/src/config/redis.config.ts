import { registerAs } from '@nestjs/config';

/**
 * Redis 连接配置（对应 design.md 2.1.2 redis.module）
 * 键前缀 hn:，连接池复用
 */
export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || 'redis123',
  db: parseInt(process.env.REDIS_DB || '0', 10),
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'hn:',
  lazyConnect: false,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
}));