import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoryService } from '../services/category.service';
import { Public } from '../../../common/decorators/public.decorator';

/** 分类 Controller（对应 design.md 2.2.2 接口1） */
@ApiTags('商品-分类')
@Controller('product/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: '查询分类树（接口1）' })
  async getTree() {
    return this.categoryService.getTree();
  }
}