import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RecommendService } from '../services/recommend.service';
import { Public } from '../../../common/decorators/public.decorator';

/** 专题 Controller（对应 design.md 2.2.2 接口29） */
@ApiTags('内容-专题')
@Controller('content/topic')
export class TopicController {
  constructor(private readonly recommendService: RecommendService) {}

  @Get(':id')
  @Public()
  @ApiOperation({ summary: '专题页（接口29）' })
  async detail(@Param('id') id: number) {
    return this.recommendService.topicDetail(Number(id));
  }
}