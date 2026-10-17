import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminJwtAuthGuard } from '../../../common/guards/admin-jwt.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentAdmin } from '../../../common/decorators/current-user.decorator';
import { RefundService } from '../../trade/services/refund.service';
import { AdminRefundQueryDto, RefundAuditDto } from '../dto/admin-order.dto';

/**
 * 后台退款管理 Controller（对应 design.md 2.2.2 后台退款接口表）
 * 退款单列表 + 审核（通过→微信退款+订单已退款，拒绝→订单恢复）
 */
@ApiTags('后台-退款管理')
@UseGuards(AdminJwtAuthGuard, RolesGuard)
@Controller('admin/refund')
export class AdminRefundController {
  constructor(private readonly refundService: RefundService) {}

  @Get('list')
  @Roles('order:read')
  @ApiOperation({ summary: '退款单列表' })
  async list(@Query() query: AdminRefundQueryDto) {
    return this.refundService.adminList(query);
  }

  @Post(':refundNo/audit')
  @Roles('order:write')
  @ApiOperation({ summary: '退款审核（通过/拒绝）' })
  async audit(
    @Param('refundNo') refundNo: string,
    @Body() dto: RefundAuditDto,
    @CurrentAdmin('adminId') adminId: number,
  ) {
    await this.refundService.audit(refundNo, dto.pass, dto.auditRemark ?? '', adminId);
    return null;
  }
}