// =============================================================================
// 购物车操作 Hook
// =============================================================================

import { useCartStore } from '@/store/modules/cart';

export function useCart() {
  const cartStore = useCartStore();

  async function refresh() {
    await cartStore.fetch();
  }

  async function addToCart(skuId: number, qty: number) {
    await cartStore.add(skuId, qty);
    uni.showToast({ title: '已加入购物车', icon: 'success' });
  }

  async function changeQty(cartId: number, qty: number) {
    await cartStore.updateQty(cartId, qty);
  }

  async function remove(cartId: number) {
    return new Promise<void>((resolve) => {
      uni.showModal({
        title: '提示',
        content: '确定要删除该商品吗？',
        success: async (res) => {
          if (res.confirm) {
            await cartStore.remove(cartId);
            resolve();
          }
        }
      });
    });
  }

  return {
    cartStore,
    refresh, addToCart, changeQty, remove
  };
}