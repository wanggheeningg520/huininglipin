import { All, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CardService } from '../services/card.service';

/**
 * 卡券域 Controller 空壳（对应 design.md 2.1.2 card 空壳）
 * 接口位存在 /api/v1/card/*，Service 抛 90001 一期未开放
 */
@ApiTags('卡券域（一期未开放）')
@Controller('card')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Get()
  @ApiOperation({ summary: '卡券列表（一期未开放）' })
  async list() {
    return this.cardService.list();
  }

  @Get(':id')
  @ApiOperation({ summary: '卡券详情（一期未开放）' })
  async detail() {
    return this.cardService.detail();
  }

  @Post('buy')
  @ApiOperation({ summary: '购买卡券（一期未开放）' })
  async buy() {
    return this.cardService.buy();
  }

  @Post('use')
  @ApiOperation({ summary: '卡券使用（一期未开放）' })
  async use() {
    return this.cardService.use();
  }

  @Get('mine')
  @ApiOperation({ summary: '我的卡券（一期未开放）' })
  async mine() {
    return this.cardService.mine();
  }

  @All('*')
  @ApiOperation({ summary: '卡券域其他接口（一期未开放）' })
  async fallback() {
    return this.cardService.list();
  }
}