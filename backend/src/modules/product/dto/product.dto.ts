import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

/** SKU DTO */
export class SkuDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({ description: '规格JSON' })
  @IsObject()
  specJson: Record<string, string>;

  @ApiProperty({ description: '销售价' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  marketPrice?: number;

  @ApiProperty({ description: '库存' })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  weight?: number;
}

/** 商品创建 DTO */
export class CreateProductDto {
  @ApiProperty()
  @IsInt()
  categoryId: number;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiProperty()
  @IsString()
  mainImage: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  detailHtml?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  isPresale?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  presaleDeliverDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sort?: number;

  @ApiProperty({ type: [SkuDto] })
  skus: SkuDto[];
}

/** 库存调整 DTO（对应 design.md 2.2.2 后台库存接口） */
export class AdjustStockDto {
  @ApiProperty({ description: '调整后库存' })
  @IsInt()
  stock: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remark?: string;
}