<script setup lang="ts">
/**
 * BannerSwiper Banner 轮播
 * 对应 design.md 2.4.6 BannerSwiper
 */
import type { BannerVO } from '@/api/types';

interface Props {
  banners: BannerVO[];
  height?: string;
  autoplay?: boolean;
  interval?: number;
}

const props = withDefaults(defineProps<Props>(), {
  height: '320rpx',
  autoplay: true,
  interval: 4000
});

const emit = defineEmits<{ (e: 'tap', banner: BannerVO): void }>();

function onTap(banner: BannerVO) {
  emit('tap', banner);
  // 根据 linkType 跳转
  if (banner.linkType === 'product' && banner.linkValue) {
    uni.navigateTo({ url: `/pages/product/detail?id=${banner.linkValue}` });
  } else if (banner.linkType === 'festival' && banner.linkValue) {
    uni.navigateTo({ url: `/pages/festival/index?id=${banner.linkValue}` });
  } else if (banner.linkType === 'topic' && banner.linkValue) {
    uni.navigateTo({ url: `/pages/topic/index?id=${banner.linkValue}` });
  }
}
</script>

<template>
  <swiper
    v-if="banners.length"
    class="hn-banner-swiper"
    :style="{ height }"
    :autoplay="autoplay"
    :interval="interval"
    circular
    indicator-dots
    indicator-active-color="#6FB35A"
    indicator-color="rgba(111,179,90,0.3)"
  >
    <swiper-item v-for="item in banners" :key="item.id" @tap="onTap(item)">
      <image class="banner-img" :src="item.image" mode="aspectFill" />
    </swiper-item>
  </swiper>
</template>

<style lang="scss" scoped>
.hn-banner-swiper {
  width: 100%;
  border-radius: $radius-card;
  overflow: hidden;
}
.banner-img {
  width: 100%;
  height: 100%;
  border-radius: $radius-card;
}
</style>