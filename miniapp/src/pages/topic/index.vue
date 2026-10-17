<script setup lang="ts">
/**
 * 专题页 MA-16
 * 对应 design.md 2.4.2 pages/topic/index
 * 专题 Banner + 关联商品
 */
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { fetchTopic } from '@/api/modules/content';
import type { TopicVO } from '@/api/types';

import ProductList from '@/components/product/ProductList.vue';
import Skeleton from '@/components/common/Skeleton.vue';

const topicId = ref(0);
const detail = ref<TopicVO | null>(null);
const loading = ref(true);

onLoad((query: any) => {
  topicId.value = Number(query.id || 1);
  load();
});

async function load() {
  loading.value = true;
  try {
    detail.value = await fetchTopic(topicId.value);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <view class="page-topic">
    <Skeleton v-if="loading" type="detail" :rows="3" />
    <template v-else-if="detail">
      <image class="topic-banner" :src="detail.banner" mode="aspectFill" />
      <view class="topic-title">
        <text class="title-text">{{ detail.title }}</text>
      </view>
      <ProductList :products="detail.products" mode="grid" :finished="true" />
    </template>
  </view>
</template>

<style lang="scss" scoped>
.page-topic {
  min-height: 100vh;
  background-color: $hn-bg;
}
.topic-banner {
  width: 100%;
  height: 360rpx;
}
.topic-title {
  padding: $spacing-sm;
  .title-text {
    font-size: $font-size-title-lg;
    font-weight: $font-weight-bold;
    color: $hn-text-1;
  }
}
</style>