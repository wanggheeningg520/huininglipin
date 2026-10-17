import { Module } from '@nestjs/common';
import { CardController } from './controllers/card.controller';
import { CardService } from './services/card.service';

/**
 * 卡券域空壳 Module（对应 design.md 2.1.2 card 空壳）
 * 一期接口位存在，Service 抛 90001，无 Entity（二期新增）
 */
@Module({
  controllers: [CardController],
  providers: [CardService],
  exports: [CardService],
})
export class CardModule {}