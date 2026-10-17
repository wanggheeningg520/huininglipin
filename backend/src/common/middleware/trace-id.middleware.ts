import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * TraceId 中间件：为每个请求生成/透传 traceId（对应 design.md 2.1.2 logger traceId）
 */
@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const traceId = (req.headers['x-trace-id'] as string) || randomUUID().replace(/-/g, '').slice(0, 16);
    req['traceId'] = traceId;
    res.setHeader('x-trace-id', traceId);
    next();
  }
}