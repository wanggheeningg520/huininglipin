import { Global, Injectable, Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Kuaidi100Adapter } from './kuaidi100.adapter';
import { SfAdapter } from './sf.adapter';
import { LogisticsAdapter, LogisticsResult } from './logistics.adapter';

/**
 * 物流服务：按物流公司路由到不同适配器（对应 design.md 2.1.2 logistics）
 */
@Injectable()
export class LogisticsService {
  private readonly logger = new Logger(LogisticsService.name);
  constructor(
    private readonly kuaidi100: Kuaidi100Adapter,
    private readonly sf: SfAdapter,
    private readonly config: ConfigService,
  ) {}

  async query(company: string, trackNo: string): Promise<LogisticsResult> {
    // 顺丰走 SF 适配器，其他走快递100
    if (company.includes('顺丰')) {
      return this.sf.query(company, trackNo);
    }
    return this.kuaidi100.query(company, trackNo);
  }
}

@Global()
@Module({
  imports: [ConfigModule],
  providers: [Kuaidi100Adapter, SfAdapter, LogisticsService],
  exports: [LogisticsService],
})
export class LogisticsModule {}