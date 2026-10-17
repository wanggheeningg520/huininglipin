/** 日期工具类 */
export class DateUtil {
  /** 格式化为 YYYY-MM-DD */
  static formatDate(d: Date | string): string {
    const date = typeof d === 'string' ? new Date(d) : d;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /** 格式化为 YYYY-MM-DD HH:mm:ss */
  static formatDateTime(d: Date | string): string {
    const date = typeof d === 'string' ? new Date(d) : d;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${day} ${h}:${min}:${s}`;
  }

  /** 当前时间戳（毫秒） */
  static nowMs(): number {
    return Date.now();
  }

  /** 增加天数 */
  static addDays(d: Date, days: number): Date {
    const r = new Date(d);
    r.setDate(r.getDate() + days);
    return r;
  }

  /** 判断是否过期 */
  static isExpired(d: Date | string): boolean {
    return new Date(d).getTime() < Date.now();
  }

  /** 计算两个时间差（秒） */
  static diffSeconds(a: Date | string, b: Date | string): number {
    return Math.floor((new Date(a).getTime() - new Date(b).getTime()) / 1000);
  }
}