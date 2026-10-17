<script setup lang="ts">
/**
 * OrderItem 订单商品项
 * 对应 design.md 2.4.6 OrderItem：图+标题+规格+单价+数量
 */
import type { OrderItemVO } from '@/api/types';
import Price from '@/components/common/Price.vue';
import { specJsonToString } from '@/utils/format';

interface Props {
  item: OrderItemVO;
}

defineProps<Props>();
</script>

<template>
  <view class="hn-order-item">
    <image class="item-img" :src="item.mainImage" mode="aspectFill" />
    <view class="item-info">
      <text class="item-title">{{ item.productTitle }}</text>
      <text class="item-spec">{{ specJsonToString(item.specJson) }}</text>
      <view class="item-bottom">
        <Price :value="item.price" color="gold" size="sm" />
        <text class="item-qty">×{{ item.qty }}</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.hn-order-item {
  display: flex;
  gap: $spacing-sm;
  padding: $spacing-sm 0;
}
.item-img {
  width: 140rpx;
  height: 140rpx;
  border-radius: $radius-image;
  flex-shrink: 0;
}
.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}
.item-title {
  font-size: $font-size-body;
  color: $hn-text-1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.item-spec {
  font-size: $font-size-caption;
  color: $hn-text-3;
  background-color: $hn-green-50;
  padding: 2rpx 12rpx;
  border-radius: $radius-small;
  align-self: flex-start;
}
.item-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}
.item-qty {
  font-size: $font-size-body;
  color: $hn-text-2;
  font-family: $font-family-din;
}
</style>