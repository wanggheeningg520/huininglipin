<script setup lang="ts">
/**
 * 订单列表页 MA-14
 * 对应 design.md 2.4.2 pages/order/list
 * 按状态筛选（全部/待支付/待发货/待收货/已完成）+ 分页
 */
import { ref, onMounted } from 'vue';
import { onLoad, onReachBottom } from '@dcloudio/uni-app';
import { fetchOrderList } from '@/api/modules/trade';
import { OrderStatus } from '@/utils/constants';
import type { OrderCardVO } from '@/api/types';

import OrderCard from '@/components/order/OrderCard.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import LoadMore from '@/components/common/LoadMore.vue';

const tabs = [
  { label: '全部', value: OrderStatus.ALL },
  { label: '待支付', value: OrderStatus.PENDING_PAY },
  { label: '待发货', value: OrderStatus.PENDING_SHIP },
  { label: '待收货', value: OrderStatus.PENDING_RECEIVE },
  { label: '已完成', value: OrderStatus.FINISHED }
];

const activeStatus = ref<string>(OrderStatus.ALL);
const orders = ref<OrderCardVO[]>([]);
const loading = ref(false);
const finished = ref(false);
const page = ref(1);
const pageSize = 20;

onLoad((query: any) => {
  if (query.status) activeStatus.value = decodeURIComponent(query.status);
});

onMounted(load);

async function load(reset = false) {
  if (reset) {
    page.value = 1;
    finished.value = false;
    orders.value = [];
  }
  if (finished.value || loading.value) return;
  loading.value = true;
  try {
    const res = await fetchOrderList({ status: activeStatus.value, page: page.value, pageSize });
    orders.value = page.value === 1 ? res.list : orders.value.concat(res.list);
    if (orders.value.length >= res.total || !res.list.length) finished.value = true;
    else page.value += 1;
  } finally {
    loading.value = false;
  }
}

onReachBottom(() => load());

function onTab(value: string) {
  activeStatus.value = value;
  load(true);
}
</script>

<template>
  <view class="page-order-list">
    <!-- 状态筛选 -->
    <view class="tabs">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: activeStatus === tab.value }"
        @tap="onTab(tab.value)"
      >
        <text>{{ tab.label }}</text>
      </view>
    </view>

    <EmptyState v-if="!orders.length && !loading" text="暂无订单" desc="快去挑选心仪的礼品吧" />

    <view class="order-list">
      <OrderCard v-for="o in orders" :key="o.orderNo" :order="o" />
      <LoadMore v-if="orders.length" :status="finished ? 'finished' : 'loading'" />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-order-list {
  min-height: 100vh;
  background-color: $hn-bg;
}
.tabs {
  display: flex;
  background-color: #ffffff;
  padding: $spacing-sm 0;
  box-shadow: $shadow-card;
  position: sticky;
  top: 0;
  z-index: 10;
}
.tab-item {
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
      width: 48rpx;
      height: 4rpx;
      background-image: $gradient-primary;
      border-radius: 2rpx;
    }
  }
}
.order-list {
  padding: $spacing-sm;
}
</style>