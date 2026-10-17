import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { OrderService } from '../src/modules/trade/services/order.service';
import { OrderEntity } from '../src/infrastructure/database/entities/trade/order.entity';
import { OrderItemEntity } from '../src/infrastructure/database/entities/trade/order-item.entity';
import { SkuEntity } from '../src/infrastructure/database/entities/product/sku.entity';
import { ProductEntity } from '../src/infrastructure/database/entities/product/product.entity';
import { AddressEntity } from '../src/infrastructure/database/entities/member/address.entity';
import { StockLogEntity } from '../src/infrastructure/database/entities/product/stock-log.entity';
import { OrderNoGenerator } from '../src/common/utils/order-no.generator';
import { StockService } from '../src/modules/product/services/stock.service';
import { CartService } from '../src/modules/trade/services/cart.service';
import { ErrorCode, OrderStatus, PayStatus, OrderType, SkuStatus, ProductStatus } from '../src/common/constants/enums';

/**
 * 订单服务单元测试（对应 design.md 2.1.3 创建订单流程 + 2.2.2 接口9/10/11/14/15）
 * 覆盖：创建订单（地址校验/SKU 校验/商品上架校验/金额计算/预售判定/库存预占/事务写入/失败回滚）、
 *       列表/详情、取消（状态机校验+释放库存）、确认收货、支付回调确认（幂等+DB 扣减库存）、发货
 */
describe('OrderService', () => {
  let service: OrderService;
  let orderRepo: jest.Mocked<Repository<OrderEntity>>;
  let itemRepo: jest.Mocked<Repository<OrderItemEntity>>;
  let skuRepo: jest.Mocked<Repository<SkuEntity>>;
  let prodRepo: jest.Mocked<Repository<ProductEntity>>;
  let addrRepo: jest.Mocked<Repository<AddressEntity>>;
  let orderNoGen: jest.Mocked<OrderNoGenerator>;
  let stockService: jest.Mocked<StockService>;
  let cartService: jest.Mocked<CartService>;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    orderNoGen = { generate: jest.fn(), generateRefundNo: jest.fn() } as any;
    stockService = {
      preOccupy: jest.fn(),
      release: jest.fn(),
      confirmDeduct: jest.fn(),
      refundRollback: jest.fn(),
      adjust: jest.fn(),
      initStockCache: jest.fn(),
      getStock: jest.fn(),
    } as any;
    cartService = { clearChecked: jest.fn() } as any;
    dataSource = { transaction: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getRepositoryToken(OrderEntity), useValue: mockRepo() },
        { provide: getRepositoryToken(OrderItemEntity), useValue: mockRepo() },
        { provide: getRepositoryToken(SkuEntity), useValue: mockRepo() },
        { provide: getRepositoryToken(ProductEntity), useValue: mockRepo() },
        { provide: getRepositoryToken(AddressEntity), useValue: mockRepo() },
        { provide: OrderNoGenerator, useValue: orderNoGen },
        { provide: StockService, useValue: stockService },
        { provide: CartService, useValue: cartService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    orderRepo = module.get(getRepositoryToken(OrderEntity)) as jest.Mocked<Repository<OrderEntity>>;
    itemRepo = module.get(getRepositoryToken(OrderItemEntity)) as jest.Mocked<Repository<OrderItemEntity>>;
    skuRepo = module.get(getRepositoryToken(SkuEntity)) as jest.Mocked<Repository<SkuEntity>>;
    prodRepo = module.get(getRepositoryToken(ProductEntity)) as jest.Mocked<Repository<ProductEntity>>;
    addrRepo = module.get(getRepositoryToken(AddressEntity)) as jest.Mocked<Repository<AddressEntity>>;
  });

  function mockRepo() {
    return {
      find: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      count: jest.fn(),
      create: jest.fn((e: any) => e),
      save: jest.fn(async (e: any) => e),
      update: jest.fn(async () => undefined),
      delete: jest.fn(async () => undefined),
      insert: jest.fn(async () => undefined),
    };
  }

  function buildAddress(): AddressEntity {
    return {
      id: 1,
      userId: 100,
      name: '张三',
      phone: '13800000000',
      province: '广东省',
      city: '深圳市',
      district: '南山区',
      detail: '科技园 1 号',
      isDefault: 1,
    } as AddressEntity;
  }

  function buildSku(over: Partial<SkuEntity> = {}): SkuEntity {
    return {
      id: 101,
      productId: 1,
      specJson: { 规格: '标准装' },
      price: 100,
      marketPrice: null,
      stock: 50,
      sales: 10,
      status: SkuStatus.ON_SALE,
      ...over,
    } as SkuEntity;
  }

  function buildProduct(over: Partial<ProductEntity> = {}): ProductEntity {
    return {
      id: 1,
      categoryId: 10,
      title: '中秋礼盒',
      mainImage: 'p.jpg',
      isPresale: 0,
      presaleDeliverDate: null,
      status: ProductStatus.ON_SALE,
      ...over,
    } as ProductEntity;
  }

  describe('create - 创建订单', () => {
    const dto = { items: [{ skuId: 101, qty: 2 }], addressId: 1 };

    it('地址不存在时抛 MEMBER_NOT_FOUND', async () => {
      addrRepo.findOne.mockResolvedValue(null);
      await expect(service.create(100, dto as any)).rejects.toMatchObject({
        bizCode: ErrorCode.MEMBER_NOT_FOUND,
      });
    });

    it('SKU 不存在时抛 SKU_NOT_FOUND', async () => {
      addrRepo.findOne.mockResolvedValue(buildAddress());
      skuRepo.find.mockResolvedValue([]); // 找不到 SKU
      await expect(service.create(100, dto as any)).rejects.toMatchObject({
        bizCode: ErrorCode.SKU_NOT_FOUND,
      });
    });

    it('SKU 停售时抛 SKU_NOT_FOUND', async () => {
      addrRepo.findOne.mockResolvedValue(buildAddress());
      skuRepo.find.mockResolvedValue([buildSku({ status: SkuStatus.OFF_SALE })]);
      await expect(service.create(100, dto as any)).rejects.toMatchObject({
        bizCode: ErrorCode.SKU_NOT_FOUND,
      });
    });

    it('商品已下架时抛 PRODUCT_NOT_FOUND', async () => {
      addrRepo.findOne.mockResolvedValue(buildAddress());
      skuRepo.find.mockResolvedValue([buildSku()]);
      prodRepo.find.mockResolvedValue([buildProduct({ status: ProductStatus.OFF_SHELF })]);
      await expect(service.create(100, dto as any)).rejects.toMatchObject({
        bizCode: ErrorCode.PRODUCT_NOT_FOUND,
      });
    });

    it('正常创建：预占库存 → 事务写订单/明细/stock_log → 返回订单号', async () => {
      addrRepo.findOne.mockResolvedValue(buildAddress());
      skuRepo.find.mockResolvedValue([buildSku()]);
      prodRepo.find.mockResolvedValue([buildProduct()]);
      orderNoGen.generate.mockResolvedValue('HNZY20260901123456');
      orderRepo.count.mockResolvedValue(0);

      const txManager = {
        create: jest.fn((_: any, e: any) => e),
        save: jest.fn(async (e: any) => (Array.isArray(e) ? e : { ...e, id: 1 })),
        insert: jest.fn(async () => undefined),
      };
      (dataSource.transaction as jest.Mock).mockImplementation(async (cb: any) => cb(txManager));

      const result = await service.create(100, dto as any);

      // 预占库存被调用
      expect(stockService.preOccupy).toHaveBeenCalledWith(101, 2, 'HNZY20260901123456');
      // 订单写入
      expect(txManager.create).toHaveBeenCalled();
      expect(txManager.save).toHaveBeenCalledTimes(2); // order + items
      // stock_log 写入（下单预占）
      expect(txManager.insert).toHaveBeenCalled();
      // 返回值
      expect(result.orderNo).toBe('HNZY20260901123456');
      expect(result.totalAmount).toBe(200); // 100*2
      expect(result.status).toBe(OrderStatus.PENDING_PAY);
    });

    it('预售商品：isPresale=1 且记录预计发货日', async () => {
      addrRepo.findOne.mockResolvedValue(buildAddress());
      skuRepo.find.mockResolvedValue([buildSku()]);
      prodRepo.find.mockResolvedValue([
        buildProduct({ isPresale: 1, presaleDeliverDate: new Date('2026-10-01') }),
      ]);
      orderNoGen.generate.mockResolvedValue('HNZY20260901123456');
      orderRepo.count.mockResolvedValue(0);
      const txManager = {
        create: jest.fn((_: any, e: any) => e),
        save: jest.fn(async (e: any) => (Array.isArray(e) ? e : { ...e, id: 1 })),
        insert: jest.fn(async () => undefined),
      };
      (dataSource.transaction as jest.Mock).mockImplementation(async (cb: any) => cb(txManager));

      await service.create(100, dto as any);

      const orderArg = txManager.create.mock.calls[0][1];
      expect(orderArg.isPresale).toBe(1);
      expect(orderArg.presaleDeliverDate).toEqual(new Date('2026-10-01'));
    });

    it('fromCart=true 时结算后清除购物车已购项', async () => {
      addrRepo.findOne.mockResolvedValue(buildAddress());
      skuRepo.find.mockResolvedValue([buildSku()]);
      prodRepo.find.mockResolvedValue([buildProduct()]);
      orderNoGen.generate.mockResolvedValue('HNZY20260901123456');
      orderRepo.count.mockResolvedValue(0);
      const txManager = {
        create: jest.fn((_: any, e: any) => e),
        save: jest.fn(async (e: any) => (Array.isArray(e) ? e : { ...e, id: 1 })),
        insert: jest.fn(async () => undefined),
      };
      (dataSource.transaction as jest.Mock).mockImplementation(async (cb: any) => cb(txManager));

      await service.create(100, { ...dto, fromCart: true } as any);

      expect(cartService.clearChecked).toHaveBeenCalledWith(100);
    });

    it('事务失败时回滚 Redis 预占并抛出原异常', async () => {
      addrRepo.findOne.mockResolvedValue(buildAddress());
      skuRepo.find.mockResolvedValue([buildSku()]);
      prodRepo.find.mockResolvedValue([buildProduct()]);
      orderNoGen.generate.mockResolvedValue('HNZY20260901123456');
      orderRepo.count.mockResolvedValue(0);
      (dataSource.transaction as jest.Mock).mockRejectedValue(new Error('DB 写入失败'));

      await expect(service.create(100, dto as any)).rejects.toThrow('DB 写入失败');
      // 回滚预占
      expect(stockService.release).toHaveBeenCalledWith(101, 2, 'HNZY20260901123456');
    });
  });

  describe('list - 订单列表', () => {
    it('返回订单列表 + 明细聚合', async () => {
      const orders = [{ id: 1, orderNo: 'O1', status: OrderStatus.PENDING_PAY, totalAmount: 100, payAmount: 100, createdAt: new Date() } as any];
      orderRepo.findAndCount.mockResolvedValue([orders, 1]);
      itemRepo.find.mockResolvedValue([
        { orderId: 1, productTitle: '礼盒', specJson: {}, price: 100, qty: 1, productImage: 'p.jpg' } as any,
      ]);

      const result = await service.list(100, {} as any);

      expect(result.list).toHaveLength(1);
      expect(result.list[0].items[0].productTitle).toBe('礼盒');
    });

    it('status=待发货 映射为 PENDING_SHIP', async () => {
      orderRepo.findAndCount.mockResolvedValue([[], 0]);
      await service.list(100, { status: '待发货' } as any);
      const callArg = orderRepo.findAndCount.mock.calls[0][0] as any;
      expect(callArg.where.status).toBe(OrderStatus.PENDING_SHIP);
    });

    it('status=待收货 映射为 SHIPPED', async () => {
      orderRepo.findAndCount.mockResolvedValue([[], 0]);
      await service.list(100, { status: '待收货' } as any);
      const callArg = orderRepo.findAndCount.mock.calls[0][0] as any;
      expect(callArg.where.status).toBe(OrderStatus.SHIPPED);
    });
  });

  describe('detail - 订单详情', () => {
    it('订单不存在时抛 ORDER_NOT_FOUND', async () => {
      orderRepo.findOne.mockResolvedValue(null);
      await expect(service.detail(100, 'O999')).rejects.toMatchObject({
        bizCode: ErrorCode.ORDER_NOT_FOUND,
      });
    });

    it('返回完整订单详情含收货人/物流/明细', async () => {
      orderRepo.findOne.mockResolvedValue({
        id: 1, orderNo: 'O1', status: OrderStatus.PAID, payStatus: PayStatus.PAID,
        orderType: OrderType.RETAIL, totalAmount: 100, payAmount: 100, cardPayAmount: 0,
        payType: '微信支付', payTime: new Date(), tradeNo: 'T1',
        receiverName: '张三', receiverPhone: '138', receiverAddress: '广东',
        remark: null, isPresale: 0, presaleDeliverDate: null,
        logisticsCompany: '顺丰', logisticsTrackNo: 'SF123',
      } as any);
      itemRepo.find.mockResolvedValue([
        { id: 1, skuId: 101, productId: 1, productTitle: '礼盒', productImage: 'p.jpg', specJson: {}, price: 100, qty: 1, subtotal: 100 } as any,
      ]);

      const result = await service.detail(100, 'O1');

      expect(result.orderNo).toBe('O1');
      expect(result.receiver.name).toBe('张三');
      expect(result.logistics).toEqual({ company: '顺丰', trackNo: 'SF123' });
      expect(result.items).toHaveLength(1);
    });
  });

  describe('cancel - 取消订单', () => {
    it('订单不存在时抛 ORDER_NOT_FOUND', async () => {
      orderRepo.findOne.mockResolvedValue(null);
      await expect(service.cancel(100, 'O999')).rejects.toMatchObject({
        bizCode: ErrorCode.ORDER_NOT_FOUND,
      });
    });

    it('非待支付状态取消抛 ORDER_STATUS_INVALID', async () => {
      orderRepo.findOne.mockResolvedValue({ id: 1, status: OrderStatus.RECEIVED } as any);
      await expect(service.cancel(100, 'O1')).rejects.toMatchObject({
        bizCode: ErrorCode.ORDER_STATUS_INVALID,
      });
    });

    it('待支付订单取消：释放库存 + 更新状态', async () => {
      orderRepo.findOne.mockResolvedValue({ id: 1, status: OrderStatus.PENDING_PAY } as any);
      itemRepo.find.mockResolvedValue([{ skuId: 101, qty: 2 } as any]);

      await service.cancel(100, 'O1');

      expect(stockService.release).toHaveBeenCalledWith(101, 2, 'O1');
      expect(orderRepo.update).toHaveBeenCalledWith(1, expect.objectContaining({
        status: OrderStatus.CANCELLED,
        cancelReason: '用户主动取消',
      }));
    });
  });

  describe('confirm - 确认收货', () => {
    it('非已发货状态确认收货抛 ORDER_STATUS_INVALID', async () => {
      orderRepo.findOne.mockResolvedValue({ id: 1, status: OrderStatus.PENDING_PAY } as any);
      await expect(service.confirm(100, 'O1')).rejects.toMatchObject({
        bizCode: ErrorCode.ORDER_STATUS_INVALID,
      });
    });

    it('已发货订单确认收货成功', async () => {
      orderRepo.findOne.mockResolvedValue({ id: 1, status: OrderStatus.SHIPPED } as any);
      await service.confirm(100, 'O1');
      expect(orderRepo.update).toHaveBeenCalledWith(1, expect.objectContaining({
        status: OrderStatus.RECEIVED,
      }));
    });
  });

  describe('confirmPaid - 支付回调确认', () => {
    it('订单已非待支付时幂等返回', async () => {
      const paidOrder = { id: 1, status: OrderStatus.PENDING_SHIP } as any;
      orderRepo.findOne.mockResolvedValue(paidOrder);
      const result = await service.confirmPaid('O1', 'T1', new Date());
      expect(result).toBe(paidOrder);
      expect(stockService.confirmDeduct).not.toHaveBeenCalled();
    });

    it('待支付订单：DB 确认扣减库存 + 更新为待发货/已支付', async () => {
      orderRepo.findOne.mockResolvedValue({ id: 1, status: OrderStatus.PENDING_PAY } as any);
      itemRepo.find.mockResolvedValue([{ skuId: 101, qty: 2 } as any]);

      const result = await service.confirmPaid('O1', 'T1', new Date('2026-09-01'));

      expect(stockService.confirmDeduct).toHaveBeenCalledWith(101, 2, 'O1');
      expect(orderRepo.update).toHaveBeenCalledWith(1, expect.objectContaining({
        status: OrderStatus.PENDING_SHIP,
        payStatus: PayStatus.PAID,
        payType: '微信支付',
        tradeNo: 'T1',
      }));
      expect(result.status).toBe(OrderStatus.PENDING_SHIP);
    });
  });

  describe('ship - 后台发货', () => {
    it('待发货订单发货成功', async () => {
      orderRepo.findOne.mockResolvedValue({ id: 1, status: OrderStatus.PENDING_SHIP } as any);
      await service.ship('O1', '顺丰', 'SF123');
      expect(orderRepo.update).toHaveBeenCalledWith(1, expect.objectContaining({
        status: OrderStatus.SHIPPED,
        logisticsCompany: '顺丰',
        logisticsTrackNo: 'SF123',
      }));
    });

    it('非待发货状态发货抛 ORDER_STATUS_INVALID', async () => {
      orderRepo.findOne.mockResolvedValue({ id: 1, status: OrderStatus.PENDING_PAY } as any);
      await expect(service.ship('O1', '顺丰', 'SF123')).rejects.toMatchObject({
        bizCode: ErrorCode.ORDER_STATUS_INVALID,
      });
    });
  });
});