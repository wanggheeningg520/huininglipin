import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrderTimeoutService } from '../services/order-timeout.service';

/**
 * 订单定时任务调度器（对应 design.md 2.1.2 定时任务）
 * 每分钟扫描待支付超时订单
 * 每小时扫描已收货订单自动完成
 */
@Injectable()
export class OrderTimeoutScheduler {
  private readonly logger = new Logger(OrderTimeoutScheduler.name);
  constructor(private readonly timeoutService: OrderTimeoutService) {}

  @Cron('* * * * *')
  async cancelTimeoutOrders(): Promise<void> {
    try {
      await this.timeoutService.cancelTimeoutOrders();
    } catch (e) {
      this.logger.error(`超时取消任务失败: ${(e as Error).message}`);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async autoFinish(): Promise<void> {
    try {
      await this.timeoutService.autoFinish();
    } catch (e) {
      this.logger.error(`自动完成任务失败: ${(e as Error).message}`);
    }
  }
}