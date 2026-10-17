<script setup lang="ts">
/**
 * 节日专区页 MA-16
 * 对应 design.md 2.4.2 pages/festival/index
 * Banner+关联商品列表，空商品展示「商品筹备中」
 */
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { fetchFestivalDetail } from '@/api/modules/content';
import type { FestivalDetailVO } from '@/api/types';

import ProductList from '@/components/product/ProductList.vue';
import Skeleton from '@/components/common/Skeleton.vue';
import EmptyState from '@/components/common/EmptyState.vue';

const festivalId = ref(0);
const detail = ref<FestivalDetailVO | null>(null);
const loading = ref(true);

onLoad((query: any) => {
  festivalId.value = Number(query.id || 1);
  load();
});

async function load() {
  loading.value = true;
  try {
    detail.value = await fetchFestivalDetail(festivalId.value);
  } catch (e: any) {
    // 专区未上线或已下线 → 10004
    if (String(e?.code) === '10004') {
      uni.showToast({ title: '专区未上线', icon: 'none' });
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <view class="page-festival">
    <Skeleton v-if="loading" type="detail" :rows="3" />

    <template v-else-if="detail">
      <!-- 节日 Banner -->
      <image class="festival-banner" :src="detail.bannerImage" mode="aspectFill" />
      <view class="festival-name">
        <text class="name-text">{{ detail.name }}</text>
      </view>

      <!-- 关联商品列表 -->
      <ProductList
        v-if="detail.products.length"
        :products="detail.products"
        mode="grid"
        :finished="true"
      />
      <EmptyState
        v-else
        text="商品筹备中"
        desc="精彩即将上线，敬请期待"
      />
    </template>
  </view>
</template>

<style lang="scss" scoped>
.page-festival {
  min-height: 100vh;
  background-color: $hn-bg;
}
.festival-banner {
  width: 100%;
  height: 400rpx;
}
.festival-name {
  padding: $spacing-sm;
  .name-text {
    font-size: $font-size-title-lg;
    font-weight: $font-weight-bold;
    color: $hn-text-1;
  }
}
</style>