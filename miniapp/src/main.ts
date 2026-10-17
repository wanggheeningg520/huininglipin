import { createSSRApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';
import { createPersistedState } from 'pinia-plugin-persistedstate';
import { uniStorageAdapter } from './store/persist';

export function createApp() {
  const app = createSSRApp(App);

  // Pinia 实例 + 持久化插件（适配 uni.storage）
  const pinia = createPinia();
  pinia.use(createPersistedState({ storage: uniStorageAdapter }));

  app.use(pinia);

  return { app, pinia };
}