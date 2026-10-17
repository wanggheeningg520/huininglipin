// =============================================================================
// 分页 Hook
// =============================================================================

import { ref } from 'vue';

export function usePagination<T>(fetcher: (params: { page: number; pageSize: number }) => Promise<{ list: T[]; total: number }>, pageSize = 20) {
  const list = ref<T[]>([]) as any;
  const page = ref(1);
  const total = ref(0);
  const loading = ref(false);
  const finished = ref(false);
  const error = ref(false);

  async function load(reset = false) {
    if (reset) {
      page.value = 1;
      finished.value = false;
      error.value = false;
    }
    if (finished.value || loading.value) return;
    loading.value = true;
    error.value = false;
    try {
      const res = await fetcher({ page: page.value, pageSize });
      if (page.value === 1) {
        list.value = res.list;
      } else {
        list.value = list.value.concat(res.list);
      }
      total.value = res.total;
      if (list.value.length >= res.total || res.list.length === 0) {
        finished.value = true;
      } else {
        page.value += 1;
      }
    } catch (e) {
      error.value = true;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  function reset() {
    list.value = [];
    page.value = 1;
    total.value = 0;
    finished.value = false;
    error.value = false;
  }

  return { list, page, total, loading, finished, error, load, reset };
}