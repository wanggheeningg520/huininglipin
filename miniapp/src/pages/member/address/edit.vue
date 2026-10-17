<script setup lang="ts">
/**
 * 地址编辑页 MA-17
 * 对应 design.md 2.4.2 pages/member/address/edit
 * 新增/编辑（省市区+详情+默认）
 */
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useAddressStore } from '@/store/modules/address';
import { isValidPhone, isValidName, isValidDetail } from '@/utils/validate';

const addressStore = useAddressStore();

const editId = ref(0);
const name = ref('');
const phone = ref('');
const province = ref('');
const city = ref('');
const district = ref('');
const detail = ref('');
const isDefault = ref(false);
const saving = ref(false);

onLoad(async (query: any) => {
  if (query.id) {
    editId.value = Number(query.id);
    await addressStore.fetch();
    const addr = addressStore.list.find((a) => a.id === editId.value);
    if (addr) {
      name.value = addr.name;
      phone.value = addr.phone;
      province.value = addr.province;
      city.value = addr.city;
      district.value = addr.district;
      detail.value = addr.detail;
      isDefault.value = addr.isDefault;
    }
  }
});

function onChooseRegion() {
  // 简化：使用 uni 选择器（实际项目可接入省市区插件）
  uni.showActionSheet({
    itemList: ['北京市 北京市 朝阳区', '北京市 北京市 海淀区', '上海市 上海市 浦东新区'],
    success: (res) => {
      const regions = [
        ['北京市', '北京市', '朝阳区'],
        ['北京市', '北京市', '海淀区'],
        ['上海市', '上海市', '浦东新区']
      ];
      const [p, c, d] = regions[res.tapIndex];
      province.value = p;
      city.value = c;
      district.value = d;
    }
  });
}

async function onSave() {
  if (!isValidName(name.value)) {
    uni.showToast({ title: '请输入 2-20 字姓名', icon: 'none' });
    return;
  }
  if (!isValidPhone(phone.value)) {
    uni.showToast({ title: '请输入正确手机号', icon: 'none' });
    return;
  }
  if (!province.value) {
    uni.showToast({ title: '请选择所在地区', icon: 'none' });
    return;
  }
  if (!isValidDetail(detail.value)) {
    uni.showToast({ title: '请输入详细地址（5-100字）', icon: 'none' });
    return;
  }
  saving.value = true;
  try {
    const data = {
      name: name.value,
      phone: phone.value,
      province: province.value,
      city: city.value,
      district: district.value,
      detail: detail.value,
      isDefault: isDefault.value
    };
    if (editId.value) {
      await addressStore.update(editId.value, data);
    } else {
      await addressStore.create(data);
    }
    uni.showToast({ title: '保存成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 1000);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <view class="page-address-edit">
    <view class="form-card">
      <view class="form-item">
        <text class="form-label">姓名</text>
        <input class="form-input" v-model="name" placeholder="收货人姓名" maxlength="20" />
      </view>
      <view class="form-item">
        <text class="form-label">手机号</text>
        <input class="form-input" v-model="phone" type="number" placeholder="11位手机号" maxlength="11" />
      </view>
      <view class="form-item" @tap="onChooseRegion">
        <text class="form-label">所在地区</text>
        <text class="form-value" :class="{ placeholder: !province }">
          {{ province ? `${province} ${city} ${district}` : '请选择省/市/区' }}
        </text>
        <text class="arrow">›</text>
      </view>
      <view class="form-item">
        <text class="form-label">详细地址</text>
        <textarea class="form-textarea" v-model="detail" placeholder="街道、楼牌号等" maxlength="100" />
      </view>
      <view class="form-item switch-item">
        <text class="form-label">设为默认地址</text>
        <switch :checked="isDefault" @change="isDefault = $event.detail.value" color="#6FB35A" />
      </view>
    </view>

    <view class="save-btn" :class="{ disabled: saving }" @tap="onSave">
      <text>{{ saving ? '保存中...' : '保存' }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-address-edit {
  min-height: 100vh;
  background-color: $hn-bg;
  padding: $spacing-sm;
}
.form-card {
  background-color: #ffffff;
  border-radius: $radius-card;
  box-shadow: $shadow-card;
  padding: 0 $spacing-sm;
}
.form-item {
  display: flex;
  align-items: center;
  padding: $spacing-sm 0;
  & + .form-item {
    border-top: 1rpx solid $hn-line;
  }
}
.form-label {
  width: 160rpx;
  font-size: $font-size-body;
  color: $hn-text-1;
  flex-shrink: 0;
}
.form-input {
  flex: 1;
  font-size: $font-size-body;
  color: $hn-text-1;
}
.form-value {
  flex: 1;
  font-size: $font-size-body;
  color: $hn-text-1;
  &.placeholder {
    color: $hn-text-3;
  }
}
.form-textarea {
  flex: 1;
  font-size: $font-size-body;
  color: $hn-text-1;
  min-height: 80rpx;
}
.arrow {
  font-size: 40rpx;
  color: $hn-text-3;
}
.switch-item {
  justify-content: space-between;
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