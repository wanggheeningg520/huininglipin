<script setup lang="ts">
/**
 * 购物车页 MA-11
 * 对应 design.md 2.4.2 pages/cart/index
 * 展示勾选项 + 合计 + 结算；数量步进器+库存校验+删除；空状态
 */
import { onShow } from '@dcloudio/uni-app';
import { useCart } from '@/hooks/useCart';
import { requireAuth } from '@/utils/auth';

import CartItem from '@/components/cart/CartItem.vue';
import Price from '@/components/common/Price.vue';
import EmptyState from '@/components/common/EmptyState.vue';

const { cartStore, refresh, changeQty, remove } = useCart();

onShow(() => {
  if (requireAuth()) refresh();
});

function onToggle(id: number, checked: boolean) {
  cartStore.toggleCheck([id], checked);
}

function onToggleAll() {
  cartStore.toggleAll(!cartStore.allChecked);
}

function onCheckout() {
  if (!cartStore.checkedItems.length) {
    uni.showToast({ title: '请选择要结算的商品', icon: 'none' });
    return;
  }
  uni.navigateTo({ url: '/pages/order/confirm?fromCart=1' });
}
</script>

<template>
  <view class="page-cart">
    <EmptyState
      v-if="cartStore.isEmpty"
      text="购物车空空如也"
      desc="去挑选心仪的礼品吧"
    >
      <view class="go-btn" @tap="uni.switchTab({ url: '/pages/home/index' })">去逛逛</view>
    </EmptyState>

    <template v-else>
      <view class="cart-list">
        <CartItem
          v-for="item in cartStore.items"
          :key="item.id"
          :item="item"
          @toggle="onToggle"
          @change-qty="changeQty"
          @remove="remove"
        />
      </view>

      <!-- 底部结算栏 -->
      <view class="bottom-bar safe-bottom">
        <view class="all-check" @tap="onToggleAll">
          <view class="check-box" :class="{ checked: cartStore.allChecked }">
            <text v-if="cartStore.allChecked" class="check-icon">✓</text>
          </view>
          <text class="all-text">全选</text>
        </view>
        <view class="total-info">
          <text class="total-label">合计：</text>
          <Price :value="cartStore.totalAmount" color="gold" size="md" />
        </view>
        <view class="checkout-btn" @tap="onCheckout">
          <text>结算 ({{ cartStore.checkedCount }})</text>
        </view>
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.page-cart {
  min-height: 100vh;
  background-color: $hn-bg;
  padding: $spacing-sm;
  padding-bottom: 140rpx;
}
.go-btn {
  margin-top: $spacing-md;
  padding: 16rpx 48rpx;
  background-image: $gradient-primary;
  color: #ffffff;
  border-radius: $radius-btn;
  font-size: $font-size-body;
  font-weight: $font-weight-semibold;
}
.cart-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
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
  padding: 0 $spacing-sm;
  gap: $spacing-sm;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
.all-check {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.check-box {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid $hn-line;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  &.checked {
    background-image: $gradient-primary;
    border-color: $hn-green-500;
    .check-icon {
      color: #fff;
      font-size: 24rpx;
      font-weight: bold;
    }
  }
}
.all-text {
  font-size: $font-size-body;
  color: $hn-text-2;
}
.total-info {
  flex: 1;
  display: flex;
  align-items: baseline;
  .total-label {
    font-size: $font-size-body;
    color: $hn-text-2;
  }
}
.checkout-btn {
  padding: 0 48rpx;
  height: 72rpx;
  line-height: 72rpx;
  background-image: $gradient-primary;
  color: #ffffff;
  border-radius: $radius-btn;
  font-size: $font-size-body;
  font-weight: $font-weight-semibold;
}
</style>