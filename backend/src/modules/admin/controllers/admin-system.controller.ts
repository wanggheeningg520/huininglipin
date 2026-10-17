import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminJwtAuthGuard } from '../../../common/guards/admin-jwt.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AdminSystemService } from '../services/admin-system.service';

/**
 * 后台系统设置 Controller（对应 design.md 2.2.2 后台系统接口表）
 * 角色 CRUD + 菜单权限分配 / 管理员账号 CRUD / 菜单树 CRUD
 * 系统参数 CRUD / 审计日志查询
 */
@ApiTags('后台-系统设置')
@UseGuards(AdminJwtAuthGuard, RolesGuard)
@Controller('admin/system')
export class AdminSystemController {
  constructor(private readonly systemService: AdminSystemService) {}

  // ===== 角色 CRUD =====
  @Get('role')
  @Roles('system:read')
  @ApiOperation({ summary: '角色列表' })
  async listRoles() {
    return this.systemService.listRoles();
  }

  @Post('role')
  @Roles('system:write')
  @ApiOperation({ summary: '创建角色' })
  async createRole(@Body() data: any) {
    return this.systemService.createRole(data);
  }

  @Put('role/:id')
  @Roles('system:write')
  @ApiOperation({ summary: '更新角色' })
  async updateRole(@Param('id') id: number, @Body() data: any) {
    await this.systemService.updateRole(Number(id), data);
    return null;
  }

  @Delete('role/:id')
  @Roles('system:write')
  @ApiOperation({ summary: '删除角色' })
  async deleteRole(@Param('id') id: number) {
    await this.systemService.deleteRole(Number(id));
    return null;
  }

  @Post('role/:id/menus')
  @Roles('system:write')
  @ApiOperation({ summary: '角色权限分配' })
  async assignRoleMenus(@Param('id') id: number, @Body('menuIds') menuIds: number[]) {
    await this.systemService.assignRoleMenus(Number(id), menuIds || []);
    return null;
  }

  // ===== 管理员账号 CRUD =====
  @Get('admin')
  @Roles('system:read')
  @ApiOperation({ summary: '管理员列表' })
  async listAdmins() {
    return this.systemService.listAdmins();
  }

  @Post('admin')
  @Roles('system:write')
  @ApiOperation({ summary: '创建管理员' })
  async createAdmin(@Body() data: any) {
    return this.systemService.createAdmin(data);
  }

  @Put('admin/:id')
  @Roles('system:write')
  @ApiOperation({ summary: '更新管理员' })
  async updateAdmin(@Param('id') id: number, @Body() data: any) {
    await this.systemService.updateAdmin(Number(id), data);
    return null;
  }

  // ===== 菜单树 CRUD =====
  @Get('menu')
  @Roles('system:read')
  @ApiOperation({ summary: '菜单列表' })
  async listMenus() {
    return this.systemService.listMenus();
  }

  @Post('menu')
  @Roles('system:write')
  @ApiOperation({ summary: '创建菜单' })
  async createMenu(@Body() data: any) {
    return this.systemService.createMenu(data);
  }

  @Put('menu/:id')
  @Roles('system:write')
  @ApiOperation({ summary: '更新菜单' })
  async updateMenu(@Param('id') id: number, @Body() data: any) {
    await this.systemService.updateMenu(Number(id), data);
    return null;
  }

  @Delete('menu/:id')
  @Roles('system:write')
  @ApiOperation({ summary: '删除菜单' })
  async deleteMenu(@Param('id') id: number) {
    await this.systemService.deleteMenu(Number(id));
    return null;
  }

  // ===== 系统参数 CRUD =====
  @Get('config')
  @Roles('system:read')
  @ApiOperation({ summary: '系统参数列表' })
  async listConfigs() {
    return this.systemService.listConfigs();
  }

  @Put('config')
  @Roles('system:write')
  @ApiOperation({ summary: '更新系统参数' })
  async updateConfig(@Body() data: { key: string; value: string; remark?: string }) {
    await this.systemService.updateConfig(data.key, data.value, data.remark);
    return null;
  }

  // ===== 审计日志查询 =====
  @Get('audit-log')
  @Roles('system:read')
  @ApiOperation({ summary: '审计日志查询' })
  async listAuditLogs(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('operatorName') operatorName?: string,
    @Query('module') module?: string,
  ) {
    return this.systemService.listAuditLogs({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
      operatorName,
      module,
    });
  }
}