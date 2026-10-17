import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchService } from '../services/search.service';
import { SearchQueryDto } from '../dto/content.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

/** 搜索 Controller（对应 design.md 2.2.2 接口27） */
@ApiTags('内容-搜索')
@Controller('content/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: '搜索（接口27）' })
  async search(@Query() query: SearchQueryDto, @CurrentUser('userId') userId?: number) {
    return this.searchService.search(query, userId);
  }
}