import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserEntity } from '../../infrastructure/database/entities/member/user.entity';
import { AddressEntity } from '../../infrastructure/database/entities/member/address.entity';
import { OrderEntity } from '../../infrastructure/database/entities/trade/order.entity';
import { AuthController } from './controllers/auth.controller';
import { UserController } from './controllers/user.controller';
import { AddressController } from './controllers/address.controller';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { AddressService } from './services/address.service';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * 会员域 Module（对应 design.md 2.1.2 member）
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, AddressEntity, OrderEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'dev-jwt-secret'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d') },
      }),
    }),
  ],
  controllers: [AuthController, UserController, AddressController],
  providers: [AuthService, UserService, AddressService, JwtStrategy],
  exports: [AuthService, UserService, AddressService, JwtModule, PassportModule],
})
export class MemberModule {}