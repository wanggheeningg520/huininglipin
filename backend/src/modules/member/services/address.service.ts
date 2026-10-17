import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AddressEntity } from '../../../infrastructure/database/entities/member/address.entity';
import { OrderEntity } from '../../../infrastructure/database/entities/trade/order.entity';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { ErrorCode } from '../../../common/constants/error-code';
import { AddressDto } from '../dto/address.dto';
import { ConfigService } from '@nestjs/config';

/**
 * 收货地址服务（对应 design.md 2.2.2 接口21-24）
 * 地址上限 20 条，删除被未完成订单引用地址拒绝，同一会员最多一条默认
 */
@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(AddressEntity) private readonly addrRepo: Repository<AddressEntity>,
    @InjectRepository(OrderEntity) private readonly orderRepo: Repository<OrderEntity>,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  async list(userId: number) {
    return this.addrRepo.find({
      where: { userId },
      order: { isDefault: 'DESC', updatedAt: 'DESC' },
    });
  }

  async create(userId: number, dto: AddressDto): Promise<number> {
    const limit = parseInt(this.config.get<string>('ADDRESS_LIMIT', '20'), 10);
    const count = await this.addrRepo.count({ where: { userId } });
    if (count >= limit) {
      throw new BusinessException(ErrorCode.ADDRESS_LIMIT_EXCEED);
    }
    return this.dataSource.transaction(async (manager) => {
      if (dto.isDefault) {
        await manager.update(AddressEntity, { userId, isDefault: 1 }, { isDefault: 0 });
      }
      const addr = manager.create(AddressEntity, {
        userId,
        name: dto.name,
        phone: dto.phone,
        province: dto.province,
        city: dto.city,
        district: dto.district,
        detail: dto.detail,
        isDefault: dto.isDefault ? 1 : 0,
      });
      const saved = await manager.save(addr);
      return saved.id;
    });
  }

  async update(userId: number, id: number, dto: AddressDto): Promise<void> {
    const addr = await this.addrRepo.findOne({ where: { id, userId } });
    if (!addr) {
      throw new BusinessException(ErrorCode.NOT_FOUND, '地址不存在');
    }
    await this.dataSource.transaction(async (manager) => {
      if (dto.isDefault) {
        await manager.update(AddressEntity, { userId, isDefault: 1 }, { isDefault: 0 });
      }
      await manager.update(AddressEntity, id, {
        name: dto.name,
        phone: dto.phone,
        province: dto.province,
        city: dto.city,
        district: dto.district,
        detail: dto.detail,
        isDefault: dto.isDefault ? 1 : 0,
      });
    });
  }

  async remove(userId: number, id: number): Promise<void> {
    const addr = await this.addrRepo.findOne({ where: { id, userId } });
    if (!addr) {
      throw new BusinessException(ErrorCode.NOT_FOUND, '地址不存在');
    }
    // 校验是否被未完成订单引用
    const refCount = await this.orderRepo.count({
      where: { receiverAddressId: id, status: '待支付' },
    });
    if (refCount > 0) {
      throw new BusinessException(ErrorCode.ADDRESS_IN_USE);
    }
    await this.addrRepo.softDelete(id);
  }

  async setDefault(userId: number, id: number): Promise<void> {
    const addr = await this.addrRepo.findOne({ where: { id, userId } });
    if (!addr) {
      throw new BusinessException(ErrorCode.NOT_FOUND, '地址不存在');
    }
    await this.dataSource.transaction(async (manager) => {
      await manager.update(AddressEntity, { userId, isDefault: 1 }, { isDefault: 0 });
      await manager.update(AddressEntity, id, { isDefault: 1 });
    });
  }

  async getById(userId: number, id: number): Promise<AddressEntity | null> {
    return this.addrRepo.findOne({ where: { id, userId } });
  }
}