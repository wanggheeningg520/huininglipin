import { Column, Entity, PrimaryColumn } from 'typeorm';

/** 角色菜单关联 Entity（对应 design.md 2.3.2 role_menu 表，复合主键 role_id+menu_id） */
@Entity('role_menu')
export class RoleMenuEntity {
  @PrimaryColumn({ name: 'role_id', type: 'bigint', unsigned: true })
  roleId: number;

  @PrimaryColumn({ name: 'menu_id', type: 'bigint', unsigned: true })
  menuId: number;
}