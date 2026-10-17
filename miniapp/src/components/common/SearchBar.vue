<script setup lang="ts">
/**
 * SearchBar 搜索栏
 * 对应 design.md 2.4.6 SearchBar：点击跳搜索页
 */
interface Props {
  keyword?: string;
  placeholder?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  keyword: '',
  placeholder: '搜索商品 / 节日礼品',
  disabled: false
});

const emit = defineEmits<{ (e: 'search', keyword: string): void; (e: 'tap'): void }>();

function onInput(e: any) {
  emit('search', e.detail.value);
}

function onTap() {
  if (props.disabled) {
    uni.navigateTo({ url: '/pages/search/index' });
  }
  emit('tap');
}

function onConfirm() {
  if (props.keyword) {
    uni.navigateTo({ url: `/pages/search/index?keyword=${encodeURIComponent(props.keyword)}` });
  }
}
</script>

<template>
  <view class="hn-searchbar" @tap="onTap">
    <view class="search-icon">
      <text class="iconfont">🔍</text>
    </view>
    <input
      v-if="!disabled"
      class="search-input"
      type="text"
      :value="keyword"
      :placeholder="placeholder"
      confirm-type="search"
      @input="onInput"
      @confirm="onConfirm"
    />
    <text v-else class="search-placeholder">{{ placeholder }}</text>
  </view>
</template>

<style lang="scss" scoped>
.hn-searchbar {
  display: flex;
  align-items: center;
  height: 72rpx;
  padding: 0 $spacing-sm;
  background-color: #ffffff;
  border-radius: $radius-btn;
  box-shadow: $shadow-card;
  gap: $spacing-xs;
}
.search-icon {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  .iconfont {
    font-size: 32rpx;
  }
}
.search-input {
  flex: 1;
  font-size: $font-size-body;
  color: $hn-text-1;
}
.search-placeholder {
  flex: 1;
  font-size: $font-size-body;
  color: $hn-text-3;
}
</style>