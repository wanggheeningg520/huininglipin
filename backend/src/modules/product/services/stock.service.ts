import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import Redis from 'ioredis';
import { SkuEntity } from '../../../infrastructure/database/entities/product/sku.entity';
import { StockLogEntity } from '../../../infrastructure/database/entities/product/stock-log.entity';
import { REDIS_CLIENT } from '../../../infrastructure/redis/redis.constants';
import { RedisKeys } from '../../../common/constants/redis-keys';
import { StockChangeType } from '../../../common/constants/enums';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { ErrorCode } from '../../../common/constants/error-code';

/**
 * 库存服务（对应 design.md 2.1.3 库存两阶段 + spec.md 4.2 规则3 防超卖）
 * 第一阶段：Redis DECRBY 原子预占（创建订单时）
 * 第二阶段：DB FOR UPDATE 确认（支付回调时）
 * 释放：取消/退款时 Redis INCRBY + DB 恢复
 * 每次变动写 stock_log
 */
@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  constructor(
    @InjectRepository(SkuEntity) private readonly skuRepo: Repository<SkuEntity>,
    @InjectRepository(StockLogEntity) private readonly stockLogRepo: Repository<StockLogEntity>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly dataSource: DataSource,
  ) {}

  /** 库存查询（接口4） */
  async getStock(skuId: number): Promise<{ skuId: number; stock: number; soldOut: boolean }> {
    const sku = await this.skuRepo.findOne({ where: { id: skuId } });
    if (!sku) {
      throw new BusinessException(ErrorCode.SKU_NOT_FOUND);
    }
    return {
      skuId,
      stock: sku.stock,
      soldOut: sku.stock <= 0 || sku.status !== 1,
    };
  }

  /**
   * 第一阶段：Redis 预占库存（创建订单时）
   * Redis DECRBY 原子操作，结果 <0 则回滚 INCRBY 并抛库存不足
   */
  async preOccupy(skuId: number, qty: number, orderNo: string): Promise<void> {
    const key = RedisKeys.stockSku(skuId);
    const after = await this.redis.decrby(key, qty);
    if (after < 0) {
      // 回滚
      await this.redis.incrby(key, qty);
      throw new BusinessException(ErrorCode.STOCK_NOT_ENOUGH);
    }
    this.logger.log(`预占库存 sku=${skuId} qty=${qty} orderNo=${orderNo} after=${after}`);
  }

  /**
   * 第二阶段：DB 确认扣减（支付回调时）
   * DB 事务 SELECT FOR UPDATE 校验并扣减，写 stock_log
   */
  async confirmDeduct(skuId: number, qty: number, orderNo: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const sku = await manager
        .getRepository(SkuEntity)
        .createQueryBuilder('sku')
        .setLock('pessimistic_write')
        .where('sku.id = :id', { id: skuId })
        .getOne();
      if (!sku) {
        throw new BusinessException(ErrorCode.SKU_NOT_FOUND);
      }
      if (sku.stock < qty) {
        throw new BusinessException(ErrorCode.STOCK_NOT_ENOUGH);
      }
      const before = sku.stock;
      const after = before - qty;
      await manager.update(SkuEntity, skuId, { stock: after, sales: sku.sales + qty });
      await manager.insert(StockLogEntity, {
        skuId,
        changeType: StockChangeType.PAY_CONFIRM,
        changeQty: -qty,
        beforeQty: before,
        afterQty: after,
        refOrderNo: orderNo,
      });
    });
  }

  /** 释放预占库存（取消订单时） */
  async release(skuId: number, qty: number, orderNo: string): Promise<void> {
    // Redis 恢复
    const key = RedisKeys.stockSku(skuId);
    await this.redis.incrby(key, qty);
    // DB 恢复 + stock_log
    await this.dataSource.transaction(async (manager) => {
      const sku = await manager
        .getRepository(SkuEntity)
        .createQueryBuilder('sku')
        .setLock('pessimistic_write')
        .where('sku.id = :id', { id: skuId })
        .getOne();
      if (!sku) return;
      const before = sku.stock;
      const after = before + qty;
      await manager.update(SkuEntity, skuId, { stock: after });
      await manager.insert(StockLogEntity, {
        skuId,
        changeType: StockChangeType.CANCEL_RELEASE,
        changeQty: qty,
        beforeQty: before,
        afterQty: after,
        refOrderNo: orderNo,
      });
    });
  }

  /** 退款回滚库存 */
  async refundRollback(skuId: number, qty: number, orderNo: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const sku = await manager
        .getRepository(SkuEntity)
        .createQueryBuilder('sku')
        .setLock('pessimistic_write')
        .where('sku.id = :id', { id: skuId })
        .getOne();
      if (!sku) return;
      const before = sku.stock;
      const after = before + qty;
      await manager.update(SkuEntity, skuId, { stock: after });
      await manager.insert(StockLogEntity, {
        skuId,
        changeType: StockChangeType.REFUND_ROLLBACK,
        changeQty: qty,
        beforeQty: before,
        afterQty: after,
        refOrderNo: orderNo,
      });
    });
  }

  /** 运营调整库存（后台，写 stock_log） */
  async adjust(skuId: number, newStock: number, operatorId: number, remark?: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const sku = await manager
        .getRepository(SkuEntity)
        .createQueryBuilder('sku')
        .setLock('pessimistic_write')
        .where('sku.id = :id', { id: skuId })
        .getOne();
      if (!sku) {
        throw new BusinessException(ErrorCode.SKU_NOT_FOUND);
      }
      const before = sku.stock;
      const change = newStock - before;
      await manager.update(SkuEntity, skuId, { stock: newStock });
      await manager.insert(StockLogEntity, {
        skuId,
        changeType: StockChangeType.OPERATOR_ADJUST,
        changeQty: change,
        beforeQty: before,
        afterQty: newStock,
        operatorId,
        remark,
      });
      // 同步 Redis 缓存
      const key = RedisKeys.stockSku(skuId);
      await this.redis.set(key, newStock);
    });
  }

  /** 初始化 Redis 库存缓存（SKU 上架时） */
  async initStockCache(skuId: number, stock: number): Promise<void> {
    const key = RedisKeys.stockSku(skuId);
    await this.redis.set(key, stock);
  }
}