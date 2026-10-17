import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Banner Entity（对应 spec.md 6.12 + design.md 2.3.2 banner 表） */
@Entity('banner')
@Index(['position', 'status', 'sort'])
@Index(['startTime', 'endTime'])
export class BannerEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'position', type: 'varchar', length: 32 })
  position: string;

  @Column({ name: 'title', type: 'varchar', length: 60, nullable: true })
  title: string | null;

  @Column({ name: 'image', type: 'varchar', length: 255 })
  image: string;

  @Column({ name: 'link_type', type: 'varchar', length: 20, default: '无' })
  linkType: string;

  @Column({ name: 'link_value', type: 'varchar', length: 255, nullable: true })
  linkValue: string | null;

  @Column({ name: 'start_time', type: 'datetime' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'datetime' })
  endTime: Date;

  @Column({ name: 'sort', type: 'int', default: 0 })
  sort: number;

  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}