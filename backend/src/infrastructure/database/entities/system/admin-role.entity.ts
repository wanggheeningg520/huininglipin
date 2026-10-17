import { Column, Entity, PrimaryColumn } from 'typeorm';

/** 管理员角色关联 Entity（对应 design.md 2.3.2 admin_role 表，复合主键 admin_id+role_id） */
@Entity('admin_role')
export class AdminRoleEntity {
  @PrimaryColumn({ name: 'admin_id', type: 'bigint', unsigned: true })
  adminId: number;

  @PrimaryColumn({ name: 'role_id', type: 'bigint', unsigned: true })
  roleId: number;
}