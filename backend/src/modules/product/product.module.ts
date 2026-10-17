import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity } from '../../infrastructure/database/entities/product/category.entity';
import { ProductEntity } from '../../infrastructure/database/entities/product/product.entity';
import { SkuEntity } from '../../infrastructure/database/entities/product/sku.entity';
import { StockLogEntity } from '../../infrastructure/database/entities/product/stock-log.entity';
import { CategoryController } from './controllers/category.controller';
import { ProductController } from './controllers/product.controller';
import { CategoryService } from './services/category.service';
import { ProductService } from './services/product.service';
import { StockService } from './services/stock.service';

/** 商品域 Module（对应 design.md 2.1.2 product） */
@Module({
  imports: [TypeOrmModule.forFeature([CategoryEntity, ProductEntity, SkuEntity, StockLogEntity])],
  controllers: [CategoryController, ProductController],
  providers: [CategoryService, ProductService, StockService],
  exports: [CategoryService, ProductService, StockService],
})
export class ProductModule {}