import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HomeService } from '../services/home.service';
import { Public } from '../../../common/decorators/public.decorator';

/** 首页聚合 Controller（对应 design.md 2.2.2 接口25） */
@ApiTags('内容-首页')
@Controller('content/home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: '首页配置聚合（接口25）' })
  async aggregate() {
    return this.homeService.aggregate();
  }
}