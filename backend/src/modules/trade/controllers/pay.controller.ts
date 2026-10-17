import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { PayService } from '../services/pay.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt.guard';
import { Public } from '../../../common/decorators/public.decorator';

/** 支付 Controller（对应 design.md 2.2.2 接口12/13） */
@ApiTags('交易-支付')
@Controller('trade/pay')
export class PayController {
  constructor(private readonly payService: PayService) {}

  @Post(':orderNo')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '微信支付下单（接口12）' })
  async createPay(@CurrentUser('userId') userId: number, @Param('orderNo') orderNo: string) {
    return this.payService.createPay(userId, orderNo);
  }

  @Post('callback')
  @Public()
  @ApiOperation({ summary: '微信支付回调（接口13）' })
  async callback(@Req() req: Request) {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    return this.payService.handleCallback(req.headers as any, rawBody);
  }
}