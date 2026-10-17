<script setup lang="ts">
/**
 * TabBar 底部导航
 * 对应 design.md 2.4.6 TabBar
 * 注：uni-app 原生 tabBar 通过 pages.json 配置，此组件用于非 tabBar 页面自定义底部栏
 */
interface Props {
  current?: number;
}

withDefaults(defineProps<Props>(), {
  current: 0
});

const tabs = [
  { text: '首页', path: '/pages/home/index', icon: '🏠' },
  { text: '分类', path: '/pages/category/index', icon: '📋' },
  { text: '礼品卡', path: '/pages/giftcard/index', icon: '💳' },
  { text: '我的', path: '/pages/member/index', icon: '👤' }
];

function onTap(path: string) {
  uni.switchTab({ url: path });
}
</script>

<template>
  <view class="hn-tabbar">
    <view v-for="(tab, i) in tabs" :key="i" class="tab-item" :class="{ active: i === current }" @tap="onTap(tab.path)">
      <text class="tab-icon">{{ tab.icon }}</text>
      <text class="tab-text">{{ tab.text }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.hn-tabbar {
  display: flex;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background-color: #ffffff;
  box-shadow: 0 -2rpx 12rpx rgba(111, 179, 90, 0.06);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  .tab-icon {
    font-size: 40rpx;
  }
  .tab-text {
    font-size: 20rpx;
    color: $hn-text-3;
  }
  &.active {
    .tab-text {
      color: $hn-green-500;
      font-weight: $font-weight-semibold;
    }
  }
}
</style>