import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { WechatLoginDto, BindPhoneDto } from '../dto/login.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt.guard';

/** 会员鉴权 Controller（对应 design.md 2.2.2 接口18/19） */
@ApiTags('会员-鉴权')
@Controller('member/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @Public()
  @ApiOperation({ summary: '微信登录（接口18）' })
  async login(@Body() dto: WechatLoginDto) {
    return this.auth.login(dto.code);
  }

  @Post('phone')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '手机号授权绑定（接口19）' })
  async bindPhone(@CurrentUser('userId') userId: number, @Body() dto: BindPhoneDto) {
    const phone = await this.auth.bindPhone(userId, dto.code);
    return { phone };
  }
}