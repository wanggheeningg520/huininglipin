// ============================================================
// 订单管理 API
// ============================================================
import { http } from '@/api/request'
import type { PageResult } from '@/types'
import type { MockOrder, MockRefund } from '@/api/mock/order'

export type Order = MockOrder
export type Refund = MockRefund

// ---------- 订单 ----------
export interface OrderQuery {
  status?: string
  keyword?: string
  orderType?: string
  page?: number
  pageSize?: number
}
export function getOrderList(params: OrderQuery): Promise<PageResult<Order>> {
  return http.get<PageResult<Order>>('order/list', params as Record<string, unknown>)
}
export function getOrderDetail(orderNo: string): Promise<Order> {
  return http.get<Order>(`order/${orderNo}`)
}
export function shipOrder(orderNo: string, logisticsCompany: string, logisticsNo: string): Promise<Order> {
  return http.post<Order>(`order/${orderNo}/ship`, { logisticsCompany, logisticsNo })
}
export function exportOrders(params: OrderQuery): Promise<{ url: string; count: number }> {
  return http.get('order/export', params as Record<string, unknown>)
}

// ---------- 退款 ----------
export function getRefundList(params: { status?: string; page?: number; pageSize?: number }): Promise<PageResult<Refund>> {
  return http.get<PageResult<Refund>>('refund/list', params as Record<string, unknown>)
}
export function auditRefund(refundNo: string, status: 'pass' | 'reject', auditRemark: string): Promise<Refund> {
  return http.post<Refund>(`refund/${refundNo}/audit`, { status, auditRemark })
}