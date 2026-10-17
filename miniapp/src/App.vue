<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';

onLaunch(() => {
  // 应用启动：可在此预拉取首页数据/检查更新
  // eslint-disable-next-line no-console
  console.log('[慧宁甄选] App Launch');
});

onShow(() => {
  // 应用从后台进入前台
});

onHide(() => {
  // 应用进入后台
});
</script>

<style lang="scss">
/* 全局样式入口（uni-app 编译后注入所有页面） */
@import '@/styles/reset.scss';
@import '@/styles/common.scss';
</style>