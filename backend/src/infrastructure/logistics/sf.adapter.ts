import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { LogisticsAdapter, LogisticsResult } from './logistics.adapter';

/** 顺丰开放平台适配器实现 */
@Injectable()
export class SfAdapter implements LogisticsAdapter {
  readonly name = 'sf';
  private readonly logger = new Logger(SfAdapter.name);
  constructor(private readonly config: ConfigService) {}

  async query(company: string, trackNo: string): Promise<LogisticsResult> {
    const appId = this.config.get<string>('SF_APP_ID', '');
    const appKey = this.config.get<string>('SF_APP_KEY', '');
    if (!appId || !appKey) {
      this.logger.warn('顺丰配置缺失');
      return { company, trackNo, traces: [], isSigned: false };
    }
    try {
      // 简化：顺丰开放平台需签名调用路由查询接口
      this.logger.log(`顺丰查询 ${trackNo}（接口待对接）`);
      return { company, trackNo, traces: [], isSigned: false };
    } catch (e) {
      this.logger.warn(`顺丰查询失败: ${(e as Error).message}`);
      return { company, trackNo, traces: [], isSigned: false };
    }
  }
}