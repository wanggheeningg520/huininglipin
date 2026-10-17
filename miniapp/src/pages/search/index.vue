<script setup lang="ts">
/**
 * 搜索页 MA-16
 * 对应 design.md 2.4.2 pages/search/index
 * 搜索框+结果列表+排序筛选+空结果展示热门词与热门商品
 */
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { search } from '@/api/modules/content';
import { ProductSortBy } from '@/utils/constants';
import type { ProductCardVO } from '@/api/types';

import SearchBar from '@/components/common/SearchBar.vue';
import ProductList from '@/components/product/ProductList.vue';
import EmptyState from '@/components/common/EmptyState.vue';

const keyword = ref('');
const hotKeywords = ref<string[]>([]);
const results = ref<ProductCardVO[]>([]);
const loading = ref(false);
const searched = ref(false);
const sortBy = ref<string>(ProductSortBy.DEFAULT);

const sortOptions = [
  { label: '综合', value: ProductSortBy.DEFAULT },
  { label: '销量', value: ProductSortBy.SALES_DESC },
  { label: '价格↑', value: ProductSortBy.PRICE_ASC },
  { label: '价格↓', value: ProductSortBy.PRICE_DESC }
];

onLoad((query: any) => {
  if (query.keyword) {
    keyword.value = decodeURIComponent(query.keyword);
    doSearch();
  } else {
    loadHot();
  }
});

async function loadHot() {
  const res = await search({ keyword: '' });
  hotKeywords.value = res.hotKeywords || [];
}

async function doSearch() {
  if (!keyword.value.trim()) {
    loadHot();
    return;
  }
  loading.value = true;
  searched.value = true;
  try {
    const res = await search({ keyword: keyword.value, sortBy: sortBy.value });
    results.value = res.list;
    hotKeywords.value = res.hotKeywords || [];
  } finally {
    loading.value = false;
  }
}

function onSort(value: string) {
  sortBy.value = value;
  if (keyword.value) doSearch();
}

function onHotWord(word: string) {
  keyword.value = word;
  doSearch();
}
</script>

<template>
  <view class="page-search">
    <!-- 搜索框 -->
    <view class="search-header">
      <SearchBar :keyword="keyword" @search="(k) => { keyword = k; }" />
      <text class="search-btn" @tap="doSearch">搜索</text>
    </view>

    <!-- 排序栏（有结果时） -->
    <view v-if="searched && results.length" class="sort-bar">
      <view
        v-for="opt in sortOptions"
        :key="opt.value"
        class="sort-item"
        :class="{ active: sortBy === opt.value }"
        @tap="onSort(opt.value)"
      >
        <text>{{ opt.label }}</text>
      </view>
    </view>

    <!-- 搜索结果 -->
    <ProductList
      v-if="searched && results.length"
      :products="results"
      mode="grid"
      :finished="true"
    />

    <!-- 空结果 -->
    <view v-else-if="searched && !loading" class="empty-wrap">
      <EmptyState text="未找到相关商品" desc="换个关键词试试吧" />
      <view v-if="hotKeywords.length" class="hot-section">
        <text class="hot-title">热门搜索</text>
        <view class="hot-tags">
          <view v-for="w in hotKeywords" :key="w" class="hot-tag" @tap="onHotWord(w)">
            <text>{{ w }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 初始状态：热门词 -->
    <view v-else class="hot-wrap">
      <view v-if="hotKeywords.length" class="hot-section">
        <text class="hot-title">热门搜索</text>
        <view class="hot-tags">
          <view v-for="w in hotKeywords" :key="w" class="hot-tag" @tap="onHotWord(w)">
            <text>{{ w }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-search {
  min-height: 100vh;
  background-color: $hn-bg;
}
.search-header {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm;
  background-color: #ffffff;
  box-shadow: $shadow-card;
}
.search-btn {
  color: $hn-green-700;
  font-size: $font-size-body;
  font-weight: $font-weight-semibold;
  padding: 0 16rpx;
}
.sort-bar {
  display: flex;
  background-color: #ffffff;
  padding: $spacing-sm 0;
  margin-top: 1rpx;
}
.sort-item {
  flex: 1;
  text-align: center;
  font-size: $font-size-body;
  color: $hn-text-2;
  &.active {
    color: $hn-green-700;
    font-weight: $font-weight-semibold;
  }
}
.empty-wrap, .hot-wrap {
  padding: $spacing-sm;
}
.hot-section {
  margin-top: $spacing-lg;
}
.hot-title {
  font-size: $font-size-title;
  font-weight: $font-weight-semibold;
  color: $hn-text-1;
  display: block;
  margin-bottom: $spacing-sm;
}
.hot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}
.hot-tag {
  padding: 12rpx 24rpx;
  background-color: $hn-green-50;
  border-radius: $radius-btn;
  font-size: $font-size-caption;
  color: $hn-green-700;
}
</style>