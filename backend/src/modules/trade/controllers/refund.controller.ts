import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RefundService } from '../services/refund.service';
import { RefundDto } from '../dto/trade.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt.guard';

/** 退款 Controller（对应 design.md 2.2.2 接口16） */
@ApiTags('交易-退款')
@Controller('trade/refund')
@UseGuards(JwtAuthGuard)
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  @Post()
  @ApiOperation({ summary: '申请退款（接口16）' })
  async apply(@CurrentUser('userId') userId: number, @Body() dto: RefundDto) {
    return this.refundService.apply(userId, dto);
  }
}