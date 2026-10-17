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
 * 商品分类 Entity（对应 spec.md 6.1 + design.md 2.3.2 category 表）
 * 四大一级分类 + 二级分类，accompany 对外展示为「雅趣伴手礼」
 */
@Entity('category')
@Index(['parentId'])
@Index(['status', 'sort'])
@Index(['code'])
export class CategoryEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'parent_id', type: 'bigint', unsigned: true, nullable: true })
  parentId: number | null;

  @Column({ name: 'name', type: 'varchar', length: 20 })
  name: string;

  @Column({ name: 'code', type: 'varchar', length: 32, nullable: true })
  code: string | null;

  @Column({ name: 'sort', type: 'int', default: 0 })
  sort: number;

  @Column({ name: 'icon', type: 'varchar', length: 255, nullable: true })
  icon: string | null;

  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}