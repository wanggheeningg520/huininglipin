// ============================================================
// 商品管理 API
// ============================================================
import { http } from '@/api/request'
import type { PageResult } from '@/types'
import type { MockCategory, MockProduct, MockStockLog, MockSku } from '@/api/mock/product'

export type Category = MockCategory
export type Product = MockProduct
export type Sku = MockSku
export type StockLog = MockStockLog

// ---------- 分类 ----------
export function getCategoryTree(): Promise<Category[]> {
  return http.get<Category[]>('product/categories')
}
export function createCategory(data: Partial<Category>): Promise<Category> {
  return http.post<Category>('product/categories', data)
}
export function updateCategory(id: number, data: Partial<Category>): Promise<Category> {
  return http.put<Category>(`product/categories/${id}`, data)
}
export function deleteCategory(id: number): Promise<null> {
  return http.del<null>(`product/categories/${id}`)
}

// ---------- 商品 ----------
export interface ProductQuery {
  categoryId?: number
  status?: string
  keyword?: string
  isPresale?: string
  page?: number
  pageSize?: number
}
export function getProductList(params: ProductQuery): Promise<PageResult<Product>> {
  return http.get<PageResult<Product>>('product/list', params as Record<string, unknown>)
}
export function getProductDetail(id: number): Promise<Product> {
  return http.get<Product>(`product/${id}`)
}
export function createProduct(data: Partial<Product>): Promise<Product> {
  return http.post<Product>('product', data)
}
export function updateProduct(id: number, data: Partial<Product>): Promise<Product> {
  return http.put<Product>(`product/${id}`, data)
}
export function updateProductStatus(id: number, status: '在售' | '下架'): Promise<Product> {
  return http.patch<Product>(`product/${id}/status`, { status })
}
export function updatePresale(id: number, isPresale: boolean, presaleDeliverDate: string): Promise<Product> {
  return http.patch<Product>(`product/${id}/presale`, { isPresale, presaleDeliverDate })
}
export function batchProductAction(ids: number[], action: 'on' | 'off'): Promise<{ success: number; fail: number }> {
  return http.post('product/batch', { ids, action })
}

// ---------- 库存 ----------
export function getStockLogs(params: { page?: number; pageSize?: number }): Promise<PageResult<StockLog>> {
  return http.get<PageResult<StockLog>>('product/stock/logs', params)
}
export function adjustStock(skuId: number, changeQty: number, changeType?: string): Promise<null> {
  return http.patch<null>(`product/sku/${skuId}/stock`, { changeQty, changeType: changeType || '运营调整' })
}