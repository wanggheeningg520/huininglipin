import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

/** 搜索请求 DTO（对应 design.md 2.2.2 接口27） */
export class SearchQueryDto {
  @ApiPropertyOptional({ description: '关键词（空时返回热门搜索词）' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  keyword?: string;

  @ApiPropertyOptional({ description: '排序：sales_desc/price_asc/price_desc', default: 'sales_desc' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: '分类 ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;
}

/** 精选推荐分页 DTO */
export class RecommendQueryDto extends PaginationDto {}

/** 创建/更新推荐 DTO */
export class RecommendDto {
  @ApiProperty({ description: '商品 ID' })
  @Type(() => Number)
  @IsInt()
  productId: number;

  @ApiPropertyOptional({ description: '排序', default: 0 })
  @IsOptional()
  @IsInt()
  sort?: number;

  @ApiPropertyOptional({ description: '启用状态 1启用 0停用', default: 1 })
  @IsOptional()
  @IsInt()
  status?: number;
}

/** 创建/更新专题 DTO */
export class TopicDto {
  @ApiProperty({ description: '专题标题' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  title: string;

  @ApiPropertyOptional({ description: '专题 Banner URL' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  banner?: string;

  @ApiPropertyOptional({ description: '关联商品 ID 列表', type: [Number] })
  @IsOptional()
  productIds?: number[];

  @ApiPropertyOptional({ description: '排序', default: 0 })
  @IsOptional()
  @IsInt()
  sort?: number;

  @ApiPropertyOptional({ description: '启用状态 1启用 0停用', default: 1 })
  @IsOptional()
  @IsInt()
  status?: number;
}