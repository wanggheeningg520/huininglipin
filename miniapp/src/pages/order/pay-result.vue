<script setup lang="ts">
/**
 * 支付结果页 MA-13
 * 对应 design.md 2.4.2 pages/order/pay-result
 * 调用接口 12 获取支付参数；uni.requestPayment 拉起微信支付
 * 支付成功跳支付结果页；支付失败/取消提示
 */
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { payOrder } from '@/utils/pay';

const orderNo = ref('');
const status = ref<'pending' | 'success' | 'fail' | 'cancel'>('pending');
const paying = ref(false);

onLoad(async (query: any) => {
  orderNo.value = query.orderNo || '';
  const initial = query.status;
  if (initial === 'pending' && orderNo.value) {
    // 自动发起支付
    await doPay();
  } else if (initial === 'success') {
    status.value = 'success';
  }
});

async function doPay() {
  if (!orderNo.value) return;
  paying.value = true;
  try {
    const result = await payOrder(orderNo.value);
    status.value = result === 'success' ? 'success' : result === 'cancel' ? 'cancel' : 'fail';
    if (status.value === 'success') {
      uni.showToast({ title: '支付成功', icon: 'success' });
    } else if (status.value === 'cancel') {
      uni.showToast({ title: '支付已取消', icon: 'none' });
    } else {
      uni.showToast({ title: '支付失败，请重试', icon: 'none' });
    }
  } finally {
    paying.value = false;
  }
}

function goOrderList() {
  uni.redirectTo({ url: '/pages/order/list?status=全部' });
}

function goOrderDetail() {
  uni.redirectTo({ url: `/pages/order/detail?orderNo=${orderNo.value}` });
}

function goHome() {
  uni.switchTab({ url: '/pages/home/index' });
}
</script>

<template>
  <view class="page-pay-result">
    <!-- 支付中 -->
    <view v-if="paying" class="result-block">
      <view class="result-icon loading">⏳</view>
      <text class="result-title">正在拉起支付...</text>
    </view>

    <!-- 支付成功 -->
    <view v-else-if="status === 'success'" class="result-block">
      <view class="result-icon success">✓</view>
      <text class="result-title">支付成功</text>
      <text class="result-desc">订单号：{{ orderNo }}</text>
      <view class="action-btns">
        <view class="btn btn-primary" @tap="goOrderDetail">查看订单</view>
        <view class="btn btn-ghost" @tap="goHome">继续选购</view>
      </view>
    </view>

    <!-- 支付失败 -->
    <view v-else-if="status === 'fail'" class="result-block">
      <view class="result-icon fail">✕</view>
      <text class="result-title">支付失败</text>
      <text class="result-desc">请重新支付或联系客服</text>
      <view class="action-btns">
        <view class="btn btn-primary" @tap="doPay">重新支付</view>
        <view class="btn btn-ghost" @tap="goOrderList">订单列表</view>
      </view>
    </view>

    <!-- 支付取消 -->
    <view v-else-if="status === 'cancel'" class="result-block">
      <view class="result-icon cancel">⊘</view>
      <text class="result-title">支付已取消</text>
      <text class="result-desc">订单已生成，可稍后支付</text>
      <view class="action-btns">
        <view class="btn btn-primary" @tap="doPay">立即支付</view>
        <view class="btn btn-ghost" @tap="goOrderList">订单列表</view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-pay-result {
  min-height: 100vh;
  background-color: $hn-bg;
  display: flex;
  align-items: center;
  justify-content: center;
}
.result-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-xl;
}
.result-icon {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 80rpx;
  font-weight: bold;
  margin-bottom: $spacing-sm;
  &.success {
    background-color: $hn-green-100;
    color: $hn-green-700;
  }
  &.fail {
    background-color: rgba(224,91,75,0.1);
    color: $hn-danger;
  }
  &.cancel {
    background-color: $hn-green-50;
    color: $hn-text-3;
  }
  &.loading {
    background-color: $hn-green-50;
    color: $hn-green-500;
  }
}
.result-title {
  font-size: $font-size-title-lg;
  font-weight: $font-weight-semibold;
  color: $hn-text-1;
}
.result-desc {
  font-size: $font-size-caption;
  color: $hn-text-3;
}
.action-btns {
  display: flex;
  gap: $spacing-sm;
  margin-top: $spacing-lg;
}
.btn {
  padding: 0 48rpx;
  height: 80rpx;
  line-height: 80rpx;
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