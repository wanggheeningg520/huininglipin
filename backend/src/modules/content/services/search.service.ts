import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { Repository, In, Like, Brackets } from 'typeorm';
import { ProductEntity } from '../../../infrastructure/database/entities/product/product.entity';
import { SkuEntity } from '../../../infrastructure/database/entities/product/sku.entity';
import { CategoryEntity } from '../../../infrastructure/database/entities/product/category.entity';
import { SearchLogEntity } from '../../../infrastructure/database/entities/content/search-log.entity';
import { RecommendEntity } from '../../../infrastructure/database/entities/content/recommend.entity';
import { RedisKeys } from '../../../common/constants/redis-keys';
import { REDIS_CLIENT } from '../../../infrastructure/redis/redis.constants';
import { SearchQueryDto } from '../dto/content.dto';

/**
 * 搜索服务（对应 design.md 2.2.2 接口27）
 * 模糊查询 product.title/subtitle + category.name
 * 空关键词返回热门搜索词；空结果返回热门商品
 */
@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  constructor(
    @InjectRepository(ProductEntity) private readonly prodRepo: Repository<ProductEntity>,
    @InjectRepository(SkuEntity) private readonly skuRepo: Repository<SkuEntity>,
    @InjectRepository(CategoryEntity) private readonly catRepo: Repository<CategoryEntity>,
    @InjectRepository(SearchLogEntity) private readonly searchLogRepo: Repository<SearchLogEntity>,
    @InjectRepository(RecommendEntity) private readonly recommendRepo: Repository<RecommendEntity>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /** 搜索（接口27） */
  async search(query: SearchQueryDto, userId?: number): Promise<any> {
    // 空关键词返回热门搜索词
    if (!query.keyword || !query.keyword.trim()) {
      const hotKeywords = await this.getHotKeywords();
      return { list: [], total: 0, hotKeywords };
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const keyword = query.keyword.trim();

    const qb = this.prodRepo
      .createQueryBuilder('p')
      .where('p.status = 1')
      .andWhere(
        new Brackets((q) => {
          q.where('p.title LIKE :kw', { kw: `%${keyword}%` })
            .orWhere('p.subtitle LIKE :kw', { kw: `%${keyword}%` });
        }),
      );

    if (query.categoryId) {
      qb.andWhere('p.category_id = :cid', { cid: query.categoryId });
    }

    switch (query.sortBy) {
      case 'price_asc':
        qb.orderBy('p.sort', 'ASC');
        break;
      case 'price_desc':
        qb.orderBy('p.sort', 'DESC');
        break;
      default:
        qb.orderBy('p.sort', 'ASC');
    }

    qb.skip((page - 1) * pageSize).take(pageSize);
    const [products, total] = await qb.getManyAndCount();

    // 记录搜索日志
    try {
      await this.searchLogRepo.save({
        keyword,
        userId: userId ?? null,
        resultCnt: total,
      });
    } catch (e) {
      this.logger.warn(`搜索日志写入失败: ${(e as Error).message}`);
    }

    // 空结果返回热门商品
    if (total === 0) {
      const hotProducts = await this.getHotProducts();
      return { list: hotProducts, total: 0, hotKeywords: await this.getHotKeywords() };
    }

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

    const list = products.map((p) => {
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

    return { list, total };
  }

  /** 获取热门搜索词（从 search_log 聚合，缓存） */
  async getHotKeywords(): Promise<string[]> {
    try {
      const cached = await this.redis.get(RedisKeys.searchHot);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      this.logger.warn(`读取热门词缓存失败: ${(e as Error).message}`);
    }
    const rows = await this.searchLogRepo
      .createQueryBuilder('s')
      .select('s.keyword', 'keyword')
      .addSelect('COUNT(*)', 'cnt')
      .groupBy('s.keyword')
      .orderBy('cnt', 'DESC')
      .limit(10)
      .getRawMany();
    const hot = rows.map((r: any) => r.keyword);
    try {
      await this.redis.set(RedisKeys.searchHot, JSON.stringify(hot), 'EX', 600);
    } catch (e) {
      this.logger.warn(`写入热门词缓存失败: ${(e as Error).message}`);
    }
    return hot;
  }

  /** 获取热门商品（从推荐表取，降级取最新上架） */
  async getHotProducts(): Promise<any[]> {
    const recommends = await this.recommendRepo.find({
      where: { status: 1 },
      order: { sort: 'ASC' },
      take: 10,
    });
    const productIds = recommends.map((r) => r.productId);
    let products: ProductEntity[];
    if (productIds.length) {
      products = await this.prodRepo.find({ where: { id: In(productIds), status: 1 } });
    } else {
      products = await this.prodRepo.find({ where: { status: 1 }, order: { createdAt: 'DESC' }, take: 10 });
    }
    const pids = products.map((p) => p.id);
    const skus = pids.length
      ? await this.skuRepo.find({ where: { productId: In(pids), status: 1 } })
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
}