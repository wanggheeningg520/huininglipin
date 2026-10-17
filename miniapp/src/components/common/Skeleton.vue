<script setup lang="ts">
/**
 * Skeleton 骨架屏
 * 对应 design.md 2.4.6 Skeleton：支持 card/detail 类型
 */
interface Props {
  type?: 'card' | 'detail' | 'list';
  rows?: number;
  count?: number;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'card',
  rows: 2,
  count: 3
});

const cardList = Array.from({ length: props.count });
</script>

<template>
  <!-- 卡片骨架 -->
  <view v-if="type === 'card'" class="skeleton-card-list">
    <view v-for="(_, i) in cardList" :key="i" class="skeleton-card">
      <view class="skel-img shimmer" />
      <view class="skel-line shimmer" style="width: 80%; margin-top: 16rpx;" />
      <view class="skel-line shimmer" style="width: 50%;" />
    </view>
  </view>

  <!-- 列表骨架 -->
  <view v-else-if="type === 'list'" class="skeleton-list">
    <view v-for="(_, i) in cardList" :key="i" class="skeleton-row">
      <view class="skel-avatar shimmer" />
      <view class="skel-content">
        <view class="skel-line shimmer" style="width: 70%;" />
        <view class="skel-line shimmer" style="width: 40%;" />
      </view>
    </view>
  </view>

  <!-- 详情骨架 -->
  <view v-else class="skeleton-detail">
    <view class="skel-banner shimmer" />
    <view class="skel-line shimmer" style="width: 60%; height: 40rpx; margin-top: 24rpx;" />
    <view class="skel-line shimmer" style="width: 30%;" />
    <view v-for="i in rows" :key="i" class="skel-line shimmer" :style="{ width: `${100 - i * 10}%` }" />
  </view>
</template>

<style lang="scss" scoped>
.shimmer {
  background: linear-gradient(90deg, $hn-green-50 25%, $hn-green-100 37%, $hn-green-50 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
  border-radius: $radius-small;
}
@keyframes shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}

.skeleton-card-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
  padding: $spacing-sm;
}
.skeleton-card {
  width: calc(50% - #{$spacing-sm} / 2);
  background: #fff;
  border-radius: $radius-card;
  padding: $spacing-sm;
  box-shadow: $shadow-card;
}
.skel-img {
  width: 100%;
  height: 280rpx;
  border-radius: $radius-image;
}
.skel-line {
  height: 28rpx;
  margin-top: 12rpx;
}

.skeleton-list {
  padding: $spacing-sm;
}
.skeleton-row {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm 0;
  border-bottom: 1rpx solid $hn-line;
}
.skel-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  flex-shrink: 0;
}
.skel-content {
  flex: 1;
}

.skeleton-detail {
  padding: $spacing-sm;
}
.skel-banner {
  width: 100%;
  height: 600rpx;
  border-radius: $radius-image;
}
</style>