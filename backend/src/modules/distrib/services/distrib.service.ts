import { Injectable } from '@nestjs/common';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { ErrorCode } from '../../../common/constants/error-code';

/**
 * 分销域服务空壳（对应 design.md 2.1.2 distrib 空壳 + spec.md 8.5）
 * 一期未开放，所有接口抛业务异常 90001
 * 无计佣/拉人头逻辑，无 Entity（三期新增）
 */
@Injectable()
export class DistribService {
  /** 分销首页 */
  async index(): Promise<any> {
    throw new BusinessException(ErrorCode.NOT_OPEN_PHASE1);
  }

  /** 申请分销员 */
  async apply(): Promise<any> {
    throw new BusinessException(ErrorCode.NOT_OPEN_PHASE1);
  }

  /** 我的佣金 */
  async commission(): Promise<any> {
    throw new BusinessException(ErrorCode.NOT_OPEN_PHASE1);
  }

  /** 我的团队 */
  async team(): Promise<any> {
    throw new BusinessException(ErrorCode.NOT_OPEN_PHASE1);
  }

  /** 提现 */
  async withdraw(): Promise<any> {
    throw new BusinessException(ErrorCode.NOT_OPEN_PHASE1);
  }
}