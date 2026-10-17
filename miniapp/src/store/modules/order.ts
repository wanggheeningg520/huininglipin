// =============================================================================
// 订单 Store
// 对应 design.md 2.4.3 useOrderStore
// =============================================================================

import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  fetchOrderList, fetchOrderDetail, createOrder, cancelOrder, confirmOrder, applyRefund
} from '@/api/modules/trade';
import type {
  OrderCardVO, OrderDetailVO, CreateOrderReq, CreateOrderResultVO
} from '@/api/types';

export const useOrderStore = defineStore('order', () => {
  // ---------- state ----------
  const orderList = ref<OrderCardVO[]>([]);
  const orderDetail = ref<OrderDetailVO | null>(null);
  const total = ref(0);
  const loading = ref(false);

  // ---------- actions ----------
  async function fetchOrders(params: { status?: string; page?: number; pageSize?: number }) {
    loading.value = true;
    try {
      const res = await fetchOrderList(params);
      if ((params.page || 1) === 1) {
        orderList.value = res.list;
      } else {
        orderList.value = orderList.value.concat(res.list);
      }
      total.value = res.total;
      return res;
    } finally {
      loading.value = false;
    }
  }

  async function fetchDetail(orderNo: string) {
    loading.value = true;
    try {
      orderDetail.value = await fetchOrderDetail(orderNo);
      return orderDetail.value;
    } finally {
      loading.value = false;
    }
  }

  async function create(data: CreateOrderReq): Promise<CreateOrderResultVO> {
    const res = await createOrder(data);
    return res;
  }

  async function cancel(orderNo: string) {
    await cancelOrder(orderNo);
    uni.showToast({ title: '订单已取消', icon: 'success' });
  }

  async function confirm(orderNo: string) {
    await confirmOrder(orderNo);
    uni.showToast({ title: '确认收货成功', icon: 'success' });
  }

  async function refund(data: { orderNo: string; amount: number; reason: string }) {
    const res = await applyRefund(data);
    uni.showToast({ title: '退款申请已提交', icon: 'success' });
    return res;
  }

  return {
    orderList, orderDetail, total, loading,
    fetchOrders, fetchDetail, create, cancel, confirm, refund
  };
});