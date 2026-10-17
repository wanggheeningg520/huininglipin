<script setup lang="ts">
/**
 * PresaleCountdown 预售倒计时
 * 对应 design.md 2.4.6 PresaleCountdown：距发货日倒计时 + 预计发货日
 * 对应 spec.md 5.6.1 规则 2 + 9.3 验收标准
 */
import { usePresale } from '@/hooks/usePresale';
import { formatDate } from '@/utils/format';

interface Props {
  deliverDate: string;
  /** 是否显示完整卡片（详情页 true / 卡片角标 false） */
  full?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  full: true
});

const { countdown, isExpired } = usePresale(props.deliverDate);

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
</script>

<template>
  <view v-if="full" class="hn-presale-countdown">
    <view class="countdown-header">
      <view class="presale-tag">
        <text class="tag-icon">⏰</text>
        <text class="tag-text">预售中</text>
      </view>
      <text class="countdown-label">距发货还剩</text>
    </view>
    <view class="countdown-body">
      <template v-if="!isExpired">
        <view v-if="countdown.days > 0" class="time-unit">
          <text class="time-num">{{ countdown.days }}</text>
          <text class="time-label">天</text>
        </view>
        <view class="time-unit">
          <text class="time-num">{{ pad(countdown.hours) }}</text>
          <text class="time-label">时</text>
        </view>
        <view class="time-unit">
          <text class="time-num">{{ pad(countdown.minutes) }}</text>
          <text class="time-label">分</text>
        </view>
        <view class="time-unit">
          <text class="time-num">{{ pad(countdown.seconds) }}</text>
          <text class="time-label">秒</text>
        </view>
      </template>
      <text v-else class="expired-text">已到发货时间</text>
    </view>
    <view class="deliver-date">
      预计发货日期：<text class="date-value">{{ formatDate(deliverDate) }}</text>
    </view>
  </view>

  <view v-else class="hn-presale-mini">
    <text class="mini-icon">⏰</text>
    <text class="mini-text">{{ countdown.days > 0 ? `${countdown.days}天后发货` : '即将发货' }}</text>
  </view>
</template>

<style lang="scss" scoped>
.hn-presale-countdown {
  background-color: $hn-gold-100;
  border: 1rpx solid $hn-gold-300;
  border-radius: $radius-card;
  padding: $spacing-sm;
  margin: $spacing-sm 0;
}
.countdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-sm;
}
.presale-tag {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background-image: $gradient-gold;
  padding: 4rpx 16rpx;
  border-radius: $radius-small;
  .tag-icon {
    font-size: 24rpx;
  }
  .tag-text {
    font-size: $font-size-caption;
    color: #ffffff;
    font-weight: $font-weight-semibold;
  }
}
.countdown-label {
  font-size: $font-size-caption;
  color: $hn-gold-700;
}
.countdown-body {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
}
.time-unit {
  display: flex;
  align-items: baseline;
  gap: 2rpx;
  .time-num {
    font-family: $font-family-din;
    font-size: 44rpx;
    font-weight: $font-weight-bold;
    color: $hn-gold-700;
    background-color: #ffffff;
    padding: 4rpx 12rpx;
    border-radius: $radius-small;
    min-width: 56rpx;
    text-align: center;
  }
  .time-label {
    font-size: $font-size-caption;
    color: $hn-gold-700;
  }
}
.expired-text {
  font-size: $font-size-body;
  color: $hn-gold-700;
  font-weight: $font-weight-semibold;
}
.deliver-date {
  margin-top: $spacing-sm;
  font-size: $font-size-caption;
  color: $hn-text-2;
  .date-value {
    color: $hn-gold-700;
    font-weight: $font-weight-semibold;
  }
}

.hn-presale-mini {
  display: inline-flex;
  align-items: center;
  gap: 4rpx;
  background-color: $hn-gold-100;
  padding: 2rpx 12rpx;
  border-radius: $radius-small;
  .mini-icon {
    font-size: 20rpx;
  }
  .mini-text {
    font-size: 20rpx;
    color: $hn-gold-700;
  }
}
</style>