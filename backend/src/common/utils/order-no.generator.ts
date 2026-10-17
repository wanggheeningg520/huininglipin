import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../infrastructure/redis/redis.constants';
import { RedisKeys } from '../constants/redis-keys';

/**
 * 订单号生成器（对应 design.md 2.3.1 订单号规则 + spec.md 6.5 规则2）
 * 规则：HNZY + yyyyMMdd + 6 位随机数字，总长 22 位
 * 实现：日期 + Redis 自增序号取模降低冲突 + 随机数 + DB 唯一索引兜底重试
 */
@Injectable()
export class OrderNoGenerator {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  /**
   * 生成订单号
   * @param existsCheck 可选的 DB 唯一性校验函数，冲突时重试最多 3 次
   */
  async generate(existsCheck?: (orderNo: string) => Promise<boolean>): Promise<string> {
    const today = this.formatDate(new Date());
    const seqKey = RedisKeys.orderSeq(today);

    for (let attempt = 0; attempt < 3; attempt++) {
      // Redis 自增序号保证同日内递增，降低 6 位随机数冲突概率
      const seq = await this.redis.incr(seqKey);
      // 序号当日有效，设置 2 天过期
      if (seq === 1) {
        await this.redis.expire(seqKey, 2 * 24 * 60 * 60);
      }
      // 6 位：seq 取模 1000000 + 随机扰动，保证 6 位
      const randomPart = ((seq * 7919 + Math.floor(Math.random() * 1000000)) % 1000000)
        .toString()
        .padStart(6, '0');
      const orderNo = `HNZY${today}${randomPart}`;

      if (!existsCheck) {
        return orderNo;
      }
      const exists = await existsCheck(orderNo);
      if (!exists) {
        return orderNo;
      }
    }
    // 重试 3 次仍冲突，抛异常
    throw new Error('订单号生成失败：连续 3 次冲突');
  }

  /** 退款单号：RF + yyyyMMdd + 6 位随机 */
  async generateRefundNo(): Promise<string> {
    const today = this.formatDate(new Date());
    const random = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
    return `RF${today}${random}`;
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  }
}