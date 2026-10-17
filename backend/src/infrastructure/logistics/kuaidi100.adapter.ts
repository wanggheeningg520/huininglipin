import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { LogisticsAdapter, LogisticsResult } from './logistics.adapter';

/** 快递100 适配器实现 */
@Injectable()
export class Kuaidi100Adapter implements LogisticsAdapter {
  readonly name = 'kuaidi100';
  private readonly logger = new Logger(Kuaidi100Adapter.name);
  constructor(private readonly config: ConfigService) {}

  async query(company: string, trackNo: string): Promise<LogisticsResult> {
    const customer = this.config.get<string>('KUAIDI100_CUSTOMER', '');
    const key = this.config.get<string>('KUAIDI100_KEY', '');
    if (!customer || !key) {
      this.logger.warn('快递100 配置缺失');
      return { company, trackNo, traces: [], isSigned: false };
    }
    try {
      // 简化：实际快递100 需订阅查询接口
      const url = 'https://poll.kuaidi100.com/poll/query.do';
      const { data } = await axios.post(url, {
        customer,
        param: JSON.stringify({ com: company, num: trackNo, key }),
      }, { timeout: 8000 });
      const traces = (data.data || []).map((t: any) => ({ time: t.time, content: t.context }));
      return {
        company,
        trackNo,
        traces,
        isSigned: data.state === '3',
      };
    } catch (e) {
      this.logger.warn(`快递100 查询失败: ${(e as Error).message}`);
      return { company, trackNo, traces: [], isSigned: false };
    }
  }
}