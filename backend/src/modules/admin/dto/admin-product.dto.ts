import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

/** 后台商品列表查询 DTO */
export class AdminProductQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: '分类 ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @ApiPropertyOptional({ description: '状态 1上架 0下架' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;

  @ApiPropertyOptional({ description: '关键词' })
  @IsOptional()
  @IsString()
  keyword?: string;
}

/** 库存调整 DTO */
export class AdjustStockDto {
  @ApiProperty({ description: '新库存值' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

/** 预售配置 DTO */
export class PresaleDto {
  @ApiProperty({ description: '是否预售 1是 0否' })
  @Type(() => Number)
  @IsInt()
  isPresale: number;

  @ApiPropertyOptional({ description: '预计发货日 YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  presaleDeliverDate?: string;
}

/** 批量操作 DTO */
export class BatchProductDto {
  @ApiProperty({ description: '商品 ID 列表', type: [Number] })
  @IsNotEmpty()
  ids: number[];

  @ApiProperty({ description: '目标状态 1上架 0下架' })
  @Type(() => Number)
  @IsInt()
  status: number;
}

/** 状态更新 DTO */
export class StatusDto {
  @ApiProperty({ description: '状态值' })
  @Type(() => Number)
  @IsInt()
  status: number;
}