import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** 菜单 Entity（对应 design.md 2.3.2 menu 表） */
@Entity('menu')
@Index(['parentId'])
export class MenuEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'parent_id', type: 'bigint', unsigned: true, nullable: true })
  parentId: number | null;

  @Column({ name: 'name', type: 'varchar', length: 32 })
  name: string;

  @Column({ name: 'path', type: 'varchar', length: 128, nullable: true })
  path: string | null;

  @Column({ name: 'permission', type: 'varchar', length: 64, nullable: true })
  permission: string | null;

  @Column({ name: 'icon', type: 'varchar', length: 64, nullable: true })
  icon: string | null;

  @Column({ name: 'sort', type: 'int', default: 0 })
  sort: number;

  @Column({ name: 'type', type: 'tinyint', default: 1 })
  type: number;

  @Column({ name: 'visible', type: 'tinyint', default: 1 })
  visible: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}