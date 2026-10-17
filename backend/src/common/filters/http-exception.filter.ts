import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode, ERROR_HTTP_STATUS, ERROR_MESSAGE } from '../constants/error-code';
import { BusinessException } from '../exceptions/business.exception';

/**
 * 全局异常过滤器（对应 design.md 2.2.1 统一响应体 + 错误码规范）
 * 统一捕获异常，转换为 {code, message, data:null, traceId}
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const traceId = (request.headers['x-trace-id'] as string) || request['traceId'] || '';

    let code: number;
    let message: string;
    let httpStatus: number;

    if (exception instanceof BusinessException) {
      code = exception.bizCode;
      message = exception.bizMessage;
      httpStatus = exception.getStatus();
    } else if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const resp = exception.getResponse();
      if (typeof resp === 'object' && resp !== null && 'code' in resp) {
        code = (resp as any).code;
        message = (resp as any).message || ERROR_MESSAGE[code] || '错误';
      } else {
        // class-validator 校验失败
        if (httpStatus === HttpStatus.BAD_REQUEST) {
          code = ErrorCode.PARAM_INVALID;
          message = this.extractValidationMessage(resp);
        } else if (httpStatus === HttpStatus.UNAUTHORIZED) {
          code = ErrorCode.UNAUTHORIZED;
          message = ERROR_MESSAGE[code];
        } else if (httpStatus === HttpStatus.FORBIDDEN) {
          code = ErrorCode.FORBIDDEN;
          message = ERROR_MESSAGE[code];
        } else if (httpStatus === HttpStatus.NOT_FOUND) {
          code = ErrorCode.NOT_FOUND;
          message = ERROR_MESSAGE[code];
        } else if (httpStatus === HttpStatus.TOO_MANY_REQUESTS) {
          code = ErrorCode.TOO_MANY_REQUESTS;
          message = ERROR_MESSAGE[code];
        } else {
          code = ErrorCode.INTERNAL_ERROR;
          message = typeof resp === 'string' ? resp : ERROR_MESSAGE[code];
        }
      }
    } else {
      code = ErrorCode.INTERNAL_ERROR;
      message = ERROR_MESSAGE[code];
      httpStatus = ERROR_HTTP_STATUS[code] || HttpStatus.INTERNAL_SERVER_ERROR;
      this.logger.error(`[traceId=${traceId}] 未处理异常: ${this.safeStringify(exception)}`);
    }

    if (code !== ErrorCode.INTERNAL_ERROR) {
      this.logger.warn(`[traceId=${traceId}] 业务异常 code=${code} message=${message}`);
    }

    response.status(httpStatus).json({
      code,
      message,
      data: null,
      traceId,
    });
  }

  private extractValidationMessage(resp: any): string {
    if (Array.isArray(resp?.message)) {
      return resp.message.join('; ');
    }
    return typeof resp === 'string' ? resp : '参数校验失败';
  }

  private safeStringify(e: unknown): string {
    try {
      if (e instanceof Error) return `${e.message}\n${e.stack}`;
      return JSON.stringify(e);
    } catch {
      return String(e);
    }
  }
}