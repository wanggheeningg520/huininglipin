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
import { UserEntity } from './user.entity';

/**
 * 收货地址 Entity（对应 spec.md 6.10 + design.md 2.3.2 address 表）
 * 同一会员最多一条 is_default=1
 */
@Entity('address')
@Index(['userId', 'isDefault'])
export class AddressEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: number;

  @Column({ name: 'name', type: 'varchar', length: 20 })
  name: string;

  @Column({ name: 'phone', type: 'varchar', length: 20 })
  phone: string;

  @Column({ name: 'province', type: 'varchar', length: 32 })
  province: string;

  @Column({ name: 'city', type: 'varchar', length: 32 })
  city: string;

  @Column({ name: 'district', type: 'varchar', length: 32 })
  district: string;

  @Column({ name: 'detail', type: 'varchar', length: 200 })
  detail: string;

  @Column({ name: 'is_default', type: 'tinyint', default: 0 })
  isDefault: number;

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