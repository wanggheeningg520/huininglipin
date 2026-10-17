import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductEntity } from './product.entity';

/**
 * 商品 SKU Entity（对应 spec.md 6.3 + design.md 2.3.2 sku 表）
 */
@Entity('sku')
@Index(['productId'])
@Index(['status'])
export class SkuEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'product_id', type: 'bigint', unsigned: true })
  productId: number;

  @Column({ name: 'spec_json', type: 'json' })
  specJson: Record<string, string>;

  @Column({ name: 'price', type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'market_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  marketPrice: number | null;

  @Column({ name: 'stock', type: 'int', default: 0 })
  stock: number;

  @Column({ name: 'sales', type: 'int', default: 0 })
  sales: number;

  @Column({ name: 'weight', type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight: number | null;

  @Column({ name: 'unit', type: 'varchar', length: 10, nullable: true })
  unit: string | null;

  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => ProductEntity)
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;
}