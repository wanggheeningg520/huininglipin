// =============================================================================
// 商品域 API
// 对应 design.md 2.2.2 接口 1-4
// =============================================================================

import { http } from '../request';
import type { CategoryNode, ProductCardVO, ProductDetailVO, PageResult } from '../types';
import { mockCategories, mockProductList, mockProductDetail } from '../mock/product';

// 1. 查询分类树 GET /product/categories
export function fetchCategories(): Promise<CategoryNode[]> {
  return http.get<CategoryNode[]>('/product/categories', undefined, {
    auth: false,
    mock: async () => mockCategories
  });
}

// 2. 商品列表查询 GET /product/list
export interface ProductListParams {
  categoryId?: number;
  priceMin?: number;
  priceMax?: number;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}

export function fetchProductList(params: ProductListParams): Promise<PageResult<ProductCardVO>> {
  return http.get<PageResult<ProductCardVO>>('/product/list', params as any, {
    auth: false,
    mock: async () => mockProductList(params)
  });
}

// 3. 商品详情查询 GET /product/{id}
export function fetchProductDetail(id: number): Promise<ProductDetailVO> {
  return http.get<ProductDetailVO>(`/product/${id}`, undefined, {
    auth: false,
    mock: async () => mockProductDetail(id)
  });
}

// 4. 库存查询 GET /product/{id}/stock?skuId=
export function fetchStock(id: number, skuId: number): Promise<{ skuId: number; stock: number; soldOut: boolean }> {
  return http.get(`/product/${id}/stock`, { skuId }, {
    auth: false,
    mock: async () => {
      const detail = mockProductDetail(id);
      const sku = detail.skus.find((s) => s.id === skuId);
      return { skuId, stock: sku?.stock ?? 0, soldOut: sku?.soldOut ?? true };
    }
  });
}