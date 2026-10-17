<script setup lang="ts">
/**
 * 礼品卡占位页 MA-17
 * 对应 design.md 2.4.2 pages/giftcard/index
 * 一期展示「即将开放」占位（为二期预留）
 */
</script>

<template>
  <view class="page-giftcard">
    <view class="placeholder">
      <view class="card-icon">💳</view>
      <text class="card-title">礼品卡功能即将开放</text>
      <text class="card-desc">企业集采 · 节日送礼 · 个性定制</text>
      <text class="card-tip">二期上线，敬请期待</text>
      <view class="feature-list">
        <view class="feature-item">
          <text class="feature-icon">🎁</text>
          <text class="feature-text">多种卡面可选</text>
        </view>
        <view class="feature-item">
          <text class="feature-icon">📊</text>
          <text class="feature-text">企业批量采购</text>
        </view>
        <view class="feature-item">
          <text class="feature-icon">✨</text>
          <text class="feature-text">个性定制祝福</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-giftcard {
  min-height: 100vh;
  background-color: $hn-bg;
  display: flex;
  align-items: center;
  justify-content: center;
}
.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-xl;
}
.card-icon {
  font-size: 160rpx;
  margin-bottom: $spacing-sm;
}
.card-title {
  font-size: $font-size-title-lg;
  font-weight: $font-weight-bold;
  color: $hn-text-1;
}
.card-desc {
  font-size: $font-size-body;
  color: $hn-text-2;
}
.card-tip {
  font-size: $font-size-caption;
  color: $hn-gold-700;
  background-color: $hn-gold-100;
  padding: 4rpx 24rpx;
  border-radius: $radius-btn;
  margin-top: 8rpx;
}
.feature-list {
  display: flex;
  gap: $spacing-lg;
  margin-top: $spacing-lg;
}
.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}
.feature-icon {
  font-size: 56rpx;
}
.feature-text {
  font-size: $font-size-caption;
  color: $hn-text-2;
}
</style>