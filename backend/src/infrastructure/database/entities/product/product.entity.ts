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
import { CategoryEntity } from './category.entity';

/**
 * 商品 SPU Entity（对应 spec.md 6.2 + design.md 2.3.2 product 表）
 * 含预售字段 is_presale / presale_deliver_date，软删除
 */
@Entity('product')
@Index(['categoryId', 'status', 'sort'])
@Index(['isPresale'])
@Index(['presaleDeliverDate'])
@Index(['status', 'sort'])
export class ProductEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'category_id', type: 'bigint', unsigned: true })
  categoryId: number;

  @Column({ name: 'title', type: 'varchar', length: 60 })
  title: string;

  @Column({ name: 'subtitle', type: 'varchar', length: 100, nullable: true })
  subtitle: string | null;

  @Column({ name: 'main_image', type: 'varchar', length: 255 })
  mainImage: string;

  @Column({ name: 'images_json', type: 'json', nullable: true })
  imagesJson: string[] | null;

  @Column({ name: 'detail_html', type: 'mediumtext', nullable: true })
  detailHtml: string | null;

  @Column({ name: 'is_presale', type: 'tinyint', default: 0 })
  isPresale: number;

  @Column({ name: 'presale_deliver_date', type: 'date', nullable: true })
  presaleDeliverDate: Date | null;

  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @Column({ name: 'sort', type: 'int', default: 0 })
  sort: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  @ManyToOne(() => CategoryEntity)
  @JoinColumn({ name: 'category_id' })
  category: CategoryEntity;
}