import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, ERROR_HTTP_STATUS, ERROR_MESSAGE } from '../constants/error-code';

/**
 * 业务异常类（对应 design.md 2.2.1 错误码规范）
 * 抛出后由 BusinessExceptionFilter 统一捕获转换为 {code, message, data:null, traceId}
 */
export class BusinessException extends HttpException {
  readonly bizCode: number;
  readonly bizMessage: string;

  constructor(code: number, message?: string) {
    const msg = message || ERROR_MESSAGE[code] || '业务错误';
    const httpStatus = ERROR_HTTP_STATUS[code] || HttpStatus.OK;
    super({ code, message: msg }, httpStatus);
    this.bizCode = code;
    this.bizMessage = msg;
  }

  /** 快速构造：参数校验失败 */
  static paramInvalid(message?: string): BusinessException {
    return new BusinessException(ErrorCode.PARAM_INVALID, message);
  }

  /** 快速构造：未授权 */
  static unauthorized(message?: string): BusinessException {
    return new BusinessException(ErrorCode.UNAUTHORIZED, message);
  }

  /** 快速构造：无权限 */
  static forbidden(message?: string): BusinessException {
    return new BusinessException(ErrorCode.FORBIDDEN, message);
  }

  /** 快速构造：资源不存在 */
  static notFound(message?: string): BusinessException {
    return new BusinessException(ErrorCode.NOT_FOUND, message);
  }
}