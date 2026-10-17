<script setup lang="ts">
/**
 * ProductList 商品列表
 * 对应 design.md 2.4.6 ProductList：瀑布流/列表切换 + LoadMore
 */
import type { ProductCardVO } from '@/api/types';
import ProductCard from './ProductCard.vue';
import LoadMore from '@/components/common/LoadMore.vue';
import EmptyState from '@/components/common/EmptyState.vue';

interface Props {
  products: ProductCardVO[];
  mode?: 'grid' | 'list';
  loading?: boolean;
  finished?: boolean;
  error?: boolean;
  emptyText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'grid',
  loading: false,
  finished: false,
  error: false,
  emptyText: '暂无商品'
});

const emit = defineEmits<{ (e: 'loadMore'): void; (e: 'retry'): void }>();

function onRetry() {
  emit('retry');
}
</script>

<template>
  <view class="hn-product-list">
    <view v-if="products.length" class="list-wrap" :class="mode">
      <ProductCard
        v-for="p in products"
        :key="p.id"
        :product="p"
        :mode="mode"
      />
    </view>

    <EmptyState v-else-if="!loading" :text="emptyText" />

    <LoadMore
      v-if="products.length"
      :status="error ? 'error' : (finished ? 'finished' : 'loading')"
      @retry="onRetry"
    />
  </view>
</template>

<style lang="scss" scoped>
.hn-product-list {
  width: 100%;
}
.list-wrap.grid {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
  padding: $spacing-sm;
}
.list-wrap.list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  padding: $spacing-sm;
}
</style>