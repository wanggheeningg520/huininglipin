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
import { UserEntity } from '../member/user.entity';
import { SkuEntity } from '../product/sku.entity';

/**
 * 购物车 Entity（对应 spec.md 6.7 + design.md 2.3.2 cart 表）
 * uk_user_sku 唯一约束（同 SKU 加数量）
 */
@Entity('cart')
@Unique('uk_user_sku', ['userId', 'skuId'])
@Index(['userId'])
export class CartEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: number;

  @Column({ name: 'sku_id', type: 'bigint', unsigned: true })
  skuId: number;

  @Column({ name: 'qty', type: 'int', default: 1 })
  qty: number;

  @Column({ name: 'checked', type: 'tinyint', default: 1 })
  checked: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => SkuEntity)
  @JoinColumn({ name: 'sku_id' })
  sku: SkuEntity;
}