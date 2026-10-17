import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** 角色 Entity（对应 design.md 2.3.2 role 表） */
@Entity('role')
export class RoleEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'name', type: 'varchar', length: 32 })
  name: string;

  @Column({ name: 'code', type: 'varchar', length: 32, unique: true })
  code: string;

  @Column({ name: 'remark', type: 'varchar', length: 200, nullable: true })
  remark: string | null;

  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}