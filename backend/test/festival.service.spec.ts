import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FestivalService } from '../src/modules/content/services/festival.service';
import { FestivalEntity } from '../src/infrastructure/database/entities/content/festival.entity';
import { ProductEntity } from '../src/infrastructure/database/entities/product/product.entity';
import { SkuEntity } from '../src/infrastructure/database/entities/product/sku.entity';
import { CategoryEntity } from '../src/infrastructure/database/entities/product/category.entity';
import { REDIS_CLIENT } from '../src/infrastructure/redis/redis.constants';
import { RedisKeys } from '../src/common/constants/redis-keys';
import { ErrorCode } from '../src/common/constants/error-code';
import { FestivalDto } from '../src/modules/content/dto/festival.dto';

/**
 * 节日日历服务单元测试（对应 design.md 2.1.3 节日流程 + 2.2.2 接口26）
 * 覆盖：农历换算（lunar-javascript）、当年公历日期计算、配置校验（农历月日范围/销售窗口）、
 *       C 端专区详情（含关联商品 SKU 最低价）、在线列表（Redis 缓存穿透/回源）、
 *       后台 CRUD（创建/更新/启停/删除/刷新缓存）
 */
describe('FestivalService', () => {
  let service: FestivalService;
  let festRepo: jest.Mocked<Repository<FestivalEntity>>;
  let prodRepo: jest.Mocked<Repository<ProductEntity>>;
  let skuRepo: jest.Mocked<Repository<SkuEntity>>;
  let catRepo: jest.Mocked<Repository<CategoryEntity>>;
  let redis: jest.Mocked<any>;

  beforeEach(async () => {
    redis = { get: jest.fn(), set: jest.fn(), del: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FestivalService,
        { provide: getRepositoryToken(FestivalEntity), useValue: mockRepo() },
        { provide: getRepositoryToken(ProductEntity), useValue: mockRepo() },
        { provide: getRepositoryToken(SkuEntity), useValue: mockRepo() },
        { provide: getRepositoryToken(CategoryEntity), useValue: mockRepo() },
        { provide: REDIS_CLIENT, useValue: redis },
      ],
    }).compile();

    service = module.get<FestivalService>(FestivalService);
    festRepo = module.get(getRepositoryToken(FestivalEntity)) as jest.Mocked<Repository<FestivalEntity>>;
    prodRepo = module.get(getRepositoryToken(ProductEntity)) as jest.Mocked<Repository<ProductEntity>>;
    skuRepo = module.get(getRepositoryToken(SkuEntity)) as jest.Mocked<Repository<SkuEntity>>;
    catRepo = module.get(getRepositoryToken(CategoryEntity)) as jest.Mocked<Repository<CategoryEntity>>;
  });

  function mockRepo() {
    return {
      find: jest.fn(), findOne: jest.fn(), findAndCount: jest.fn(), count: jest.fn(),
      create: jest.fn((e: any) => e), save: jest.fn(async (e: any) => e),
      update: jest.fn(async () => undefined), delete: jest.fn(async () => undefined),
      softDelete: jest.fn(async () => undefined),
    };
  }

  function buildFestival(over: Partial<FestivalEntity> = {}): FestivalEntity {
    return {
      id: 1, name: '中秋节', calendarType: '农历', month: 8, day: 15, prepDays: 7,
      saleStart: new Date('2026-08-01'), saleEnd: new Date('2026-09-30'),
      bannerImage: 'b.jpg', linkUrl: null, status: 1, isOnline: 1, sort: 0,
      ...over,
    } as FestivalEntity;
  }

  function buildDto(over: Partial<FestivalDto> = {}): FestivalDto {
    return {
      name: '中秋节', calendarType: '农历', month: 8, day: 15, prepDays: 7,
      saleStart: '2026-08-01T00:00:00Z', saleEnd: '2026-09-30T00:00:00Z',
      bannerImage: 'b.jpg', sort: 0, status: 1,
      ...over,
    } as FestivalDto;
  }

  describe('lunarToSolar - 农历换算公历', () => {
    it('农历八月十五换算为公历日期', () => {
      const result = service.lunarToSolar(2026, 8, 15);
      expect(result).toBeInstanceOf(Date);
      // 2026 年中秋为公历 9 月 25 日
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(8); // 0-indexed 9 月
    });

    it('非法农历日期抛 FESTIVAL_CONFIG_INVALID', () => {
      // lunar-javascript 对极端非法会抛错
      expect(() => service.lunarToSolar(2026, 13, 1)).toThrow();
    });
  });

  describe('getCurrentDate - 计算当年公历日期', () => {
    it('农历节日调用 lunarToSolar', () => {
      const fest = buildFestival({ calendarType: '农历', month: 8, day: 15 });
      const result = service.getCurrentDate(fest, 2026);
      expect(result.getFullYear()).toBe(2026);
    });

    it('公历节日直接构造 Date', () => {
      const fest = buildFestival({ calendarType: '公历', month: 10, day: 1 });
      const result = service.getCurrentDate(fest, 2026);
      expect(result).toEqual(new Date(2026, 9, 1)); // 国庆 10 月 1 日
    });
  });

  describe('validate - 配置校验', () => {
    it('农历月份越界（>12）抛 FESTIVAL_CONFIG_INVALID', () => {
      expect(() => service.validate(buildDto({ calendarType: '农历', month: 13 }))).toThrow();
    });

    it('农历日期越界（>30）抛 FESTIVAL_CONFIG_INVALID', () => {
      expect(() => service.validate(buildDto({ calendarType: '农历', day: 31 }))).toThrow();
    });

    it('saleEnd 早于 saleStart 抛 FESTIVAL_CONFIG_INVALID', () => {
      expect(() =>
        service.validate(buildDto({ saleStart: '2026-09-30T00:00:00Z', saleEnd: '2026-08-01T00:00:00Z' })),
      ).toThrow();
    });

    it('合法农历配置不抛异常', () => {
      expect(() => service.validate(buildDto())).not.toThrow();
    });

    it('合法公历配置不抛异常', () => {
      expect(() => service.validate(buildDto({ calendarType: '公历', month: 10, day: 1 }))).not.toThrow();
    });
  });

  describe('detail - C 端节日专区详情', () => {
    it('专区未上线（isOnline=0）抛 NOT_FOUND', async () => {
      festRepo.findOne.mockResolvedValue(buildFestival({ isOnline: 0 }));
      await expect(service.detail(1)).rejects.toMatchObject({ bizCode: ErrorCode.NOT_FOUND });
    });

    it('专区不存在抛 NOT_FOUND', async () => {
      festRepo.findOne.mockResolvedValue(null);
      await expect(service.detail(999)).rejects.toMatchObject({ bizCode: ErrorCode.NOT_FOUND });
    });

    it('返回专区详情 + 关联商品 SKU 最低价', async () => {
      festRepo.findOne.mockResolvedValue(buildFestival());
      prodRepo.find.mockResolvedValue([
        { id: 1, title: '中秋礼盒', mainImage: 'p.jpg', isPresale: 0, status: 1 } as any,
      ]);
      skuRepo.find.mockResolvedValue([
        { productId: 1, price: 88, status: 1 } as any,
        { productId: 1, price: 128, status: 1 } as any,
      ]);

      const result = await service.detail(1);

      expect(result.name).toBe('中秋节');
      expect(result.products).toHaveLength(1);
      expect(result.products[0].priceFrom).toBe(88); // Math.min(88,128)
    });
  });

  describe('findOnline - 在线节日列表（带 Redis 缓存）', () => {
    it('Redis 命中缓存时直接返回缓存数据', async () => {
      const cached = [buildFestival({ id: 1 }), buildFestival({ id: 2, name: '春节' })];
      redis.get.mockResolvedValue(JSON.stringify(cached));

      const result = await service.findOnline();

      expect(result).toHaveLength(2);
      expect(festRepo.find).not.toHaveBeenCalled();
    });

    it('Redis 未命中时回源 DB 并写缓存', async () => {
      redis.get.mockResolvedValue(null);
      const dbList = [buildFestival()];
      festRepo.find.mockResolvedValue(dbList);

      const result = await service.findOnline();

      expect(result).toEqual(dbList);
      expect(festRepo.find).toHaveBeenCalledWith({
        where: { status: 1, isOnline: 1 },
        order: { sort: 'ASC' },
      });
      expect(redis.set).toHaveBeenCalledWith(
        RedisKeys.festivalOnline,
        JSON.stringify(dbList),
        'EX',
        300,
      );
    });

    it('Redis 读异常时降级查 DB', async () => {
      redis.get.mockRejectedValue(new Error('Redis down'));
      festRepo.find.mockResolvedValue([buildFestival()]);

      const result = await service.findOnline();

      expect(result).toHaveLength(1);
      expect(festRepo.find).toHaveBeenCalled();
    });
  });

  describe('findAll - 后台查询全部', () => {
    it('返回全部节日按 sort 排序', async () => {
      festRepo.find.mockResolvedValue([buildFestival()]);
      const result = await service.findAll();
      expect(festRepo.find).toHaveBeenCalledWith({ order: { sort: 'ASC' } });
      expect(result).toHaveLength(1);
    });
  });

  describe('create - 创建节日', () => {
    it('校验通过后写入，isOnline 默认 0（创建后需手动上线）', async () => {
      festRepo.create.mockImplementation((e: any) => e);
      festRepo.save.mockResolvedValue(buildFestival());

      await service.create(buildDto());

      const created = festRepo.create.mock.calls[0][0];
      expect(created.isOnline).toBe(0);
      expect(created.name).toBe('中秋节');
    });
  });

  describe('update - 更新节日', () => {
    it('校验通过后更新并刷新缓存', async () => {
      festRepo.find.mockResolvedValue([]);
      await service.update(1, buildDto());
      expect(festRepo.update).toHaveBeenCalledWith(1, expect.objectContaining({ name: '中秋节' }));
      expect(redis.set).toHaveBeenCalled(); // refreshCache
    });
  });

  describe('updateStatus / remove', () => {
    it('updateStatus 更新状态并刷新缓存', async () => {
      festRepo.find.mockResolvedValue([]);
      await service.updateStatus(1, 0);
      expect(festRepo.update).toHaveBeenCalledWith(1, { status: 0 });
      expect(redis.set).toHaveBeenCalled();
    });

    it('remove 软删除并刷新缓存', async () => {
      festRepo.find.mockResolvedValue([]);
      await service.remove(1);
      expect(festRepo.softDelete).toHaveBeenCalledWith(1);
      expect(redis.set).toHaveBeenCalled();
    });
  });

  describe('refreshCache - 刷新缓存', () => {
    it('查询在线节日并写入 Redis（TTL=300）', async () => {
      const list = [buildFestival()];
      festRepo.find.mockResolvedValue(list);

      await service.refreshCache();

      expect(festRepo.find).toHaveBeenCalledWith({
        where: { status: 1, isOnline: 1 },
        order: { sort: 'ASC' },
      });
      expect(redis.set).toHaveBeenCalledWith(
        RedisKeys.festivalOnline,
        JSON.stringify(list),
        'EX',
        300,
      );
    });

    it('Redis 写异常时不抛出（降级）', async () => {
      festRepo.find.mockResolvedValue([buildFestival()]);
      redis.set.mockRejectedValue(new Error('Redis down'));
      await expect(service.refreshCache()).resolves.toBeUndefined();
    });
  });
});