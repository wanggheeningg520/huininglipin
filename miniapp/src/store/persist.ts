// =============================================================================
// Pinia 持久化适配 uni.storage
// pinia-plugin-persistedstate 默认使用 localStorage，小程序环境需适配 uni.storage
// =============================================================================

export interface PersistStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** uni.storage 适配器 */
export const uniStorageAdapter: PersistStorage = {
  getItem(key: string): string | null {
    try {
      return uni.getStorageSync(key) || null;
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      uni.setStorageSync(key, value);
    } catch {
      /* ignore */
    }
  },
  removeItem(key: string): void {
    try {
      uni.removeStorageSync(key);
    } catch {
      /* ignore */
    }
  }
};