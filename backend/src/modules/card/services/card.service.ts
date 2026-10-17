import { Injectable } from '@nestjs/common';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { ErrorCode } from '../../../common/constants/error-code';

/**
 * 卡券域服务空壳（对应 design.md 2.1.2 card 空壳 + spec.md 4.4 规则1）
 * 一期未开放，所有接口抛业务异常 90001
 * 二期新增 Entity 与具体逻辑
 */
@Injectable()
export class CardService {
  /** 卡券列表 */
  async list(): Promise<any> {
    throw new BusinessException(ErrorCode.NOT_OPEN_PHASE1);
  }

  /** 卡券详情 */
  async detail(): Promise<any> {
    throw new BusinessException(ErrorCode.NOT_OPEN_PHASE1);
  }

  /** 购买卡券 */
  async buy(): Promise<any> {
    throw new BusinessException(ErrorCode.NOT_OPEN_PHASE1);
  }

  /** 卡券使用 */
  async use(): Promise<any> {
    throw new BusinessException(ErrorCode.NOT_OPEN_PHASE1);
  }

  /** 我的卡券 */
  async mine(): Promise<any> {
    throw new BusinessException(ErrorCode.NOT_OPEN_PHASE1);
  }
}