import { NestFactory } from '@nestjs/core';
import { NestApplication, ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

/**
 * 应用入口（对应 design.md 2.1.2 + BE-02）
 * 启动 NestJS 监听端口，挂载 Swagger /api-docs
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestApplication>(AppModule, {
    bufferLogs: false,
  });

  // 读取配置
  const config = app.get(ConfigService);
  const port = config.get<number>('APP_PORT', 3000);
  const env = config.get<string>('NODE_ENV', 'development');

  // 全局前缀 /api/v1
  app.setGlobalPrefix('api/v1', {
    exclude: [],
  });

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Swagger 文档（仅非生产环境挂载，生产可按需开放）
  if (env !== 'production' || config.get<string>('SWAGGER_ENABLE') === 'true') {
    const docConfig = new DocumentBuilder()
      .setTitle('慧宁甄选礼品商城 API')
      .setDescription('一期后端接口文档 - 对应 design.md 2.2.2 接口清单')
      .setVersion('1.0.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
      .addTag('商品-分类')
      .addTag('商品-商品')
      .addTag('会员-用户')
      .addTag('内容-首页')
      .addTag('后台-鉴权')
      .build();
    const document = SwaggerModule.createDocument(app, docConfig);
    SwaggerModule.setup('api-docs', app, document);
    logger.log(`Swagger 文档已挂载: /api-docs`);
  }

  // 启动监听
  await app.listen(port);
  logger.log(`应用已启动 [${env}] 端口: ${port}`);
  logger.log(`接口前缀: /api/v1`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('启动失败:', err);
  process.exit(1);
});