<script setup lang="ts">
/**
 * SpecSelector 规格选择器
 * 对应 design.md 2.4.6 SpecSelector：售罄禁用+选中联动库存
 */
import type { SkuInfo } from '@/api/types';
import { specJsonToString } from '@/utils/format';

interface Props {
  skus: SkuInfo[];
  selectedId?: number;
}

const props = withDefaults(defineProps<Props>(), {
  selectedId: 0
});

const emit = defineEmits<{ (e: 'select', sku: SkuInfo): void }>();

function onSelect(sku: SkuInfo) {
  if (sku.soldOut) return;
  emit('select', sku);
}
</script>

<template>
  <view class="hn-spec-selector">
    <view class="spec-label">规格</view>
    <view class="spec-options">
      <view
        v-for="sku in skus"
        :key="sku.id"
        class="spec-item"
        :class="{
          active: sku.id === selectedId,
          disabled: sku.soldOut
        }"
        @tap="onSelect(sku)"
      >
        <text class="spec-text">{{ specJsonToString(sku.specJson) }}</text>
        <text v-if="sku.soldOut" class="sold-out-text">售罄</text>
      </view>
    </view>
    <view v-if="selectedId" class="spec-stock">
      <text class="stock-label">库存：</text>
      <text class="stock-value">{{ skus.find(s => s.id === selectedId)?.stock || 0 }} 件</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.hn-spec-selector {
  padding: $spacing-sm 0;
}
.spec-label {
  font-size: $font-size-title;
  font-weight: $font-weight-semibold;
  color: $hn-text-1;
  margin-bottom: $spacing-sm;
}
.spec-options {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}
.spec-item {
  position: relative;
  padding: 16rpx 32rpx;
  background-color: $hn-green-50;
  border: 2rpx solid transparent;
  border-radius: $radius-small;
  .spec-text {
    font-size: $font-size-body;
    color: $hn-text-2;
  }
  &.active {
    background-color: $hn-green-100;
    border-color: $hn-green-500;
    .spec-text {
      color: $hn-green-700;
      font-weight: $font-weight-semibold;
    }
  }
  &.disabled {
    opacity: 0.5;
    background-color: $hn-line;
    .spec-text {
      color: $hn-text-3;
      text-decoration: line-through;
    }
  }
}
.sold-out-text {
  font-size: 20rpx;
  color: $hn-danger;
  margin-left: 8rpx;
}
.spec-stock {
  margin-top: $spacing-sm;
  font-size: $font-size-caption;
  color: $hn-text-3;
  .stock-value {
    color: $hn-green-700;
  }
}
</style>