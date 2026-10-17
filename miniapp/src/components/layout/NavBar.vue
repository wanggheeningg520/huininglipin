<script setup lang="ts">
/**
 * NavBar 导航栏
 * 对应 design.md 2.4.6 NavBar：title + back
 */
import { ref } from 'vue';

interface Props {
  title?: string;
  back?: boolean;
  bgColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  back: true,
  bgColor: '#FAFCF8'
});

const statusBarHeight = ref(0);
try {
  const sys = uni.getSystemInfoSync();
  statusBarHeight.value = sys.statusBarHeight || 0;
} catch {
  /* ignore */
}

function onBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
  } else {
    uni.switchTab({ url: '/pages/home/index' });
  }
}
</script>

<template>
  <view class="hn-navbar" :style="{ backgroundColor: bgColor }">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />
    <view class="nav-content">
      <view v-if="back" class="nav-back" @tap="onBack">
        <text class="back-icon">‹</text>
      </view>
      <view v-else class="nav-back" />
      <text class="nav-title">{{ title }}</text>
      <view class="nav-right">
        <slot name="right" />
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.hn-navbar {
  width: 100%;
}
.status-bar {
  width: 100%;
}
.nav-content {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 $spacing-sm;
  position: relative;
}
.nav-back {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  .back-icon {
    font-size: 56rpx;
    color: $hn-text-1;
  }
}
.nav-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: $font-size-title;
  font-weight: $font-weight-semibold;
  color: $hn-text-1;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.nav-right {
  display: flex;
  align-items: center;
}
</style>