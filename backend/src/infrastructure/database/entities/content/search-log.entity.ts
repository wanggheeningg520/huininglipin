import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** 搜索日志 Entity（对应 spec.md 5.7.1 规则5 + design.md 2.3.2 search_log 表） */
@Entity('search_log')
@Index(['keyword'])
@Index(['createdAt'])
export class SearchLogEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'keyword', type: 'varchar', length: 60 })
  keyword: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true, nullable: true })
  userId: number | null;

  @Column({ name: 'result_cnt', type: 'int', default: 0 })
  resultCnt: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}