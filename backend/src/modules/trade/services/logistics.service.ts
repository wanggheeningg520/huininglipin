import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { OrderEntity } from '../../../infrastructure/database/entities/trade/order.entity';
import { LogisticsService } from '../../../infrastructure/logistics/logistics.module';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { ErrorCode } from '../../../common/constants/error-code';
import { REDIS_CLIENT } from '../../../infrastructure/redis/redis.constants';
import { RedisKeys, LOGISTICS_CACHE_TTL } from '../../../common/constants/redis-keys';

/**
 * 物流服务（对应 design.md 2.2.2 接口17 + 2.1.2 logistics）
 * 轨迹查询带 Redis 缓存（TTL 1800s）
 * API 不可用返回「查询中」+后台记录重试
 */
@Injectable()
export class LogisticsService2 {
  private readonly logger = new Logger(LogisticsService2.name);

  constructor(
    @InjectRepository(OrderEntity) private readonly orderRepo: Repository<OrderEntity>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly logistics: LogisticsService,
  ) {}

  /** 物流轨迹查询（接口17） */
  async query(userId: number, orderNo: string): Promise<any> {
    const order = await this.orderRepo.findOne({ where: { orderNo, userId } });
    if (!order) {
      throw new BusinessException(ErrorCode.ORDER_NOT_FOUND);
    }
    if (!order.logisticsCompany || !order.logisticsTrackNo) {
      return { company: '', trackNo: '', traces: [], isSigned: false };
    }
    // 缓存查询
    const cacheKey = RedisKeys.logisticsTrack(order.logisticsTrackNo);
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    // 调用适配器
    const result = await this.logistics.query(order.logisticsCompany, order.logisticsTrackNo);
    // 缓存
    await this.redis.set(cacheKey, JSON.stringify(result), 'EX', LOGISTICS_CACHE_TTL);
    return result;
  }
}