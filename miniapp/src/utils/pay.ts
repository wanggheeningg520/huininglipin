// =============================================================================
// 微信支付调起
// 对应 design.md 2.2.2 接口 12 + spec.md 5.2.1 规则 6
// =============================================================================

import type { PayParamsVO } from '@/api/types';

/** 调起微信支付 */
export function requestPayment(params: PayParamsVO): Promise<void> {
  return new Promise((resolve, reject) => {
    uni.requestPayment({
      provider: 'wxpay',
      timeStamp: params.timeStamp,
      nonceStr: params.nonceStr,
      package: params.package,
      signType: params.signType as 'RSA',
      paySign: params.paySign,
      success: () => resolve(),
      fail: (err) => reject(new Error(err.errMsg || '支付失败'))
    });
  });
}

/** 支付流程：下单 → 调起 → 结果 */
export async function payOrder(orderNo: string): Promise<'success' | 'cancel' | 'fail'> {
  // 动态导入避免循环依赖
  const { createPay } = await import('@/api/modules/trade');
  try {
    const payParams = await createPay(orderNo);
    await requestPayment(payParams);
    return 'success';
  } catch (err: any) {
    const msg = err?.message || '';
    if (msg.includes('cancel')) return 'cancel';
    return 'fail';
  }
}