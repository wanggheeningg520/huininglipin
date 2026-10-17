import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { Request, Response } from 'express';
import { REDIS_CLIENT } from '../../infrastructure/redis/redis.constants';
import { RedisKeys, IDEMPOTENCY_TTL } from '../constants/redis-keys';
import { ErrorCode } from '../constants/error-code';
import { BusinessException } from '../exceptions/business.exception';
import { IDEMPOTENT_KEY } from '../decorators/idempotent.decorator';

/**
 * 幂等拦截器（对应 design.md 2.1.3 幂等防重设计 + spec.md 4.2 规则2）
 * 基于 X-Idempotency-Key 头 Redis SETNX 防重，TTL 30min
 * 标记 @Idempotent() 的接口强制要求幂等键，否则拒绝
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const isRequired = this.reflector.getAllAndOverride<boolean>(IDEMPOTENT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!isRequired) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const key = request.headers['x-idempotency-key'] as string | undefined;

    if (!key) {
      throw new BusinessException(ErrorCode.PARAM_INVALID, '缺少幂等键 X-Idempotency-Key');
    }

    const redisKey = RedisKeys.idempotency(key);
    // SETNX：设置成功返回 1，已存在返回 0
    const setOk = await this.redis.set(redisKey, JSON.stringify({ status: 'pending' }), 'EX', IDEMPOTENCY_TTL, 'NX');
    if (!setOk) {
      // 幂等键命中，返回已缓存结果
      const cached = await this.redis.get(redisKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.status === 'done' && parsed.result !== undefined) {
          response.setHeader('X-Idempotent-Replay', 'true');
          return of(parsed.result);
        }
      }
      throw new BusinessException(ErrorCode.IDEMPOTENT_REPEAT);
    }

    return new Observable((subscriber) => {
      next.handle().subscribe({
        next: async (value) => {
          // 缓存处理结果
          await this.redis.set(
            redisKey,
            JSON.stringify({ status: 'done', result: value }),
            'EX',
            IDEMPOTENCY_TTL,
          );
          subscriber.next(value);
        },
        error: async (err) => {
          // 出错时删除幂等键，允许重试
          await this.redis.del(redisKey);
          subscriber.error(err);
        },
        complete: () => subscriber.complete(),
      });
    });
  }
}