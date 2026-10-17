<script setup lang="ts">
/**
 * ComplianceTip 合规提示
 * 对应 design.md 2.4.6 ComplianceTip：fresh/presale 类型
 * 对应 spec.md 8.1/8.3 合规红线
 */
import { COMPLIANCE_TIPS } from '@/utils/constants';

interface Props {
  type: 'fresh' | 'presale';
  deliverDate?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  deliverDate: null
});

import { computed } from 'vue';

const tips = computed<string[]>(() => {
  if (props.type === 'fresh') {
    return [COMPLIANCE_TIPS.FRESH_NO_RETURN, COMPLIANCE_TIPS.FRESH_COLD_CHAIN];
  }
  return [COMPLIANCE_TIPS.PRESALE_LOCK_FIRST];
});
</script>

<template>
  <view class="hn-compliance-tip" :class="type">
    <view class="tip-header">
      <text class="tip-icon">{{ type === 'fresh' ? '🧊' : '⏰' }}</text>
      <text class="tip-title">{{ type === 'fresh' ? '生鲜提示' : '预售提示' }}</text>
    </view>
    <view v-for="(tip, i) in tips" :key="i" class="tip-item">
      <text class="tip-dot">·</text>
      <text class="tip-text">{{ tip }}</text>
    </view>
    <view v-if="type === 'presale' && deliverDate" class="tip-deliver">
      预计发货日期：<text class="deliver-date">{{ deliverDate }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.hn-compliance-tip {
  padding: $spacing-sm;
  border-radius: $radius-card;
  margin: $spacing-sm 0;
}
.fresh {
  background-color: rgba(224, 91, 75, 0.06);
  border: 1rpx solid rgba(224, 91, 75, 0.2);
}
.presale {
  background-color: $hn-gold-100;
  border: 1rpx solid $hn-gold-300;
}
.tip-header {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  margin-bottom: $spacing-xs;
}
.tip-icon {
  font-size: 32rpx;
}
.tip-title {
  font-size: $font-size-title;
  font-weight: $font-weight-semibold;
  color: $hn-text-1;
}
.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 4rpx;
  font-size: $font-size-caption;
  color: $hn-text-2;
  line-height: $line-height-body;
  margin-top: 4rpx;
}
.tip-dot {
  color: $hn-green-500;
  font-weight: bold;
}
.tip-deliver {
  margin-top: $spacing-xs;
  font-size: $font-size-caption;
  color: $hn-text-2;
  .deliver-date {
    color: $hn-gold-700;
    font-weight: $font-weight-semibold;
  }
}
</style>