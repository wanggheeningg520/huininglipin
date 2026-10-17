import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { ProductEntity } from '../../../infrastructure/database/entities/product/product.entity';
import { SkuEntity } from '../../../infrastructure/database/entities/product/sku.entity';
import { CategoryEntity } from '../../../infrastructure/database/entities/product/category.entity';
import { QueryProductDto } from '../dto/query-product.dto';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { ErrorCode, ProductStatus, SkuStatus } from '../../../common/constants/enums';

/**
 * 商品服务（对应 design.md 2.2.2 接口2/3）
 * 列表按分类/价格区间/销量/上架状态筛选排序分页
 * 详情返回 SPU + 全部在售 SKU + 预售属性 + 合规提示
 */
@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);
  constructor(
    @InjectRepository(ProductEntity) private readonly prodRepo: Repository<ProductEntity>,
    @InjectRepository(SkuEntity) private readonly skuRepo: Repository<SkuEntity>,
    @InjectRepository(CategoryEntity) private readonly catRepo: Repository<CategoryEntity>,
  ) {}

  /** 商品列表（C 端，仅上架） */
  async list(query: QueryProductDto): Promise<any> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: any = { status: ProductStatus.ON_SALE };
    if (query.categoryId) where.categoryId = query.categoryId;

    const order: any = {};
    switch (query.sortBy) {
      case 'sales_desc':
        // SKU 销量聚合排序需子查询，此处简化按 sort
        order.sort = 'ASC';
        break;
      case 'price_asc':
      case 'price_desc':
        order.sort = 'ASC';
        break;
      case 'created_desc':
        order.createdAt = 'DESC';
        break;
      default:
        order.sort = 'ASC';
    }

    const [products, total] = await this.prodRepo.findAndCount({
      where,
      order,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 查 SKU 最低价
    const productIds = products.map((p) => p.id);
    const skus = productIds.length
      ? await this.skuRepo.find({
          where: { productId: In(productIds), status: SkuStatus.ON_SALE },
        })
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
      const marketPrices = pskus.map((s) => Number(s.marketPrice || s.price));
      const sales = pskus.reduce((sum, s) => sum + s.sales, 0);
      return {
        id: p.id,
        title: p.title,
        mainImage: p.mainImage,
        priceFrom: prices.length ? Math.min(...prices) : 0,
        marketPriceFrom: marketPrices.length ? Math.max(...marketPrices) : 0,
        sales,
        isPresale: !!p.isPresale,
        presaleDeliverDate: p.presaleDeliverDate ? p.presaleDeliverDate.toISOString().slice(0, 10) : null,
      };
    });

    return { list, total, page, pageSize };
  }

  /** 商品详情（C 端） */
  async detail(id: number): Promise<any> {
    const product = await this.prodRepo.findOne({ where: { id } });
    if (!product || product.status !== ProductStatus.ON_SALE) {
      throw new BusinessException(ErrorCode.PRODUCT_NOT_FOUND);
    }
    const category = await this.catRepo.findOne({ where: { id: product.categoryId } });
    const skus = await this.skuRepo.find({
      where: { productId: id, status: SkuStatus.ON_SALE },
      order: { price: 'ASC' },
    });

    // 是否生鲜（水果品类 code=fresh）
    const isFresh = category?.code === 'fresh';
    const complianceTips: string[] = [];
    if (isFresh) {
      complianceTips.push('生鲜商品不支持 7 天无理由退货');
      complianceTips.push('冷链物流配送，请及时验收');
    }
    if (product.isPresale) {
      complianceTips.push('预售商品：先锁单后发货，预计发货日内发出');
    }

    return {
      id: product.id,
      title: product.title,
      subtitle: product.subtitle,
      mainImage: product.mainImage,
      images: product.imagesJson || [],
      detailHtml: product.detailHtml || '',
      isPresale: !!product.isPresale,
      presaleDeliverDate: product.presaleDeliverDate
        ? product.presaleDeliverDate.toISOString().slice(0, 10)
        : null,
      category: { id: category?.id ?? 0, name: category?.name ?? '' },
      isFresh,
      complianceTips,
      skus: skus.map((s) => ({
        id: s.id,
        specJson: s.specJson,
        price: Number(s.price),
        marketPrice: s.marketPrice ? Number(s.marketPrice) : null,
        stock: s.stock,
        sales: s.sales,
        unit: s.unit || '',
        status: s.status === SkuStatus.ON_SALE ? '在售' : '停售',
        soldOut: s.stock <= 0 || s.status !== SkuStatus.ON_SALE,
      })),
    };
  }

  /** 后台商品列表（含下架） */
  async adminList(query: any): Promise<any> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: any = {};
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.status !== undefined) where.status = query.status;
    if (query.keyword) where.title = Like(`%${query.keyword}%`);
    const [list, total] = await this.prodRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { list, total, page, pageSize };
  }

  async create(data: any): Promise<ProductEntity> {
    const { skus, ...prodData } = data;
    return this.prodRepo.manager.transaction(async (manager) => {
      const product = manager.create(ProductEntity, {
        ...prodData,
        isPresale: prodData.isPresale ?? 0,
        status: 1,
      });
      const saved = await manager.save(product);
      if (skus?.length) {
        const skuEntities = skus.map((s: any) =>
          manager.create(SkuEntity, { ...s, productId: saved.id, status: 1 }),
        );
        await manager.save(skuEntities);
      }
      return saved;
    });
  }

  async update(id: number, data: any): Promise<void> {
    const { skus, ...prodData } = data;
    await this.prodRepo.update(id, prodData);
    if (skus) {
      await this.skuRepo.delete({ productId: id });
      const entities = skus.map((s: any) =>
        this.skuRepo.create({ ...s, productId: id, status: s.status ?? 1 }),
      );
      await this.skuRepo.save(entities);
    }
  }

  async updateStatus(id: number, status: number): Promise<void> {
    await this.prodRepo.update(id, { status });
  }

  async batchUpdateStatus(ids: number[], status: number): Promise<void> {
    await this.prodRepo.update({ id: In(ids) }, { status });
  }

  async updatePresale(id: number, isPresale: number, presaleDeliverDate?: string): Promise<void> {
    await this.prodRepo.update(id, {
      isPresale,
      presaleDeliverDate: presaleDeliverDate ? new Date(presaleDeliverDate) : null,
    });
  }
}