<script setup lang="ts">
/**
 * 商品列表页 MA-11
 * 对应 design.md 2.4.2 pages/product/list
 * 筛选（分类/价格区间）+ 排序（销量/价格）+ 分页
 */
import { ref, onMounted } from 'vue';
import { onLoad, onReachBottom } from '@dcloudio/uni-app';
import { fetchProductList } from '@/api/modules/product';
import { ProductSortBy } from '@/utils/constants';
import type { ProductCardVO } from '@/api/types';

import ProductList from '@/components/product/ProductList.vue';
import Skeleton from '@/components/common/Skeleton.vue';

const categoryId = ref<number | undefined>(undefined);
const categoryName = ref('');
const products = ref<ProductCardVO[]>([]);
const loading = ref(true);
const finished = ref(false);
const error = ref(false);
const page = ref(1);
const pageSize = 20;

const sortBy = ref<string>(ProductSortBy.DEFAULT);
const priceMin = ref<number | undefined>(undefined);
const priceMax = ref<number | undefined>(undefined);

const sortOptions = [
  { label: '综合', value: ProductSortBy.DEFAULT },
  { label: '销量', value: ProductSortBy.SALES_DESC },
  { label: '价格↑', value: ProductSortBy.PRICE_ASC },
  { label: '价格↓', value: ProductSortBy.PRICE_DESC }
];

onLoad((query: any) => {
  if (query.categoryId) categoryId.value = Number(query.categoryId);
  if (query.name) categoryName.value = decodeURIComponent(query.name);
});

onMounted(load);

async function load(reset = false) {
  if (reset) {
    page.value = 1;
    finished.value = false;
    error.value = false;
    products.value = [];
  }
  if (finished.value || loading.value) return;
  loading.value = true;
  error.value = false;
  try {
    const res = await fetchProductList({
      categoryId: categoryId.value,
      sortBy: sortBy.value,
      priceMin: priceMin.value,
      priceMax: priceMax.value,
      page: page.value,
      pageSize
    });
    products.value = page.value === 1 ? res.list : products.value.concat(res.list);
    if (products.value.length >= res.total || !res.list.length) finished.value = true;
    else page.value += 1;
  } catch (e) {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

onReachBottom(() => load());

function onSort(value: string) {
  sortBy.value = value;
  load(true);
}
</script>

<template>
  <view class="page-list">
    <!-- 排序栏 -->
    <view class="sort-bar">
      <view
        v-for="opt in sortOptions"
        :key="opt.value"
        class="sort-item"
        :class="{ active: sortBy === opt.value }"
        @tap="onSort(opt.value)"
      >
        <text>{{ opt.label }}</text>
      </view>
    </view>

    <Skeleton v-if="loading && !products.length" type="card" :count="4" />

    <ProductList
      v-else
      :products="products"
      mode="grid"
      :loading="loading"
      :finished="finished"
      :error="error"
      empty-text="暂无商品"
      @retry="load(true)"
    />
  </view>
</template>

<style lang="scss" scoped>
.page-list {
  min-height: 100vh;
  background-color: $hn-bg;
}
.sort-bar {
  display: flex;
  align-items: center;
  background-color: #ffffff;
  padding: $spacing-sm 0;
  box-shadow: $shadow-card;
  position: sticky;
  top: 0;
  z-index: 10;
}
.sort-item {
  flex: 1;
  text-align: center;
  font-size: $font-size-body;
  color: $hn-text-2;
  &.active {
    color: $hn-green-700;
    font-weight: $font-weight-semibold;
    position: relative;
    &::after {
      content: '';
      position: absolute;
      bottom: -8rpx;
      left: 50%;
      transform: translateX(-50%);
      width: 40rpx;
      height: 4rpx;
      background-image: $gradient-primary;
      border-radius: 2rpx;
    }
  }
}
</style>