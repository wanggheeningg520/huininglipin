<script setup lang="ts">
/**
 * 商品详情页 MA-10
 * 对应 design.md 2.4.2 pages/product/detail
 * 轮播图 + 规格选择（售罄禁用）+ 加购 + 立即购买
 * 预售商品展示预售角标+倒计时+预计发货日
 * 生鲜（水果品类）公示不支持无理由退货+冷链物流
 */
import { ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { fetchProductDetail } from '@/api/modules/product';
import type { ProductDetailVO, SkuInfo } from '@/api/types';

import Price from '@/components/common/Price.vue';
import SpecSelector from '@/components/product/SpecSelector.vue';
import PresaleCountdown from '@/components/presale/PresaleCountdown.vue';
import ComplianceTip from '@/components/common/ComplianceTip.vue';
import Skeleton from '@/components/common/Skeleton.vue';
import { useCart } from '@/hooks/useCart';
import { requireAuth } from '@/utils/auth';

const productId = ref(0);
const detail = ref<ProductDetailVO | null>(null);
const loading = ref(true);
const selectedSku = ref<SkuInfo | null>(null);
const currentImg = ref(0);
const qty = ref(1);

const { addToCart } = useCart();

onLoad((query: any) => {
  productId.value = Number(query.id || 101);
  loadDetail();
});

async function loadDetail() {
  loading.value = true;
  try {
    detail.value = await fetchProductDetail(productId.value);
    // 默认选中第一个在售 SKU
    selectedSku.value = detail.value.skus.find((s) => !s.soldOut) || detail.value.skus[0] || null;
  } finally {
    loading.value = false;
  }
}

function onSelectSku(sku: SkuInfo) {
  selectedSku.value = sku;
}

const canBuy = computed(() => selectedSku.value && !selectedSku.value.soldOut);

function onAddCart() {
  if (!requireAuth()) return;
  if (!selectedSku.value || selectedSku.value.soldOut) {
    uni.showToast({ title: '请选择有效规格', icon: 'none' });
    return;
  }
  addToCart(selectedSku.value.id, qty.value);
}

function onBuyNow() {
  if (!requireAuth()) return;
  if (!selectedSku.value || selectedSku.value.soldOut) {
    uni.showToast({ title: '请选择有效规格', icon: 'none' });
    return;
  }
  const sku = selectedSku.value;
  uni.navigateTo({
    url: `/pages/order/confirm?skuId=${sku.id}&qty=${qty.value}&productId=${productId.value}`
  });
}

function onMinus() {
  if (qty.value > 1) qty.value -= 1;
}
function onPlus() {
  if (selectedSku.value && qty.value < selectedSku.value.stock) qty.value += 1;
}
</script>

<template>
  <view class="page-detail">
    <Skeleton v-if="loading" type="detail" :rows="6" />

    <template v-else-if="detail">
      <!-- 商品图片轮播 -->
      <swiper class="img-swiper" circular :indicator-dots="true" indicator-active-color="#6FB35A" @change="currentImg = $event.detail.current">
        <swiper-item v-for="(img, i) in detail.images" :key="i">
          <image class="img" :src="img" mode="aspectFill" />
        </swiper-item>
      </swiper>

      <!-- 预售倒计时 -->
      <PresaleCountdown v-if="detail.isPresale && detail.presaleDeliverDate" :deliver-date="detail.presaleDeliverDate" />

      <!-- 商品信息 -->
      <view class="info-card">
        <view class="title-row">
          <view v-if="detail.isPresale" class="presale-tag">预售</view>
          <text class="title">{{ detail.title }}</text>
        </view>
        <text v-if="detail.subtitle" class="subtitle">{{ detail.subtitle }}</text>
        <view class="price-row">
          <Price v-if="selectedSku" :value="selectedSku.price" color="gold" size="lg" :market-price="selectedSku.marketPrice" />
          <text v-if="selectedSku" class="sales">已售 {{ selectedSku.sales }}</text>
        </view>
      </view>

      <!-- 规格选择 -->
      <view class="spec-card">
        <SpecSelector :skus="detail.skus" :selected-id="selectedSku?.id || 0" @select="onSelectSku" />
        <view class="qty-row">
          <text class="qty-label">数量</text>
          <view class="qty-control">
            <view class="qty-btn" @tap="onMinus"><text>−</text></view>
            <text class="qty-num">{{ qty }}</text>
            <view class="qty-btn" @tap="onPlus"><text>+</text></view>
          </view>
        </view>
      </view>

      <!-- 合规提示（生鲜） -->
      <ComplianceTip v-if="detail.isFresh" type="fresh" />

      <!-- 商品详情（富文本） -->
      <view class="detail-card">
        <view class="detail-header">
          <text class="detail-title">商品详情</text>
        </view>
        <view class="detail-html">
          <rich-text :nodes="detail.detailHtml" />
        </view>
      </view>

      <!-- 底部操作栏 -->
      <view class="bottom-bar safe-bottom">
        <view class="bar-btn cart-btn" @tap="onAddCart">
          <text class="bar-icon">🛒</text>
          <text class="bar-text">加入购物车</text>
        </view>
        <view class="bar-btn buy-btn" :class="{ disabled: !canBuy }" @tap="onBuyNow">
          <text class="bar-text">立即购买</text>
        </view>
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.page-detail {
  min-height: 100vh;
  background-color: $hn-bg;
  padding-bottom: 140rpx;
}
.img-swiper {
  width: 100%;
  height: 750rpx;
}
.img {
  width: 100%;
  height: 100%;
}

.info-card {
  background-color: #ffffff;
  padding: $spacing-sm;
  margin: $spacing-sm;
  border-radius: $radius-card;
  box-shadow: $shadow-card;
}
.title-row {
  display: flex;
  align-items: flex-start;
  gap: $spacing-xs;
}
.presale-tag {
  flex-shrink: 0;
  padding: 2rpx 12rpx;
  background-image: $gradient-gold;
  color: #ffffff;
  font-size: 20rpx;
  font-weight: $font-weight-semibold;
  border-radius: $radius-small;
  margin-top: 6rpx;
}
.title {
  font-size: $font-size-title-lg;
  font-weight: $font-weight-semibold;
  color: $hn-text-1;
  line-height: $line-height-title;
  flex: 1;
}
.subtitle {
  font-size: $font-size-caption;
  color: $hn-text-3;
  margin-top: 8rpx;
}
.price-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-top: $spacing-sm;
}
.sales {
  font-size: $font-size-caption;
  color: $hn-text-3;
}

.spec-card {
  background-color: #ffffff;
  padding: $spacing-sm;
  margin: $spacing-sm;
  border-radius: $radius-card;
  box-shadow: $shadow-card;
}
.qty-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: $spacing-sm;
  border-top: 1rpx solid $hn-line;
  margin-top: $spacing-sm;
}
.qty-label {
  font-size: $font-size-title;
  font-weight: $font-weight-semibold;
  color: $hn-text-1;
}
.qty-control {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.qty-btn {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background-color: $hn-green-50;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  color: $hn-green-700;
}
.qty-num {
  font-size: $font-size-body;
  font-weight: $font-weight-semibold;
  min-width: 48rpx;
  text-align: center;
  font-family: $font-family-din;
}

.detail-card {
  background-color: #ffffff;
  padding: $spacing-sm;
  margin: $spacing-sm;
  border-radius: $radius-card;
  box-shadow: $shadow-card;
}
.detail-header {
  padding-bottom: $spacing-sm;
  border-bottom: 1rpx solid $hn-line;
}
.detail-title {
  font-size: $font-size-title;
  font-weight: $font-weight-semibold;
  color: $hn-text-1;
}
.detail-html {
  padding: $spacing-sm 0;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120rpx;
  background-color: #ffffff;
  box-shadow: 0 -2rpx 12rpx rgba(111,179,90,0.08);
  display: flex;
  align-items: center;
  padding: 0 $spacing-sm;
  gap: $spacing-sm;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
.bar-btn {
  flex: 1;
  height: 80rpx;
  border-radius: $radius-btn;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}
.cart-btn {
  background-color: $hn-green-50;
  border: 2rpx solid $hn-green-300;
  .bar-icon { font-size: 32rpx; }
  .bar-text {
    color: $hn-green-700;
    font-size: $font-size-body;
    font-weight: $font-weight-semibold;
  }
}
.buy-btn {
  background-image: $gradient-primary;
  .bar-text {
    color: #ffffff;
    font-size: $font-size-body;
    font-weight: $font-weight-semibold;
  }
  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}
</style>