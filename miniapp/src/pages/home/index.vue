<script setup lang="ts">
/**
 * 首页 MA-08
 * 对应 design.md 2.4.2 pages/home/index
 * 布局：搜索栏+定位 → 节日专区轮播（日历驱动）→ 四大品类金刚区 → 当季鲜果预售位
 *       → 礼品卡推荐位占位 → 精选瀑布流 → TabBar
 * 调用 GET /api/v1/content/home 聚合接口
 */
import { ref, onMounted } from 'vue';
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { fetchHome, fetchRecommend } from '@/api/modules/content';
import type { HomeAggVO, ProductCardVO } from '@/api/types';

import SearchBar from '@/components/common/SearchBar.vue';
import BannerSwiper from '@/components/common/BannerSwiper.vue';
import CategoryGrid from '@/components/common/CategoryGrid.vue';
import FestivalEntry from '@/components/festival/FestivalEntry.vue';
import ProductCard from '@/components/product/ProductCard.vue';
import ProductList from '@/components/product/ProductList.vue';
import Skeleton from '@/components/common/Skeleton.vue';

const homeData = ref<HomeAggVO | null>(null);
const loading = ref(true);

// 精选推荐瀑布流
const recommends = ref<ProductCardVO[]>([]);
const page = ref(1);
const pageSize = 20;
const total = ref(0);
const recommendLoading = ref(false);
const finished = ref(false);

async function loadHome() {
  loading.value = true;
  try {
    homeData.value = await fetchHome();
    // 首屏推荐
    recommends.value = homeData.value.recommends || [];
    total.value = 20; // mock 总数
  } finally {
    loading.value = false;
  }
}

async function loadMore() {
  if (finished.value || recommendLoading.value) return;
  recommendLoading.value = true;
  try {
    page.value += 1;
    const res = await fetchRecommend({ page: page.value, pageSize });
    recommends.value = recommends.value.concat(res.list);
    if (recommends.value.length >= total.value || !res.list.length) {
      finished.value = true;
    }
  } finally {
    recommendLoading.value = false;
  }
}

onMounted(loadHome);

onPullDownRefresh(async () => {
  page.value = 1;
  finished.value = false;
  await loadHome();
  uni.stopPullDownRefresh();
});

onReachBottom(loadMore);

function goFestival(id: number) {
  uni.navigateTo({ url: `/pages/festival/index?id=${id}` });
}
</script>

<template>
  <view class="page-home">
    <!-- 1. 搜索栏 + 定位 -->
    <view class="home-header">
      <view class="location">
        <text class="loc-icon">📍</text>
        <text class="loc-text">北京</text>
      </view>
      <view class="search-wrap">
        <SearchBar disabled />
      </view>
    </view>

    <Skeleton v-if="loading" type="detail" :rows="4" />

    <template v-else-if="homeData">
      <!-- 2. 节日专区轮播（日历驱动） -->
      <view v-if="homeData.festivals.length" class="section festival-section">
        <swiper class="festival-swiper" autoplay circular :interval="5000" previous-margin="40rpx" next-margin="40rpx">
          <swiper-item v-for="f in homeData.festivals" :key="f.id">
            <FestivalEntry :festival="f" />
          </swiper-item>
        </swiper>
      </view>

      <!-- 3. 四大品类金刚区 -->
      <view class="section">
        <CategoryGrid :categories="homeData.categories" />
      </view>

      <!-- 4. 当季鲜果预售位 -->
      <view v-if="homeData.presaleProducts.length" class="section presale-section">
        <view class="section-header">
          <text class="section-title">当季鲜果 · 预售</text>
          <text class="section-more">查看更多 ›</text>
        </view>
        <scroll-view scroll-x class="presale-scroll">
          <view class="presale-list">
            <ProductCard
              v-for="p in homeData.presaleProducts"
              :key="p.id"
              :product="p"
              mode="grid"
            />
          </view>
        </scroll-view>
      </view>

      <!-- 5. 礼品卡推荐位占位（一期展示二期预告） -->
      <view class="section giftcard-placeholder">
        <view class="placeholder-card">
          <text class="placeholder-icon">💳</text>
          <view class="placeholder-text">
            <text class="placeholder-title">礼品卡功能即将开放</text>
            <text class="placeholder-desc">企业集采 / 节日送礼，敬请期待</text>
          </view>
        </view>
      </view>

      <!-- 6. 精选商品瀑布流 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">精选好礼</text>
        </view>
        <ProductList
          :products="recommends"
          mode="grid"
          :loading="recommendLoading"
          :finished="finished"
        />
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.page-home {
  min-height: 100vh;
  background-color: $hn-bg;
  padding-bottom: 120rpx;
}
.home-header {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm;
  background-color: #ffffff;
  box-shadow: $shadow-card;
}
.location {
  display: flex;
  align-items: center;
  gap: 4rpx;
  .loc-icon { font-size: 28rpx; }
  .loc-text { font-size: $font-size-caption; color: $hn-text-2; }
}
.search-wrap { flex: 1; }

.section {
  margin-top: $spacing-sm;
  padding: 0 $spacing-sm;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-sm 0;
}
.section-title {
  font-size: $font-size-title;
  font-weight: $font-weight-semibold;
  color: $hn-text-1;
}
.section-more {
  font-size: $font-size-caption;
  color: $hn-text-3;
}

.festival-section {
  padding: $spacing-sm;
}
.festival-swiper {
  height: 240rpx;
}

.presale-scroll {
  white-space: nowrap;
}
.presale-list {
  display: inline-flex;
  gap: $spacing-sm;
  padding-bottom: $spacing-xs;
  .hn-product-card {
    width: 280rpx !important;
  }
}

.giftcard-placeholder {
  .placeholder-card {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    background-image: $gradient-gold;
    padding: $spacing-md;
    border-radius: $radius-card;
    box-shadow: $shadow-card;
  }
  .placeholder-icon {
    font-size: 64rpx;
  }
  .placeholder-text {
    display: flex;
    flex-direction: column;
    gap: 4rpx;
  }
  .placeholder-title {
    font-size: $font-size-title;
    font-weight: $font-weight-bold;
    color: #ffffff;
  }
  .placeholder-desc {
    font-size: $font-size-caption;
    color: rgba(255,255,255,0.85);
  }
}
</style>