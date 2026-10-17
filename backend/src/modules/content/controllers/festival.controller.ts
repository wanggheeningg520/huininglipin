import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FestivalService } from '../services/festival.service';
import { Public } from '../../../common/decorators/public.decorator';

/** 节日专区 Controller（对应 design.md 2.2.2 接口26） */
@ApiTags('内容-节日')
@Controller('content/festival')
export class FestivalController {
  constructor(private readonly festivalService: FestivalService) {}

  @Get(':id')
  @Public()
  @ApiOperation({ summary: '节日专区详情（接口26）' })
  async detail(@Param('id') id: number) {
    return this.festivalService.detail(Number(id));
  }
}