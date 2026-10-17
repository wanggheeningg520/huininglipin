import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { OrderService } from '../services/order.service';
import { CreateOrderDto, RefundDto } from '../dto/trade.dto';
import { QueryOrderDto } from '../dto/query-order.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt.guard';
import { Public } from '../../../common/decorators/public.decorator';
import { Idempotent } from '../../../common/decorators/idempotent.decorator';
import { IdempotencyInterceptor } from '../../../common/interceptors/idempotency.interceptor';

/** 订单 Controller（对应 design.md 2.2.2 接口9/10/11/14/15） */
@ApiTags('交易-订单')
@Controller('trade/order')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @Idempotent()
  @UseInterceptors(IdempotencyInterceptor)
  @ApiOperation({ summary: '创建订单（接口9）' })
  async create(@CurrentUser('userId') userId: number, @Body() dto: CreateOrderDto) {
    return this.orderService.create(userId, dto);
  }

  @Get('list')
  @ApiOperation({ summary: '订单列表（接口10）' })
  async list(@CurrentUser('userId') userId: number, @Query() query: QueryOrderDto) {
    return this.orderService.list(userId, query);
  }

  @Get(':orderNo')
  @ApiOperation({ summary: '订单详情（接口11）' })
  async detail(@CurrentUser('userId') userId: number, @Param('orderNo') orderNo: string) {
    return this.orderService.detail(userId, orderNo);
  }

  @Post(':orderNo/cancel')
  @ApiOperation({ summary: '取消订单（接口14）' })
  async cancel(@CurrentUser('userId') userId: number, @Param('orderNo') orderNo: string) {
    await this.orderService.cancel(userId, orderNo);
    return null;
  }

  @Post(':orderNo/confirm')
  @ApiOperation({ summary: '确认收货（接口15）' })
  async confirm(@CurrentUser('userId') userId: number, @Param('orderNo') orderNo: string) {
    await this.orderService.confirm(userId, orderNo);
    return null;
  }
}