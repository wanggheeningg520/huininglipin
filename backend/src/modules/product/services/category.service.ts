import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../../../infrastructure/database/entities/product/category.entity';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { ErrorCode } from '../../../common/constants/error-code';

/**
 * 分类服务（对应 design.md 2.2.2 接口1）
 * 查询分类树返回 4 个一级 + 二级子分类
 * C 端展示名 accompany → 雅趣伴手礼（已在 init.sql 中直接存储展示名）
 */
@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);
  constructor(
    @InjectRepository(CategoryEntity) private readonly catRepo: Repository<CategoryEntity>,
  ) {}

  /** 查询分类树（C 端，仅启用） */
  async getTree(): Promise<any[]> {
    const all = await this.catRepo.find({
      where: { status: 1 },
      order: { sort: 'ASC' },
    });
    const roots = all.filter((c) => !c.parentId);
    return roots.map((r) => ({
      id: r.id,
      name: r.name,
      icon: r.icon,
      sort: r.sort,
      children: all
        .filter((c) => c.parentId === r.id)
        .map((c) => ({ id: c.id, name: c.name, icon: c.icon, sort: c.sort, children: [] })),
    }));
  }

  /** 后台：查询全部分类（含停用） */
  async findAll(): Promise<CategoryEntity[]> {
    return this.catRepo.find({ order: { sort: 'ASC' } });
  }

  async create(data: Partial<CategoryEntity>): Promise<CategoryEntity> {
    return this.catRepo.save(this.catRepo.create(data));
  }

  async update(id: number, data: Partial<CategoryEntity>): Promise<void> {
    await this.catRepo.update(id, data);
  }

  async remove(id: number): Promise<void> {
    await this.catRepo.softDelete(id);
  }
}