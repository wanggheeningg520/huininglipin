import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../../infrastructure/database/entities/member/user.entity';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { ErrorCode } from '../../../common/constants/error-code';

/** 用户信息服务（对应 design.md 2.2.2 接口20） */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
  ) {}

  async getProfile(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new BusinessException(ErrorCode.MEMBER_NOT_FOUND);
    }
    return {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      phone: user.phone,
      level: user.level,
      points: user.points,
    };
  }

  async updateProfile(userId: number, data: Partial<Pick<UserEntity, 'nickname' | 'avatar'>>) {
    await this.userRepo.update(userId, data);
    return this.getProfile(userId);
  }
}