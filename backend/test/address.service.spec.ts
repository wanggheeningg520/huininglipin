import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AddressService } from '../src/modules/member/services/address.service';
import { AddressEntity } from '../src/infrastructure/database/entities/member/address.entity';
import { OrderEntity } from '../src/infrastructure/database/entities/trade/order.entity';
import { AddressDto } from '../src/modules/member/dto/address.dto';
import { ErrorCode } from '../src/common/constants/error-code';

/**
 * 收货地址服务单元测试（对应 design.md 2.2.2 接口21-24）
 * 覆盖：列表（默认地址排序优先）、创建（上限校验/默认地址互斥切换）、
 *       更新、删除（被未完成订单引用拒绝）、设置默认、查询
 */
describe('AddressService', () => {
  let service: AddressService;
  let addrRepo: jest.Mocked<Repository<AddressEntity>>;
  let orderRepo: jest.Mocked<Repository<OrderEntity>>;
  let dataSource: jest.Mocked<DataSource>;
  let config: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    config = { get: jest.fn() } as any;
    dataSource = { transaction: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressService,
        { provide: getRepositoryToken(AddressEntity), useValue: mockRepo() },
        { provide: getRepositoryToken(OrderEntity), useValue: mockRepo() },
        { provide: DataSource, useValue: dataSource },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get<AddressService>(AddressService);
    addrRepo = module.get(getRepositoryToken(AddressEntity)) as jest.Mocked<Repository<AddressEntity>>;
    orderRepo = module.get(getRepositoryToken(OrderEntity)) as jest.Mocked<Repository<OrderEntity>>;
  });

  function mockRepo() {
    return {
      find: jest.fn(), findOne: jest.fn(), findAndCount: jest.fn(), count: jest.fn(),
      create: jest.fn((e: any) => e), save: jest.fn(async (e: any) => e),
      update: jest.fn(async () => undefined), delete: jest.fn(async () => undefined),
      softDelete: jest.fn(async () => undefined),
    };
  }

  function buildDto(over: Partial<AddressDto> = {}): AddressDto {
    return {
      name: '张三', phone: '13800000000', province: '广东省', city: '深圳市',
      district: '南山区', detail: '科技园 1 号', isDefault: false,
      ...over,
    } as AddressDto;
  }

  function buildAddress(over: Partial<AddressEntity> = {}): AddressEntity {
    return {
      id: 1, userId: 100, name: '张三', phone: '13800000000',
      province: '广东省', city: '深圳市', district: '南山区', detail: '科技园 1 号',
      isDefault: 1,
      ...over,
    } as AddressEntity;
  }

  /** mock 一个事务 manager */
  function mockTransaction() {
    const manager: any = {
      create: jest.fn((_: any, e: any) => e),
      save: jest.fn(async (e: any) => e),
      update: jest.fn(async () => undefined),
    };
    (dataSource.transaction as jest.Mock).mockImplementation(async (cb: any) => cb(manager));
    return manager;
  }

  describe('list - 地址列表', () => {
    it('按 isDefault DESC + updatedAt DESC 排序返回', async () => {
      addrRepo.find.mockResolvedValue([buildAddress()]);
      await service.list(100);
      expect(addrRepo.find).toHaveBeenCalledWith({
        where: { userId: 100 },
        order: { isDefault: 'DESC', updatedAt: 'DESC' },
      });
    });
  });

  describe('create - 创建地址', () => {
    it('地址数量达上限（默认 20）时抛 ADDRESS_LIMIT_EXCEED', async () => {
      config.get.mockReturnValue('20');
      addrRepo.count.mockResolvedValue(20);

      await expect(service.create(100, buildDto())).rejects.toMatchObject({
        bizCode: ErrorCode.ADDRESS_LIMIT_EXCEED,
      });
    });

    it('自定义上限（如 5）生效', async () => {
      config.get.mockReturnValue('5');
      addrRepo.count.mockResolvedValue(5);
      await expect(service.create(100, buildDto())).rejects.toMatchObject({
        bizCode: ErrorCode.ADDRESS_LIMIT_EXCEED,
      });
    });

    it('isDefault=true 时先将其他默认地址置 0（互斥）', async () => {
      config.get.mockReturnValue('20');
      addrRepo.count.mockResolvedValue(3);
      const manager = mockTransaction();
      manager.save.mockResolvedValue({ id: 10 } as any);

      await service.create(100, buildDto({ isDefault: true }));

      expect(manager.update).toHaveBeenCalledWith(AddressEntity, { userId: 100, isDefault: 1 }, { isDefault: 0 });
    });

    it('isDefault=false 时不切换其他默认地址', async () => {
      config.get.mockReturnValue('20');
      addrRepo.count.mockResolvedValue(3);
      const manager = mockTransaction();
      manager.save.mockResolvedValue({ id: 10 } as any);

      await service.create(100, buildDto({ isDefault: false }));

      // 第一次 update 是切换默认，此处不应被调用
      expect(manager.update).not.toHaveBeenCalledWith(AddressEntity, { userId: 100, isDefault: 1 }, { isDefault: 0 });
    });

    it('正常创建返回新地址 id', async () => {
      config.get.mockReturnValue('20');
      addrRepo.count.mockResolvedValue(3);
      const manager = mockTransaction();
      manager.save.mockResolvedValue({ id: 42 } as any);

      const id = await service.create(100, buildDto());
      expect(id).toBe(42);
    });
  });

  describe('update - 更新地址', () => {
    it('地址不存在时抛 NOT_FOUND', async () => {
      addrRepo.findOne.mockResolvedValue(null);
      await expect(service.update(100, 999, buildDto())).rejects.toMatchObject({
        bizCode: ErrorCode.NOT_FOUND,
      });
    });

    it('isDefault=true 时切换默认地址互斥', async () => {
      addrRepo.findOne.mockResolvedValue(buildAddress());
      const manager = mockTransaction();

      await service.update(100, 1, buildDto({ isDefault: true }));

      expect(manager.update).toHaveBeenCalledWith(AddressEntity, { userId: 100, isDefault: 1 }, { isDefault: 0 });
      expect(manager.update).toHaveBeenCalledWith(AddressEntity, 1, expect.objectContaining({ isDefault: 1 }));
    });
  });

  describe('remove - 删除地址', () => {
    it('地址不存在时抛 NOT_FOUND', async () => {
      addrRepo.findOne.mockResolvedValue(null);
      await expect(service.remove(100, 999)).rejects.toMatchObject({
        bizCode: ErrorCode.NOT_FOUND,
      });
    });

    it('被未完成订单引用时抛 ADDRESS_IN_USE', async () => {
      addrRepo.findOne.mockResolvedValue(buildAddress());
      orderRepo.count.mockResolvedValue(1); // 有引用

      await expect(service.remove(100, 1)).rejects.toMatchObject({
        bizCode: ErrorCode.ADDRESS_IN_USE,
      });
    });

    it('无引用时软删除成功', async () => {
      addrRepo.findOne.mockResolvedValue(buildAddress());
      orderRepo.count.mockResolvedValue(0);

      await service.remove(100, 1);

      expect(addrRepo.softDelete).toHaveBeenCalledWith(1);
    });

    it('引用查询条件为 receiverAddressId + status=待支付', async () => {
      addrRepo.findOne.mockResolvedValue(buildAddress());
      orderRepo.count.mockResolvedValue(0);

      await service.remove(100, 1);

      expect(orderRepo.count).toHaveBeenCalledWith({
        where: { receiverAddressId: 1, status: '待支付' },
      });
    });
  });

  describe('setDefault - 设置默认地址', () => {
    it('地址不存在时抛 NOT_FOUND', async () => {
      addrRepo.findOne.mockResolvedValue(null);
      await expect(service.setDefault(100, 999)).rejects.toMatchObject({
        bizCode: ErrorCode.NOT_FOUND,
      });
    });

    it('事务内先清其他默认再置当前为默认', async () => {
      addrRepo.findOne.mockResolvedValue(buildAddress({ isDefault: 0 }));
      const manager = mockTransaction();

      await service.setDefault(100, 1);

      expect(manager.update).toHaveBeenCalledWith(AddressEntity, { userId: 100, isDefault: 1 }, { isDefault: 0 });
      expect(manager.update).toHaveBeenCalledWith(AddressEntity, 1, { isDefault: 1 });
    });
  });

  describe('getById - 查询单条', () => {
    it('返回指定用户的地址', async () => {
      addrRepo.findOne.mockResolvedValue(buildAddress());
      const result = await service.getById(100, 1);
      expect(addrRepo.findOne).toHaveBeenCalledWith({ where: { id: 1, userId: 100 } });
      expect(result?.id).toBe(1);
    });

    it('不属于该用户时返回 null', async () => {
      addrRepo.findOne.mockResolvedValue(null);
      const result = await service.getById(100, 999);
      expect(result).toBeNull();
    });
  });
});