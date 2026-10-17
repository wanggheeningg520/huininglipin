<script setup lang="ts">
/**
 * CategoryGrid 品类金刚区
 * 对应 design.md 2.4.6 CategoryGrid：四大品类入口（线性图标）
 */
import type { CategoryNode } from '@/api/types';

interface Props {
  categories: CategoryNode[];
  column?: number;
}

const props = withDefaults(defineProps<Props>(), {
  column: 4
});

// 品类图标 emoji 映射（一期用 emoji 占位，二期替换线性 SVG 图标）
const ICON_MAP: Record<string, string> = {
  食品: '🍱',
  节日: '🎉',
  水果: '🍑',
  '雅趣伴手礼': '🎁'
};

function getIcon(name: string): string {
  return ICON_MAP[name] || '🛍️';
}

function onTap(cat: CategoryNode) {
  uni.navigateTo({ url: `/pages/product/list?categoryId=${cat.id}&name=${encodeURIComponent(cat.name)}` });
}
</script>

<template>
  <view class="hn-category-grid">
    <view
      v-for="cat in categories"
      :key="cat.id"
      class="grid-item"
      @tap="onTap(cat)"
    >
      <view class="grid-icon">
        <text class="icon-emoji">{{ getIcon(cat.name) }}</text>
      </view>
      <text class="grid-name">{{ cat.name }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.hn-category-grid {
  display: flex;
  flex-wrap: wrap;
  background-color: #ffffff;
  border-radius: $radius-card;
  padding: $spacing-md 0;
  box-shadow: $shadow-card;
}
.grid-item {
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
}
.grid-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background-color: $hn-green-50;
  display: flex;
  align-items: center;
  justify-content: center;
  // 线性 2px 描边圆头风格
  border: 2rpx solid $hn-green-100;
  .icon-emoji {
    font-size: 48rpx;
  }
}
.grid-name {
  font-size: $font-size-caption;
  color: $hn-text-2;
  font-weight: $font-weight-semibold;
}
</style>