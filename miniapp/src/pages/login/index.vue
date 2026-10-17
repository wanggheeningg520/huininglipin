<script setup lang="ts">
/**
 * 登录授权页 MA-17
 * 对应 design.md 2.4.2 pages/login/index
 * 微信授权登录
 */
import { ref } from 'vue';
import { useUserStore } from '@/store/modules/user';

const userStore = useUserStore();
const loading = ref(false);

async function onLogin() {
  loading.value = true;
  try {
    await userStore.login();
    uni.showToast({ title: '登录成功', icon: 'success' });
    setTimeout(() => {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        uni.navigateBack();
      } else {
        uni.switchTab({ url: '/pages/home/index' });
      }
    }, 1000);
  } catch (e: any) {
    uni.showToast({ title: e?.message || '登录失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

function onGetPhone(e: any) {
  if (e.detail.errMsg !== 'getPhoneNumber:ok') return;
  // 实际项目：用 e.detail.code 调用 bindPhone 接口
  userStore.bindPhone(e.detail.code || '').catch(() => { /* ignore */ });
}
</script>

<template>
  <view class="page-login">
    <view class="login-bg" />
    <view class="login-content">
      <view class="logo">
        <text class="logo-icon">🌿</text>
        <text class="logo-name">慧宁甄选</text>
        <text class="logo-slogan">品质之选 · 心意之礼</text>
      </view>

      <view class="login-btn" :class="{ disabled: loading }" @tap="onLogin">
        <text class="btn-icon">💬</text>
        <text class="btn-text">{{ loading ? '登录中...' : '微信一键登录' }}</text>
      </view>

      <text class="agreement">
        登录即代表同意《用户协议》与《隐私政策》
      </text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-login {
  min-height: 100vh;
  background-color: $hn-bg;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60vh;
  background-image: linear-gradient(180deg, $hn-green-100 0%, $hn-bg 100%);
}
.login-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xl;
  padding: $spacing-xl;
}
.logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-sm;
}
.logo-icon {
  font-size: 120rpx;
}
.logo-name {
  font-size: 56rpx;
  font-weight: $font-weight-bold;
  color: $hn-green-700;
}
.logo-slogan {
  font-size: $font-size-body;
  color: $hn-text-2;
}
.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-xs;
  width: 600rpx;
  height: 96rpx;
  background-image: $gradient-primary;
  border-radius: $radius-btn;
  box-shadow: $shadow-card;
  .btn-icon {
    font-size: 40rpx;
  }
  .btn-text {
    font-size: $font-size-title;
    font-weight: $font-weight-semibold;
    color: #ffffff;
  }
  &.disabled {
    opacity: 0.6;
    pointer-events: none;
  }
}
.agreement {
  font-size: $font-size-caption;
  color: $hn-text-3;
  text-align: center;
}
</style>