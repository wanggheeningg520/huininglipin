<script setup lang="ts">
/**
 * 确认订单页 MA-12
 * 对应 design.md 2.4.2 pages/order/confirm
 * 地址选择（预选默认）+ 备注（≤200字）+ 价格计算
 * 预售商品显著提示先锁单后发货+预计发货日
 * 生鲜合规提示
 * 调用接口 9 创建订单（带 X-Idempotency-Key）
 */
import { ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useCartStore } from '@/store/modules/cart';
import { useAddressStore } from '@/store/modules/address';
import { useOrderStore } from '@/store/modules/order';
import { fetchProductDetail } from '@/api/modules/product';
import type { ProductDetailVO, SkuInfo } from '@/api/types';

import AddressPicker from '@/components/common/AddressPicker.vue';
import Price from '@/components/common/Price.vue';
import ComplianceTip from '@/components/common/ComplianceTip.vue';
import { BIZ } from '@/utils/constants';

const cartStore = useCartStore();
const addressStore = useAddressStore();
const orderStore = useOrderStore();

const fromCart = ref(false);
const directSkuId = ref(0);
const directQty = ref(1);
const directProductId = ref(0);
const directProduct = ref<ProductDetailVO | null>(null);
const directSku = ref<SkuInfo | null>(null);

const remark = ref('');
const submitting = ref(false);

onLoad(async (query: any) => {
  fromCart.value = query.fromCart === '1';
  if (!fromCart.value) {
    directSkuId.value = Number(query.skuId || 0);
    directQty.value = Number(query.qty || 1);
    directProductId.value = Number(query.productId || 0);
    if (directProductId.value) {
      directProduct.value = await fetchProductDetail(directProductId.value);
      directSku.value = directProduct.value.skus.find((s) => s.id === directSkuId.value) || null;
    }
  } else {
    await cartStore.fetch();
  }
  await addressStore.fetch();
});

// 结算商品列表
const settleItems = computed(() => {
  if (fromCart.value) {
    return cartStore.checkedItems.map((i) => ({
      productId: i.productId,
      skuId: i.skuId,
      title: i.productTitle,
      mainImage: i.mainImage,
      specJson: i.specJson,
      price: i.price,
      qty: i.qty,
      isPresale: false,
      presaleDeliverDate: null as string | null,
      isFresh: false
    }));
  }
  if (directProduct.value && directSku.value) {
    return [{
      productId: directProduct.value.id,
      skuId: directSku.value.id,
      title: directProduct.value.title,
      mainImage: directProduct.value.mainImage,
      specJson: directSku.value.specJson,
      price: directSku.value.price,
      qty: directQty.value,
      isPresale: directProduct.value.isPresale,
      presaleDeliverDate: directProduct.value.presaleDeliverDate,
      isFresh: directProduct.value.isFresh
    }];
  }
  return [];
});

const totalAmount = computed(() => settleItems.value.reduce((s, i) => s + i.price * i.qty, 0));
const hasPresale = computed(() => settleItems.value.some((i) => i.isPresale));
const hasFresh = computed(() => settleItems.value.some((i) => i.isFresh));
const presaleDeliverDate = computed(() => settleItems.value.find((i) => i.isPresale)?.presaleDeliverDate || null);

const selectedAddress = computed(() => addressStore.defaultAddress);

function selectAddress() {
  uni.navigateTo({ url: '/pages/member/address/list?from=confirm' });
}

async function onSubmit() {
  if (!selectedAddress.value) {
    uni.showToast({ title: '请选择收货地址', icon: 'none' });
    return;
  }
  if (remark.value.length > BIZ.REMARK_MAX) {
    uni.showToast({ title: `备注不超过 ${BIZ.REMARK_MAX} 字`, icon: 'none' });
    return;
  }
  submitting.value = true;
  try {
    const items = settleItems.value.map((i) => ({ skuId: i.skuId, qty: i.qty }));
    const res = await orderStore.create({
      items,
      addressId: selectedAddress.value.id,
      remark: remark.value,
      fromCart: fromCart.value
    });
    uni.navigateTo({ url: `/pages/order/pay-result?orderNo=${res.orderNo}&status=pending` });
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <view class="page-confirm">
    <!-- 地址选择 -->
    <view class="section">
      <AddressPicker :address="selectedAddress" @select="selectAddress" />
    </view>

    <!-- 商品列表 -->
    <view class="section goods-section">
      <view v-for="item in settleItems" :key="item.skuId" class="goods-item">
        <image class="goods-img" :src="item.mainImage" mode="aspectFill" />
        <view class="goods-info">
          <text class="goods-title">{{ item.title }}</text>
          <text class="goods-spec">{{ Object.entries(item.specJson).map(([k,v]) => k+': '+v).join(' / ') }}</text>
          <view class="goods-bottom">
            <Price :value="item.price" color="gold" size="sm" />
            <text class="goods-qty">×{{ item.qty }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 预售提示 -->
    <ComplianceTip v-if="hasPresale" type="presale" :deliver-date="presaleDeliverDate" />

    <!-- 生鲜合规提示 -->
    <ComplianceTip v-if="hasFresh" type="fresh" />

    <!-- 备注 -->
    <view class="section remark-section">
      <text class="remark-label">订单备注</text>
      <textarea
        class="remark-input"
        v-model="remark"
        placeholder="选填，请输入备注信息（≤200字）"
        maxlength="200"
        :auto-height="true"
      />
    </view>

    <!-- 价格汇总 -->
    <view class="section price-summary">
      <view class="summary-row">
        <text class="summary-label">商品金额</text>
        <Price :value="totalAmount" color="gold" size="sm" />
      </view>
      <view class="summary-row">
        <text class="summary-label">运费</text>
        <text class="summary-value">包邮</text>
      </view>
      <view class="summary-row total">
        <text class="summary-label">实付</text>
        <Price :value="totalAmount" color="gold" size="md" />
      </view>
    </view>

    <!-- 底部提交 -->
    <view class="bottom-bar safe-bottom">
      <view class="bar-left">
        <text class="total-label">合计：</text>
        <Price :value="totalAmount" color="gold" size="md" />
      </view>
      <view class="submit-btn" :class="{ disabled: submitting }" @tap="onSubmit">
        <text>{{ submitting ? '提交中...' : '提交订单' }}</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-confirm {
  min-height: 100vh;
  background-color: $hn-bg;
  padding-bottom: 140rpx;
}
.section {
  margin: $spacing-sm;
  padding: $spacing-sm;
  background-color: #ffffff;
  border-radius: $radius-card;
  box-shadow: $shadow-card;
}
.goods-item {
  display: flex;
  gap: $spacing-sm;
  padding: $spacing-sm 0;
  & + .goods-item {
    border-top: 1rpx solid $hn-line;
  }
}
.goods-img {
  width: 140rpx;
  height: 140rpx;
  border-radius: $radius-image;
  flex-shrink: 0;
}
.goods-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.goods-title {
  font-size: $font-size-body;
  color: $hn-text-1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.goods-spec {
  font-size: $font-size-caption;
  color: $hn-text-3;
  background-color: $hn-green-50;
  padding: 2rpx 12rpx;
  border-radius: $radius-small;
  align-self: flex-start;
}
.goods-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}
.goods-qty {
  font-size: $font-size-body;
  color: $hn-text-2;
  font-family: $font-family-din;
}

.remark-section {
  .remark-label {
    font-size: $font-size-title;
    font-weight: $font-weight-semibold;
    color: $hn-text-1;
    display: block;
    margin-bottom: $spacing-sm;
  }
}
.remark-input {
  width: 100%;
  min-height: 80rpx;
  font-size: $font-size-body;
  color: $hn-text-1;
  background-color: $hn-bg;
  border-radius: $radius-small;
  padding: $spacing-sm;
}

.price-summary {
  .summary-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8rpx 0;
    &.total {
      border-top: 1rpx solid $hn-line;
      margin-top: 8rpx;
      padding-top: $spacing-sm;
    }
  }
  .summary-label {
    font-size: $font-size-body;
    color: $hn-text-2;
  }
  .summary-value {
    font-size: $font-size-body;
    color: $hn-green-700;
  }
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 110rpx;
  background-color: #ffffff;
  box-shadow: 0 -2rpx 12rpx rgba(111,179,90,0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 $spacing-sm;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
.bar-left {
  display: flex;
  align-items: baseline;
  .total-label {
    font-size: $font-size-body;
    color: $hn-text-2;
  }
}
.submit-btn {
  padding: 0 64rpx;
  height: 80rpx;
  line-height: 80rpx;
  background-image: $gradient-primary;
  color: #ffffff;
  border-radius: $radius-btn;
  font-size: $font-size-body;
  font-weight: $font-weight-semibold;
  &.disabled {
    opacity: 0.6;
    pointer-events: none;
  }
}
</style>