import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 会员 Entity（对应 spec.md 6.9 + design.md 2.3.2 user 表）
 * openid 唯一索引，软删除
 */
@Entity('user')
@Index(['unionid'])
@Index(['phone'])
export class UserEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'openid', type: 'varchar', length: 64, unique: true })
  openid: string;

  @Column({ name: 'unionid', type: 'varchar', length: 64, nullable: true })
  unionid: string | null;

  @Column({ name: 'phone', type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ name: 'nickname', type: 'varchar', length: 64, nullable: true })
  nickname: string | null;

  @Column({ name: 'avatar', type: 'varchar', length: 255, nullable: true })
  avatar: string | null;

  @Column({ name: 'level', type: 'int', default: 0 })
  level: number;

  @Column({ name: 'points', type: 'int', default: 0 })
  points: number;

  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}