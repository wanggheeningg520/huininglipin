import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { Request, Response } from 'express';
import { ErrorCode } from '../constants/error-code';

/**
 * 统一响应拦截器（对应 design.md 2.2.1 统一响应体）
 * 成功统一转 {code:0, message:'success', data}
 * 跳过微信支付回调（特殊响应格式）
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    // 微信支付回调返回 {code:'SUCCESS', message:'OK'}，不包装
    if (request.path.includes('/trade/pay/callback')) {
      return next.handle();
    }
    // 已经是标准响应体结构则不再包装
    return next.handle().pipe(
      map((data) => {
        if (
          data &&
          typeof data === 'object' &&
          'code' in data &&
          'message' in data &&
          'data' in data
        ) {
          return data;
        }
        const traceId = (request.headers['x-trace-id'] as string) || request['traceId'] || '';
        return {
          code: ErrorCode.SUCCESS,
          message: 'success',
          data: data ?? null,
          traceId: traceId || undefined,
        };
      }),
    );
  }
}