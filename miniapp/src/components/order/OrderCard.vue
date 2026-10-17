<script setup lang="ts">
/**
 * OrderCard 订单卡片
 * 对应 design.md 2.4.6 OrderCard：订单号+状态+商品缩略+金额
 */
import type { OrderCardVO } from '@/api/types';
import OrderItem from './OrderItem.vue';
import Price from '@/components/common/Price.vue';
import { formatDateTime } from '@/utils/format';

interface Props {
  order: OrderCardVO;
}

const props = defineProps<Props>();

const emit = defineEmits<{ (e: 'tap', orderNo: string): void }>();

function onTap() {
  emit('tap', props.order.orderNo);
  uni.navigateTo({ url: `/pages/order/detail?orderNo=${props.order.orderNo}` });
}

// 状态颜色映射
function statusColor(status: string): string {
  const map: Record<string, string> = {
    '待支付': '$hn-warn',
    '待发货': '$hn-green-500',
    '待收货': '$hn-green-700',
    '已完成': '$hn-text-3',
    '已取消': '$hn-text-3',
    '退款中': '$hn-danger',
    '已退款': '$hn-text-3'
  };
  return map[status] || '$hn-text-2';
}
</script>

<template>
  <view class="hn-order-card" @tap="onTap">
    <view class="card-header">
      <text class="order-no">订单号：{{ order.orderNo }}</text>
      <text class="order-status" :style="{ color: statusColor(order.status) }">{{ order.status }}</text>
    </view>
    <view class="card-items">
      <OrderItem v-for="(item, i) in order.items" :key="i" :item="item" />
    </view>
    <view class="card-footer">
      <text class="order-time">{{ formatDateTime(order.createdAt) }}</text>
      <view class="order-amount">
        <text class="amount-label">共 {{ order.items.reduce((s, i) => s + i.qty, 0) }} 件 实付</text>
        <Price :value="order.payAmount" color="gold" size="md" />
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.hn-order-card {
  background-color: #ffffff;
  border-radius: $radius-card;
  box-shadow: $shadow-card;
  padding: $spacing-sm;
  margin-bottom: $spacing-sm;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: $spacing-sm;
  border-bottom: 1rpx solid $hn-line;
}
.order-no {
  font-size: $font-size-caption;
  color: $hn-text-3;
}
.order-status {
  font-size: $font-size-body;
  font-weight: $font-weight-semibold;
}
.card-items {
  padding: $spacing-xs 0;
}
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: $spacing-sm;
  border-top: 1rpx solid $hn-line;
}
.order-time {
  font-size: $font-size-caption;
  color: $hn-text-3;
}
.order-amount {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
  .amount-label {
    font-size: $font-size-caption;
    color: $hn-text-2;
  }
}
</style>