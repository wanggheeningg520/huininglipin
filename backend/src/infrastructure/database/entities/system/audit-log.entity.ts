import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** 审计日志 Entity（对应 design.md 2.3.2 audit_log 表） */
@Entity('audit_log')
@Index(['operatorId'])
@Index(['module', 'action'])
@Index(['createdAt'])
export class AuditLogEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'operator_id', type: 'bigint', unsigned: true, nullable: true })
  operatorId: number | null;

  @Column({ name: 'operator_name', type: 'varchar', length: 32, nullable: true })
  operatorName: string | null;

  @Column({ name: 'operator_type', type: 'varchar', length: 10, default: 'admin' })
  operatorType: string;

  @Column({ name: 'module', type: 'varchar', length: 32 })
  module: string;

  @Column({ name: 'action', type: 'varchar', length: 32 })
  action: string;

  @Column({ name: 'target_id', type: 'varchar', length: 64, nullable: true })
  targetId: string | null;

  @Column({ name: 'before_value', type: 'json', nullable: true })
  beforeValue: Record<string, any> | null;

  @Column({ name: 'after_value', type: 'json', nullable: true })
  afterValue: Record<string, any> | null;

  @Column({ name: 'ip', type: 'varchar', length: 45, nullable: true })
  ip: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 255, nullable: true })
  userAgent: string | null;

  @Column({ name: 'trace_id', type: 'varchar', length: 64, nullable: true })
  traceId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}