import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsISODateTime, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/** 创建/更新 Banner DTO（对应 design.md 2.2.2 后台 Banner 接口） */
export class BannerDto {
  @ApiProperty({ description: '位置', enum: ['首页顶部', '分类页顶部', '节日专区'] })
  @IsIn(['首页顶部', '分类页顶部', '节日专区'])
  position: string;

  @ApiPropertyOptional({ description: '标题' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  title?: string;

  @ApiProperty({ description: '图片 URL' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  image: string;

  @ApiPropertyOptional({ description: '链接类型', enum: ['商品', '分类', '专题', '外链', '无'], default: '无' })
  @IsOptional()
  @IsIn(['商品', '分类', '专题', '外链', '无'])
  linkType?: string;

  @ApiPropertyOptional({ description: '链接值' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  linkValue?: string;

  @ApiProperty({ description: '开始时间' })
  @IsISODateTime()
  startTime: string;

  @ApiProperty({ description: '结束时间' })
  @IsISODateTime()
  endTime: string;

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