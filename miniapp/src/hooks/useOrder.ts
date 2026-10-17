// =============================================================================
// 订单操作 Hook
// =============================================================================

import { useOrderStore } from '@/store/modules/order';

export function useOrder() {
  const orderStore = useOrderStore();

  async function cancelOrder(orderNo: string) {
    return new Promise<void>((resolve, reject) => {
      uni.showModal({
        title: '取消订单',
        content: '确定要取消该订单吗？取消后不可恢复。',
        success: async (res) => {
          if (res.confirm) {
            try {
              await orderStore.cancel(orderNo);
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        }
      });
    });
  }

  async function confirmOrder(orderNo: string) {
    return new Promise<void>((resolve, reject) => {
      uni.showModal({
        title: '确认收货',
        content: '请确认已收到商品，确认后订单将完成。',
        success: async (res) => {
          if (res.confirm) {
            try {
              await orderStore.confirm(orderNo);
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        }
      });
    });
  }

  return { orderStore, cancelOrder, confirmOrder };
}