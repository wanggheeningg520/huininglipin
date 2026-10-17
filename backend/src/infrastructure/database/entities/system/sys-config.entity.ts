import { Column, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** 系统参数 Entity（对应 design.md 2.3.2 sys_config 表） */
@Entity('sys_config')
export class SysConfigEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'config_key', type: 'varchar', length: 64, unique: true })
  configKey: string;

  @Column({ name: 'config_value', type: 'varchar', length: 500 })
  configValue: string;

  @Column({ name: 'config_type', type: 'varchar', length: 20, default: 'string' })
  configType: string;

  @Column({ name: 'remark', type: 'varchar', length: 200, nullable: true })
  remark: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}