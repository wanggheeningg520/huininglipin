<script setup lang="ts">
/**
 * 个人中心 MA-15
 * 对应 design.md 2.4.2 pages/member/index
 * 头像+昵称+订单入口（待支付/待发货/待收货/退款）+地址管理+关于
 */
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/modules/user';
import { useCartStore } from '@/store/modules/cart';
import { OrderStatus } from '@/utils/constants';

const userStore = useUserStore();
const cartStore = useCartStore();

onShow(() => {
  userStore.restore();
  if (userStore.isLogged) {
    userStore.fetchProfile().catch(() => { /* ignore */ });
  }
});

const orderEntries = [
  { label: '待支付', status: OrderStatus.PENDING_PAY, icon: '💰' },
  { label: '待发货', status: OrderStatus.PENDING_SHIP, icon: '📦' },
  { label: '待收货', status: OrderStatus.PENDING_RECEIVE, icon: '🚚' },
  { label: '退款/售后', status: '退款', icon: '↩️' }
];

function goOrderList(status: string) {
  if (!userStore.isLogged) {
    uni.navigateTo({ url: '/pages/login/index' });
    return;
  }
  uni.navigateTo({ url: `/pages/order/list?status=${encodeURIComponent(status)}` });
}

function goAddress() {
  if (!userStore.isLogged) {
    uni.navigateTo({ url: '/pages/login/index' });
    return;
  }
  uni.navigateTo({ url: '/pages/member/address/list' });
}

function goProfile() {
  if (!userStore.isLogged) {
    uni.navigateTo({ url: '/pages/login/index' });
    return;
  }
  uni.navigateTo({ url: '/pages/member/profile' });
}

function goLogin() {
  uni.navigateTo({ url: '/pages/login/index' });
}

function goCart() {
  uni.switchTab({ url: '/pages/cart/index' });
}
</script>

<template>
  <view class="page-member">
    <!-- 用户信息头部 -->
    <view class="member-header">
      <view class="user-info" @tap="userStore.isLogged ? goProfile() : goLogin()">
        <image class="avatar" :src="userStore.avatar || 'https://cdn.example.com/mock/avatar.png'" mode="aspectFill" />
        <view class="user-text">
          <text class="nickname">{{ userStore.isLogged ? userStore.nickname : '点击登录' }}</text>
          <text v-if="userStore.isLogged" class="level">会员等级：Lv{{ userStore.userInfo?.level || 1 }}</text>
        </view>
      </view>
      <view class="header-bg" />
    </view>

    <!-- 我的订单 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">我的订单</text>
        <text class="section-more" @tap="goOrderList('全部')">查看全部 ›</text>
      </view>
      <view class="order-entries">
        <view
          v-for="entry in orderEntries"
          :key="entry.label"
          class="order-entry"
          @tap="goOrderList(entry.status)"
        >
          <text class="entry-icon">{{ entry.icon }}</text>
          <text class="entry-label">{{ entry.label }}</text>
        </view>
      </view>
    </view>

    <!-- 功能入口 -->
    <view class="section func-section">
      <view class="func-item" @tap="goAddress">
        <text class="func-icon">📍</text>
        <text class="func-label">收货地址</text>
        <text class="func-arrow">›</text>
      </view>
      <view class="func-item" @tap="goCart">
        <text class="func-icon">🛒</text>
        <text class="func-label">购物车</text>
        <text class="func-arrow">›</text>
      </view>
      <view class="func-item">
        <text class="func-icon">📞</text>
        <text class="func-label">联系客服</text>
        <text class="func-arrow">›</text>
      </view>
      <view class="func-item">
        <text class="func-icon">ℹ️</text>
        <text class="func-label">关于慧宁甄选</text>
        <text class="func-arrow">›</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-member {
  min-height: 100vh;
  background-color: $hn-bg;
  padding-bottom: 120rpx;
}
.member-header {
  position: relative;
  padding: $spacing-lg $spacing-sm;
  background-image: $gradient-primary;
}
.header-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(111,179,90,0.1) 0%, transparent 100%);
  pointer-events: none;
}
.user-info {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  position: relative;
}
.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255,255,255,0.5);
}
.user-text {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.nickname {
  font-size: $font-size-title-lg;
  font-weight: $font-weight-bold;
  color: #ffffff;
}
.level {
  font-size: $font-size-caption;
  color: rgba(255,255,255,0.9);
}

.section {
  margin: $spacing-sm;
  padding: $spacing-sm;
  background-color: #ffffff;
  border-radius: $radius-card;
  box-shadow: $shadow-card;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-sm;
}
.section-title {
  font-size: $font-size-title;
  font-weight: $font-weight-semibold;
  color: $hn-text-1;
}
.section-more {
  font-size: $font-size-caption;
  color: $hn-text-3;
}
.order-entries {
  display: flex;
}
.order-entry {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: $spacing-sm 0;
}
.entry-icon {
  font-size: 48rpx;
}
.entry-label {
  font-size: $font-size-caption;
  color: $hn-text-2;
}

.func-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm 0;
  & + .func-item {
    border-top: 1rpx solid $hn-line;
  }
}
.func-icon {
  font-size: 40rpx;
  width: 48rpx;
  text-align: center;
}
.func-label {
  flex: 1;
  font-size: $font-size-body;
  color: $hn-text-1;
}
.func-arrow {
  font-size: 40rpx;
  color: $hn-text-3;
}
</style>