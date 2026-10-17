import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
// 系统域 Entity
import { AdminUserEntity } from '../../infrastructure/database/entities/system/admin-user.entity';
import { RoleEntity } from '../../infrastructure/database/entities/system/role.entity';
import { MenuEntity } from '../../infrastructure/database/entities/system/menu.entity';
import { RoleMenuEntity } from '../../infrastructure/database/entities/system/role-menu.entity';
import { AdminRoleEntity } from '../../infrastructure/database/entities/system/admin-role.entity';
import { AuditLogEntity } from '../../infrastructure/database/entities/system/audit-log.entity';
import { SysConfigEntity } from '../../infrastructure/database/entities/system/sys-config.entity';
// 会员/交易 Entity（后台会员管理需要）
import { UserEntity } from '../../infrastructure/database/entities/member/user.entity';
import { OrderEntity } from '../../infrastructure/database/entities/trade/order.entity';
// 依赖业务模块
import { ProductModule } from '../product/product.module';
import { TradeModule } from '../trade/trade.module';
import { ContentModule } from '../content/content.module';
import { OssModule } from '../../infrastructure/oss/oss.module';
// Controllers
import { AdminAuthController } from './controllers/admin-auth.controller';
import { AdminProductController } from './controllers/admin-product.controller';
import { AdminOrderController } from './controllers/admin-order.controller';
import { AdminRefundController } from './controllers/admin-refund.controller';
import { AdminContentController } from './controllers/admin-content.controller';
import { AdminMemberController } from './controllers/admin-member.controller';
import { AdminSystemController } from './controllers/admin-system.controller';
import { AdminOssController } from './controllers/admin-oss.controller';
// Services
import { AdminAuthService } from './services/admin-auth.service';
import { AdminMemberService } from './services/admin-member.service';
import { AdminSystemService } from './services/admin-system.service';
// Strategy
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';

/**
 * 后台管理 Module（对应 design.md 2.2.2 后台管理 API）
 * 聚合鉴权/商品/订单/退款/内容/会员/系统/OSS 全部后台接口
 * 均经 AdminJwtAuthGuard + RolesGuard（RBAC）
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminUserEntity,
      RoleEntity,
      MenuEntity,
      RoleMenuEntity,
      AdminRoleEntity,
      AuditLogEntity,
      SysConfigEntity,
      UserEntity,
      OrderEntity,
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('ADMIN_JWT_SECRET', 'dev-admin-jwt-secret'),
        signOptions: { expiresIn: '2h' },
      }),
    }),
    ProductModule,
    TradeModule,
    ContentModule,
    OssModule,
  ],
  controllers: [
    AdminAuthController,
    AdminProductController,
    AdminOrderController,
    AdminRefundController,
    AdminContentController,
    AdminMemberController,
    AdminSystemController,
    AdminOssController,
  ],
  providers: [AdminAuthService, AdminMemberService, AdminSystemService, AdminJwtStrategy],
  exports: [AdminAuthService, AdminSystemService],
})
export class AdminModule {}