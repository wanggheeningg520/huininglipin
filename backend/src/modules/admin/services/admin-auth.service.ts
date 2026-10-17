import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AdminUserEntity } from '../../../infrastructure/database/entities/system/admin-user.entity';
import { RoleEntity } from '../../../infrastructure/database/entities/system/role.entity';
import { MenuEntity } from '../../../infrastructure/database/entities/system/menu.entity';
import { RoleMenuEntity } from '../../../infrastructure/database/entities/system/role-menu.entity';
import { AdminRoleEntity } from '../../../infrastructure/database/entities/system/admin-role.entity';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { ErrorCode } from '../../../common/constants/error-code';
import { AdminLoginDto } from '../dto/admin-auth.dto';

/**
 * 后台鉴权服务（对应 design.md 2.3.2 admin_user/role/menu + 2.5.3）
 * 账号密码登录签发 JWT（TTL 2h），返回 token + 用户信息 + 权限列表
 */
@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);
  constructor(
    @InjectRepository(AdminUserEntity) private readonly adminRepo: Repository<AdminUserEntity>,
    @InjectRepository(RoleEntity) private readonly roleRepo: Repository<RoleEntity>,
    @InjectRepository(MenuEntity) private readonly menuRepo: Repository<MenuEntity>,
    @InjectRepository(RoleMenuEntity) private readonly roleMenuRepo: Repository<RoleMenuEntity>,
    @InjectRepository(AdminRoleEntity) private readonly adminRoleRepo: Repository<AdminRoleEntity>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** 后台登录 */
  async login(dto: AdminLoginDto, ip?: string): Promise<any> {
    const admin = await this.adminRepo.findOne({ where: { username: dto.username } });
    if (!admin) {
      throw new BusinessException(ErrorCode.UNAUTHORIZED, '账号或密码错误');
    }
    if (admin.status !== 1) {
      throw new BusinessException(ErrorCode.FORBIDDEN, '账号已停用');
    }
    const ok = await bcrypt.compare(dto.password, admin.password);
    if (!ok) {
      throw new BusinessException(ErrorCode.UNAUTHORIZED, '账号或密码错误');
    }

    // 查角色
    const adminRoles = await this.adminRoleRepo.find({ where: { adminId: admin.id } });
    const roleIds = adminRoles.map((r) => r.roleId);
    const roles = roleIds.length ? await this.roleRepo.find({ where: { id: In(roleIds), status: 1 } }) : [];

    // 查权限（菜单 permission）
    const roleMenus = roleIds.length
      ? await this.roleMenuRepo.find({ where: { roleId: In(roleIds) } })
      : [];
    const menuIds = [...new Set(roleMenus.map((rm) => rm.menuId))];
    const menus = menuIds.length ? await this.menuRepo.find({ where: { id: In(menuIds) } }) : [];
    const permissions = [...new Set(menus.map((m) => m.permission).filter(Boolean))] as string[];

    // 签发 JWT（TTL 2h）
    const token = this.jwtService.sign(
      {
        adminId: admin.id,
        username: admin.username,
        realName: admin.realName,
        roleIds,
        permissions,
      },
      {
        secret: this.config.get<string>('ADMIN_JWT_SECRET', 'dev-admin-jwt-secret'),
        expiresIn: '2h',
      },
    );

    // 更新登录信息
    await this.adminRepo.update(admin.id, { lastLoginAt: new Date(), lastLoginIp: ip ?? null });

    return {
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        realName: admin.realName,
        phone: admin.phone,
      },
      roles: roles.map((r) => ({ id: r.id, name: r.name, code: r.code })),
      permissions,
      menus: this.buildMenuTree(menus),
    };
  }

  /** 构建菜单树 */
  private buildMenuTree(menus: MenuEntity[]): any[] {
    const map = new Map<number, any>();
    const roots: any[] = [];
    menus.forEach((m) => {
      map.set(m.id, { ...m, children: [] });
    });
    menus.forEach((m) => {
      const node = map.get(m.id)!;
      if (m.parentId && map.has(m.parentId)) {
        map.get(m.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }

  /** 获取管理员信息 */
  async getAdminInfo(adminId: number): Promise<any> {
    const admin = await this.adminRepo.findOne({ where: { id: adminId } });
    if (!admin) {
      throw new BusinessException(ErrorCode.NOT_FOUND, '管理员不存在');
    }
    return {
      id: admin.id,
      username: admin.username,
      realName: admin.realName,
      phone: admin.phone,
      lastLoginAt: admin.lastLoginAt,
    };
  }
}