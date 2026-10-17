<script setup lang="ts">
/**
 * LoadMore 加载更多
 * 对应 design.md 2.4.6 LoadMore：三态 loading/finished/error
 */
interface Props {
  status: 'loading' | 'finished' | 'error';
  finishedText?: string;
  errorText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  finishedText: '没有更多了',
  errorText: '加载失败，点击重试'
});

const emit = defineEmits<{ (e: 'retry'): void }>();
</script>

<template>
  <view class="hn-loadmore">
    <template v-if="status === 'loading'">
      <view class="loading-dot" />
      <text class="loadmore-text">加载中...</text>
    </template>
    <template v-else-if="status === 'finished'">
      <view class="finished-line" />
      <text class="loadmore-text">{{ finishedText }}</text>
      <view class="finished-line" />
    </template>
    <template v-else>
      <text class="loadmore-text error" @tap="emit('retry')">{{ errorText }}</text>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.hn-loadmore {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-md 0;
  gap: $spacing-xs;
}
.loadmore-text {
  font-size: $font-size-caption;
  color: $hn-text-3;
  &.error {
    color: $hn-danger;
  }
}
.loading-dot {
  width: 24rpx;
  height: 24rpx;
  border: 3rpx solid $hn-green-100;
  border-top-color: $hn-green-500;
  border-radius: 50%;
  animation: rotate 0.8s linear infinite;
}
@keyframes rotate {
  to { transform: rotate(360deg); }
}
.finished-line {
  width: 60rpx;
  height: 1rpx;
  background-color: $hn-line;
}
</style>