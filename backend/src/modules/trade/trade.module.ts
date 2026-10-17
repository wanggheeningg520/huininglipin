import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartEntity } from '../../infrastructure/database/entities/trade/cart.entity';
import { OrderEntity } from '../../infrastructure/database/entities/trade/order.entity';
import { OrderItemEntity } from '../../infrastructure/database/entities/trade/order-item.entity';
import { RefundEntity } from '../../infrastructure/database/entities/trade/refund.entity';
import { SkuEntity } from '../../infrastructure/database/entities/product/sku.entity';
import { ProductEntity } from '../../infrastructure/database/entities/product/product.entity';
import { AddressEntity } from '../../infrastructure/database/entities/member/address.entity';
import { StockLogEntity } from '../../infrastructure/database/entities/product/stock-log.entity';
import { ProductModule } from '../product/product.module';
import { MemberModule } from '../member/member.module';
import { CartController } from './controllers/cart.controller';
import { OrderController } from './controllers/order.controller';
import { PayController } from './controllers/pay.controller';
import { RefundController } from './controllers/refund.controller';
import { LogisticsController } from './controllers/logistics.controller';
import { CartService } from './services/cart.service';
import { OrderService } from './services/order.service';
import { PayService } from './services/pay.service';
import { RefundService } from './services/refund.service';
import { LogisticsService2 } from './services/logistics.service';
import { OrderTimeoutService } from './services/order-timeout.service';
import { OrderTimeoutScheduler } from './schedulers/order-timeout.scheduler';
import { OrderNoGenerator } from '../../common/utils/order-no.generator';

/** 交易域 Module（对应 design.md 2.1.2 trade） */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      CartEntity,
      OrderEntity,
      OrderItemEntity,
      RefundEntity,
      SkuEntity,
      ProductEntity,
      AddressEntity,
      StockLogEntity,
    ]),
    ProductModule,
    MemberModule,
  ],
  controllers: [
    CartController,
    OrderController,
    PayController,
    RefundController,
    LogisticsController,
  ],
  providers: [
    CartService,
    OrderService,
    PayService,
    RefundService,
    LogisticsService2,
    OrderTimeoutService,
    OrderTimeoutScheduler,
    OrderNoGenerator,
  ],
  exports: [OrderService, RefundService, CartService],
})
export class TradeModule {}