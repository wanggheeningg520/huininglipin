import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProductService } from '../src/modules/product/services/product.service';
import { ProductEntity } from '../src/infrastructure/database/entities/product/product.entity';
import { SkuEntity } from '../src/infrastructure/database/entities/product/sku.entity';
import { CategoryEntity } from '../src/infrastructure/database/entities/product/category.entity';
import { BusinessException } from '../src/common/exceptions/business.exception';
import { ErrorCode, ProductStatus, SkuStatus } from '../src/common/constants/enums';

/**
 * 商品服务单元测试（对应 design.md 2.2.2 接口2/3）
 * 覆盖：商品列表（分类筛选/排序/分页/SKU 最低价聚合）、商品详情（含生鲜合规提示/预售提示/SKU 售卖状态）、
 *       后台列表/创建/更新/上下架/批量上下架/预售配置
 */
describe('ProductService', () => {
  let service: ProductService;
  let prodRepo: jest.Mocked<Repository<ProductEntity>>;
  let skuRepo: jest.Mocked<Repository<SkuEntity>>;
  let catRepo: jest.Mocked<Repository<CategoryEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: getRepositoryToken(ProductEntity), useValue: createMockRepo() },
        { provide: getRepositoryToken(SkuEntity), useValue: createMockRepo() },
        { provide: getRepositoryToken(CategoryEntity), useValue: createMockRepo() },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    prodRepo = module.get(getRepositoryToken(ProductEntity)) as jest.Mocked<Repository<ProductEntity>>;
    skuRepo = module.get(getRepositoryToken(SkuEntity)) as jest.Mocked<Repository<SkuEntity>>;
    catRepo = module.get(getRepositoryToken(CategoryEntity)) as jest.Mocked<Repository<CategoryEntity>>;
  });

  /** 构造一个 mock Repository，所有方法返回 jest.fn 以便断言 */
  function createMockRepo() {
    return {
      find: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      count: jest.fn(),
      create: jest.fn((entity: any) => entity),
      save: jest.fn(async (entity: any) => entity),
      update: jest.fn(async () => undefined),
      delete: jest.fn(async () => undefined),
      softDelete: jest.fn(async () => undefined),
      manager: {
        transaction: jest.fn(async (cb: any) => cb({
          create: jest.fn((_: any, e: any) => e),
          save: jest.fn(async (e: any) => e),
          insert: jest.fn(async () => undefined),
          update: jest.fn(async () => undefined),
        })),
      },
    };
  }

  /** 构造商品实体 */
  function buildProduct(over: Partial<ProductEntity> = {}): ProductEntity {
    return {
      id: 1,
      categoryId: 10,
      title: '中秋礼盒',
      subtitle: '伴手礼',
      mainImage: 'https://cdn/p.jpg',
      imagesJson: ['https://cdn/1.jpg', 'https://cdn/2.jpg'],
      detailHtml: '<p>详情</p>',
      isPresale: 0,
      presaleDeliverDate: null,
      status: ProductStatus.ON_SALE,
      sort: 0,
      createdAt: new Date('2026-09-01'),
      updatedAt: new Date('2026-09-01'),
      deletedAt: null,
      ...over,
    } as ProductEntity;
  }

  /** 构造 SKU 实体 */
  function buildSku(over: Partial<SkuEntity> = {}): SkuEntity {
    return {
      id: 101,
      productId: 1,
      specJson: { 规格: '标准装' },
      price: 128,
      marketPrice: 168,
      stock: 50,
      sales: 10,
      weight: 1.2,
      unit: '盒',
      status: SkuStatus.ON_SALE,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...over,
    } as SkuEntity;
  }

  describe('list - C 端商品列表', () => {
    it('应返回上架商品列表并聚合 SKU 最低价/销量', async () => {
      const products = [buildProduct({ id: 1 }), buildProduct({ id: 2, title: '端午礼盒' })];
      prodRepo.findAndCount.mockResolvedValue([products, 2]);
      const skus = [
        buildSku({ id: 101, productId: 1, price: 88, marketPrice: 128, sales: 5 }),
        buildSku({ id: 102, productId: 1, price: 128, marketPrice: 168, sales: 3 }),
        buildSku({ id: 201, productId: 2, price: 99, marketPrice: 139, sales: 8 }),
      ];
      skuRepo.find.mockResolvedValue(skus);

      const result = await service.list({ page: 1, pageSize: 20 });

      expect(result.total).toBe(2);
      expect(result.list).toHaveLength(2);
      expect(result.list[0].priceFrom).toBe(88); // Math.min(88,128)
      expect(result.list[0].marketPriceFrom).toBe(168); // Math.max(128,168)
      expect(result.list[0].sales).toBe(8); // 5+3
      expect(result.list[1].priceFrom).toBe(99);
      // 断言仅查在售 SKU
      expect(skuRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { productId: In([1, 2]), status: SkuStatus.ON_SALE } }),
      );
    });

    it('无商品时返回空列表且不查 SKU', async () => {
      prodRepo.findAndCount.mockResolvedValue([[], 0]);
      const result = await service.list({});
      expect(result.list).toEqual([]);
      expect(result.total).toBe(0);
      expect(skuRepo.find).not.toHaveBeenCalled();
    });

    it('应按 categoryId 筛选', async () => {
      prodRepo.findAndCount.mockResolvedValue([[], 0]);
      await service.list({ categoryId: 10 });
      const callArg = prodRepo.findAndCount.mock.calls[0][0] as any;
      expect(callArg.where).toEqual({ status: ProductStatus.ON_SALE, categoryId: 10 });
    });

    it('sortBy=created_desc 时按 createdAt DESC 排序', async () => {
      prodRepo.findAndCount.mockResolvedValue([[], 0]);
      await service.list({ sortBy: 'created_desc' });
      const callArg = prodRepo.findAndCount.mock.calls[0][0] as any;
      expect(callArg.order).toEqual({ createdAt: 'DESC' });
    });

    it('分页参数 skip/take 计算正确', async () => {
      prodRepo.findAndCount.mockResolvedValue([[], 0]);
      await service.list({ page: 3, pageSize: 10 });
      const callArg = prodRepo.findAndCount.mock.calls[0][0] as any;
      expect(callArg.skip).toBe(20); // (3-1)*10
      expect(callArg.take).toBe(10);
    });
  });

  describe('detail - C 端商品详情', () => {
    it('商品不存在时抛 PRODUCT_NOT_FOUND', async () => {
      prodRepo.findOne.mockResolvedValue(null);
      await expect(service.detail(999)).rejects.toMatchObject({
        bizCode: ErrorCode.PRODUCT_NOT_FOUND,
      });
    });

    it('商品已下架时抛 PRODUCT_NOT_FOUND', async () => {
      prodRepo.findOne.mockResolvedValue(buildProduct({ status: ProductStatus.OFF_SHELF }));
      await expect(service.detail(1)).rejects.toMatchObject({
        bizCode: ErrorCode.PRODUCT_NOT_FOUND,
      });
    });

    it('生鲜商品应返回合规提示（不支持 7 天无理由 + 冷链）', async () => {
      prodRepo.findOne.mockResolvedValue(buildProduct());
      catRepo.findOne.mockResolvedValue({
        id: 10,
        name: '水果',
        code: 'fresh',
      } as CategoryEntity);
      skuRepo.find.mockResolvedValue([buildSku()]);

      const result = await service.detail(1);

      expect(result.isFresh).toBe(true);
      expect(result.complianceTips).toContain('生鲜商品不支持 7 天无理由退货');
      expect(result.complianceTips).toContain('冷链物流配送，请及时验收');
    });

    it('预售商品应返回预售合规提示', async () => {
      prodRepo.findOne.mockResolvedValue(
        buildProduct({ isPresale: 1, presaleDeliverDate: new Date('2026-10-01') }),
      );
      catRepo.findOne.mockResolvedValue({ id: 10, name: '礼盒', code: 'gift' } as CategoryEntity);
      skuRepo.find.mockResolvedValue([buildSku()]);

      const result = await service.detail(1);

      expect(result.isPresale).toBe(true);
      expect(result.complianceTips).toContain('预售商品：先锁单后发货，预计发货日内发出');
      expect(result.presaleDeliverDate).toBe('2026-10-01');
    });

    it('SKU 售罄时 soldOut=true', async () => {
      prodRepo.findOne.mockResolvedValue(buildProduct());
      catRepo.findOne.mockResolvedValue({ id: 10, name: '礼盒', code: 'gift' } as CategoryEntity);
      skuRepo.find.mockResolvedValue([
        buildSku({ stock: 0 }),
        buildSku({ id: 102, stock: 5, status: SkuStatus.OFF_SALE }),
      ]);

      const result = await service.detail(1);

      expect(result.skus[0].soldOut).toBe(true); // stock=0
      expect(result.skus[1].soldOut).toBe(true); // status !== ON_SALE
    });

    it('SKU 按 price ASC 排序查询', async () => {
      prodRepo.findOne.mockResolvedValue(buildProduct());
      catRepo.findOne.mockResolvedValue(null);
      skuRepo.find.mockResolvedValue([]);

      await service.detail(1);

      const callArg = skuRepo.find.mock.calls[0][0] as any;
      expect(callArg.where).toEqual({ productId: 1, status: SkuStatus.ON_SALE });
      expect(callArg.order).toEqual({ price: 'ASC' });
    });
  });

  describe('adminList - 后台商品列表', () => {
    it('支持关键词模糊搜索 + 状态筛选', async () => {
      prodRepo.findAndCount.mockResolvedValue([[], 0]);
      await service.adminList({ keyword: '中秋', status: 1, categoryId: 10 });
      const callArg = prodRepo.findAndCount.mock.calls[0][0] as any;
      expect(callArg.where.title).toEqual({ _type: 'bracket', _value: [expect.anything()] } as any);
      expect(callArg.where.status).toBe(1);
      expect(callArg.where.categoryId).toBe(10);
    });
  });

  describe('create - 创建商品', () => {
    it('应事务创建 SPU + SKU 列表', async () => {
      const savedProd = buildProduct({ id: 100 });
      const txManager = {
        create: jest.fn((_: any, e: any) => e),
        save: jest.fn(async (e: any) => (Array.isArray(e) ? e : { ...e, id: 100 })),
      };
      (prodRepo.manager as any).transaction.mockImplementation(async (cb: any) => cb(txManager));

      const result = await service.create({
        title: '新年礼盒',
        categoryId: 10,
        mainImage: 'p.jpg',
        skus: [{ specJson: {}, price: 100, stock: 10 }],
      });

      expect(txManager.create).toHaveBeenCalled();
      expect(txManager.save).toHaveBeenCalledTimes(2); // SPU + SKU 数组
      expect(result.id).toBe(100);
    });
  });

  describe('update - 更新商品', () => {
    it('带 skus 时先删旧 SKU 再写新 SKU', async () => {
      skuRepo.create.mockImplementation((e: any) => e as any);
      await service.update(1, {
        title: '更新标题',
        skus: [{ specJson: {}, price: 200, stock: 5, status: 1 }],
      });
      expect(prodRepo.update).toHaveBeenCalledWith(1, { title: '更新标题' });
      expect(skuRepo.delete).toHaveBeenCalledWith({ productId: 1 });
      expect(skuRepo.save).toHaveBeenCalled();
    });

    it('不带 skus 时仅更新 SPU', async () => {
      await service.update(1, { title: '仅改标题' });
      expect(prodRepo.update).toHaveBeenCalledWith(1, { title: '仅改标题' });
      expect(skuRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus / batchUpdateStatus / updatePresale', () => {
    it('updateStatus 应更新单条状态', async () => {
      await service.updateStatus(1, ProductStatus.OFF_SHELF);
      expect(prodRepo.update).toHaveBeenCalledWith(1, { status: ProductStatus.OFF_SHELF });
    });

    it('batchUpdateStatus 应批量更新', async () => {
      await service.batchUpdateStatus([1, 2, 3], ProductStatus.ON_SALE);
      expect(prodRepo.update).toHaveBeenCalledWith({ id: In([1, 2, 3]) }, { status: ProductStatus.ON_SALE });
    });

    it('updatePresale 应写入预售标志与预计发货日', async () => {
      await service.updatePresale(1, 1, '2026-10-01');
      expect(prodRepo.update).toHaveBeenCalledWith(1, {
        isPresale: 1,
        presaleDeliverDate: new Date('2026-10-01'),
      });
    });

    it('updatePresale 取消预售时 presaleDeliverDate=null', async () => {
      await service.updatePresale(1, 0);
      expect(prodRepo.update).toHaveBeenCalledWith(1, {
        isPresale: 0,
        presaleDeliverDate: null,
      });
    });
  });
});