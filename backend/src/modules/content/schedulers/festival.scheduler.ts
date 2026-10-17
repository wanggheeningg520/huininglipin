import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FestivalEntity } from '../../../infrastructure/database/entities/content/festival.entity';
import { FestivalService } from '../services/festival.service';

/**
 * 节日专区自动上下线定时任务（对应 design.md 2.1.3 节日自动上下线流程）
 * cron 每分钟扫描启用 festival，根据当前时间是否在销售窗口内自动上下线
 */
@Injectable()
export class FestivalScheduler {
  private readonly logger = new Logger(FestivalScheduler.name);
  constructor(
    @InjectRepository(FestivalEntity) private readonly festRepo: Repository<FestivalEntity>,
    private readonly festivalService: FestivalService,
  ) {}

  @Cron('* * * * *')
  async autoOnlineOffline(): Promise<void> {
    try {
      const festivals = await this.festRepo.find({ where: { status: 1 } });
      const now = new Date();
      for (const festival of festivals) {
        try {
          // 计算当年公历日期（农历换算）
          this.festivalService.getCurrentDate(festival, now.getFullYear());
          const inWindow =
            now.getTime() >= festival.saleStart.getTime() && now.getTime() <= festival.saleEnd.getTime();
          if (inWindow && festival.isOnline !== 1) {
            // 标记上线
            await this.festRepo.update(festival.id, { isOnline: 1 });
            this.logger.log(`节日「${festival.name}」已自动上线`);
          } else if (!inWindow && festival.isOnline === 1) {
            // 标记下线
            await this.festRepo.update(festival.id, { isOnline: 0 });
            this.logger.log(`节日「${festival.name}」已自动下线`);
          }
        } catch (e) {
          this.logger.warn(`节日「${festival.name}」换算失败: ${(e as Error).message}`);
        }
      }
      // 刷新在线缓存
      await this.festivalService.refreshCache();
    } catch (e) {
      this.logger.error(`节日自动上下线任务失败: ${(e as Error).message}`);
    }
  }
}