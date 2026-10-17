import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RecommendService } from '../services/recommend.service';
import { RecommendQueryDto } from '../dto/content.dto';
import { Public } from '../../../common/decorators/public.decorator';

/** 精选推荐 Controller（对应 design.md 2.2.2 接口28） */
@ApiTags('内容-推荐')
@Controller('content/recommend')
export class RecommendController {
  constructor(private readonly recommendService: RecommendService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: '精选推荐瀑布流分页（接口28）' })
  async list(@Query() query: RecommendQueryDto) {
    return this.recommendService.recommendList(query);
  }
}