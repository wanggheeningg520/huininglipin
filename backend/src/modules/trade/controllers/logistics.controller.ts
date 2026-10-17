import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LogisticsService2 } from '../services/logistics.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt.guard';

/** 物流 Controller（对应 design.md 2.2.2 接口17） */
@ApiTags('交易-物流')
@Controller('trade/order')
@UseGuards(JwtAuthGuard)
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService2) {}

  @Get(':orderNo/logistics')
  @ApiOperation({ summary: '物流轨迹查询（接口17）' })
  async query(@CurrentUser('userId') userId: number, @Param('orderNo') orderNo: string) {
    return this.logisticsService.query(userId, orderNo);
  }
}