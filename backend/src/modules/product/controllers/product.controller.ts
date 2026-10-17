import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductService } from '../services/product.service';
import { StockService } from '../services/stock.service';
import { QueryProductDto } from '../dto/query-product.dto';
import { Public } from '../../../common/decorators/public.decorator';

/** 商品 Controller（对应 design.md 2.2.2 接口2/3/4） */
@ApiTags('商品-商品')
@Controller('product')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly stockService: StockService,
  ) {}

  @Get('list')
  @Public()
  @ApiOperation({ summary: '商品列表查询（接口2）' })
  async list(@Query() query: QueryProductDto) {
    return this.productService.list(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: '商品详情查询（接口3）' })
  async detail(@Param('id') id: number) {
    return this.productService.detail(Number(id));
  }

  @Get(':id/stock')
  @Public()
  @ApiOperation({ summary: '库存查询（接口4）' })
  async stock(@Param('id') id: number, @Query('skuId') skuId: number) {
    return this.stockService.getStock(Number(skuId));
  }
}