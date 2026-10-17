<script setup lang="ts">
/**
 * AddressPicker 地址选择器
 * 对应 design.md 2.4.6 AddressPicker：下单页预选默认地址
 */
import type { AddressVO } from '@/api/types';

interface Props {
  address: AddressVO | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{ (e: 'select'): void }>();

function onTap() {
  emit('select');
  uni.navigateTo({ url: '/pages/member/address/list?from=confirm' });
}
</script>

<template>
  <view class="hn-address-picker" @tap="onTap">
    <template v-if="address">
      <view class="picker-left">
        <text class="loc-icon">📍</text>
      </view>
      <view class="picker-info">
        <view class="picker-header">
          <text class="picker-name">{{ address.name }}</text>
          <text class="picker-phone">{{ address.phone }}</text>
          <view v-if="address.isDefault" class="default-tag">默认</view>
        </view>
        <text class="picker-addr">{{ address.province }}{{ address.city }}{{ address.district }}{{ address.detail }}</text>
      </view>
    </template>
    <template v-else>
      <text class="empty-text">请选择收货地址</text>
    </template>
    <text class="arrow">›</text>
  </view>
</template>

<style lang="scss" scoped>
.hn-address-picker {
  display: flex;
  align-items: center;
  background-color: #ffffff;
  padding: $spacing-sm;
  border-radius: $radius-card;
  box-shadow: $shadow-card;
  gap: $spacing-sm;
}
.picker-left {
  .loc-icon {
    font-size: 40rpx;
  }
}
.picker-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.picker-header {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}
.picker-name {
  font-size: $font-size-title;
  font-weight: $font-weight-semibold;
  color: $hn-text-1;
}
.picker-phone {
  font-size: $font-size-body;
  color: $hn-text-2;
}
.default-tag {
  font-size: 20rpx;
  color: #fff;
  background-image: $gradient-primary;
  padding: 2rpx 12rpx;
  border-radius: $radius-small;
}
.picker-addr {
  font-size: $font-size-caption;
  color: $hn-text-2;
  line-height: $line-height-body;
}
.empty-text {
  flex: 1;
  font-size: $font-size-body;
  color: $hn-text-3;
}
.arrow {
  font-size: 40rpx;
  color: $hn-text-3;
}
</style>