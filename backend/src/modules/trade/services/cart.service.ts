import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CartEntity } from '../../../infrastructure/database/entities/trade/cart.entity';
import { SkuEntity } from '../../../infrastructure/database/entities/product/sku.entity';
import { ProductEntity } from '../../../infrastructure/database/entities/product/product.entity';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { ErrorCode, SkuStatus, ProductStatus } from '../../../common/constants/enums';
import { AddCartDto, CheckCartDto } from '../dto/trade.dto';
import { ConfigService } from '@nestjs/config';

/**
 * 购物车服务（对应 design.md 2.2.2 接口5-8）
 * qty 上限 99，SKU 停售返回 20002，库存不足返回 20003
 * uk_user_sku 唯一约束（同 SKU 加数量）
 */
@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);
  constructor(
    @InjectRepository(CartEntity) private readonly cartRepo: Repository<CartEntity>,
    @InjectRepository(SkuEntity) private readonly skuRepo: Repository<SkuEntity>,
    @InjectRepository(ProductEntity) private readonly prodRepo: Repository<ProductEntity>,
    private readonly config: ConfigService,
  ) {}

  /** 购物车列表（接口5） */
  async list(userId: number) {
    const items = await this.cartRepo.find({ where: { userId }, order: { updatedAt: 'DESC' } });
    if (!items.length) {
      return { items: [], totalCount: 0, totalAmount: 0 };
    }
    const skuIds = items.map((i) => i.skuId);
    const skus = await this.skuRepo.find({ where: { id: skuIds as any } });
    const skuMap = new Map(skus.map((s) => [s.id, s]));
    const prodIds = [...new Set(skus.map((s) => s.productId))];
    const products = await this.prodRepo.find({ where: { id: prodIds as any } });
    const prodMap = new Map(products.map((p) => [p.id, p]));

    let totalAmount = 0;
    let totalCount = 0;
    const result = items.map((item) => {
      const sku = skuMap.get(item.skuId);
      const product = sku ? prodMap.get(sku.productId) : undefined;
      const price = sku ? Number(sku.price) : 0;
      const subtotal = price * item.qty;
      if (item.checked) {
        totalAmount += subtotal;
        totalCount += item.qty;
      }
      return {
        id: item.id,
        skuId: item.skuId,
        productId: sku?.productId ?? 0,
        productTitle: product?.title ?? '',
        mainImage: product?.mainImage ?? '',
        specJson: sku?.specJson ?? {},
        price,
        qty: item.qty,
        checked: !!item.checked,
        stock: sku?.stock ?? 0,
        soldOut: !sku || sku.stock <= 0 || sku.status !== SkuStatus.ON_SALE,
      };
    });
    return { items: result, totalCount, totalAmount };
  }

  /** 加购/更新数量（接口6） */
  async add(userId: number, dto: AddCartDto): Promise<number> {
    const qtyLimit = parseInt(this.config.get<string>('CART_QTY_LIMIT', '99'), 10);
    if (dto.qty > qtyLimit) {
      throw new BusinessException(ErrorCode.PARAM_INVALID, `数量超过上限 ${qtyLimit}`);
    }
    const sku = await this.skuRepo.findOne({ where: { id: dto.skuId } });
    if (!sku || sku.status !== SkuStatus.ON_SALE) {
      throw new BusinessException(ErrorCode.SKU_NOT_FOUND);
    }
    const product = await this.prodRepo.findOne({ where: { id: sku.productId } });
    if (!product || product.status !== ProductStatus.ON_SALE) {
      throw new BusinessException(ErrorCode.PRODUCT_NOT_FOUND);
    }
    if (sku.stock < dto.qty) {
      throw new BusinessException(ErrorCode.STOCK_NOT_ENOUGH);
    }
    // uk_user_sku：同 SKU 加数量
    const existing = await this.cartRepo.findOne({ where: { userId, skuId: dto.skuId } });
    if (existing) {
      const newQty = existing.qty + dto.qty;
      if (newQty > qtyLimit) {
        throw new BusinessException(ErrorCode.PARAM_INVALID, `数量超过上限 ${qtyLimit}`);
      }
      existing.qty = newQty;
      if (dto.checked !== undefined) existing.checked = dto.checked ? 1 : 0;
      const saved = await this.cartRepo.save(existing);
      return saved.id;
    }
    const cart = this.cartRepo.create({
      userId,
      skuId: dto.skuId,
      qty: dto.qty,
      checked: dto.checked === undefined ? 1 : dto.checked ? 1 : 0,
    });
    const saved = await this.cartRepo.save(cart);
    return saved.id;
  }

  /** 删除购物车项（接口7） */
  async remove(userId: number, id: number): Promise<void> {
    await this.cartRepo.delete({ id, userId });
  }

  /** 勾选/取消勾选（接口8） */
  async check(userId: number, dto: CheckCartDto): Promise<void> {
    await this.cartRepo.update(
      { id: dto.cartIds as any, userId },
      { checked: dto.checked ? 1 : 0 },
    );
  }

  /** 结算后清除已购项 */
  async clearChecked(userId: number): Promise<void> {
    await this.cartRepo.delete({ userId, checked: 1 });
  }
}