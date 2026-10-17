import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AUDIT_LOG_KEY, AuditLogMeta } from '../decorators/audit-log.decorator';
import { AuditLogEntity } from '../../infrastructure/database/entities/system/audit-log.entity';

/**
 * 审计日志拦截器（对应 design.md 2.1.2 审计日志 + spec.md 4.3 规则5）
 * 配合 @AuditLog() 装饰器记录操作人/IP/时间/模块/前后值到 audit_log
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(AuditLogEntity) private readonly auditRepo: Repository<AuditLogEntity>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const meta = this.reflector.get<AuditLogMeta>(AUDIT_LOG_KEY, context.getHandler());
    if (!meta) {
      return next.handle();
    }
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as any;
    const beforeValue = this.extractBeforeValue(request);

    return next.handle().pipe(
      tap((result) => {
        const afterValue = this.safeJson(result);
        this.auditRepo.insert({
          operatorId: user?.adminId ?? user?.userId ?? null,
          operatorName: user?.username ?? user?.nickname ?? null,
          operatorType: user?.adminId ? 'admin' : 'user',
          module: meta.module,
          action: meta.action,
          targetId: this.extractTargetId(request),
          beforeValue: beforeValue ? this.safeJson(beforeValue) : null,
          afterValue,
          ip: request.ip || '',
          userAgent: request.headers['user-agent'] || '',
          traceId: (request['traceId'] as string) || null,
        }).catch(() => {
          // 审计日志写入失败不影响主流程
        });
      }),
    );
  }

  private extractTargetId(request: Request): string | null {
    const params = request.params || {};
    return params.id || params.orderNo || params.refundNo || null;
  }

  private extractBeforeValue(request: Request): any {
    return request.body || null;
  }

  private safeJson(v: any): any {
    try {
      if (v === undefined) return null;
      return v;
    } catch {
      return null;
    }
  }
}