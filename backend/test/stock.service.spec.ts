import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { StockService } from '../src/modules/product/services/stock.service';
import { SkuEntity } from '../src/infrastructure/database/entities/product/sku.entity';
import { StockLogEntity } from '../src/infrastructure/database/entities/product/stock-log.entity';
import { REDIS_CLIENT } from '../src/infrastructure/redis/redis.constants';
import { RedisKeys } from '../src/common/constants/redis-keys';
import { StockChangeType } from '../src/common/constants/enums';
import { ErrorCode } from '../src/common/constants/error-code';
import { BusinessException } from '../src/common/exceptions/business.exception';

/**
 * 库存服务单元测试（对应 design.md 2.1.3 库存两阶段 + spec.md 4.2 规则3 防超卖）
 * 覆盖：Redis 预占（DECRBY 原子/不足回滚 INCRBY）、DB 确认扣减（FOR UPDATE/写 stock_log）、
 *       释放（Redis+DB 恢复）、退款回滚、运营调整、缓存初始化
 */
describe('StockService', () => {
  let service: StockService;
  let skuRepo: jest.Mocked<Repository<SkuEntity>>;
  let stockLogRepo: jest.Mocked<Repository<StockLogEntity>>;
  let redis: jest.Mocked<any>;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    redis = {
      decrby: jest.fn(),
      incrby: jest.fn(),
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    };
    dataSource = {
      transaction: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        { provide: getRepositoryToken(SkuEntity), useValue: createMockRepo() },
        { provide: getRepositoryToken(StockLogEntity), useValue: createMockRepo() },
        { provide: REDIS_CLIENT, useValue: redis },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
    skuRepo = module.get(getRepositoryToken(SkuEntity)) as jest.Mocked<Repository<SkuEntity>>;
    stockLogRepo = module.get(getRepositoryToken(StockLogEntity)) as jest.Mocked<Repository<StockLogEntity>>;
  });

  function createMockRepo() {
    return {
      find: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      count: jest.fn(),
      create: jest.fn((e: any) => e),
      save: jest.fn(async (e: any) => e),
      update: jest.fn(async () => undefined),
      delete: jest.fn(async () => undefined),
    };
  }

  /** 构造事务 manager mock，可控制查到的 SKU */
  function mockTransaction(sku: SkuEntity | null) {
    const manager: any = {
      getRepository: jest.fn().mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue({
          setLock: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(sku),
        }),
      }),
      update: jest.fn(async () => undefined),
      insert: jest.fn(async () => undefined),
    };
    (dataSource.transaction as jest.Mock).mockImplementation(async (cb: any) => cb(manager));
    return manager;
  }

  function buildSku(over: Partial<SkuEntity> = {}): SkuEntity {
    return {
      id: 101,
      productId: 1,
      specJson: {},
      price: 100,
      marketPrice: null,
      stock: 50,
      sales: 10,
      weight: null,
      unit: '盒',
      status: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...over,
    } as SkuEntity;
  }

  describe('getStock - 库存查询', () => {
    it('返回库存与售罄标志', async () => {
      skuRepo.findOne.mockResolvedValue(buildSku({ stock: 10, status: 1 }));
      const result = await service.getStock(101);
      expect(result).toEqual({ skuId: 101, stock: 10, soldOut: false });
    });

    it('库存为 0 时 soldOut=true', async () => {
      skuRepo.findOne.mockResolvedValue(buildSku({ stock: 0 }));
      const result = await service.getStock(101);
      expect(result.soldOut).toBe(true);
    });

    it('SKU 停售时 soldOut=true', async () => {
      skuRepo.findOne.mockResolvedValue(buildSku({ stock: 10, status: 0 }));
      const result = await service.getStock(101);
      expect(result.soldOut).toBe(true);
    });

    it('SKU 不存在时抛 SKU_NOT_FOUND', async () => {
      skuRepo.findOne.mockResolvedValue(null);
      await expect(service.getStock(999)).rejects.toMatchObject({ bizCode: ErrorCode.SKU_NOT_FOUND });
    });
  });

  describe('preOccupy - 第一阶段 Redis 预占', () => {
    it('库存充足时 DECRBY 成功，不回滚', async () => {
      redis.decrby.mockResolvedValue(40); // 50-10=40
      await service.preOccupy(101, 10, 'HNZY20260901123456');
      expect(redis.decrby).toHaveBeenCalledWith(RedisKeys.stockSku(101), 10);
      expect(redis.incrby).not.toHaveBeenCalled();
    });

    it('库存刚好够（after=0）应成功', async () => {
      redis.decrby.mockResolvedValue(0);
      await service.preOccupy(101, 50, 'HNZY20260901123456');
      expect(redis.incrby).not.toHaveBeenCalled();
    });

    it('库存不足（after<0）应 INCRBY 回滚并抛 STOCK_NOT_ENOUGH', async () => {
      redis.decrby.mockResolvedValue(-1);
      await expect(service.preOccupy(101, 60, 'HNZY20260901123456')).rejects.toMatchObject({
        bizCode: ErrorCode.STOCK_NOT_ENOUGH,
      });
      expect(redis.incrby).toHaveBeenCalledWith(RedisKeys.stockSku(101), 60);
    });

    it('并发场景：after=-5 也应回滚', async () => {
      redis.decrby.mockResolvedValue(-5);
      await expect(service.preOccupy(101, 55, 'orderNo')).rejects.toMatchObject({
        bizCode: ErrorCode.STOCK_NOT_ENOUGH,
      });
      expect(redis.incrby).toHaveBeenCalledWith(RedisKeys.stockSku(101), 55);
    });
  });

  describe('confirmDeduct - 第二阶段 DB 确认扣减', () => {
    it('库存充足时扣减并写 stock_log（PAY_CONFIRM）', async () => {
      const sku = buildSku({ stock: 50, sales: 10 });
      const manager = mockTransaction(sku);

      await service.confirmDeduct(101, 10, 'HNZY20260901123456');

      expect(manager.update).toHaveBeenCalledWith(SkuEntity, 101, { stock: 40, sales: 20 });
      expect(manager.insert).toHaveBeenCalledWith(StockLogEntity, {
        skuId: 101,
        changeType: StockChangeType.PAY_CONFIRM,
        changeQty: -10,
        beforeQty: 50,
        afterQty: 40,
        refOrderNo: 'HNZY20260901123456',
      });
    });

    it('SKU 不存在时抛 SKU_NOT_FOUND', async () => {
      mockTransaction(null);
      await expect(service.confirmDeduct(999, 10, 'orderNo')).rejects.toMatchObject({
        bizCode: ErrorCode.SKU_NOT_FOUND,
      });
    });

    it('DB 库存不足时抛 STOCK_NOT_ENOUGH（防超卖兜底）', async () => {
      mockTransaction(buildSku({ stock: 5 }));
      await expect(service.confirmDeduct(101, 10, 'orderNo')).rejects.toMatchObject({
        bizCode: ErrorCode.STOCK_NOT_ENOUGH,
      });
    });
  });

  describe('release - 释放预占库存', () => {
    it('Redis INCRBY 恢复 + DB 恢复 + 写 CANCEL_RELEASE 流水', async () => {
      const sku = buildSku({ stock: 40 });
      const manager = mockTransaction(sku);

      await service.release(101, 10, 'orderNo');

      expect(redis.incrby).toHaveBeenCalledWith(RedisKeys.stockSku(101), 10);
      expect(manager.update).toHaveBeenCalledWith(SkuEntity, 101, { stock: 50 });
      expect(manager.insert).toHaveBeenCalledWith(StockLogEntity, {
        skuId: 101,
        changeType: StockChangeType.CANCEL_RELEASE,
        changeQty: 10,
        beforeQty: 40,
        afterQty: 50,
        refOrderNo: 'orderNo',
      });
    });

    it('SKU 不存在时仅恢复 Redis 不抛异常', async () => {
      mockTransaction(null);
      await expect(service.release(999, 10, 'orderNo')).resolves.toBeUndefined();
      expect(redis.incrby).toHaveBeenCalled();
    });
  });

  describe('refundRollback - 退款回滚库存', () => {
    it('DB 恢复 + 写 REFUND_ROLLBACK 流水', async () => {
      const sku = buildSku({ stock: 30 });
      const manager = mockTransaction(sku);

      await service.refundRollback(101, 20, 'orderNo');

      expect(manager.update).toHaveBeenCalledWith(SkuEntity, 101, { stock: 50 });
      expect(manager.insert).toHaveBeenCalledWith(StockLogEntity, {
        skuId: 101,
        changeType: StockChangeType.REFUND_ROLLBACK,
        changeQty: 20,
        beforeQty: 30,
        afterQty: 50,
        refOrderNo: 'orderNo',
      });
    });
  });

  describe('adjust - 运营调整库存', () => {
    it('调整库存 + 写 OPERATOR_ADJUST 流水 + 同步 Redis', async () => {
      const sku = buildSku({ stock: 50 });
      const manager = mockTransaction(sku);

      await service.adjust(101, 80, 1, '盘点调整');

      expect(manager.update).toHaveBeenCalledWith(SkuEntity, 101, { stock: 80 });
      expect(manager.insert).toHaveBeenCalledWith(StockLogEntity, {
        skuId: 101,
        changeType: StockChangeType.OPERATOR_ADJUST,
        changeQty: 30, // 80-50
        beforeQty: 50,
        afterQty: 80,
        operatorId: 1,
        remark: '盘点调整',
      });
      expect(redis.set).toHaveBeenCalledWith(RedisKeys.stockSku(101), 80);
    });

    it('SKU 不存在时抛 SKU_NOT_FOUND', async () => {
      mockTransaction(null);
      await expect(service.adjust(999, 80, 1)).rejects.toMatchObject({
        bizCode: ErrorCode.SKU_NOT_FOUND,
      });
    });
  });

  describe('initStockCache - 初始化 Redis 库存缓存', () => {
    it('应写入 Redis 缓存', async () => {
      await service.initStockCache(101, 100);
      expect(redis.set).toHaveBeenCalledWith(RedisKeys.stockSku(101), 100);
    });
  });
});