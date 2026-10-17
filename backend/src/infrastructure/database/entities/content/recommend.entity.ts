import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ProductEntity } from '../product/product.entity';

/** 精选推荐 Entity（对应 design.md 2.3.2 recommend 表） */
@Entity('recommend')
@Unique('uk_product_id', ['productId'])
@Index(['status', 'sort'])
export class RecommendEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'product_id', type: 'bigint', unsigned: true })
  productId: number;

  @Column({ name: 'sort', type: 'int', default: 0 })
  sort: number;

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