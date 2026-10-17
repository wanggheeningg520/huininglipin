<script setup lang="ts">
/**
 * CartItem 购物车项卡片
 * 对应 design.md 2.4.6 CartItem：勾选+数量步进器+库存校验
 */
import type { CartItemVO } from '@/api/types';
import Price from '@/components/common/Price.vue';
import { specJsonToString } from '@/utils/format';

interface Props {
  item: CartItemVO;
  editable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  editable: true
});

const emit = defineEmits<{
  (e: 'toggle', id: number, checked: boolean): void;
  (e: 'changeQty', id: number, qty: number): void;
  (e: 'remove', id: number): void;
}>();

function onToggle() {
  emit('toggle', props.item.id, !props.item.checked);
}

function onMinus() {
  if (props.item.qty <= 1) return;
  emit('changeQty', props.item.id, props.item.qty - 1);
}

function onPlus() {
  if (props.item.qty >= props.item.stock) {
    uni.showToast({ title: '库存不足', icon: 'none' });
    return;
  }
  emit('changeQty', props.item.id, props.item.qty + 1);
}

function onRemove() {
  emit('remove', props.item.id);
}
</script>

<template>
  <view class="hn-cart-item" :class="{ disabled: item.soldOut }">
    <view v-if="editable" class="check-box" :class="{ checked: item.checked }" @tap="onToggle">
      <text v-if="item.checked" class="check-icon">✓</text>
    </view>
    <image class="item-img" :src="item.mainImage" mode="aspectFill" @tap="uni.navigateTo({ url: `/pages/product/detail?id=${item.productId}` })" />
    <view class="item-info">
      <text class="item-title">{{ item.productTitle }}</text>
      <text class="item-spec">{{ specJsonToString(item.specJson) }}</text>
      <view class="item-bottom">
        <Price :value="item.price" color="gold" />
        <view v-if="editable" class="qty-control">
          <view class="qty-btn" @tap="onMinus"><text>−</text></view>
          <text class="qty-num">{{ item.qty }}</text>
          <view class="qty-btn" @tap="onPlus"><text>+</text></view>
        </view>
        <text v-else class="qty-readonly">×{{ item.qty }}</text>
      </view>
    </view>
    <view v-if="editable" class="item-remove" @tap="onRemove">
      <text class="remove-icon">✕</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.hn-cart-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm;
  background-color: #ffffff;
  border-radius: $radius-card;
  box-shadow: $shadow-card;
  &.disabled {
    opacity: 0.6;
  }
}
.check-box {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid $hn-line;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  &.checked {
    background-image: $gradient-primary;
    border-color: $hn-green-500;
    .check-icon {
      color: #ffffff;
      font-size: 24rpx;
      font-weight: bold;
    }
  }
}
.item-img {
  width: 160rpx;
  height: 160rpx;
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
.qty-control {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.qty-btn {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background-color: $hn-green-50;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: $hn-green-700;
}
.qty-num {
  font-size: $font-size-body;
  color: $hn-text-1;
  font-weight: $font-weight-semibold;
  min-width: 40rpx;
  text-align: center;
  font-family: $font-family-din;
}
.qty-readonly {
  font-size: $font-size-body;
  color: $hn-text-2;
}
.item-remove {
  padding: 8rpx;
  .remove-icon {
    font-size: 24rpx;
    color: $hn-text-3;
  }
}
</style>