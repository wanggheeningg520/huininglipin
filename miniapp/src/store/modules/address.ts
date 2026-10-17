// =============================================================================
// 收货地址 Store
// 对应 design.md 2.4.3 useAddressStore
// =============================================================================

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  fetchAddressList, createAddress, updateAddress, removeAddress, setDefaultAddress
} from '@/api/modules/member';
import { BIZ } from '@/utils/constants';
import type { AddressVO } from '@/api/types';

export const useAddressStore = defineStore('address', () => {
  // ---------- state ----------
  const list = ref<AddressVO[]>([]);
  const loading = ref(false);

  // ---------- getters ----------
  const defaultAddress = computed(() => list.value.find((a) => a.isDefault) || list.value[0] || null);
  const hasReachedLimit = computed(() => list.value.length >= BIZ.ADDRESS_LIMIT);

  // ---------- actions ----------
  async function fetch() {
    loading.value = true;
    try {
      list.value = await fetchAddressList();
    } finally {
      loading.value = false;
    }
  }

  async function create(data: Omit<AddressVO, 'id'>) {
    if (hasReachedLimit.value) {
      uni.showToast({ title: `地址最多 ${BIZ.ADDRESS_LIMIT} 条`, icon: 'none' });
      throw new Error('ADDRESS_LIMIT');
    }
    const res = await createAddress(data);
    await fetch();
    return res;
  }

  async function update(id: number, data: Omit<AddressVO, 'id'>) {
    const res = await updateAddress(id, data);
    await fetch();
    return res;
  }

  async function remove(id: number) {
    await removeAddress(id);
    list.value = list.value.filter((a) => a.id !== id);
  }

  async function setDefault(id: number) {
    await setDefaultAddress(id);
    await fetch();
  }

  return {
    list, loading, defaultAddress, hasReachedLimit,
    fetch, create, update, remove, setDefault
  };
});