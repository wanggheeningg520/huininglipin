<script setup lang="ts">
/**
 * FestivalEntry 节日专区入口
 * 对应 design.md 2.4.6 FestivalEntry：节日 Banner + 名称（轮播项）
 */
import type { FestivalZoneVO } from '@/api/types';

interface Props {
  festival: FestivalZoneVO;
}

const props = defineProps<Props>();

function onTap() {
  // linkUrl 形如 /pages/festival/index?id=1
  if (props.festival.linkUrl) {
    const url = props.festival.linkUrl.includes('?')
      ? props.festival.linkUrl
      : `${props.festival.linkUrl}?id=${props.festival.id}`;
    uni.navigateTo({ url });
  } else {
    uni.navigateTo({ url: `/pages/festival/index?id=${props.festival.id}` });
  }
}
</script>

<template>
  <view class="hn-festival-entry" @tap="onTap">
    <image class="festival-banner" :src="festival.bannerImage" mode="aspectFill" />
    <view class="festival-mask" />
    <view class="festival-info">
      <text class="festival-name">{{ festival.name }}</text>
      <text class="festival-cta">立即选购 ›</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.hn-festival-entry {
  position: relative;
  width: 100%;
  height: 240rpx;
  border-radius: $radius-card;
  overflow: hidden;
  box-shadow: $shadow-card;
}
.festival-banner {
  width: 100%;
  height: 100%;
}
.festival-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(31,42,28,0.5) 100%);
}
.festival-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: $spacing-sm;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}
.festival-name {
  font-size: $font-size-title-lg;
  font-weight: $font-weight-bold;
  color: #ffffff;
  text-shadow: 0 2rpx 8rpx rgba(0,0,0,0.3);
}
.festival-cta {
  font-size: $font-size-caption;
  color: $hn-gold-300;
  font-weight: $font-weight-semibold;
}
</style>