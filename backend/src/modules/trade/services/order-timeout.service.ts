import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Not } from 'typeorm';
import { OrderEntity } from '../../../infrastructure/database/entities/trade/order.entity';
import { OrderItemEntity } from '../../../infrastructure/database/entities/trade/order-item.entity';
import { StockService } from '../../product/services/stock.service';
import { OrderStatus } from '../../../common/constants/enums';
import { ConfigService } from '@nestjs/config';

/**
 * 订单超时服务（对应 design.md 2.1.2 定时任务 + spec.md 5.2.1 规则4）
 * 扫描待支付超时订单自动取消 + 释放预占库存
 */
@Injectable()
export class OrderTimeoutService {
  private readonly logger = new Logger(OrderTimeoutService.name);

  constructor(
    @InjectRepository(OrderEntity) private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity) private readonly itemRepo: Repository<OrderItemEntity>,
    private readonly stockService: StockService,
    private readonly config: ConfigService,
  ) {}

  /** 扫描并取消超时订单 */
  async cancelTimeoutOrders(): Promise<number> {
    const timeoutMinutes = parseInt(this.config.get<string>('PAY_TIMEOUT_MINUTES', '30'), 10);
    const deadline = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    const orders = await this.orderRepo.find({
      where: { status: OrderStatus.PENDING_PAY, createdAt: LessThan(deadline) },
      take: 100,
    });
    let count = 0;
    for (const order of orders) {
      try {
        const items = await this.itemRepo.find({ where: { orderId: order.id } });
        for (const item of items) {
          await this.stockService.release(item.skuId, item.qty, order.orderNo);
        }
        await this.orderRepo.update(order.id, {
          status: OrderStatus.CANCELLED,
          cancelTime: new Date(),
          cancelReason: '支付超时自动取消',
        });
        count++;
      } catch (e) {
        this.logger.error(`取消超时订单失败 ${order.orderNo}: ${(e as Error).message}`);
      }
    }
    if (count > 0) {
      this.logger.log(`已取消 ${count} 笔超时订单`);
    }
    return count;
  }

  /** 自动确认收货（售后期 7 天后自动完成） */
  async autoFinish(): Promise<number> {
    const afterSaleDays = parseInt(this.config.get<string>('AFTER_SALE_DAYS', '7'), 10);
    const deadline = new Date(Date.now() - afterSaleDays * 24 * 60 * 60 * 1000);
    const orders = await this.orderRepo.find({
      where: { status: OrderStatus.RECEIVED, confirmTime: LessThan(deadline) },
      take: 100,
    });
    let count = 0;
    for (const order of orders) {
      await this.orderRepo.update(order.id, {
        status: OrderStatus.FINISHED,
        finishTime: new Date(),
      });
      count++;
    }
    if (count > 0) {
      this.logger.log(`已自动完成 ${count} 笔订单`);
    }
    return count;
  }
}