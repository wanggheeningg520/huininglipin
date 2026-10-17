// =============================================================================
// 交易域 API
// 对应 design.md 2.2.2 接口 5-17
// =============================================================================

import { http } from '../request';
import type {
  CartResultVO, CartItemVO, CreateOrderReq, CreateOrderResultVO,
  OrderCardVO, OrderDetailVO, PayParamsVO, LogisticsVO, PageResult
} from '../types';
import {
  mockCart, mockOrderList, mockOrderDetail, mockCreateOrder,
  mockPayParams, mockLogistics, mockCartItems
} from '../mock/trade';

// 5. 购物车列表 GET /trade/cart
export function fetchCart(): Promise<CartResultVO> {
  return http.get<CartResultVO>('/trade/cart', undefined, {
    mock: async () => mockCart()
  });
}

// 6. 加购/更新购物车 POST /trade/cart
export function addOrUpdateCart(data: { skuId: number; qty: number; checked?: boolean }): Promise<{ cartId: number }> {
  return http.post<{ cartId: number }>('/trade/cart', data, {
    mock: async () => ({ cartId: Math.floor(Math.random() * 10000) })
  });
}

// 7. 删除购物车项 DELETE /trade/cart/{id}
export function removeCartItem(id: number): Promise<null> {
  return http.delete<null>(`/trade/cart/${id}`, {
    mock: async () => null
  });
}

// 8. 勾选/取消勾选 PATCH /trade/cart/check
export function toggleCartCheck(data: { cartIds: number[]; checked: boolean }): Promise<null> {
  return http.patch<null>('/trade/cart/check', data, {
    mock: async () => null
  });
}

// 9. 创建订单 POST /trade/order
export function createOrder(data: CreateOrderReq): Promise<CreateOrderResultVO> {
  return http.post<CreateOrderResultVO>('/trade/order', data, {
    idempotent: true,   // 注入 X-Idempotency-Key
    mock: async () => mockCreateOrder()
  });
}

// 10. 订单列表 GET /trade/order/list
export function fetchOrderList(params: { status?: string; page?: number; pageSize?: number }): Promise<PageResult<OrderCardVO>> {
  return http.get<PageResult<OrderCardVO>>('/trade/order/list', params, {
    mock: async () => mockOrderList(params)
  });
}

// 11. 订单详情 GET /trade/order/{orderNo}
export function fetchOrderDetail(orderNo: string): Promise<OrderDetailVO> {
  return http.get<OrderDetailVO>(`/trade/order/${orderNo}`, undefined, {
    mock: async () => mockOrderDetail(orderNo)
  });
}

// 12. 微信支付下单 POST /trade/pay/{orderNo}
export function createPay(orderNo: string): Promise<PayParamsVO> {
  return http.post<PayParamsVO>(`/trade/pay/${orderNo}`, undefined, {
    mock: async () => mockPayParams()
  });
}

// 14. 取消订单 POST /trade/order/{orderNo}/cancel
export function cancelOrder(orderNo: string): Promise<null> {
  return http.post<null>(`/trade/order/${orderNo}/cancel`, undefined, {
    mock: async () => null
  });
}

// 15. 确认收货 POST /trade/order/{orderNo}/confirm
export function confirmOrder(orderNo: string): Promise<null> {
  return http.post<null>(`/trade/order/${orderNo}/confirm`, undefined, {
    mock: async () => null
  });
}

// 16. 申请退款 POST /trade/refund
export function applyRefund(data: { orderNo: string; amount: number; reason: string }): Promise<{ refundNo: string }> {
  return http.post<{ refundNo: string }>('/trade/refund', data, {
    mock: async () => ({ refundNo: 'RF' + Date.now() })
  });
}

// 17. 物流轨迹查询 GET /trade/order/{orderNo}/logistics
export function fetchLogistics(orderNo: string): Promise<LogisticsVO> {
  return http.get<LogisticsVO>(`/trade/order/${orderNo}/logistics`, undefined, {
    mock: async () => mockLogistics()
  });
}

// 导出 mock 购物车项（供 store 初始化使用）
export { mockCartItems };