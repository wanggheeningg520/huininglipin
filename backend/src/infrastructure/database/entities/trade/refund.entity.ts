import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderEntity } from './order.entity';

/**
 * 退款 Entity（对应 spec.md 6.8 + design.md 2.3.2 refund 表）
 * refund_no 全局唯一
 */
@Entity('refund')
@Index(['orderId'])
@Index(['status'])
export class RefundEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'order_id', type: 'bigint', unsigned: true })
  orderId: number;

  @Column({ name: 'refund_no', type: 'varchar', length: 32, unique: true })
  refundNo: string;

  @Column({ name: 'amount', type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'reason', type: 'varchar', length: 200 })
  reason: string;

  @Column({ name: 'status', type: 'varchar', length: 20, default: '待审核' })
  status: string;

  @Column({ name: 'audit_remark', type: 'varchar', length: 200, nullable: true })
  auditRemark: string | null;

  @Column({ name: 'auditor_id', type: 'bigint', unsigned: true, nullable: true })
  auditorId: number | null;

  @Column({ name: 'wx_refund_no', type: 'varchar', length: 64, nullable: true })
  wxRefundNo: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'finished_at', type: 'datetime', nullable: true })
  finishedAt: Date | null;

  @ManyToOne(() => OrderEntity)
  @JoinColumn({ name: 'order_id' })
  order: OrderEntity;
}