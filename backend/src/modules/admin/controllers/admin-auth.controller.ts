import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AdminAuthService } from '../services/admin-auth.service';
import { AdminLoginDto } from '../dto/admin-auth.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentAdmin } from '../../../common/decorators/current-user.decorator';

/** 后台鉴权 Controller（对应 design.md 2.2.2 后台登录接口） */
@ApiTags('后台-鉴权')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly authService: AdminAuthService) {}

  @Post('login')
  @Public()
  @ApiOperation({ summary: '后台登录' })
  async login(@Body() dto: AdminLoginDto, @Req() req: Request) {
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] || req.ip;
    return this.authService.login(dto, ip);
  }

  @Get('info')
  @ApiOperation({ summary: '获取当前管理员信息' })
  async info(@CurrentAdmin('adminId') adminId: number) {
    return this.authService.getAdminInfo(adminId);
  }
}