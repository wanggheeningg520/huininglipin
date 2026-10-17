import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { Repository, In } from 'typeorm';
import { FestivalEntity } from '../../../infrastructure/database/entities/content/festival.entity';
import { ProductEntity } from '../../../infrastructure/database/entities/product/product.entity';
import { SkuEntity } from '../../../infrastructure/database/entities/product/sku.entity';
import { CategoryEntity } from '../../../infrastructure/database/entities/product/category.entity';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { ErrorCode } from '../../../common/constants/error-code';
import { REDIS_CLIENT } from '../../../infrastructure/redis/redis.constants';
import { RedisKeys } from '../../../common/constants/redis-keys';
import { FestivalDto } from '../dto/festival.dto';

/**
 * 节日日历服务（对应 design.md 2.1.3 节日流程 + 2.2.2 接口26）
 * 支持公历/农历，农历由 lunar-javascript 换算为当年公历
 */
@Injectable()
export class FestivalService {
  private readonly logger = new Logger(FestivalService.name);
  constructor(
    @InjectRepository(FestivalEntity) private readonly festRepo: Repository<FestivalEntity>,
    @InjectRepository(ProductEntity) private readonly prodRepo: Repository<ProductEntity>,
    @InjectRepository(SkuEntity) private readonly skuRepo: Repository<SkuEntity>,
    @InjectRepository(CategoryEntity) private readonly catRepo: Repository<CategoryEntity>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /**
   * 农历换算为当年公历日期（对应 spec.md 5.5.1 规则4）
   * 使用 lunar-javascript 将农历月日转为当年的公历日期
   */
  lunarToSolar(year: number, lunarMonth: number, lunarDay: number, isLeap = false): Date {
    // 动态引入 lunar-javascript，避免类型定义缺失问题
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Lunar } = require('lunar-javascript');
    try {
      const lunar = Lunar.fromYmd(year, lunarMonth, lunarDay);
      const solar = lunar.getSolar();
      return new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay());
    } catch (e) {
      throw new BusinessException(
        ErrorCode.FESTIVAL_CONFIG_INVALID,
        `农历日期非法：${year}年${isLeap ? '闰' : ''}${lunarMonth}月${lunarDay}日`,
      );
    }
  }

  /** 计算节日当年的公历日期 */
  getCurrentDate(festival: FestivalEntity, year: number = new Date().getFullYear()): Date {
    if (festival.calendarType === '农历') {
      return this.lunarToSolar(year, festival.month, festival.day);
    }
    return new Date(year, festival.month - 1, festival.day);
  }

  /** 校验节日配置合法性 */
  validate(data: FestivalDto): void {
    // 农历配置校验：月份 1-12，日期 1-30（农历大月 30 天，小月 29 天）
    if (data.calendarType === '农历') {
      if (data.month < 1 || data.month > 12) {
        throw new BusinessException(ErrorCode.FESTIVAL_CONFIG_INVALID, '农历月份应在 1-12 之间');
      }
      if (data.day < 1 || data.day > 30) {
        throw new BusinessException(ErrorCode.FESTIVAL_CONFIG_INVALID, '农历日期应在 1-30 之间');
      }
      // 尝试换算验证日期合法
      this.lunarToSolar(new Date().getFullYear(), data.month, data.day);
    } else {
      // 公历校验
      const maxDay = new Date(new Date().getFullYear(), data.month, 0).getDate();
      if (data.day > maxDay) {
        throw new BusinessException(ErrorCode.FESTIVAL_CONFIG_INVALID, `公历${data.month}月无${data.day}日`);
      }
    }
    // 销售窗口校验
    const start = new Date(data.saleStart);
    const end = new Date(data.saleEnd);
    if (end.getTime() <= start.getTime()) {
      throw new BusinessException(ErrorCode.FESTIVAL_CONFIG_INVALID, 'sale_end 必须晚于 sale_start');
    }
  }

  /** C 端：节日专区详情（接口26） */
  async detail(id: number): Promise<any> {
    const festival = await this.festRepo.findOne({ where: { id } });
    if (!festival || festival.isOnline !== 1) {
      throw new BusinessException(ErrorCode.NOT_FOUND, '专区未上线或已下线');
    }
    // 关联商品：通过 linkUrl 或分类关联，此处简化为查水果品类在售商品
    const products = await this.prodRepo.find({
      where: { status: 1 },
      order: { sort: 'ASC' },
      take: 20,
    });
    const productIds = products.map((p) => p.id);
    const skus = productIds.length
      ? await this.skuRepo.find({ where: { productId: In(productIds), status: 1 } })
      : [];
    const skuMap = new Map<number, SkuEntity[]>();
    skus.forEach((s) => {
      const arr = skuMap.get(s.productId) || [];
      arr.push(s);
      skuMap.set(s.productId, arr);
    });
    return {
      id: festival.id,
      name: festival.name,
      bannerImage: festival.bannerImage,
      products: products.map((p) => {
        const pskus = skuMap.get(p.id) || [];
        const prices = pskus.map((s) => Number(s.price));
        return {
          id: p.id,
          title: p.title,
          mainImage: p.mainImage,
          priceFrom: prices.length ? Math.min(...prices) : 0,
          isPresale: !!p.isPresale,
        };
      }),
    };
  }

  /** C 端：查询当前在线节日专区列表 */
  async findOnline(): Promise<FestivalEntity[]> {
    // 先查 Redis 缓存
    try {
      const cached = await this.redis.get(RedisKeys.festivalOnline);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      this.logger.warn(`Redis 读取节日缓存失败: ${(e as Error).message}`);
    }
    const list = await this.festRepo.find({
      where: { status: 1, isOnline: 1 },
      order: { sort: 'ASC' },
    });
    // 写缓存
    try {
      await this.redis.set(RedisKeys.festivalOnline, JSON.stringify(list), 'EX', 300);
    } catch (e) {
      this.logger.warn(`Redis 写入节日缓存失败: ${(e as Error).message}`);
    }
    return list;
  }

  /** 后台：查询全部节日 */
  async findAll(): Promise<FestivalEntity[]> {
    return this.festRepo.find({ order: { sort: 'ASC' } });
  }

  /** 后台：创建节日 */
  async create(data: FestivalDto): Promise<FestivalEntity> {
    this.validate(data);
    const entity = this.festRepo.create({
      name: data.name,
      calendarType: data.calendarType,
      month: data.month,
      day: data.day,
      prepDays: data.prepDays ?? 0,
      saleStart: new Date(data.saleStart),
      saleEnd: new Date(data.saleEnd),
      bannerImage: data.bannerImage ?? null,
      linkUrl: data.linkUrl ?? null,
      sort: data.sort ?? 0,
      status: data.status ?? 1,
      isOnline: 0,
    });
    return this.festRepo.save(entity);
  }

  /** 后台：更新节日 */
  async update(id: number, data: FestivalDto): Promise<void> {
    this.validate(data);
    await this.festRepo.update(id, {
      name: data.name,
      calendarType: data.calendarType,
      month: data.month,
      day: data.day,
      prepDays: data.prepDays ?? 0,
      saleStart: new Date(data.saleStart),
      saleEnd: new Date(data.saleEnd),
      bannerImage: data.bannerImage ?? null,
      linkUrl: data.linkUrl ?? null,
      sort: data.sort ?? 0,
      status: data.status ?? 1,
    });
    await this.refreshCache();
  }

  /** 后台：启用/停用节日 */
  async updateStatus(id: number, status: number): Promise<void> {
    await this.festRepo.update(id, { status });
    await this.refreshCache();
  }

  /** 后台：删除节日 */
  async remove(id: number): Promise<void> {
    await this.festRepo.softDelete(id);
    await this.refreshCache();
  }

  /** 刷新在线节日缓存 */
  async refreshCache(): Promise<void> {
    try {
      const list = await this.festRepo.find({
        where: { status: 1, isOnline: 1 },
        order: { sort: 'ASC' },
      });
      await this.redis.set(RedisKeys.festivalOnline, JSON.stringify(list), 'EX', 300);
    } catch (e) {
      this.logger.warn(`刷新节日缓存失败: ${(e as Error).message}`);
    }
  }
}