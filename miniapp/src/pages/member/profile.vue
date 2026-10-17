<script setup lang="ts">
/**
 * 个人信息页 MA-15
 * 对应 design.md 2.4.2 pages/member/profile
 * 编辑昵称/头像；未登录跳登录页
 */
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/store/modules/user';
import { requireAuth } from '@/utils/auth';

const userStore = useUserStore();

const nickname = ref('');
const avatar = ref('');
const phone = ref('');
const saving = ref(false);

onMounted(() => {
  if (!requireAuth()) return;
  userStore.restore();
  nickname.value = userStore.userInfo?.nickname || '';
  avatar.value = userStore.userInfo?.avatar || '';
  phone.value = userStore.userInfo?.phone || '';
});

function onChooseAvatar() {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      avatar.value = res.tempFilePaths[0];
    }
  });
}

async function onSave() {
  if (!nickname.value.trim()) {
    uni.showToast({ title: '请输入昵称', icon: 'none' });
    return;
  }
  saving.value = true;
  try {
    // 调用更新接口（mock 直接更新本地）
    if (userStore.userInfo) {
      userStore.userInfo.nickname = nickname.value.trim();
      userStore.userInfo.avatar = avatar.value;
    }
    uni.showToast({ title: '保存成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 1000);
  } finally {
    saving.value = false;
  }
}

function onBindPhone() {
  if (phone.value) return;
  uni.showToast({ title: '请通过微信授权获取手机号', icon: 'none' });
}
</script>

<template>
  <view class="page-profile">
    <view class="section">
      <view class="profile-item" @tap="onChooseAvatar">
        <text class="item-label">头像</text>
        <view class="item-right">
          <image class="avatar" :src="avatar || 'https://cdn.example.com/mock/avatar.png'" mode="aspectFill" />
          <text class="arrow">›</text>
        </view>
      </view>
      <view class="profile-item">
        <text class="item-label">昵称</text>
        <input class="item-input" v-model="nickname" placeholder="请输入昵称" maxlength="20" />
      </view>
      <view class="profile-item" @tap="onBindPhone">
        <text class="item-label">手机号</text>
        <view class="item-right">
          <text class="item-value">{{ phone || '未绑定' }}</text>
          <text v-if="!phone" class="bind-btn">去绑定</text>
        </view>
      </view>
    </view>

    <view class="save-btn" :class="{ disabled: saving }" @tap="onSave">
      <text>{{ saving ? '保存中...' : '保存' }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-profile {
  min-height: 100vh;
  background-color: $hn-bg;
  padding: $spacing-sm;
}
.section {
  background-color: #ffffff;
  border-radius: $radius-card;
  box-shadow: $shadow-card;
  padding: 0 $spacing-sm;
}
.profile-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-sm 0;
  & + .profile-item {
    border-top: 1rpx solid $hn-line;
  }
}
.item-label {
  font-size: $font-size-body;
  color: $hn-text-1;
}
.item-right {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
}
.arrow {
  font-size: 40rpx;
  color: $hn-text-3;
}
.item-input {
  flex: 1;
  text-align: right;
  font-size: $font-size-body;
  color: $hn-text-1;
  margin-left: $spacing-sm;
}
.item-value {
  font-size: $font-size-body;
  color: $hn-text-2;
}
.bind-btn {
  font-size: $font-size-caption;
  color: $hn-green-700;
  background-color: $hn-green-50;
  padding: 4rpx 16rpx;
  border-radius: $radius-small;
}
.save-btn {
  margin-top: $spacing-lg;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
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