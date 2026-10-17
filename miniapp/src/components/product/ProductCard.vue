<script setup lang="ts">
/**
 * ProductCard 商品卡片
 * 对应 design.md 2.4.6 ProductCard：主图+标题+价格+销量+预售角标
 */
import type { ProductCardVO } from '@/api/types';
import Price from '@/components/common/Price.vue';

interface Props {
  product: ProductCardVO;
  mode?: 'grid' | 'list';
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'grid'
});

function onTap() {
  uni.navigateTo({ url: `/pages/product/detail?id=${props.product.id}` });
}
</script>

<template>
  <view class="hn-product-card" :class="mode" @tap="onTap">
    <view class="card-img-wrap">
      <image class="card-img" :src="product.mainImage" mode="aspectFill" lazy-load />
      <view v-if="product.isPresale" class="presale-badge">预售</view>
    </view>
    <view class="card-info">
      <text class="card-title">{{ product.title }}</text>
      <view class="card-meta">
        <text class="sales">已售 {{ product.sales }}</text>
      </view>
      <view class="card-bottom">
        <Price :value="product.priceFrom" color="gold" size="md" :market-price="product.marketPriceFrom" />
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.hn-product-card {
  background-color: #ffffff;
  border-radius: $radius-card;
  box-shadow: $shadow-card;
  overflow: hidden;
}
.grid {
  width: calc(50% - #{$spacing-sm} / 2);
  .card-img-wrap {
    width: 100%;
    height: 280rpx;
  }
  .card-title {
    -webkit-line-clamp: 2;
  }
}
.list {
  display: flex;
  gap: $spacing-sm;
  padding: $spacing-sm;
  .card-img-wrap {
    width: 200rpx;
    height: 200rpx;
    flex-shrink: 0;
  }
  .card-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .card-title {
    -webkit-line-clamp: 2;
  }
}
.card-img-wrap {
  position: relative;
  border-radius: $radius-image;
  overflow: hidden;
}
.card-img {
  width: 100%;
  height: 100%;
}
.presale-badge {
  position: absolute;
  top: 12rpx;
  left: 12rpx;
  padding: 4rpx 16rpx;
  background-image: $gradient-gold;
  color: #ffffff;
  font-size: 20rpx;
  font-weight: $font-weight-semibold;
  border-radius: $radius-small;
}
.card-info {
  padding: $spacing-sm;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.card-title {
  font-size: $font-size-body;
  color: $hn-text-1;
  line-height: $line-height-body;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  min-height: 2em;
}
.card-meta {
  .sales {
    font-size: $font-size-caption;
    color: $hn-text-3;
  }
}
.card-bottom {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
</style>