import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** 后台登录 DTO（对应 design.md 2.2.2 后台登录接口） */
export class AdminLoginDto {
  @ApiProperty({ description: '用户名', example: 'admin' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  username: string;

  @ApiProperty({ description: '密码', example: 'admin123' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  password: string;
}