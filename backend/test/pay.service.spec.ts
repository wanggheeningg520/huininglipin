import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PayService } from '../src/modules/trade/services/pay.service';
import { OrderEntity } from '../src/infrastructure/database/entities/trade/order.entity';
import { WechatPayService } from '../src/infrastructure/wechat/wechat-pay.service';
import { OrderService } from '../src/modules/trade/services/order.service';
import { REDIS_CLIENT } from '../src/infrastructure/redis/redis.constants';
import { RedisKeys, PAY_CALLBACK_TTL } from '../src/common/constants/redis-keys';
import { ErrorCode, OrderStatus, PayStatus } from '../src/common/constants/enums';

/**
 * 支付服务单元测试（对应 design.md 2.1.3 支付回调流程 + 2.2.2 接口12/13）
 * 覆盖：微信支付下单（订单状态校验/重复支付/调起统一下单）、
 *       回调（验签失败/幂等键 SETNX/非 SUCCESS 状态/确认支付/处理失败删键重试）
 */
describe('PayService', () => {
  let service: PayService;
  let orderRepo: jest.Mocked<Repository<OrderEntity>>;
  let wechatPay: jest.Mocked<WechatPayService>;
  let orderService: jest.Mocked<OrderService>;
  let redis: jest.Mocked<any>;
  let config: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    redis = { set: jest.fn(), get: jest.fn(), del: jest.fn() };
    config = { get: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayService,
        { provide: getRepositoryToken(OrderEntity), useValue: mockRepo() },
        { provide: WechatPayService, useValue: { createOrder: jest.fn(), verifyAndDecryptCallback: jest.fn(), refund: jest.fn(), queryOrder: jest.fn() } },
        { provide: OrderService, useValue: { confirmPaid: jest.fn(), getByOrderNo: jest.fn() } },
        { provide: REDIS_CLIENT, useValue: redis },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get<PayService>(PayService);
    orderRepo = module.get(getRepositoryToken(OrderEntity)) as jest.Mocked<Repository<OrderEntity>>;
    wechatPay = module.get(WechatPayService) as jest.Mocked<WechatPayService>;
    orderService = module.get(OrderService) as jest.Mocked<OrderService>;
  });

  function mockRepo() {
    return {
      find: jest.fn(), findOne: jest.fn(), findAndCount: jest.fn(), count: jest.fn(),
      create: jest.fn((e: any) => e), save: jest.fn(async (e: any) => e),
      update: jest.fn(async () => undefined), delete: jest.fn(async () => undefined),
    };
  }

  describe('createPay - 微信支付下单', () => {
    it('订单不存在时抛 ORDER_NOT_FOUND', async () => {
      orderRepo.findOne.mockResolvedValue(null);
      await expect(service.createPay(100, 'O999')).rejects.toMatchObject({
        bizCode: ErrorCode.ORDER_NOT_FOUND,
      });
    });

    it('订单已支付（PENDING_SHIP）时抛 ORDER_PAID_REPEAT', async () => {
      orderRepo.findOne.mockResolvedValue({
        orderNo: 'O1', status: OrderStatus.PENDING_SHIP, payStatus: PayStatus.PAID, payAmount: 100,
      } as any);
      await expect(service.createPay(100, 'O1')).rejects.toMatchObject({
        bizCode: ErrorCode.ORDER_PAID_REPEAT,
      });
    });

    it('订单状态非法（如已取消）时抛 ORDER_STATUS_INVALID', async () => {
      orderRepo.findOne.mockResolvedValue({
        orderNo: 'O1', status: OrderStatus.CANCELLED, payStatus: PayStatus.PENDING, payAmount: 100,
      } as any);
      await expect(service.createPay(100, 'O1')).rejects.toMatchObject({
        bizCode: ErrorCode.ORDER_STATUS_INVALID,
      });
    });

    it('待支付订单调起微信统一下单返回支付参数', async () => {
      orderRepo.findOne.mockResolvedValue({
        orderNo: 'O1', status: OrderStatus.PENDING_PAY, payAmount: 100, user: { openid: 'wx_openid' },
      } as any);
      const payParams = { timeStamp: '1700000000', nonceStr: 'abc', package: 'prepay_id=P1', signType: 'RSA', paySign: 'sig', prepayId: 'P1' };
      wechatPay.createOrder.mockResolvedValue(payParams as any);

      const result = await service.createPay(100, 'O1');

      expect(wechatPay.createOrder).toHaveBeenCalledWith(expect.objectContaining({
        orderNo: 'O1',
        amount: 100,
        openid: 'wx_openid',
      }));
      expect(result).toEqual(payParams);
    });
  });

  describe('handleCallback - 微信支付回调', () => {
    const headers = { 'wechatpay-timestamp': '1700000000', 'wechatpay-nonce': 'n', 'wechatpay-signature': 'sig', 'wechatpay-serial': 's' };
    const rawBody = JSON.stringify({ resource: { ciphertext: 'c', associated_data: 'a', nonce: 'nn' } });

    it('验签失败时返回 FAIL', async () => {
      wechatPay.verifyAndDecryptCallback.mockRejectedValue(new Error('签名错误'));
      const result = await service.handleCallback(headers, rawBody);
      expect(result).toEqual({ code: 'FAIL', message: '验签失败' });
    });

    it('重复回调（SETNX 失败）幂等返回 SUCCESS', async () => {
      wechatPay.verifyAndDecryptCallback.mockResolvedValue({
        outTradeNo: 'O1', transactionId: 'T1', tradeState: 'SUCCESS', successTime: '2026-09-01T00:00:00Z', amountTotal: 10000,
      });
      redis.set.mockResolvedValue(null); // SETNX 失败=已存在

      const result = await service.handleCallback(headers, rawBody);

      expect(result).toEqual({ code: 'SUCCESS', message: 'OK' });
      expect(orderService.confirmPaid).not.toHaveBeenCalled();
    });

    it('首次回调 SETNX 成功，tradeState=SUCCESS 时确认支付', async () => {
      wechatPay.verifyAndDecryptCallback.mockResolvedValue({
        outTradeNo: 'O1', transactionId: 'T1', tradeState: 'SUCCESS', successTime: '2026-09-01T00:00:00Z', amountTotal: 10000,
      });
      redis.set.mockResolvedValue('OK'); // SETNX 成功
      orderService.confirmPaid.mockResolvedValue({} as any);

      await service.handleCallback(headers, rawBody);

      // 确认支付被调用，传入订单号/微信交易号/支付时间
      expect(orderService.confirmPaid).toHaveBeenCalledWith(
        'O1',
        'T1',
        expect.any(Date),
      );
    });

    it('首次回调 SETNX 成功，tradeState 非 SUCCESS 时仅返回 SUCCESS 不确认', async () => {
      wechatPay.verifyAndDecryptCallback.mockResolvedValue({
        outTradeNo: 'O1', transactionId: 'T1', tradeState: 'NOTPAY', successTime: '', amountTotal: 10000,
      });
      redis.set.mockResolvedValue('OK');

      const result = await service.handleCallback(headers, rawBody);

      expect(result).toEqual({ code: 'SUCCESS', message: 'OK' });
      expect(orderService.confirmPaid).not.toHaveBeenCalled();
    });

    it('确认支付失败时删除幂等键允许重试并返回 FAIL', async () => {
      wechatPay.verifyAndDecryptCallback.mockResolvedValue({
        outTradeNo: 'O1', transactionId: 'T1', tradeState: 'SUCCESS', successTime: '2026-09-01T00:00:00Z', amountTotal: 10000,
      });
      redis.set.mockResolvedValue('OK');
      orderService.confirmPaid.mockRejectedValue(new Error('库存不足'));

      const result = await service.handleCallback(headers, rawBody);

      expect(result).toEqual({ code: 'FAIL', message: '处理失败' });
      expect(redis.del).toHaveBeenCalled();
    });

    it('幂等键使用 pay:callback:{tradeNo} 且 TTL=PAY_CALLBACK_TTL', async () => {
      wechatPay.verifyAndDecryptCallback.mockResolvedValue({
        outTradeNo: 'O1', transactionId: 'T_UNIQUE', tradeState: 'SUCCESS', successTime: '2026-09-01T00:00:00Z', amountTotal: 10000,
      });
      redis.set.mockResolvedValue('OK');
      orderService.confirmPaid.mockResolvedValue({} as any);

      await service.handleCallback(headers, rawBody);

      expect(redis.set).toHaveBeenCalledWith(
        RedisKeys.payCallback('T_UNIQUE'),
        '1',
        'EX',
        PAY_CALLBACK_TTL,
        'NX',
      );
    });
  });
});