// =============================================================================
// 校验工具
// =============================================================================

/** 手机号校验 */
export function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

/** 姓名（2-20 字） */
export function isValidName(name: string): boolean {
  return name.trim().length >= 2 && name.trim().length <= 20;
}

/** 地址详情（5-100 字） */
export function isValidDetail(detail: string): boolean {
  return detail.trim().length >= 5 && detail.trim().length <= 100;
}

/** 订单备注（≤200 字） */
export function isValidRemark(remark: string): boolean {
  return remark.length <= 200;
}

/** 数量校验（1-99） */
export function isValidQty(qty: number): boolean {
  return Number.isInteger(qty) && qty >= 1 && qty <= 99;
}