import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminJwtAuthGuard } from '../../../common/guards/admin-jwt.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { FestivalService } from '../../content/services/festival.service';
import { BannerService } from '../../content/services/banner.service';
import { RecommendService } from '../../content/services/recommend.service';
import { FestivalDto } from '../../content/dto/festival.dto';
import { BannerDto } from '../../content/dto/banner.dto';
import { RecommendDto, TopicDto } from '../../content/dto/content.dto';
import { StatusDto } from '../dto/admin-product.dto';

/**
 * 后台内容运营 Controller（对应 design.md 2.2.2 后台内容接口表）
 * 节日日历 CRUD + 启停 / Banner CRUD / 精选推荐 CRUD / 专题 CRUD
 */
@ApiTags('后台-内容运营')
@UseGuards(AdminJwtAuthGuard, RolesGuard)
@Controller('admin/content')
export class AdminContentController {
  constructor(
    private readonly festivalService: FestivalService,
    private readonly bannerService: BannerService,
    private readonly recommendService: RecommendService,
  ) {}

  // ===== 节日日历 CRUD =====
  @Get('festival')
  @Roles('content:read')
  @ApiOperation({ summary: '节日日历列表' })
  async listFestivals() {
    return this.festivalService.findAll();
  }

  @Post('festival')
  @Roles('content:write')
  @ApiOperation({ summary: '创建节日' })
  async createFestival(@Body() dto: FestivalDto) {
    return this.festivalService.create(dto);
  }

  @Put('festival/:id')
  @Roles('content:write')
  @ApiOperation({ summary: '更新节日' })
  async updateFestival(@Param('id') id: number, @Body() dto: FestivalDto) {
    await this.festivalService.update(Number(id), dto);
    return null;
  }

  @Patch('festival/:id/status')
  @Roles('content:write')
  @ApiOperation({ summary: '启用/停用节日' })
  async updateFestivalStatus(@Param('id') id: number, @Body() dto: StatusDto) {
    await this.festivalService.updateStatus(Number(id), dto.status);
    return null;
  }

  @Delete('festival/:id')
  @Roles('content:write')
  @ApiOperation({ summary: '删除节日' })
  async removeFestival(@Param('id') id: number) {
    await this.festivalService.remove(Number(id));
    return null;
  }

  // ===== Banner CRUD =====
  @Get('banner')
  @Roles('content:read')
  @ApiOperation({ summary: 'Banner 列表' })
  async listBanners(@Query('position') position?: string) {
    return this.bannerService.findAll(position);
  }

  @Post('banner')
  @Roles('content:write')
  @ApiOperation({ summary: '创建 Banner' })
  async createBanner(@Body() dto: BannerDto) {
    return this.bannerService.create(dto);
  }

  @Put('banner/:id')
  @Roles('content:write')
  @ApiOperation({ summary: '更新 Banner' })
  async updateBanner(@Param('id') id: number, @Body() dto: BannerDto) {
    await this.bannerService.update(Number(id), dto);
    return null;
  }

  @Delete('banner/:id')
  @Roles('content:write')
  @ApiOperation({ summary: '删除 Banner' })
  async removeBanner(@Param('id') id: number) {
    await this.bannerService.remove(Number(id));
    return null;
  }

  // ===== 精选推荐 CRUD =====
  @Get('recommend')
  @Roles('content:read')
  @ApiOperation({ summary: '精选推荐列表' })
  async listRecommends() {
    return this.recommendService.findAll();
  }

  @Post('recommend')
  @Roles('content:write')
  @ApiOperation({ summary: '创建推荐' })
  async createRecommend(@Body() dto: RecommendDto) {
    return this.recommendService.create(dto);
  }

  @Put('recommend/:id')
  @Roles('content:write')
  @ApiOperation({ summary: '更新推荐' })
  async updateRecommend(@Param('id') id: number, @Body() dto: RecommendDto) {
    await this.recommendService.update(Number(id), dto);
    return null;
  }

  @Delete('recommend/:id')
  @Roles('content:write')
  @ApiOperation({ summary: '删除推荐' })
  async removeRecommend(@Param('id') id: number) {
    await this.recommendService.remove(Number(id));
    return null;
  }

  // ===== 专题 CRUD =====
  @Get('topic')
  @Roles('content:read')
  @ApiOperation({ summary: '专题列表' })
  async listTopics() {
    return this.recommendService.findAllTopics();
  }

  @Post('topic')
  @Roles('content:write')
  @ApiOperation({ summary: '创建专题' })
  async createTopic(@Body() dto: TopicDto) {
    return this.recommendService.createTopic(dto);
  }

  @Put('topic/:id')
  @Roles('content:write')
  @ApiOperation({ summary: '更新专题' })
  async updateTopic(@Param('id') id: number, @Body() dto: TopicDto) {
    await this.recommendService.updateTopic(Number(id), dto);
    return null;
  }

  @Delete('topic/:id')
  @Roles('content:write')
  @ApiOperation({ summary: '删除专题' })
  async removeTopic(@Param('id') id: number) {
    await this.recommendService.removeTopic(Number(id));
    return null;
  }
}