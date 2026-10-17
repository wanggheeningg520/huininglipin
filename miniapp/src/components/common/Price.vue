<script setup lang="ts">
/**
 * Price 价格组件
 * 对应 design.md 2.4.6 Price：金色/红色切换，DIN 字体
 */
import { computed } from 'vue';
import { formatPrice } from '@/utils/format';

interface Props {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'gold' | 'red' | 'green';
  showSymbol?: boolean;
  marketPrice?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'gold',
  showSymbol: true,
  marketPrice: null
});

const fontSize = computed(() => {
  const map = { sm: '28rpx', md: '36rpx', lg: '48rpx' };
  return map[props.size];
});

const colorClass = computed(() => {
  const map = { gold: 'hn-gold', red: 'hn-red', green: 'hn-green' };
  return map[props.color];
});

const formatted = computed(() => formatPrice(props.value));
const marketFormatted = computed(() => props.marketPrice ? formatPrice(props.marketPrice) : '');
</script>

<template>
  <view class="hn-price-wrap">
    <view class="hn-price" :class="colorClass" :style="{ fontSize }">
      <text v-if="showSymbol" class="symbol">¥</text>
      <text class="value">{{ formatted }}</text>
    </view>
    <view v-if="marketPrice && marketPrice > value" class="hn-price-market">
      ¥{{ marketFormatted }}
    </view>
  </view>
</template>

<style lang="scss" scoped>
.hn-price-wrap {
  display: inline-flex;
  align-items: baseline;
  gap: $spacing-xs;
}
.hn-price {
  font-family: $font-family-din;
  font-weight: $font-weight-bold;
  line-height: 1;
  display: inline-flex;
  align-items: baseline;
  .symbol {
    font-size: 0.7em;
    margin-right: 2rpx;
  }
}
.hn-gold { color: $hn-gold-700; }
.hn-red  { color: $hn-danger; }
.hn-green { color: $hn-green-700; }
.hn-price-market {
  font-size: $font-size-caption;
  color: $hn-text-3;
  text-decoration: line-through;
  font-family: $font-family-din;
}
</style>