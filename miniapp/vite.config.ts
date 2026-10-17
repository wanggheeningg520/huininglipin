import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';

// uni-app Vue3 + TS + Vite 编译配置
export default defineConfig({
  plugins: [uni()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 全局注入 variables.scss，所有组件可直接使用 SCSS 变量
        additionalData: '@import "@/styles/variables.scss";'
      }
    }
  }
});