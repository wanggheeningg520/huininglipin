import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';

/** 通用 ID DTO */
export class IdDto {
  @ApiPropertyOptional({ description: 'ID' })
  @IsOptional()
  @IsInt()
  id?: number;
}