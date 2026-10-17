import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In, Not } from 'typeorm';
import { OrderEntity } from '../../../infrastructure/database/entities/trade/order.entity';
import { OrderItemEntity } from '../../../infrastructure/database/entities/trade/order-item.entity';
import { SkuEntity } from '../../../infrastructure/database/entities/product/sku.entity';
import { ProductEntity } from '../../../infrastructure/database/entities/product/product.entity';
import { AddressEntity } from '../../../infrastructure/database/entities/member/address.entity';
import { StockLogEntity } from '../../../infrastructure/database/entities/product/stock-log.entity';
import { BusinessException } from '../../../common/exceptions/business.exception';
import {
  ErrorCode,
  OrderStatus,
  PayStatus,
  OrderType,
  SkuStatus,
  ProductStatus,
  StockChangeType,
  canTransition,
} from '../../../common/constants/enums';
import { CreateOrderDto } from '../dto/trade.dto';
import { QueryOrderDto } from '../dto/query-order.dto';
import { OrderNoGenerator } from '../../../common/utils/order-no.generator';
import { StockService } from '../../product/services/stock.service';
import { CartService } from './cart.service';

/**
 * 订单服务（对应 design.md 2.1.3 创建订单流程 + 2.2.2 接口9/10/11/14/15）
 * 创建订单：校验 SKU 在售/库存/地址/未下架 → 生成订单号 → 预占库存 → 地址快照 → 写 order+order_item+stock_log
 * 状态机：维护迁移矩阵，非法迁移抛 30002
 */
@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectRepository(OrderEntity) private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity) private readonly itemRepo: Repository<OrderItemEntity>,
    @InjectRepository(SkuEntity) private readonly skuRepo: Repository<SkuEntity>,
    @InjectRepository(ProductEntity) private readonly prodRepo: Repository<ProductEntity>,
    @InjectRepository(AddressEntity) private readonly addrRepo: Repository<AddressEntity>,
    private readonly orderNoGen: OrderNoGenerator,
    private readonly stockService: StockService,
    private readonly cartService: CartService,
    private readonly dataSource: DataSource,
  ) {}

  /** 创建订单（接口9） */
  async create(userId: number, dto: CreateOrderDto): Promise<any> {
    // 校验地址
    const address = await this.addrRepo.findOne({ where: { id: dto.addressId, userId } });
    if (!address) {
      throw new BusinessException(ErrorCode.MEMBER_NOT_FOUND, '收货地址不存在');
    }
    // 校验 SKU + 商品
    const skuIds = dto.items.map((i) => i.skuId);
    const skus = await this.skuRepo.find({ where: { id: In(skuIds) } });
    if (skus.length !== skuIds.length) {
      throw new BusinessException(ErrorCode.SKU_NOT_FOUND);
    }
    for (const sku of skus) {
      if (sku.status !== SkuStatus.ON_SALE) {
        throw new BusinessException(ErrorCode.SKU_NOT_FOUND);
      }
    }
    const prodIds = [...new Set(skus.map((s) => s.productId))];
    const products = await this.prodRepo.find({ where: { id: In(prodIds) } });
    for (const p of products) {
      if (p.status !== ProductStatus.ON_SALE) {
        throw new BusinessException(ErrorCode.PRODUCT_NOT_FOUND);
      }
    }
    const prodMap = new Map(products.map((p) => [p.id, p]));
    const skuMap = new Map(skus.map((s) => [s.id, s]));

    // 生成订单号（DB 唯一性兜底）
    const orderNo = await this.orderNoGen.generate(async (no) => {
      const count = await this.orderRepo.count({ where: { orderNo: no } });
      return count > 0;
    });

    // 计算金额 + 判断预售
    let totalAmount = 0;
    let isPresale = 0;
    let presaleDeliverDate: Date | null = null;
    const orderItems: any[] = [];
    for (const item of dto.items) {
      const sku = skuMap.get(item.skuId)!;
      const product = prodMap.get(sku.productId)!;
      const subtotal = Number(sku.price) * item.qty;
      totalAmount += subtotal;
      if (product.isPresale) {
        isPresale = 1;
        presaleDeliverDate = product.presaleDeliverDate;
      }
      orderItems.push({
        skuId: sku.id,
        productId: product.id,
        productTitle: product.title,
        productImage: product.mainImage,
        specJson: sku.specJson,
        price: Number(sku.price),
        qty: item.qty,
        subtotal,
      });
    }

    // 第一阶段：Redis 预占库存
    for (const item of dto.items) {
      await this.stockService.preOccupy(item.skuId, item.qty, orderNo);
    }

    // 写入订单（事务）
    try {
      const order = await this.dataSource.transaction(async (manager) => {
        const order = manager.create(OrderEntity, {
          orderNo,
          userId,
          orderType: OrderType.RETAIL,
          totalAmount,
          payAmount: totalAmount,
          cardPayAmount: 0,
          payStatus: PayStatus.PENDING,
          status: OrderStatus.PENDING_PAY,
          receiverName: address.name,
          receiverPhone: address.phone,
          receiverAddress: `${address.province}${address.city}${address.district}${address.detail}`,
          receiverAddressId: address.id,
          remark: dto.remark || null,
          isPresale,
          presaleDeliverDate,
        });
        const saved = await manager.save(order);
        // 写 order_item
        const items = orderItems.map((it) =>
          manager.create(OrderItemEntity, { ...it, orderId: saved.id }),
        );
        await manager.save(items);
        // 写 stock_log（下单预占）
        for (const item of dto.items) {
          const sku = skuMap.get(item.skuId)!;
          await manager.insert(StockLogEntity, {
            skuId: item.skuId,
            changeType: StockChangeType.ORDER_PREOCCUPY,
            changeQty: -item.qty,
            beforeQty: sku.stock,
            afterQty: sku.stock - item.qty,
            refOrderNo: orderNo,
          });
        }
        return saved;
      });

      // 从购物车结算则清除已购项
      if (dto.fromCart) {
        await this.cartService.clearChecked(userId);
      }

      return {
        orderNo: order.orderNo,
        totalAmount: Number(order.totalAmount),
        payAmount: Number(order.payAmount),
        status: order.status,
      };
    } catch (e) {
      // 写库失败回滚 Redis 预占
      for (const item of dto.items) {
        await this.stockService.release(item.skuId, item.qty, orderNo).catch(() => {});
      }
      throw e;
    }
  }

  /** 订单列表（接口10） */
  async list(userId: number, query: QueryOrderDto): Promise<any> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: any = { userId };
    if (query.status && query.status !== '全部') {
      if (query.status === '待发货') {
        where.status = OrderStatus.PENDING_SHIP;
      } else if (query.status === '待收货') {
        where.status = OrderStatus.SHIPPED;
      } else {
        where.status = query.status;
      }
    }
    const [orders, total] = await this.orderRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    const orderIds = orders.map((o) => o.id);
    const items = orderIds.length
      ? await this.itemRepo.find({ where: { orderId: In(orderIds) } })
      : [];
    const itemMap = new Map<number, OrderItemEntity[]>();
    items.forEach((i) => {
      const arr = itemMap.get(i.orderId) || [];
      arr.push(i);
      itemMap.set(i.orderId, arr);
    });
    const list = orders.map((o) => ({
      orderNo: o.orderNo,
      status: o.status,
      totalAmount: Number(o.totalAmount),
      payAmount: Number(o.payAmount),
      createdAt: o.createdAt,
      items: (itemMap.get(o.id) || []).map((i) => ({
        productTitle: i.productTitle,
        specJson: i.specJson,
        price: Number(i.price),
        qty: i.qty,
        mainImage: i.productImage || '',
      })),
    }));
    return { list, total, page, pageSize };
  }

  /** 订单详情（接口11） */
  async detail(userId: number, orderNo: string): Promise<any> {
    const order = await this.orderRepo.findOne({ where: { orderNo, userId } });
    if (!order) {
      throw new BusinessException(ErrorCode.ORDER_NOT_FOUND);
    }
    const items = await this.itemRepo.find({ where: { orderId: order.id } });
    return {
      orderNo: order.orderNo,
      status: order.status,
      payStatus: order.payStatus,
      orderType: order.orderType,
      totalAmount: Number(order.totalAmount),
      payAmount: Number(order.payAmount),
      cardPayAmount: Number(order.cardPayAmount),
      payType: order.payType,
      payTime: order.payTime,
      tradeNo: order.tradeNo,
      receiver: {
        name: order.receiverName,
        phone: order.receiverPhone,
        address: order.receiverAddress,
      },
      remark: order.remark,
      isPresale: !!order.isPresale,
      presaleDeliverDate: order.presaleDeliverDate
        ? order.presaleDeliverDate.toISOString().slice(0, 10)
        : null,
      logistics:
        order.logisticsCompany && order.logisticsTrackNo
          ? { company: order.logisticsCompany, trackNo: order.logisticsTrackNo }
          : null,
      items: items.map((i) => ({
        id: i.id,
        skuId: i.skuId,
        productId: i.productId,
        productTitle: i.productTitle,
        productImage: i.productImage,
        specJson: i.specJson,
        price: Number(i.price),
        qty: i.qty,
        subtotal: Number(i.subtotal),
      })),
      createdAt: order.createdAt,
    };
  }

  /** 取消订单（接口14） */
  async cancel(userId: number, orderNo: string): Promise<void> {
    const order = await this.orderRepo.findOne({ where: { orderNo, userId } });
    if (!order) {
      throw new BusinessException(ErrorCode.ORDER_NOT_FOUND);
    }
    if (!canTransition(order.status, OrderStatus.CANCELLED)) {
      throw new BusinessException(ErrorCode.ORDER_STATUS_INVALID);
    }
    // 释放预占库存
    const items = await this.itemRepo.find({ where: { orderId: order.id } });
    for (const item of items) {
      await this.stockService.release(item.skuId, item.qty, orderNo);
    }
    await this.orderRepo.update(order.id, {
      status: OrderStatus.CANCELLED,
      cancelTime: new Date(),
      cancelReason: '用户主动取消',
    });
  }

  /** 确认收货（接口15） */
  async confirm(userId: number, orderNo: string): Promise<void> {
    const order = await this.orderRepo.findOne({ where: { orderNo, userId } });
    if (!order) {
      throw new BusinessException(ErrorCode.ORDER_NOT_FOUND);
    }
    if (!canTransition(order.status, OrderStatus.RECEIVED)) {
      throw new BusinessException(ErrorCode.ORDER_STATUS_INVALID);
    }
    await this.orderRepo.update(order.id, {
      status: OrderStatus.RECEIVED,
      confirmTime: new Date(),
    });
  }

  /** 支付回调确认（供 PayService 调用） */
  async confirmPaid(orderNo: string, tradeNo: string, payTime: Date): Promise<OrderEntity> {
    const order = await this.orderRepo.findOne({ where: { orderNo } });
    if (!order) {
      throw new BusinessException(ErrorCode.ORDER_NOT_FOUND);
    }
    if (order.status !== OrderStatus.PENDING_PAY) {
      // 已支付，幂等返回
      return order;
    }
    // 第二阶段：DB 确认库存扣减
    const items = await this.itemRepo.find({ where: { orderId: order.id } });
    for (const item of items) {
      await this.stockService.confirmDeduct(item.skuId, item.qty, orderNo);
    }
    // 预售单 → 待发货（等预计发货日）；非预售 → 待发货
    const nextStatus = OrderStatus.PENDING_SHIP;
    await this.orderRepo.update(order.id, {
      status: nextStatus,
      payStatus: PayStatus.PAID,
      payType: '微信支付',
      payTime,
      tradeNo,
    });
    return { ...order, status: nextStatus, payStatus: PayStatus.PAID, tradeNo, payTime };
  }

  /** 后台发货 */
  async ship(orderNo: string, company: string, trackNo: string): Promise<void> {
    const order = await this.orderRepo.findOne({ where: { orderNo } });
    if (!order) {
      throw new BusinessException(ErrorCode.ORDER_NOT_FOUND);
    }
    if (!canTransition(order.status, OrderStatus.SHIPPED)) {
      throw new BusinessException(ErrorCode.ORDER_STATUS_INVALID);
    }
    await this.orderRepo.update(order.id, {
      status: OrderStatus.SHIPPED,
      logisticsCompany: company,
      logisticsTrackNo: trackNo,
      shipTime: new Date(),
    });
  }

  /** 获取订单（供其他服务调用） */
  async getByOrderNo(orderNo: string): Promise<OrderEntity | null> {
    return this.orderRepo.findOne({ where: { orderNo } });
  }

  /** 获取订单项 */
  async getItems(orderId: number): Promise<OrderItemEntity[]> {
    return this.itemRepo.find({ where: { orderId } });
  }

  /** 后台订单列表 */
  async adminList(query: any): Promise<any> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.orderNo) where.orderNo = query.orderNo;
    const [list, total] = await this.orderRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { list, total, page, pageSize };
  }
}