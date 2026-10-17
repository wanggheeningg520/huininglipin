// ============================================================
// 应用入口
// ============================================================
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './store'
import { permission } from './directives/permission'

// Element Plus 样式
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
// 全局样式
import '@/styles/index.scss'

const app = createApp(App)

app.use(pinia)
app.use(router)

// 自定义指令
app.directive('permission', permission)

app.mount('#app')