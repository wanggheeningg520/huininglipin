import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt.guard';

/** 用户信息 Controller（对应 design.md 2.2.2 接口20） */
@ApiTags('会员-用户')
@Controller('member/user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: '用户信息查询（接口20）' })
  async getProfile(@CurrentUser('userId') userId: number) {
    return this.userService.getProfile(userId);
  }
}