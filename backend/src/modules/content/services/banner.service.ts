import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BannerEntity } from '../../../infrastructure/database/entities/content/banner.entity';
import { REDIS_CLIENT } from '../../../infrastructure/redis/redis.constants';
import { RedisKeys } from '../../../common/constants/redis-keys';
import { BannerDto } from '../dto/banner.dto';

/**
 * Banner 服务（对应 design.md 2.2.2 后台 Banner 接口）
 * 按位置查询有效 Banner（时间窗内 + 启用）
 */
@Injectable()
export class BannerService {
  private readonly logger = new Logger(BannerService.name);
  constructor(
    @InjectRepository(BannerEntity) private readonly bannerRepo: Repository<BannerEntity>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /** C 端：按位置查询有效 Banner（时间窗内 + 启用） */
  async findValidByPosition(position: string): Promise<BannerEntity[]> {
    const cacheKey = RedisKeys.bannerPosition(position);
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      this.logger.warn(`Redis 读取 Banner 缓存失败: ${(e as Error).message}`);
    }
    const now = new Date();
    const banners = await this.bannerRepo
      .createQueryBuilder('b')
      .where('b.position = :position', { position })
      .andWhere('b.status = 1')
      .andWhere('b.start_time <= :now', { now })
      .andWhere('b.end_time >= :now', { now })
      .orderBy('b.sort', 'ASC')
      .getMany();
    try {
      await this.redis.set(cacheKey, JSON.stringify(banners), 'EX', 300);
    } catch (e) {
      this.logger.warn(`Redis 写入 Banner 缓存失败: ${(e as Error).message}`);
    }
    return banners;
  }

  /** 后台：查询全部 Banner */
  async findAll(position?: string): Promise<BannerEntity[]> {
    const where: any = {};
    if (position) where.position = position;
    return this.bannerRepo.find({ where, order: { sort: 'ASC' } });
  }

  /** 后台：创建 Banner */
  async create(data: BannerDto): Promise<BannerEntity> {
    const entity = this.bannerRepo.create({
      position: data.position,
      title: data.title ?? null,
      image: data.image,
      linkType: data.linkType ?? '无',
      linkValue: data.linkValue ?? null,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      sort: data.sort ?? 0,
      status: data.status ?? 1,
    });
    const saved = await this.bannerRepo.save(entity);
    await this.refreshCache(data.position);
    return saved;
  }

  /** 后台：更新 Banner */
  async update(id: number, data: BannerDto): Promise<void> {
    const old = await this.bannerRepo.findOne({ where: { id } });
    await this.bannerRepo.update(id, {
      position: data.position,
      title: data.title ?? null,
      image: data.image,
      linkType: data.linkType ?? '无',
      linkValue: data.linkValue ?? null,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      sort: data.sort ?? 0,
      status: data.status ?? 1,
    });
    await this.refreshCache(data.position);
    if (old && old.position !== data.position) await this.refreshCache(old.position);
  }

  /** 后台：删除 Banner */
  async remove(id: number): Promise<void> {
    const old = await this.bannerRepo.findOne({ where: { id } });
    await this.bannerRepo.softDelete(id);
    if (old) await this.refreshCache(old.position);
  }

  /** 刷新指定位置 Banner 缓存 */
  private async refreshCache(position: string): Promise<void> {
    try {
      const now = new Date();
      const banners = await this.bannerRepo
        .createQueryBuilder('b')
        .where('b.position = :position', { position })
        .andWhere('b.status = 1')
        .andWhere('b.start_time <= :now', { now })
        .andWhere('b.end_time >= :now', { now })
        .orderBy('b.sort', 'ASC')
        .getMany();
      await this.redis.set(RedisKeys.bannerPosition(position), JSON.stringify(banners), 'EX', 300);
    } catch (e) {
      this.logger.warn(`刷新 Banner 缓存失败: ${(e as Error).message}`);
    }
  }
}