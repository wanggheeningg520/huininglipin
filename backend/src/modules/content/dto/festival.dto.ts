import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsISODateTime, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/** 创建/更新节日 DTO（对应 design.md 2.2.2 后台内容接口表） */
export class FestivalDto {
  @ApiProperty({ description: '节日名称', example: '中秋节' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  name: string;

  @ApiProperty({ description: '历法类型', enum: ['公历', '农历'] })
  @IsIn(['公历', '农历'])
  calendarType: string;

  @ApiProperty({ description: '月份', example: 8 })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ description: '日期', example: 15 })
  @IsInt()
  @Min(1)
  @Max(31)
  day: number;

  @ApiPropertyOptional({ description: '备货提前期（天）', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  prepDays?: number;

  @ApiProperty({ description: '销售开始时间' })
  @IsISODateTime()
  saleStart: string;

  @ApiProperty({ description: '销售结束时间' })
  @IsISODateTime()
  saleEnd: string;

  @ApiPropertyOptional({ description: 'Banner 图片 URL' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  bannerImage?: string;

  @ApiPropertyOptional({ description: '链接 URL' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  linkUrl?: string;

  @ApiPropertyOptional({ description: '排序', default: 0 })
  @IsOptional()
  @IsInt()
  sort?: number;

  @ApiPropertyOptional({ description: '启用状态 1启用 0停用', default: 1 })
  @IsOptional()
  @IsInt()
  @IsIn([0, 1])
  status?: number;
}