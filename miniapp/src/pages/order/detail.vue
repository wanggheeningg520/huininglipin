<script setup lang="ts">
/**
 * 订单详情页 MA-14
 * 对应 design.md 2.4.2 pages/order/detail
 * 订单状态+物流跟踪+商品项+收货信息+预售提示
 * 确认收货+取消订单+申请退款操作
 * 生鲜已签收退款提示联系客服
 */
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { fetchOrderDetail, fetchLogistics } from '@/api/modules/trade';
import { useOrder } from '@/hooks/useOrder';
import { COMPLIANCE_TIPS } from '@/utils/constants';
import type { OrderDetailVO, LogisticsVO } from '@/api/types';

import OrderItem from '@/components/order/OrderItem.vue';
import Price from '@/components/common/Price.vue';
import ComplianceTip from '@/components/common/ComplianceTip.vue';
import { formatDateTime } from '@/utils/format';

const orderNo = ref('');
const detail = ref<OrderDetailVO | null>(null);
const logistics = ref<LogisticsVO | null>(null);
const loading = ref(true);

const { orderStore, cancelOrder, confirmOrder } = useOrder();

onLoad((query: any) => {
  orderNo.value = query.orderNo || '';
  loadDetail();
});

async function loadDetail() {
  loading.value = true;
  try {
    detail.value = await fetchOrderDetail(orderNo.value);
    if (detail.value.logistics) {
      try {
        logistics.value = await fetchLogistics(orderNo.value);
      } catch { /* ignore */ }
    }
  } finally {
    loading.value = false;
  }
}

async function onCancel() {
  await cancelOrder(orderNo.value);
  await loadDetail();
}

async function onConfirm() {
  await confirmOrder(orderNo.value);
  await loadDetail();
}

function onPay() {
  uni.navigateTo({ url: `/pages/order/pay-result?orderNo=${orderNo.value}&status=pending` });
}

function onRefund() {
  // 生鲜已签收退款提示联系客服
  if (detail.value?.status === '已完成' && detail.value.isPresale) {
    uni.showModal({
      title: '提示',
      content: COMPLIANCE_TIPS.FRESH_SIGNED_REFUND,
      showCancel: false
    });
    return;
  }
  uni.showModal({
    title: '申请退款',
    content: '确定要申请退款吗？',
    success: async (res) => {
      if (res.confirm && detail.value) {
        await orderStore.refund({
          orderNo: orderNo.value,
          amount: detail.value.payAmount,
          reason: '用户申请退款'
        });
        await loadDetail();
      }
    }
  });
}
</script>

<template>
  <view class="page-order-detail">
    <view v-if="loading" class="loading-text">加载中...</view>

    <template v-else-if="detail">
      <!-- 订单状态 -->
      <view class="status-block">
        <text class="status-text">{{ detail.status }}</text>
        <text class="order-no">订单号：{{ detail.orderNo }}</text>
      </view>

      <!-- 物流跟踪 -->
      <view v-if="logistics && logistics.traces.length" class="section logistics-section">
        <view class="section-title">
          <text class="title-text">物流跟踪</text>
          <text class="logistics-company">{{ logistics.company }} · {{ logistics.trackNo }}</text>
        </view>
        <view class="trace-list">
          <view
            v-for="(trace, i) in logistics.traces"
            :key="i"
            class="trace-item"
            :class="{ first: i === 0 }"
          >
            <view class="trace-dot" />
            <view class="trace-content">
              <text class="trace-text">{{ trace.content }}</text>
              <text class="trace-time">{{ trace.time }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 收货信息 -->
      <view class="section receiver-section">
        <text class="section-title-text">收货信息</text>
        <view class="receiver-info">
          <view class="receiver-header">
            <text class="receiver-name">{{ detail.receiver.name }}</text>
            <text class="receiver-phone">{{ detail.receiver.phone }}</text>
          </view>
          <text class="receiver-addr">{{ detail.receiver.address }}</text>
        </view>
      </view>

      <!-- 商品列表 -->
      <view class="section goods-section">
        <text class="section-title-text">商品</text>
        <OrderItem v-for="(item, i) in detail.items" :key="i" :item="item" />
      </view>

      <!-- 预售提示 -->
      <ComplianceTip v-if="detail.isPresale" type="presale" :deliver-date="detail.presaleDeliverDate" />

      <!-- 订单信息 -->
      <view class="section info-section">
        <view class="info-row">
          <text class="info-label">下单时间</text>
          <text class="info-value">{{ formatDateTime(detail.createdAt) }}</text>
        </view>
        <view v-if="detail.payTime" class="info-row">
          <text class="info-label">支付时间</text>
          <text class="info-value">{{ formatDateTime(detail.payTime) }}</text>
        </view>
        <view v-if="detail.remark" class="info-row">
          <text class="info-label">备注</text>
          <text class="info-value">{{ detail.remark }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">商品金额</text>
          <Price :value="detail.totalAmount" color="gold" size="sm" />
        </view>
        <view class="info-row total">
          <text class="info-label">实付金额</text>
          <Price :value="detail.payAmount" color="gold" size="md" />
        </view>
      </view>

      <!-- 底部操作 -->
      <view class="bottom-bar safe-bottom">
        <template v-if="detail.status === '待支付'">
          <view class="btn btn-ghost" @tap="onCancel">取消订单</view>
          <view class="btn btn-primary" @tap="onPay">立即支付</view>
        </template>
        <template v-else-if="detail.status === '待收货'">
          <view class="btn btn-ghost" @tap="onRefund">申请退款</view>
          <view class="btn btn-primary" @tap="onConfirm">确认收货</view>
        </template>
        <template v-else-if="detail.status === '待发货'">
          <view class="btn btn-ghost" @tap="onRefund">申请退款</view>
        </template>
        <template v-else-if="detail.status === '已完成'">
          <view class="btn btn-ghost" @tap="onRefund">申请退款</view>
        </template>
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.page-order-detail {
  min-height: 100vh;
  background-color: $hn-bg;
  padding-bottom: 140rpx;
}
.loading-text {
  text-align: center;
  padding: $spacing-xl;
  color: $hn-text-3;
}
.status-block {
  background-image: $gradient-primary;
  padding: $spacing-lg $spacing-sm;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.status-text {
  font-size: $font-size-title-lg;
  font-weight: $font-weight-bold;
  color: #ffffff;
}
.order-no {
  font-size: $font-size-caption;
  color: rgba(255,255,255,0.85);
}
.section {
  margin: $spacing-sm;
  padding: $spacing-sm;
  background-color: #ffffff;
  border-radius: $radius-card;
  box-shadow: $shadow-card;
}
.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-sm;
}
.title-text, .section-title-text {
  font-size: $font-size-title;
  font-weight: $font-weight-semibold;
  color: $hn-text-1;
  display: block;
  margin-bottom: $spacing-sm;
}
.logistics-company {
  font-size: $font-size-caption;
  color: $hn-text-3;
}
.trace-list {
  padding-left: $spacing-xs;
}
.trace-item {
  display: flex;
  gap: $spacing-sm;
  padding: 8rpx 0;
  position: relative;
  &::before {
    content: '';
    position: absolute;
    left: 11rpx;
    top: 24rpx;
    bottom: -8rpx;
    width: 2rpx;
    background-color: $hn-line;
  }
  &:last-child::before { display: none; }
  &.first .trace-dot {
    background-color: $hn-green-500;
    border-color: $hn-green-500;
  }
  &.first .trace-text {
    color: $hn-green-700;
    font-weight: $font-weight-semibold;
  }
}
.trace-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background-color: #ffffff;
  border: 2rpx solid $hn-line;
  flex-shrink: 0;
  margin-top: 8rpx;
  z-index: 1;
}
.trace-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.trace-text {
  font-size: $font-size-caption;
  color: $hn-text-2;
}
.trace-time {
  font-size: 20rpx;
  color: $hn-text-3;
}

.receiver-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.receiver-header {
  display: flex;
  gap: $spacing-sm;
}
.receiver-name {
  font-size: $font-size-body;
  font-weight: $font-weight-semibold;
  color: $hn-text-1;
}
.receiver-phone {
  font-size: $font-size-body;
  color: $hn-text-2;
}
.receiver-addr {
  font-size: $font-size-caption;
  color: $hn-text-2;
  line-height: $line-height-body;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8rpx 0;
  &.total {
    border-top: 1rpx solid $hn-line;
    margin-top: 8rpx;
    padding-top: $spacing-sm;
  }
}
.info-label {
  font-size: $font-size-body;
  color: $hn-text-2;
}
.info-value {
  font-size: $font-size-body;
  color: $hn-text-1;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 110rpx;
  background-color: #ffffff;
  box-shadow: 0 -2rpx 12rpx rgba(111,179,90,0.08);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 $spacing-sm;
  gap: $spacing-sm;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
.btn {
  padding: 0 40rpx;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: $radius-btn;
  font-size: $font-size-body;
  font-weight: $font-weight-semibold;
  text-align: center;
}
.btn-primary {
  background-image: $gradient-primary;
  color: #ffffff;
}
.btn-ghost {
  background-color: $hn-green-50;
  color: $hn-green-700;
  border: 2rpx solid $hn-green-300;
}
</style>