import { Module } from '@nestjs/common';
import { DistribController } from './controllers/distrib.controller';
import { DistribService } from './services/distrib.service';

/**
 * 分销域空壳 Module（对应 design.md 2.1.2 distrib 空壳）
 * 一期接口位存在，Service 抛 90001，无 Entity（三期新增）
 */
@Module({
  controllers: [DistribController],
  providers: [DistribService],
  exports: [DistribService],
})
export class DistribModule {}