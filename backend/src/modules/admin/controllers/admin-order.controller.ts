import { Body, Controller, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AdminJwtAuthGuard } from '../../../common/guards/admin-jwt.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentAdmin } from '../../../common/decorators/current-user.decorator';
import { OrderService } from '../../trade/services/order.service';
import { RefundService } from '../../trade/services/refund.service';
import { AdminOrderQueryDto, ShipDto, AdminRefundQueryDto, RefundAuditDto } from '../dto/admin-order.dto';

/**
 * 后台订单管理 Controller（对应 design.md 2.2.2 后台订单接口表）
 * 订单列表/详情/发货/导出 + 退款列表/审核
 */
@ApiTags('后台-订单管理')
@UseGuards(AdminJwtAuthGuard, RolesGuard)
@Controller('admin/order')
export class AdminOrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly refundService: RefundService,
  ) {}

  @Get('list')
  @Roles('order:read')
  @ApiOperation({ summary: '订单列表（多状态筛选/搜索）' })
  async list(@Query() query: AdminOrderQueryDto) {
    return this.orderService.adminList(query);
  }

  @Get(':orderNo')
  @Roles('order:read')
  @ApiOperation({ summary: '订单详情' })
  async detail(@Param('orderNo') orderNo: string) {
    const order = await this.orderService.getByOrderNo(orderNo);
    if (!order) return null;
    const items = await this.orderService.getItems(order.id);
    return { ...order, items };
  }

  @Post(':orderNo/ship')
  @Roles('order:write')
  @ApiOperation({ summary: '发货（物流公司+运单号）' })
  async ship(@Param('orderNo') orderNo: string, @Body() dto: ShipDto) {
    await this.orderService.ship(orderNo, dto.company, dto.trackNo);
    return null;
  }

  @Get('export')
  @Roles('order:read')
  @ApiOperation({ summary: '订单导出 CSV' })
  async export(@Query() query: AdminOrderQueryDto, @Res() res: Response) {
    const result = await this.orderService.adminList({ ...query, page: 1, pageSize: 50 });
    const header = '订单号,用户ID,订单状态,支付状态,支付金额,创建时间\n';
    const rows = (result.list as any[])
      .map(
        (o) =>
          `${o.orderNo},${o.userId},${o.status},${o.payStatus},${o.payAmount},${o.createdAt?.toISOString()}`,
      )
      .join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
    res.send(header + rows);
  }
}