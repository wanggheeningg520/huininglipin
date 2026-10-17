<script setup lang="ts">
/**
 * EmptyState 空状态
 * 对应 design.md 2.4.6 EmptyState：自定义图文
 */
interface Props {
  text?: string;
  desc?: string;
  image?: string;
  icon?: string;
}

withDefaults(defineProps<Props>(), {
  text: '暂无数据',
  desc: '',
  image: '',
  icon: 'empty'
});
</script>

<template>
  <view class="hn-empty">
    <image v-if="image" class="empty-img" :src="image" mode="aspectFit" />
    <view v-else class="empty-icon">
      <text class="iconfont">{{ icon === 'empty' ? '📭' : icon }}</text>
    </view>
    <text class="empty-text">{{ text }}</text>
    <text v-if="desc" class="empty-desc">{{ desc }}</text>
    <slot />
  </view>
</template>

<style lang="scss" scoped>
.hn-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-xl 0;
}
.empty-img {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: $spacing-md;
}
.empty-icon {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background-color: $hn-green-50;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: $spacing-md;
  .iconfont {
    font-size: 64rpx;
  }
}
.empty-text {
  font-size: $font-size-body;
  color: $hn-text-2;
  font-weight: $font-weight-semibold;
}
.empty-desc {
  font-size: $font-size-caption;
  color: $hn-text-3;
  margin-top: $spacing-xs;
  line-height: $line-height-body;
}
</style>