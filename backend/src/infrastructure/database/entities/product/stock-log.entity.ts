import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SkuEntity } from './sku.entity';

/**
 * 库存流水 Entity（对应 spec.md 6.4 + design.md 2.3.2 stock_log 表）
 * 每次库存变动写一条，after_qty = before_qty + change_qty
 */
@Entity('stock_log')
@Index(['skuId'])
@Index(['refOrderNo'])
@Index(['changeType'])
@Index(['createdAt'])
export class StockLogEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'sku_id', type: 'bigint', unsigned: true })
  skuId: number;

  @Column({ name: 'change_type', type: 'varchar', length: 20 })
  changeType: string;

  @Column({ name: 'change_qty', type: 'int' })
  changeQty: number;

  @Column({ name: 'before_qty', type: 'int' })
  beforeQty: number;

  @Column({ name: 'after_qty', type: 'int' })
  afterQty: number;

  @Column({ name: 'ref_order_no', type: 'varchar', length: 32, nullable: true })
  refOrderNo: string | null;

  @Column({ name: 'operator_id', type: 'bigint', unsigned: true, nullable: true })
  operatorId: number | null;

  @Column({ name: 'remark', type: 'varchar', length: 200, nullable: true })
  remark: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => SkuEntity)
  @JoinColumn({ name: 'sku_id' })
  sku: SkuEntity;
}