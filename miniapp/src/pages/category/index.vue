<script setup lang="ts">
/**
 * 分类页 MA-09
 * 对应 design.md 2.4.2 pages/category/index
 * 四大品类列表 + 二级分类
 */
import { ref, onMounted } from 'vue';
import { fetchCategories } from '@/api/modules/product';
import type { CategoryNode } from '@/api/types';
import Skeleton from '@/components/common/Skeleton.vue';

const categories = ref<CategoryNode[]>([]);
const loading = ref(true);
const activeId = ref<number>(0);

const ICON_MAP: Record<string, string> = {
  食品: '🍱', 节日: '🎉', 水果: '🍑', '雅趣伴手礼': '🎁'
};

async function load() {
  loading.value = true;
  try {
    categories.value = await fetchCategories();
    if (categories.value.length) activeId.value = categories.value[0].id;
  } finally {
    loading.value = false;
  }
}

onMounted(load);

const activeCategory = ref<CategoryNode | null>(null);
import { watch } from 'vue';
watch(activeId, (id) => {
  activeCategory.value = categories.value.find((c) => c.id === id) || null;
}, { immediate: true });

function goProductList(cat: CategoryNode) {
  uni.navigateTo({ url: `/pages/product/list?categoryId=${cat.id}&name=${encodeURIComponent(cat.name)}` });
}
</script>

<template>
  <view class="page-category">
    <Skeleton v-if="loading" type="list" :count="4" />
    <view v-else class="category-layout">
      <!-- 左侧一级分类 -->
      <scroll-view scroll-y class="sidebar">
        <view
          v-for="cat in categories"
          :key="cat.id"
          class="sidebar-item"
          :class="{ active: cat.id === activeId }"
          @tap="activeId = cat.id"
        >
          <text class="sidebar-icon">{{ ICON_MAP[cat.name] || '🛍️' }}</text>
          <text class="sidebar-name">{{ cat.name }}</text>
        </view>
      </scroll-view>

      <!-- 右侧二级分类 -->
      <scroll-view scroll-y class="content">
        <view v-if="activeCategory" class="content-inner">
          <view class="content-header">
            <text class="content-title">{{ activeCategory.name }}</text>
          </view>
          <view class="sub-grid">
            <view
              v-for="sub in activeCategory.children"
              :key="sub.id"
              class="sub-item"
              @tap="goProductList(sub)"
            >
              <view class="sub-icon">
                <text>{{ ICON_MAP[activeCategory.name] || '📦' }}</text>
              </view>
              <text class="sub-name">{{ sub.name }}</text>
            </view>
          </view>
          <view class="all-entry" @tap="goProductList(activeCategory)">
            <text class="all-text">查看全部 {{ activeCategory.name }} ›</text>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-category {
  height: 100vh;
  background-color: $hn-bg;
}
.category-layout {
  display: flex;
  height: 100%;
}
.sidebar {
  width: 180rpx;
  height: 100%;
  background-color: $hn-green-50;
}
.sidebar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: $spacing-sm 0;
  position: relative;
  .sidebar-icon { font-size: 40rpx; }
  .sidebar-name {
    font-size: $font-size-caption;
    color: $hn-text-2;
  }
  &.active {
    background-color: #ffffff;
    .sidebar-name {
      color: $hn-green-700;
      font-weight: $font-weight-semibold;
    }
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 6rpx;
      height: 48rpx;
      background-image: $gradient-primary;
      border-radius: 0 6rpx 6rpx 0;
    }
  }
}
.content {
  flex: 1;
  height: 100%;
  padding: $spacing-sm;
}
.content-inner {
  background-color: #ffffff;
  border-radius: $radius-card;
  padding: $spacing-sm;
  box-shadow: $shadow-card;
}
.content-header {
  padding-bottom: $spacing-sm;
  border-bottom: 1rpx solid $hn-line;
}
.content-title {
  font-size: $font-size-title;
  font-weight: $font-weight-semibold;
  color: $hn-text-1;
}
.sub-grid {
  display: flex;
  flex-wrap: wrap;
  padding: $spacing-sm 0;
}
.sub-item {
  width: 33.33%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: $spacing-sm 0;
}
.sub-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background-color: $hn-green-50;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid $hn-green-100;
  font-size: 40rpx;
}
.sub-name {
  font-size: $font-size-caption;
  color: $hn-text-2;
}
.all-entry {
  text-align: center;
  padding: $spacing-sm 0;
  .all-text {
    font-size: $font-size-caption;
    color: $hn-green-700;
  }
}
</style>