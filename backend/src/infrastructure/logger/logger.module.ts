import { Global, Injectable, Logger, Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * 日志模块（对应 design.md 2.1.2 logger.module）
 * 使用 NestJS 内置 Logger，带 traceId（由 TraceIdMiddleware 注入）
 * 生产环境可替换为 winston，此处保持简洁用内置 Logger
 */
@Injectable()
export class LoggerService {
  private readonly logger = new Logger('App');
  log(message: string, context?: string) {
    this.logger.log(message, context);
  }
  warn(message: string, context?: string) {
    this.logger.warn(message, context);
  }
  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, trace, context);
  }
  debug(message: string, context?: string) {
    this.logger.debug(message, context);
  }
}

@Global()
@Module({
  imports: [ConfigModule],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule implements OnModuleInit {
  constructor(private readonly config: ConfigService) {}
  onModuleInit(): void {
    const level = this.config.get<string>('LOG_LEVEL', 'info');
    Logger.log(`日志级别: ${level}`, 'LoggerModule');
  }
}