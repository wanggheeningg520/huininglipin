import { SetMetadata } from '@nestjs/common';

/**
 * 审计日志装饰器（对应 design.md 2.1.2 审计日志）
 * 用法：@AuditLog('商品', 'update')
 * 配合 AuditInterceptor 记录操作人/IP/时间/模块/前后值到 audit_log
 */
export const AUDIT_LOG_KEY = 'auditLog';
export interface AuditLogMeta {
  module: string;
  action: string;
}

export const AuditLog = (module: string, action: string) =>
  SetMetadata(AUDIT_LOG_KEY, { module, action } as AuditLogMeta);