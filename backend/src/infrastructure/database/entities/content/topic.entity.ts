import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** 专题页 Entity（对应 design.md 2.3.2 topic 表） */
@Entity('topic')
@Index(['status', 'sort'])
export class TopicEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'title', type: 'varchar', length: 60 })
  title: string;

  @Column({ name: 'banner', type: 'varchar', length: 255, nullable: true })
  banner: string | null;

  @Column({ name: 'product_ids', type: 'json', nullable: true })
  productIds: number[] | null;

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
}