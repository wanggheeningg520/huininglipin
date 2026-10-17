// =============================================================================
// 预售倒计时 Hook
// =============================================================================

import { ref, onUnmounted, computed } from 'vue';
import { timeRemaining, msToCountdown } from '@/utils/format';

export function usePresale(deliverDate: string) {
  const remaining = ref(timeRemaining(deliverDate));
  let timer: ReturnType<typeof setInterval> | null = null;

  function start() {
    stop();
    timer = setInterval(() => {
      remaining.value = timeRemaining(deliverDate);
      if (remaining.value <= 0) stop();
    }, 1000);
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  const countdown = computed(() => msToCountdown(remaining.value));
  const isExpired = computed(() => remaining.value <= 0);

  start();
  onUnmounted(stop);

  return { remaining, countdown, isExpired, start, stop };
}