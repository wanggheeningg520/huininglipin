import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

/**
 * TypeORM + MySQL 数据库连接配置（对应 design.md 2.1.2 公共设施 + 2.6.2）
 * 连接池 max:20，synchronize:false，软删除由 Entity @DeleteDateColumn 支持
 */
export default registerAs('database', (): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'hn_app',
  password: process.env.DB_PASSWORD || 'app123',
  database: process.env.DB_DATABASE || 'huining_mall',
  charset: 'utf8mb4',
  timezone: '+08:00',
  entities: [join(__dirname, '..', 'infrastructure', 'database', 'entities', '**', '*.entity{.ts,.js}')],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  extra: {
    connectionLimit: parseInt(process.env.DB_POOL_MAX || '20', 10),
  },
  poolSize: parseInt(process.env.DB_POOL_MAX || '20', 10),
}));