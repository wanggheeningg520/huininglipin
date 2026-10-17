// =============================================================================
// 分享工具
// =============================================================================

interface ShareOptions {
  title?: string;
  path?: string;
  imageUrl?: string;
}

/** 设置当前页面分享 */
export function setupShare(options: ShareOptions) {
  // #ifdef MP-WEIXIN
  if (typeof (uni as any).onShareAppMessage === 'function') {
    (uni as any).onShareAppMessage(() => ({
      title: options.title || '慧宁甄选 · 品质之选',
      path: options.path || '/pages/home/index',
      imageUrl: options.imageUrl || ''
    }));
  }
  // #endif
}

/** 分享到朋友圈 */
export function shareTimeline(options: ShareOptions) {
  // #ifdef MP-WEIXIN
  if (typeof (uni as any).onShareTimeline === 'function') {
    (uni as any).onShareTimeline(() => ({
      title: options.title || '慧宁甄选 · 品质之选',
      query: options.path || '',
      imageUrl: options.imageUrl || ''
    }));
  }
  // #endif
}