import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { UserEntity } from '../../../infrastructure/database/entities/member/user.entity';
import { OrderEntity } from '../../../infrastructure/database/entities/trade/order.entity';
import { MaskUtil } from '../../../common/utils/mask.util';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { ErrorCode } from '../../../common/constants/error-code';

/**
 * 后台会员管理服务（对应 design.md 2.2.2 后台会员接口）
 * 会员列表（手机号脱敏）+ 会员详情（含 level/points）
 * 一期积分变动接口返回「一期未开放」
 */
@Injectable()
export class AdminMemberService {
  private readonly logger = new Logger(AdminMemberService.name);
  constructor(
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(OrderEntity) private readonly orderRepo: Repository<OrderEntity>,
  ) {}

  /** 会员列表（手机号脱敏展示） */
  async list(query: { page?: number; pageSize?: number; keyword?: string }): Promise<any> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: any = {};
    if (query.keyword) {
      where.phone = Like(`%${query.keyword}%`);
    }
    const [users, total] = await this.userRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return {
      list: users.map((u) => ({
        id: u.id,
        nickname: u.nickname,
        avatar: u.avatar,
        phone: MaskUtil.maskPhone(u.phone),
        level: u.level,
        points: u.points,
        status: u.status,
        createdAt: u.createdAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  /** 会员详情 */
  async detail(id: number): Promise<any> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new BusinessException(ErrorCode.MEMBER_NOT_FOUND);
    }
    const orderCount = await this.orderRepo.count({ where: { userId: id } });
    return {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      phone: MaskUtil.maskPhone(user.phone),
      level: user.level,
      points: user.points,
      status: user.status,
      orderCount,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}