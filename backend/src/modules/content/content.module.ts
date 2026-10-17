import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FestivalEntity } from '../../infrastructure/database/entities/content/festival.entity';
import { BannerEntity } from '../../infrastructure/database/entities/content/banner.entity';
import { RecommendEntity } from '../../infrastructure/database/entities/content/recommend.entity';
import { TopicEntity } from '../../infrastructure/database/entities/content/topic.entity';
import { SearchLogEntity } from '../../infrastructure/database/entities/content/search-log.entity';
import { ProductEntity } from '../../infrastructure/database/entities/product/product.entity';
import { SkuEntity } from '../../infrastructure/database/entities/product/sku.entity';
import { CategoryEntity } from '../../infrastructure/database/entities/product/category.entity';
import { FestivalController } from './controllers/festival.controller';
import { SearchController } from './controllers/search.controller';
import { RecommendController } from './controllers/recommend.controller';
import { TopicController } from './controllers/topic.controller';
import { HomeController } from './controllers/home.controller';
import { FestivalService } from './services/festival.service';
import { BannerService } from './services/banner.service';
import { SearchService } from './services/search.service';
import { RecommendService } from './services/recommend.service';
import { HomeService } from './services/home.service';
import { FestivalScheduler } from './schedulers/festival.scheduler';

/**
 * 内容域 Module（对应 design.md 2.1.2 content）
 * 节日日历/Banner/搜索/推荐/专题/首页聚合
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      FestivalEntity,
      BannerEntity,
      RecommendEntity,
      TopicEntity,
      SearchLogEntity,
      ProductEntity,
      SkuEntity,
      CategoryEntity,
    ]),
  ],
  controllers: [
    FestivalController,
    SearchController,
    RecommendController,
    TopicController,
    HomeController,
  ],
  providers: [
    FestivalService,
    BannerService,
    SearchService,
    RecommendService,
    HomeService,
    FestivalScheduler,
  ],
  exports: [FestivalService, BannerService, RecommendService, HomeService],
})
export class ContentModule {}