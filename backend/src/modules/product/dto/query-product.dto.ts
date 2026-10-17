import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

/** 商品列表查询 DTO（对应 design.md 2.2.2 接口2） */
export class QueryProductDto extends PaginationDto {
  @ApiPropertyOptional({ description: '分类ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @ApiPropertyOptional({ description: '价格下限' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMin?: number;

  @ApiPropertyOptional({ description: '价格上限' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMax?: number;

  @ApiPropertyOptional({
    description: '排序',
    enum: ['sales_desc', 'price_asc', 'price_desc', 'created_desc'],
  })
  @IsOptional()
  @IsEnum(['sales_desc', 'price_asc', 'price_desc', 'created_desc'])
  sortBy?: string;
}