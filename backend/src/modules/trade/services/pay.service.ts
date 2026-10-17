import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { OrderEntity } from '../../../infrastructure/database/entities/trade/order.entity';
import { WechatPayService } from '../../../infrastructure/wechat/wechat-pay.service';
import { OrderService } from './order.service';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { ErrorCode, OrderStatus, PayStatus } from '../../../common/constants/enums';
import { REDIS_CLIENT } from '../../../infrastructure/redis/redis.constants';
import { RedisKeys, PAY_CALLBACK_TTL } from '../../../common/constants/redis-keys';
import { ConfigService } from '@nestjs/config';

/**
 * 支付服务（对应 design.md 2.1.3 支付回调流程 + 2.2.2 接口12/13）
 * 微信支付 v3 统一下单返回小程序支付参数
 * 回调 V3 RSA 验签 + 解密 + Redis 幂等键
 */
@Injectable()
export class PayService {
  private readonly logger = new Logger(PayService.name);

  constructor(
    @InjectRepository(OrderEntity) private readonly orderRepo: Repository<OrderEntity>,
    private readonly wechatPay: WechatPayService,
    private readonly orderService: OrderService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly config: ConfigService,
  ) {}

  /** 微信支付下单（接口12） */
  async createPay(userId: number, orderNo: string): Promise<any> {
    const order = await this.orderRepo.findOne({ where: { orderNo, userId } });
    if (!order) {
      throw new BusinessException(ErrorCode.ORDER_NOT_FOUND);
    }
    if (order.status !== OrderStatus.PENDING_PAY) {
      if (order.status === OrderStatus.PENDING_SHIP || order.payStatus === PayStatus.PAID) {
        throw new BusinessException(ErrorCode.ORDER_PAID_REPEAT);
      }
      throw new BusinessException(ErrorCode.ORDER_STATUS_INVALID);
    }
    // 调用微信支付统一下单
    const payParams = await this.wechatPay.createOrder({
      orderNo: order.orderNo,
      description: `慧宁甄选订单 ${order.orderNo}`,
      amount: Number(order.payAmount),
      openid: (order as any).user?.openid || '',
    });
    return payParams;
  }

  /**
   * 微信支付回调（接口13）
   * V3 RSA 验签 + 解密 + Redis 幂等键 SETNX
   */
  async handleCallback(headers: Record<string, string>, rawBody: string): Promise<any> {
    // 验签 + 解密
    let payload: any;
    try {
      payload = await this.wechatPay.verifyAndDecryptCallback(headers, rawBody);
    } catch (e) {
      this.logger.error(`支付回调验签失败: ${(e as Error).message}`);
      return { code: 'FAIL', message: '验签失败' };
    }

    // 幂等键 SETNX
    const idemKey = RedisKeys.payCallback(payload.transactionId);
    const setOk = await this.redis.set(idemKey, '1', 'EX', PAY_CALLBACK_TTL, 'NX');
    if (!setOk) {
      // 重复回调，返回成功不重复处理
      this.logger.log(`重复回调 tradeNo=${payload.transactionId}，幂等返回`);
      return { code: 'SUCCESS', message: 'OK' };
    }

    // 仅处理支付成功
    if (payload.tradeState !== 'SUCCESS') {
      return { code: 'SUCCESS', message: 'OK' };
    }

    // 确认支付：更新订单 + 确认库存扣减
    try {
      await this.orderService.confirmPaid(
        payload.outTradeNo,
        payload.transactionId,
        new Date(payload.successTime),
      );
    } catch (e) {
      this.logger.error(`支付回调处理失败: ${(e as Error).message}`);
      // 处理失败删除幂等键允许重试
      await this.redis.del(idemKey);
      return { code: 'FAIL', message: '处理失败' };
    }

    return { code: 'SUCCESS', message: 'OK' };
  }
}