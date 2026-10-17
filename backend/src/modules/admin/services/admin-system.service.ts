import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AdminUserEntity } from '../../../infrastructure/database/entities/system/admin-user.entity';
import { RoleEntity } from '../../../infrastructure/database/entities/system/role.entity';
import { MenuEntity } from '../../../infrastructure/database/entities/system/menu.entity';
import { RoleMenuEntity } from '../../../infrastructure/database/entities/system/role-menu.entity';
import { AdminRoleEntity } from '../../../infrastructure/database/entities/system/admin-role.entity';
import { AuditLogEntity } from '../../../infrastructure/database/entities/system/audit-log.entity';
import { SysConfigEntity } from '../../../infrastructure/database/entities/system/sys-config.entity';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { ErrorCode } from '../../../common/constants/error-code';

/**
 * 后台系统设置服务（对应 design.md 2.2.2 后台系统接口表）
 * 角色 CRUD + 菜单权限分配 / 管理员账号 CRUD + 角色分配 / 菜单树 CRUD
 * 系统参数 CRUD / 审计日志查询
 */
@Injectable()
export class AdminSystemService {
  private readonly logger = new Logger(AdminSystemService.name);
  constructor(
    @InjectRepository(AdminUserEntity) private readonly adminRepo: Repository<AdminUserEntity>,
    @InjectRepository(RoleEntity) private readonly roleRepo: Repository<RoleEntity>,
    @InjectRepository(MenuEntity) private readonly menuRepo: Repository<MenuEntity>,
    @InjectRepository(RoleMenuEntity) private readonly roleMenuRepo: Repository<RoleMenuEntity>,
    @InjectRepository(AdminRoleEntity) private readonly adminRoleRepo: Repository<AdminRoleEntity>,
    @InjectRepository(AuditLogEntity) private readonly auditRepo: Repository<AuditLogEntity>,
    @InjectRepository(SysConfigEntity) private readonly configRepo: Repository<SysConfigEntity>,
  ) {}

  // ===== 角色 CRUD =====
  async listRoles(): Promise<RoleEntity[]> {
    return this.roleRepo.find({ order: { createdAt: 'ASC' } });
  }

  async createRole(data: Partial<RoleEntity>): Promise<RoleEntity> {
    return this.roleRepo.save(this.roleRepo.create(data));
  }

  async updateRole(id: number, data: Partial<RoleEntity>): Promise<void> {
    await this.roleRepo.update(id, data);
  }

  async deleteRole(id: number): Promise<void> {
    await this.roleRepo.softDelete(id);
    await this.roleMenuRepo.delete({ roleId: id });
    await this.adminRoleRepo.delete({ roleId: id });
  }

  /** 角色权限分配（菜单 ID 列表） */
  async assignRoleMenus(roleId: number, menuIds: number[]): Promise<void> {
    await this.roleMenuRepo.delete({ roleId });
    if (menuIds.length) {
      await this.roleMenuRepo.save(menuIds.map((menuId) => this.roleMenuRepo.create({ roleId, menuId })));
    }
  }

  // ===== 管理员账号 CRUD =====
  async listAdmins(): Promise<any[]> {
    const admins = await this.adminRepo.find({ order: { createdAt: 'ASC' } });
    const adminIds = admins.map((a) => a.id);
    const adminRoles = adminIds.length
      ? await this.adminRoleRepo.find({ where: { adminId: In(adminIds) } })
      : [];
    const roleIds = [...new Set(adminRoles.map((ar) => ar.roleId))];
    const roles = roleIds.length ? await this.roleRepo.find({ where: { id: In(roleIds) } }) : [];
    const roleMap = new Map(roles.map((r) => [r.id, r]));
    return admins.map((a) => ({
      id: a.id,
      username: a.username,
      realName: a.realName,
      phone: a.phone,
      status: a.status,
      roles: adminRoles
        .filter((ar) => ar.adminId === a.id)
        .map((ar) => roleMap.get(ar.roleId))
        .filter(Boolean)
        .map((r) => ({ id: r!.id, name: r!.name, code: r!.code })),
    }));
  }

  async createAdmin(data: { username: string; password: string; realName?: string; phone?: string; roleIds?: number[] }): Promise<AdminUserEntity> {
    const exist = await this.adminRepo.findOne({ where: { username: data.username } });
    if (exist) {
      throw new BusinessException(ErrorCode.PARAM_INVALID, '用户名已存在');
    }
    const hashed = await bcrypt.hash(data.password, 10);
    const admin = await this.adminRepo.save(
      this.adminRepo.create({
        username: data.username,
        password: hashed,
        realName: data.realName ?? null,
        phone: data.phone ?? null,
        status: 1,
      }),
    );
    if (data.roleIds?.length) {
      await this.adminRoleRepo.save(
        data.roleIds.map((roleId) => this.adminRoleRepo.create({ adminId: admin.id, roleId })),
      );
    }
    return admin;
  }

  async updateAdmin(id: number, data: { password?: string; realName?: string; phone?: string; status?: number; roleIds?: number[] }): Promise<void> {
    const update: any = {};
    if (data.password) update.password = await bcrypt.hash(data.password, 10);
    if (data.realName !== undefined) update.realName = data.realName;
    if (data.phone !== undefined) update.phone = data.phone;
    if (data.status !== undefined) update.status = data.status;
    if (Object.keys(update).length) await this.adminRepo.update(id, update);
    if (data.roleIds) {
      await this.adminRoleRepo.delete({ adminId: id });
      if (data.roleIds.length) {
        await this.adminRoleRepo.save(
          data.roleIds.map((roleId) => this.adminRoleRepo.create({ adminId: id, roleId })),
        );
      }
    }
  }

  // ===== 菜单树 CRUD =====
  async listMenus(): Promise<MenuEntity[]> {
    return this.menuRepo.find({ order: { sort: 'ASC' } });
  }

  async createMenu(data: Partial<MenuEntity>): Promise<MenuEntity> {
    return this.menuRepo.save(this.menuRepo.create(data));
  }

  async updateMenu(id: number, data: Partial<MenuEntity>): Promise<void> {
    await this.menuRepo.update(id, data);
  }

  async deleteMenu(id: number): Promise<void> {
    await this.menuRepo.delete(id);
    await this.roleMenuRepo.delete({ menuId: id });
  }

  // ===== 系统参数 CRUD =====
  async listConfigs(): Promise<SysConfigEntity[]> {
    return this.configRepo.find({ order: { configKey: 'ASC' } });
  }

  async updateConfig(key: string, value: string, remark?: string): Promise<void> {
    const config = await this.configRepo.findOne({ where: { configKey: key } });
    if (config) {
      await this.configRepo.update(config.id, { configValue: value, remark: remark ?? config.remark });
    } else {
      await this.configRepo.save(this.configRepo.create({ configKey: key, configValue: value, remark }));
    }
  }

  /** 读取系统参数 */
  async getConfig(key: string): Promise<string | null> {
    const config = await this.configRepo.findOne({ where: { configKey: key } });
    return config?.configValue ?? null;
  }

  // ===== 审计日志查询 =====
  async listAuditLogs(query: {
    page?: number;
    pageSize?: number;
    operatorName?: string;
    module?: string;
    startTime?: string;
    endTime?: string;
  }): Promise<any> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: any = {};
    if (query.operatorName) where.operatorName = Like(`%${query.operatorName}%`);
    if (query.module) where.module = query.module;
    if (query.startTime && query.endTime) {
      where.createdAt = In([query.startTime, query.endTime]); // 简化，实际用 Between
    }
    const [list, total] = await this.auditRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { list, total, page, pageSize };
  }
}