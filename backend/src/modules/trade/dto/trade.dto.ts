import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/** 购物车加购 DTO（接口6） */
export class AddCartDto {
  @ApiProperty()
  @IsInt()
  skuId: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  qty: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  checked?: boolean;
}

/** 勾选购物车 DTO（接口8） */
export class CheckCartDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  cartIds: number[];

  @ApiProperty()
  @IsBoolean()
  checked: boolean;
}

/** 创建订单项 */
export class CreateOrderItemDto {
  @ApiProperty()
  @IsInt()
  skuId: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  qty: number;
}

/** 创建订单 DTO（接口9） */
export class CreateOrderDto {
  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiProperty()
  @IsInt()
  addressId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  remark?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  fromCart?: boolean;
}

/** 退款申请 DTO（接口16） */
export class RefundDto {
  @ApiProperty()
  @IsString()
  orderNo: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  reason: string;
}