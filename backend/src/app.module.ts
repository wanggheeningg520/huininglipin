import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
// 基础设施模块
import { DatabaseModule } from './infrastructure/database/database.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { LoggerModule } from './infrastructure/logger/logger.module';
import { OssModule } from './infrastructure/oss/oss.module';
import { WechatModule } from './infrastructure/wechat/wechat.module';
import { LogisticsModule } from './infrastructure/logistics/logistics.module';
// 配置
import appConfig from './config/configuration';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import wechatConfig from './config/wechat.config';
import ossConfig from './config/oss.config';
// 公共设施
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { GlobalValidationPipe } from './common/pipes/validation.pipe';
import { TraceIdMiddleware } from './common/middleware/trace-id.middleware';
// 业务模块
import { MemberModule } from './modules/member/member.module';
import { ProductModule } from './modules/product/product.module';
import { TradeModule } from './modules/trade/trade.module';
import { ContentModule } from './modules/content/content.module';
import { CardModule } from './modules/card/card.module';
import { DistribModule } from './modules/distrib/distrib.module';
import { AdminModule } from './modules/admin/admin.module';

/**
 * 应用根 Module（对应 design.md 2.1.2 工程结构）
 * 聚合基础设施 + 六大业务域 + 后台管理
 * 全局注册：异常过滤器、响应拦截器、校验管道、TraceId 中间件
 */
@Module({
  imports: [
    // 配置加载
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [appConfig, databaseConfig, redisConfig, wechatConfig, ossConfig],
    }),
    // 定时任务
    ScheduleModule.forRoot(),
    // 基础设施
    DatabaseModule,
    RedisModule,
    LoggerModule,
    OssModule,
    WechatModule,
    LogisticsModule,
    // 业务域
    MemberModule,
    ProductModule,
    TradeModule,
    ContentModule,
    CardModule,
    DistribModule,
    // 后台管理
    AdminModule,
  ],
  providers: [
    // 全局校验管道
    { provide: APP_PIPE, useClass: GlobalValidationPipe },
    // 全局异常过滤器
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    // 全局响应拦截器
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    // 全局日志拦截器
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule implements NestModule {
  /** 注册 TraceId 中间件 */
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TraceIdMiddleware).forRoutes('*');
  }
}