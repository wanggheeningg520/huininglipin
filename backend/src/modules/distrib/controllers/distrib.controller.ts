import { All, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DistribService } from '../services/distrib.service';

/**
 * 分销域 Controller 空壳（对应 design.md 2.1.2 distrib 空壳）
 * 接口位存在 /api/v1/distrib/*，Service 抛 90001 一期未开放
 */
@ApiTags('分销域（一期未开放）')
@Controller('distrib')
export class DistribController {
  constructor(private readonly distribService: DistribService) {}

  @Get()
  @ApiOperation({ summary: '分销首页（一期未开放）' })
  async index() {
    return this.distribService.index();
  }

  @Post('apply')
  @ApiOperation({ summary: '申请分销员（一期未开放）' })
  async apply() {
    return this.distribService.apply();
  }

  @Get('commission')
  @ApiOperation({ summary: '我的佣金（一期未开放）' })
  async commission() {
    return this.distribService.commission();
  }

  @Get('team')
  @ApiOperation({ summary: '我的团队（一期未开放）' })
  async team() {
    return this.distribService.team();
  }

  @Post('withdraw')
  @ApiOperation({ summary: '提现（一期未开放）' })
  async withdraw() {
    return this.distribService.withdraw();
  }

  @All('*')
  @ApiOperation({ summary: '分销域其他接口（一期未开放）' })
  async fallback() {
    return this.distribService.index();
  }
}