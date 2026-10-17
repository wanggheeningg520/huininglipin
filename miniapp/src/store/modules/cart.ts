// =============================================================================
// 购物车 Store
// 对应 design.md 2.4.3 useCartStore
// =============================================================================

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  fetchCart, addOrUpdateCart, removeCartItem, toggleCartCheck
} from '@/api/modules/trade';
import { BIZ } from '@/utils/constants';
import type { CartItemVO } from '@/api/types';

export const useCartStore = defineStore('cart', () => {
  // ---------- state ----------
  const items = ref<CartItemVO[]>([]);
  const loading = ref(false);

  // ---------- getters ----------
  const totalCount = computed(() => items.value.reduce((s, i) => s + i.qty, 0));
  const checkedItems = computed(() => items.value.filter((i) => i.checked));
  const checkedCount = computed(() => checkedItems.value.reduce((s, i) => s + i.qty, 0));
  const totalAmount = computed(() => checkedItems.value.reduce((s, i) => s + i.price * i.qty, 0));
  const allChecked = computed(() => items.value.length > 0 && items.value.every((i) => i.checked));
  const isEmpty = computed(() => items.value.length === 0);

  // ---------- actions ----------
  async function fetch() {
    loading.value = true;
    try {
      const res = await fetchCart();
      items.value = res.items;
    } finally {
      loading.value = false;
    }
  }

  async function add(skuId: number, qty: number, checked = true) {
    if (qty > BIZ.CART_QTY_MAX) {
      uni.showToast({ title: `单次最多加购 ${BIZ.CART_QTY_MAX} 件`, icon: 'none' });
      return;
    }
    await addOrUpdateCart({ skuId, qty, checked });
    await fetch();
  }

  async function updateQty(cartId: number, qty: number) {
    if (qty < 1) return;
    if (qty > BIZ.CART_QTY_MAX) {
      uni.showToast({ title: `最多 ${BIZ.CART_QTY_MAX} 件`, icon: 'none' });
      return;
    }
    const item = items.value.find((i) => i.id === cartId);
    if (!item) return;
    if (qty > item.stock) {
      uni.showToast({ title: '库存不足', icon: 'none' });
      return;
    }
    await addOrUpdateCart({ skuId: item.skuId, qty });
    await fetch();
  }

  async function remove(cartId: number) {
    await removeCartItem(cartId);
    items.value = items.value.filter((i) => i.id !== cartId);
  }

  async function toggleCheck(cartIds: number[], checked: boolean) {
    await toggleCartCheck({ cartIds, checked });
    items.value.forEach((i) => {
      if (cartIds.includes(i.id)) i.checked = checked;
    });
  }

  async function toggleAll(checked: boolean) {
    const ids = items.value.map((i) => i.id);
    if (ids.length) await toggleCheck(ids, checked);
  }

  /** 结算：返回勾选项 */
  function checkout() {
    return checkedItems.value;
  }

  return {
    items, loading, totalCount, checkedItems, checkedCount, totalAmount,
    allChecked, isEmpty,
    fetch, add, updateQty, remove, toggleCheck, toggleAll, checkout
  };
});