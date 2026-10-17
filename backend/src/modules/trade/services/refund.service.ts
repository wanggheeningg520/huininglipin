import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RefundEntity } from '../../../infrastructure/database/entities/trade/refund.entity';
import { OrderEntity } from '../../../infrastructure/database/entities/trade/order.entity';
import { OrderItemEntity } from '../../../infrastructure/database/entities/trade/order-item.entity';
import { OrderNoGenerator } from '../../../common/utils/order-no.generator';
import { StockService } from '../../product/services/stock.service';
import { WechatPayService } from '../../../infrastructure/wechat/wechat-pay.service';
import { BusinessException } from '../../../common/exceptions/business.exception';
import {
  ErrorCode,
  OrderStatus,
  RefundStatus,
  PayStatus,
} from '../../../common/constants/enums';
import { RefundDto } from '../dto/trade.dto';

/**
 * 退款服务（对应 design.md 2.2.2 接口16 + 2.1.3 状态机）
 * 已支付未发货可申请退款；已发货退款进入人工审核；生鲜已签收退款提示联系客服
 */
@Injectable()
export class RefundService {
  private readonly logger = new Logger(RefundService.name);

  constructor(
    @InjectRepository(RefundEntity) private readonly refundRepo: Repository<RefundEntity>,
    @InjectRepository(OrderEntity) private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity) private readonly itemRepo: Repository<OrderItemEntity>,
    private readonly orderNoGen: OrderNoGenerator,
    private readonly stockService: StockService,
    private readonly wechatPay: WechatPayService,
    private readonly dataSource: DataSource,
  ) {}

  /** 申请退款（接口16） */
  async apply(userId: number, dto: RefundDto): Promise<{ refundNo: string }> {
    const order = await this.orderRepo.findOne({ where: { orderNo: dto.orderNo, userId } });
    if (!order) {
      throw new BusinessException(ErrorCode.ORDER_NOT_FOUND);
    }
    // 状态校验：已支付/已发货可申请，已收货（生鲜）提示联系客服
    if (order.status === OrderStatus.RECEIVED || order.status === OrderStatus.FINISHED) {
      throw new BusinessException(ErrorCode.ORDER_STATUS_INVALID, '订单已签收，请联系客服处理退款');
    }
    if (order.status !== OrderStatus.PAID && order.status !== OrderStatus.PENDING_SHIP && order.status !== OrderStatus.SHIPPED) {
      throw new BusinessException(ErrorCode.ORDER_STATUS_INVALID);
    }
    // 退款金额校验
    if (dto.amount > Number(order.payAmount)) {
      throw new BusinessException(ErrorCode.REFUND_AMOUNT_EXCEED);
    }
    const refundNo = await this.orderNoGen.generateRefundNo();
    const status =
      order.status === OrderStatus.SHIPPED ? RefundStatus.PENDING_AUDIT : RefundStatus.PENDING_AUDIT;
    const refund = this.refundRepo.create({
      orderId: order.id,
      refundNo,
      amount: dto.amount,
      reason: dto.reason,
      status,
    });
    await this.refundRepo.save(refund);
    // 订单进入退款中
    await this.orderRepo.update(order.id, { status: OrderStatus.REFUNDING });
    return { refundNo };
  }

  /** 后台退款审核（通过→微信退款+订单已退款，拒绝→订单恢复） */
  async audit(refundNo: string, pass: boolean, auditRemark: string, auditorId: number): Promise<void> {
    const refund = await this.refundRepo.findOne({ where: { refundNo } });
    if (!refund) {
      throw new BusinessException(ErrorCode.NOT_FOUND, '退款单不存在');
    }
    const order = await this.orderRepo.findOne({ where: { id: refund.orderId } });
    if (!order) {
      throw new BusinessException(ErrorCode.ORDER_NOT_FOUND);
    }
    if (pass) {
      // 调用微信退款
      try {
        const result = await this.wechatPay.refund({
          orderNo: order.orderNo,
          refundNo: refund.refundNo,
          amount: Number(order.payAmount),
          refundAmount: Number(refund.amount),
          reason: refund.reason,
        });
        await this.refundRepo.update(refund.id, {
          status: RefundStatus.REFUNDED,
          auditRemark,
          auditorId,
          wxRefundNo: result.wxRefundNo,
          finishedAt: new Date(),
        });
        await this.orderRepo.update(order.id, {
          status: OrderStatus.REFUNDED,
          payStatus: PayStatus.REFUNDED,
        });
        // 退款回滚库存
        const items = await this.itemRepo.find({ where: { orderId: order.id } });
        for (const item of items) {
          await this.stockService.refundRollback(item.skuId, item.qty, order.orderNo);
        }
      } catch (e) {
        this.logger.error(`微信退款失败: ${(e as Error).message}`);
        throw new BusinessException(ErrorCode.INTERNAL_ERROR, '微信退款失败');
      }
    } else {
      // 拒绝，订单恢复
      await this.refundRepo.update(refund.id, {
        status: RefundStatus.REJECTED,
        auditRemark,
        auditorId,
        finishedAt: new Date(),
      });
      await this.orderRepo.update(order.id, { status: OrderStatus.PAID });
    }
  }

  /** 后台退款单列表 */
  async adminList(query: any): Promise<any> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: any = {};
    if (query.status) where.status = query.status;
    const [list, total] = await this.refundRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { list, total, page, pageSize };
  }
}