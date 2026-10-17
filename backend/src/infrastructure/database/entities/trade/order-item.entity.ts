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
import { SkuEntity } from '../product/sku.entity';

/**
 * 订单明细 Entity（对应 spec.md 6.6 + design.md 2.3.2 order_item 表）
 * 下单时快照 SKU 与商品信息
 */
@Entity('order_item')
@Index(['orderId'])
@Index(['skuId'])
export class OrderItemEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'order_id', type: 'bigint', unsigned: true })
  orderId: number;

  @Column({ name: 'sku_id', type: 'bigint', unsigned: true })
  skuId: number;

  @Column({ name: 'product_id', type: 'bigint', unsigned: true })
  productId: number;

  @Column({ name: 'product_title', type: 'varchar', length: 60 })
  productTitle: string;

  @Column({ name: 'product_image', type: 'varchar', length: 255, nullable: true })
  productImage: string | null;

  @Column({ name: 'spec_json', type: 'json' })
  specJson: Record<string, string>;

  @Column({ name: 'price', type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'qty', type: 'int' })
  qty: number;

  @Column({ name: 'subtotal', type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => OrderEntity)
  @JoinColumn({ name: 'order_id' })
  order: OrderEntity;

  @ManyToOne(() => SkuEntity)
  @JoinColumn({ name: 'sku_id' })
  sku: SkuEntity;
}