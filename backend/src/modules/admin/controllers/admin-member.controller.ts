import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminJwtAuthGuard } from '../../../common/guards/admin-jwt.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AdminMemberService } from '../services/admin-member.service';

/**
 * 后台会员管理 Controller（对应 design.md 2.2.2 后台会员接口）
 * 会员列表（手机号脱敏）+ 会员详情
 */
@ApiTags('后台-会员管理')
@UseGuards(AdminJwtAuthGuard, RolesGuard)
@Controller('admin/member')
export class AdminMemberController {
  constructor(private readonly memberService: AdminMemberService) {}

  @Get('list')
  @Roles('member:read')
  @ApiOperation({ summary: '会员列表（手机号脱敏）' })
  async list(@Query('page') page?: number, @Query('pageSize') pageSize?: number, @Query('keyword') keyword?: string) {
    return this.memberService.list({ page: page ? Number(page) : 1, pageSize: pageSize ? Number(pageSize) : 20, keyword });
  }

  @Get(':id')
  @Roles('member:read')
  @ApiOperation({ summary: '会员详情' })
  async detail(@Param('id') id: number) {
    return this.memberService.detail(Number(id));
  }
}