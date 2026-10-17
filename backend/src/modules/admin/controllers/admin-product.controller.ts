import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminJwtAuthGuard } from '../../../common/guards/admin-jwt.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentAdmin } from '../../../common/decorators/current-user.decorator';
import { CategoryService } from '../../product/services/category.service';
import { ProductService } from '../../product/services/product.service';
import { StockService } from '../../product/services/stock.service';
import { AdminProductQueryDto, AdjustStockDto, PresaleDto, BatchProductDto, StatusDto } from '../dto/admin-product.dto';

/**
 * 后台商品管理 Controller（对应 design.md 2.2.2 后台商品接口表）
 * 分类 CRUD + 商品 CRUD + 上下架 + 批量 + 库存调整 + 预售配置
 */
@ApiTags('后台-商品管理')
@UseGuards(AdminJwtAuthGuard, RolesGuard)
@Controller('admin/product')
export class AdminProductController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly productService: ProductService,
    private readonly stockService: StockService,
  ) {}

  // ===== 分类 CRUD =====
  @Get('categories')
  @Roles('product:read')
  @ApiOperation({ summary: '分类列表（含停用）' })
  async listCategories() {
    return this.categoryService.findAll();
  }

  @Post('categories')
  @Roles('product:write')
  @ApiOperation({ summary: '创建分类' })
  async createCategory(@Body() data: any) {
    return this.categoryService.create(data);
  }

  @Put('categories/:id')
  @Roles('product:write')
  @ApiOperation({ summary: '更新分类' })
  async updateCategory(@Param('id') id: number, @Body() data: any) {
    await this.categoryService.update(Number(id), data);
    return null;
  }

  @Delete('categories/:id')
  @Roles('product:write')
  @ApiOperation({ summary: '删除分类' })
  async removeCategory(@Param('id') id: number) {
    await this.categoryService.remove(Number(id));
    return null;
  }

  // ===== 商品 CRUD =====
  @Get('list')
  @Roles('product:read')
  @ApiOperation({ summary: '商品列表（含下架）' })
  async list(@Query() query: AdminProductQueryDto) {
    return this.productService.adminList(query);
  }

  @Post()
  @Roles('product:write')
  @ApiOperation({ summary: '创建商品' })
  async create(@Body() data: any) {
    return this.productService.create(data);
  }

  @Put(':id')
  @Roles('product:write')
  @ApiOperation({ summary: '更新商品' })
  async update(@Param('id') id: number, @Body() data: any) {
    await this.productService.update(Number(id), data);
    return null;
  }

  @Patch(':id/status')
  @Roles('product:write')
  @ApiOperation({ summary: '上架/下架' })
  async updateStatus(@Param('id') id: number, @Body() dto: StatusDto) {
    await this.productService.updateStatus(Number(id), dto.status);
    return null;
  }

  @Post('batch')
  @Roles('product:write')
  @ApiOperation({ summary: '批量上下架' })
  async batch(@Body() dto: BatchProductDto) {
    await this.productService.batchUpdateStatus(dto.ids, dto.status);
    return null;
  }

  // ===== 库存调整 =====
  @Patch('sku/:id/stock')
  @Roles('product:write')
  @ApiOperation({ summary: '库存调整（写 stock_log）' })
  async adjustStock(
    @Param('id') id: number,
    @Body() dto: AdjustStockDto,
    @CurrentAdmin('adminId') adminId: number,
  ) {
    await this.stockService.adjust(Number(id), dto.stock, adminId, dto.remark);
    return null;
  }

  // ===== 预售配置 =====
  @Patch(':id/presale')
  @Roles('product:write')
  @ApiOperation({ summary: '预售配置' })
  async updatePresale(@Param('id') id: number, @Body() dto: PresaleDto) {
    await this.productService.updatePresale(Number(id), dto.isPresale, dto.presaleDeliverDate);
    return null;
  }
}