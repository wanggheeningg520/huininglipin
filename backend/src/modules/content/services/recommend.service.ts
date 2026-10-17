import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RecommendEntity } from '../../../infrastructure/database/entities/content/recommend.entity';
import { TopicEntity } from '../../../infrastructure/database/entities/content/topic.entity';
import { ProductEntity } from '../../../infrastructure/database/entities/product/product.entity';
import { SkuEntity } from '../../../infrastructure/database/entities/product/sku.entity';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { ErrorCode } from '../../../common/constants/error-code';
import { RecommendQueryDto, RecommendDto, TopicDto } from '../dto/content.dto';

/**
 * 精选推荐与专题服务（对应 design.md 2.2.2 接口28/29）
 */
@Injectable()
export class RecommendService {
  private readonly logger = new Logger(RecommendService.name);
  constructor(
    @InjectRepository(RecommendEntity) private readonly recRepo: Repository<RecommendEntity>,
    @InjectRepository(TopicEntity) private readonly topicRepo: Repository<TopicEntity>,
    @InjectRepository(ProductEntity) private readonly prodRepo: Repository<ProductEntity>,
    @InjectRepository(SkuEntity) private readonly skuRepo: Repository<SkuEntity>,
  ) {}

  /** C 端：精选推荐瀑布流分页（接口28） */
  async recommendList(query: RecommendQueryDto): Promise<any> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const [recommends, total] = await this.recRepo.findAndCount({
      where: { status: 1 },
      order: { sort: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
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
    const list = products.map((p) => {
      const pskus = skuMap.get(p.id) || [];
      const prices = pskus.map((s) => Number(s.price));
      return {
        id: p.id,
        title: p.title,
        mainImage: p.mainImage,
        priceFrom: prices.length ? Math.min(...prices) : 0,
        sales: pskus.reduce((sum, s) => sum + s.sales, 0),
        isPresale: !!p.isPresale,
      };
    });
    return { list, total, page, pageSize };
  }

  /** C 端：专题页（接口29） */
  async topicDetail(id: number): Promise<any> {
    const topic = await this.topicRepo.findOne({ where: { id, status: 1 } });
    if (!topic) {
      throw new BusinessException(ErrorCode.NOT_FOUND, '专题不存在或已下线');
    }
    const productIds = topic.productIds || [];
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
    return {
      id: topic.id,
      title: topic.title,
      banner: topic.banner,
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

  /** 后台：推荐列表 */
  async findAll(): Promise<RecommendEntity[]> {
    return this.recRepo.find({ order: { sort: 'ASC' } });
  }

  /** 后台：创建推荐 */
  async create(data: RecommendDto): Promise<RecommendEntity> {
    return this.recRepo.save(
      this.recRepo.create({
        productId: data.productId,
        sort: data.sort ?? 0,
        status: data.status ?? 1,
      }),
    );
  }

  /** 后台：更新推荐 */
  async update(id: number, data: RecommendDto): Promise<void> {
    await this.recRepo.update(id, {
      productId: data.productId,
      sort: data.sort ?? 0,
      status: data.status ?? 1,
    });
  }

  /** 后台：删除推荐 */
  async remove(id: number): Promise<void> {
    await this.recRepo.delete(id);
  }

  /** 后台：专题列表 */
  async findAllTopics(): Promise<TopicEntity[]> {
    return this.topicRepo.find({ order: { sort: 'ASC' } });
  }

  /** 后台：创建专题 */
  async createTopic(data: TopicDto): Promise<TopicEntity> {
    return this.topicRepo.save(
      this.topicRepo.create({
        title: data.title,
        banner: data.banner ?? null,
        productIds: data.productIds ?? null,
        sort: data.sort ?? 0,
        status: data.status ?? 1,
      }),
    );
  }

  /** 后台：更新专题 */
  async updateTopic(id: number, data: TopicDto): Promise<void> {
    await this.topicRepo.update(id, {
      title: data.title,
      banner: data.banner ?? null,
      productIds: data.productIds ?? null,
      sort: data.sort ?? 0,
      status: data.status ?? 1,
    });
  }

  /** 后台：删除专题 */
  async removeTopic(id: number): Promise<void> {
    await this.topicRepo.softDelete(id);
  }
}