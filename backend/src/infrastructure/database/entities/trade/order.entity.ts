import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../member/user.entity';

/**
 * 订单 Entity（对应 spec.md 6.5 + design.md 2.3.2 order 表）
 * order_no 唯一，预留 card_pay_amount（二期），收货信息快照，软删除
 */
@Entity('order')
@Index(['userId', 'status', 'createdAt'])
@Index(['status'])
@Index(['payStatus'])
@Index(['tradeNo'])
@Index(['isPresale', 'presaleDeliverDate'])
@Index(['createdAt'])
export class OrderEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'order_no', type: 'varchar', length: 32, unique: true })
  orderNo: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: number;

  @Column({ name: 'order_type', type: 'varchar', length: 20, default: '零售单' })
  orderType: string;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ name: 'pay_amount', type: 'decimal', precision: 10, scale: 2 })
  payAmount: number;

  @Column({ name: 'card_pay_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  cardPayAmount: number;

  @Column({ name: 'pay_status', type: 'varchar', length: 20, default: '待支付' })
  payStatus: string;

  @Column({ name: 'pay_type', type: 'varchar', length: 20, nullable: true })
  payType: string | null;

  @Column({ name: 'pay_time', type: 'datetime', nullable: true })
  payTime: Date | null;

  @Column({ name: 'trade_no', type: 'varchar', length: 64, nullable: true })
  tradeNo: string | null;

  @Column({ name: 'status', type: 'varchar', length: 20, default: '待支付' })
  status: string;

  @Column({ name: 'receiver_name', type: 'varchar', length: 20 })
  receiverName: string;

  @Column({ name: 'receiver_phone', type: 'varchar', length: 20 })
  receiverPhone: string;

  @Column({ name: 'receiver_address', type: 'varchar', length: 300 })
  receiverAddress: string;

  @Column({ name: 'receiver_address_id', type: 'bigint', unsigned: true, nullable: true })
  receiverAddressId: number | null;

  @Column({ name: 'remark', type: 'varchar', length: 200, nullable: true })
  remark: string | null;

  @Column({ name: 'invoice_info_json', type: 'json', nullable: true })
  invoiceInfoJson: Record<string, any> | null;

  @Column({ name: 'is_presale', type: 'tinyint', default: 0 })
  isPresale: number;

  @Column({ name: 'presale_deliver_date', type: 'date', nullable: true })
  presaleDeliverDate: Date | null;

  @Column({ name: 'logistics_company', type: 'varchar', length: 32, nullable: true })
  logisticsCompany: string | null;

  @Column({ name: 'logistics_track_no', type: 'varchar', length: 64, nullable: true })
  logisticsTrackNo: string | null;

  @Column({ name: 'ship_time', type: 'datetime', nullable: true })
  shipTime: Date | null;

  @Column({ name: 'confirm_time', type: 'datetime', nullable: true })
  confirmTime: Date | null;

  @Column({ name: 'finish_time', type: 'datetime', nullable: true })
  finishTime: Date | null;

  @Column({ name: 'cancel_time', type: 'datetime', nullable: true })
  cancelTime: Date | null;

  @Column({ name: 'cancel_reason', type: 'varchar', length: 100, nullable: true })
  cancelReason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}