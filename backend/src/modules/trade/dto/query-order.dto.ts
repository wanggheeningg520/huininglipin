import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

/** 订单列表查询 DTO（接口10） */
export class QueryOrderDto extends PaginationDto {
  @ApiPropertyOptional({
    description: '订单状态',
    enum: ['全部', '待支付', '待发货', '待收货', '已完成'],
  })
  @IsOptional()
  @IsEnum(['全部', '待支付', '待发货', '待收货', '已完成'])
  status?: string;
}