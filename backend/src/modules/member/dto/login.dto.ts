import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

/** 微信登录 DTO（对应 design.md 2.2.2 接口18） */
export class WechatLoginDto {
  @ApiProperty({ description: 'wx.login 获取的 code' })
  @IsString()
  @MinLength(1)
  code: string;
}

/** 手机号授权 DTO（对应 design.md 2.2.2 接口19） */
export class BindPhoneDto {
  @ApiProperty({ description: 'getPhoneNumber 的 code' })
  @IsString()
  @MinLength(1)
  code: string;
}