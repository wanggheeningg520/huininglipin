import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * 分页查询 DTO（对应 design.md 2.2.2 公共参数）
 * pageSize 最大 50，默认 20
 */
export class PaginationDto {
  @ApiPropertyOptional({ description: '页码，默认 1', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量，默认 20，最大 50', default: 20, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number = 20;

  /** 计算跳过条数 */
  getSkip(): number {
    return ((this.page ?? 1) - 1) * this.getTake();
  }

  /** 计算取条数 */
  getTake(): number {
    return this.pageSize ?? 20;
  }
}