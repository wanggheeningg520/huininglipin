import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
  ValidationPipe as NestValidationPipe,
} from '@nestjs/common';
import { ErrorCode } from '../constants/error-code';
import { BusinessException } from '../exceptions/business.exception';

/**
 * 全局校验管道（对应 design.md 2.2.1 + spec.md 4.4 规则2）
 * class-validator 校验失败返回 10001
 */
@Injectable()
export class GlobalValidationPipe
  extends NestValidationPipe
  implements PipeTransform
{
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => {
        const messages = errors.map((e) => {
          const constraints = e.constraints ? Object.values(e.constraints) : [];
          return `${e.property}: ${constraints.join(', ')}`;
        });
        return new BusinessException(ErrorCode.PARAM_INVALID, messages.join('; '));
      },
    });
  }
}