import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { Repository, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BannerEntity } from '../../../infrastructure/database/entities/content/banner.entity';
import { FestivalEntity } from '../../../infrastructure/database/entities/content/festival.entity';
import { RecommendEntity } from '../../../infrastructure/database/entities/content/recommend.entity';
import { CategoryEntity } from '../../../infrastructure/database/entities/product/category.entity';
import { ProductEntity } from '../../../infrastructure/database/entities/product/product.entity';
import { SkuEntity } from '../../../infrastructure/database/entities/product/sku.entity';
import { RedisKeys, HOME_CACHE_TTL } from '../../../common/constants/redis-keys';
import { REDIS_CLIENT } from '../../../infrastructure/redis/redis.constants';
import { FestivalService } from './festival.service';
import { BannerService } from './banner.service';

/**
 * 首页聚合服务（对应 design.md 2.2.2 接口25）
 * 聚合 banners + festivals + categories + presaleProducts + recommends
 * 各子查询并行 + Redis 缓存，P95 ≤ 1200ms
 */
@Injectable()
export class HomeService {
  private readonly logger = new Logger(HomeService.name);
  constructor(
    @InjectRepository(BannerEntity) private readonly bannerRepo: Repository<BannerEntity>,
    @InjectRepository(FestivalEntity) private readonly festRepo: Repository<FestivalEntity>,
    @InjectRepository(RecommendEntity) private readonly recRepo: Repository<RecommendEntity>,
    @InjectRepository(CategoryEntity) private readonly catRepo: Repository<CategoryEntity>,
    @InjectRepository(ProductEntity) private readonly prodRepo: Repository<ProductEntity>,
    @InjectRepository(SkuEntity) private readonly skuRepo: Repository<SkuEntity>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly festivalService: FestivalService,
    private readonly bannerService: BannerService,
  ) {}

  /** 首页聚合（接口25） */
  async aggregate(): Promise<any> {
    // 先查缓存
    try {
      const cached = await this.redis.get(RedisKeys.homeAggregate);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      this.logger.warn(`读取首页缓存失败: ${(e as Error).message}`);
    }

    // 各子查询并行
    const [banners, festivals, categories, presaleProducts, recommends] = await Promise.all([
      this.getHomeBanners(),
      this.festivalService.findOnline(),
      this.getCategoryTree(),
      this.getPresaleProducts(),
      this.getRecommendProducts(),
    ]);

    const result = {
      banners: banners.map((b) => ({
        id: b.id,
        image: b.image,
        linkType: b.linkType,
        linkValue: b.linkValue,
      })),
      festivals: festivals.map((f) => ({
        id: f.id,
        name: f.name,
        bannerImage: f.bannerImage,
        linkUrl: f.linkUrl,
        sort: f.sort,
      })),
      categories,
      presaleProducts,
      recommends,
    };

    // 写缓存
    try {
      await this.redis.set(RedisKeys.homeAggregate, JSON.stringify(result), 'EX', HOME_CACHE_TTL);
    } catch (e) {
      this.logger.warn(`写入首页缓存失败: ${(e as Error).message}`);
    }
    return result;
  }

  /** 首页顶部 Banner */
  private async getHomeBanners(): Promise<BannerEntity[]> {
    return this.bannerService.findValidByPosition('首页顶部');
  }

  /** 四大品类金刚区 */
  private async getCategoryTree(): Promise<any[]> {
    const all = await this.catRepo.find({ where: { status: 1 }, order: { sort: 'ASC' } });
    const roots = all.filter((c) => !c.parentId);
    return roots.map((r) => ({
      id: r.id,
      name: r.name,
      icon: r.icon,
      sort: r.sort,
      children: all
        .filter((c) => c.parentId === r.id)
        .map((c) => ({ id: c.id, name: c.name, icon: c.icon, sort: c.sort })),
    }));
  }

  /** 当季鲜果预售位：水果品类 is_presale=true 且未到发货日 */
  private async getPresaleProducts(): Promise<any[]> {
    const freshCat = await this.catRepo.findOne({ where: { code: 'fresh' } });
    if (!freshCat) return [];
    const today = new Date();
    const products = await this.prodRepo.find({
      where: {
        categoryId: freshCat.id,
        status: 1,
        isPresale: 1,
        presaleDeliverDate: MoreThanOrEqual(today),
      },
      order: { sort: 'ASC' },
      take: 6,
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
    return products.map((p) => {
      const pskus = skuMap.get(p.id) || [];
      const prices = pskus.map((s) => Number(s.price));
      return {
        id: p.id,
        title: p.title,
        mainImage: p.mainImage,
        priceFrom: prices.length ? Math.min(...prices) : 0,
        isPresale: true,
        presaleDeliverDate: p.presaleDeliverDate ? p.presaleDeliverDate.toISOString().slice(0, 10) : null,
      };
    });
  }

  /** 精选推荐（首页首屏） */
  private async getRecommendProducts(): Promise<any[]> {
    const recommends = await this.recRepo.find({
      where: { status: 1 },
      order: { sort: 'ASC' },
      take: 10,
    });
    const productIds = recommends.map((r) => r.productId);
    const products = productIds.length
      ? await this.prodRepo.find({ where: { id: In(productIds), status: 1 } })
      : [];
    const skus = productIds.length
      ? await this.skuRepo.find({ where: { productId: In(productIds), status: 1 } })
      : [];
    const skuMap = new Map<number, SkuEntity[]>();
    skus.forEach((s) => {
      const arr = skuMap.get(s.productId) || [];
      arr.push(s);
      skuMap.set(s.productId, arr);
    });
    return products.map((p) => {
      const pskus = skuMap.get(p.id) || [];
      const prices = pskus.map((s) => Number(s.price));
      return {
        id: p.id,
        title: p.title,
        mainImage: p.mainImage,
        priceFrom: prices.length ? Math.min(...prices) : 0,
        isPresale: !!p.isPresale,
      };
    });
  }

  /** 刷新首页缓存 */
  async refreshCache(): Promise<void> {
    try {
      await this.redis.del(RedisKeys.homeAggregate);
    } catch (e) {
      this.logger.warn(`清除首页缓存失败: ${(e as Error).message}`);
    }
  }
}