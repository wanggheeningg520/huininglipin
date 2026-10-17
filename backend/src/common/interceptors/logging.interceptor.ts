import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { Logger } from '@nestjs/common';

/**
 * 日志拦截器：记录请求方法/路径/耗时
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const traceId = (request.headers['x-trace-id'] as string) || request['traceId'] || '';
    const { method, path } = request;
    const now = Date.now();
    return next.handle().pipe(
      tap(() => {
        const cost = Date.now() - now;
        this.logger.log(`[${traceId}] ${method} ${path} ${cost}ms`);
      }),
    );
  }
}