import { Global, Inject, Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

/**
 * Redis 连接模块（对应 design.md 2.1.2 redis.module）
 * ioredis 连接 Redis 7，键前缀 hn:，连接池复用
 * 全局模块，注入 REDIS_CLIENT
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        const client = new Redis({
          host: config.get<string>('redis.host', 'localhost'),
          port: config.get<number>('redis.port', 6379),
          password: config.get<string>('redis.password', 'redis123'),
          db: config.get<number>('redis.db', 0),
          keyPrefix: config.get<string>('redis.keyPrefix', 'hn:'),
          lazyConnect: false,
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          retryStrategy: (times) => Math.min(times * 500, 3000),
        });
        client.on('error', (err) => {
          Logger.error(`Redis 连接错误: ${err.message}`, 'RedisModule');
        });
        client.on('connect', () => {
          Logger.log('Redis 已连接', 'RedisModule');
        });
        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleInit {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}
  async onModuleInit(): Promise<void> {
    try {
      const pong = await this.redis.ping();
      Logger.log(`Redis ping: ${pong}`, 'RedisModule');
    } catch (e) {
      Logger.warn(`Redis ping 失败: ${(e as Error).message}`, 'RedisModule');
    }
  }
}