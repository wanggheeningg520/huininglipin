import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

/** 后台订单列表查询 DTO */
export class AdminOrderQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: '订单状态' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '订单号' })
  @IsOptional()
  @IsString()
  orderNo?: string;
}

/** 发货 DTO */
export class ShipDto {
  @ApiProperty({ description: '物流公司' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  company: string;

  @ApiProperty({ description: '运单号' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  trackNo: string;
}

/** 退款审核 DTO */
export class RefundAuditDto {
  @ApiProperty({ description: '是否通过 true通过 false拒绝' })
  pass: boolean;

  @ApiPropertyOptional({ description: '审核备注' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  auditRemark?: string;
}

/** 后台退款列表查询 DTO */
export class AdminRefundQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: '退款状态' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '退款单号' })
  @IsOptional()
  @IsString()
  refundNo?: string;
}