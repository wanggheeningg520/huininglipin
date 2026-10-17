<script setup lang="ts">
/**
 * 地址列表页 MA-17
 * 对应 design.md 2.4.2 pages/member/address/list
 * 地址列表+新增/编辑；地址超 20 条提示
 */
import { onShow } from '@dcloudio/uni-app';
import { useAddressStore } from '@/store/modules/address';
import { BIZ } from '@/utils/constants';

const addressStore = useAddressStore();

onShow(() => {
  addressStore.fetch();
});

function onAdd() {
  if (addressStore.hasReachedLimit) {
    uni.showToast({ title: `地址最多 ${BIZ.ADDRESS_LIMIT} 条`, icon: 'none' });
    return;
  }
  uni.navigateTo({ url: '/pages/member/address/edit' });
}

function onEdit(id: number) {
  uni.navigateTo({ url: `/pages/member/address/edit?id=${id}` });
}

function onSetDefault(id: number) {
  addressStore.setDefault(id);
}

function onRemove(id: number) {
  uni.showModal({
    title: '提示',
    content: '确定要删除该地址吗？',
    success: async (res) => {
      if (res.confirm) {
        await addressStore.remove(id);
      }
    }
  });
}
</script>

<template>
  <view class="page-address-list">
    <view v-if="addressStore.list.length" class="address-list">
      <view v-for="addr in addressStore.list" :key="addr.id" class="address-card">
        <view class="addr-info" @tap="onEdit(addr.id)">
          <view class="addr-header">
            <text class="addr-name">{{ addr.name }}</text>
            <text class="addr-phone">{{ addr.phone }}</text>
            <view v-if="addr.isDefault" class="default-tag">默认</view>
          </view>
          <text class="addr-detail">{{ addr.province }}{{ addr.city }}{{ addr.district }}{{ addr.detail }}</text>
        </view>
        <view class="addr-actions">
          <view v-if="!addr.isDefault" class="action-btn" @tap="onSetDefault(addr.id)">
            <text>设为默认</text>
          </view>
          <view class="action-btn" @tap="onEdit(addr.id)">
            <text>编辑</text>
          </view>
          <view class="action-btn danger" @tap="onRemove(addr.id)">
            <text>删除</text>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="empty-wrap">
      <text class="empty-text">暂无收货地址</text>
    </view>

    <!-- 底部新增按钮 -->
    <view class="bottom-bar safe-bottom">
      <view class="add-btn" @tap="onAdd">
        <text>+ 新增收货地址</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-address-list {
  min-height: 100vh;
  background-color: $hn-bg;
  padding: $spacing-sm;
  padding-bottom: 140rpx;
}
.address-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}
.address-card {
  background-color: #ffffff;
  border-radius: $radius-card;
  box-shadow: $shadow-card;
  padding: $spacing-sm;
}
.addr-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.addr-header {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}
.addr-name {
  font-size: $font-size-title;
  font-weight: $font-weight-semibold;
  color: $hn-text-1;
}
.addr-phone {
  font-size: $font-size-body;
  color: $hn-text-2;
}
.default-tag {
  font-size: 20rpx;
  color: #fff;
  background-image: $gradient-primary;
  padding: 2rpx 12rpx;
  border-radius: $radius-small;
}
.addr-detail {
  font-size: $font-size-caption;
  color: $hn-text-2;
  line-height: $line-height-body;
}
.addr-actions {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-sm;
  margin-top: $spacing-sm;
  padding-top: $spacing-sm;
  border-top: 1rpx solid $hn-line;
}
.action-btn {
  font-size: $font-size-caption;
  color: $hn-text-2;
  padding: 4rpx 16rpx;
  &.danger {
    color: $hn-danger;
  }
}
.empty-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-xl 0;
}
.empty-text {
  font-size: $font-size-body;
  color: $hn-text-3;
}
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: $spacing-sm;
  background-color: #ffffff;
  box-shadow: 0 -2rpx 12rpx rgba(111,179,90,0.08);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
.add-btn {
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  background-image: $gradient-primary;
  color: #ffffff;
  border-radius: $radius-btn;
  font-size: $font-size-body;
  font-weight: $font-weight-semibold;
}
</style>