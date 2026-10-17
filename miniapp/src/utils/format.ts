// =============================================================================
// 格式化工具
// =============================================================================

/** 价格分转元（如有需要），这里 mock 数据已是元 */
export function formatPrice(value: number): string {
  return value.toFixed(2);
}

/** 价格千分位 */
export function formatPriceWithComma(value: number): string {
  return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 日期格式化 YYYY-MM-DD HH:mm:ss */
export function formatDateTime(date: Date | string | number): string {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** 日期格式化 YYYY-MM-DD */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 手机号脱敏：中间 4 位 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 11) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(7);
}

/** 计算距发货日剩余时间（毫秒） */
export function timeRemaining(deliverDate: string): number {
  const target = new Date(deliverDate).getTime();
  const now = Date.now();
  return Math.max(0, target - now);
}

/** 毫秒转 倒计时对象 */
export function msToCountdown(ms: number): { days: number; hours: number; minutes: number; seconds: number } {
  const totalSec = Math.floor(ms / 1000);
  return {
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60
  };
}

/** 规格 JSON 转字符串展示 */
export function specJsonToString(specJson: Record<string, string>): string {
  return Object.entries(specJson).map(([k, v]) => `${k}: ${v}`).join(' / ');
}