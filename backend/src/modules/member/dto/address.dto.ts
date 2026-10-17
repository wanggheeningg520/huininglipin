import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/** 收货地址 DTO（对应 design.md 2.2.2 接口22） */
export class AddressDto {
  @ApiProperty({ description: '收货人姓名' })
  @IsString()
  @MaxLength(20)
  name: string;

  @ApiProperty({ description: '手机号' })
  @IsString()
  @MaxLength(20)
  phone: string;

  @ApiProperty({ description: '省' })
  @IsString()
  @MaxLength(32)
  province: string;

  @ApiProperty({ description: '市' })
  @IsString()
  @MaxLength(32)
  city: string;

  @ApiProperty({ description: '区' })
  @IsString()
  @MaxLength(32)
  district: string;

  @ApiProperty({ description: '详细地址' })
  @IsString()
  @MaxLength(200)
  detail: string;

  @ApiPropertyOptional({ description: '是否默认' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}