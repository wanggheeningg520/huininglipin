import { Global, Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

/**
 * TypeORM + MySQL 数据库连接模块（对应 design.md 2.1.2 公共设施 + 2.6.2）
 * 连接池 max:20，synchronize:false，软删除由 Entity @DeleteDateColumn 支持
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => ({
        type: 'mysql',
        host: config.get<string>('database.host', 'localhost'),
        port: config.get<number>('database.port', 3306),
        username: config.get<string>('database.username', 'hn_app'),
        password: config.get<string>('database.password', 'app123'),
        database: config.get<string>('database.database', 'huining_mall'),
        charset: 'utf8mb4',
        timezone: '+08:00',
        entities: [join(__dirname, 'entities', '**', '*.{ts,js}')],
        synchronize: false,
        logging: config.get<string>('database.logging') === 'true',
        extra: {
          connectionLimit: config.get<number>('database.poolSize', 20),
        },
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {
  constructor() {
    Logger.log('DatabaseModule 已加载', 'DatabaseModule');
  }
}