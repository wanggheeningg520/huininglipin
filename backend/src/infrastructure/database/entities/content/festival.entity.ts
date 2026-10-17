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
 * 节日日历 Entity（对应 spec.md 6.11 + design.md 2.3.2 festival 表）
 * 支持公历/农历，农历由 lunar-javascript 换算为当年公历
 */
@Entity('festival')
@Index(['status', 'sort'])
@Index(['isOnline'])
@Index(['saleStart', 'saleEnd'])
export class FestivalEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'name', type: 'varchar', length: 20 })
  name: string;

  @Column({ name: 'calendar_type', type: 'varchar', length: 10, default: '公历' })
  calendarType: string;

  @Column({ name: 'month', type: 'tinyint' })
  month: number;

  @Column({ name: 'day', type: 'tinyint' })
  day: number;

  @Column({ name: 'prep_days', type: 'int', default: 0 })
  prepDays: number;

  @Column({ name: 'sale_start', type: 'datetime' })
  saleStart: Date;

  @Column({ name: 'sale_end', type: 'datetime' })
  saleEnd: Date;

  @Column({ name: 'banner_image', type: 'varchar', length: 255, nullable: true })
  bannerImage: string | null;

  @Column({ name: 'link_url', type: 'varchar', length: 255, nullable: true })
  linkUrl: string | null;

  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @Column({ name: 'is_online', type: 'tinyint', default: 0 })
  isOnline: number;

  @Column({ name: 'sort', type: 'int', default: 0 })
  sort: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}