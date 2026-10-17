<template>
  <div class="tags-view">
    <el-scrollbar>
      <div class="tags-list">
        <div
          v-for="tag in appStore.tagViews"
          :key="tag.path"
          class="tag-item"
          :class="{ active: appStore.activeTag === tag.path }"
          @click="goTo(tag.path)"
        >
          <span class="tag-title">{{ tag.title }}</span>
          <el-icon class="tag-close" @click.stop="closeTag(tag.path)">
            <Close />
          </el-icon>
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Close } from '@element-plus/icons-vue'
import { useAppStore } from '@/store/modules/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

// 监听路由变化，添加标签
watch(
  () => route.fullPath,
  () => {
    if (route.meta.hidden || route.path === '/login') return
    appStore.addTagView({
      path: route.fullPath,
      title: (route.meta.title as string) || '未命名',
      name: route.name as string
    })
  },
  { immediate: true }
)

function goTo(path: string): void {
  router.push(path)
}

function closeTag(path: string): void {
  const isActive = appStore.activeTag === path
  appStore.removeTagView(path)
  if (isActive) {
    router.push(appStore.activeTag || '/dashboard')
  }
}
</script>

<style scoped lang="scss">
.tags-view {
  height: $tagsview-height;
  background: $color-bg-card;
  border-bottom: 1px solid $color-border-light;
  display: flex;
  align-items: center;
  padding: 0 8px;
  z-index: $z-tagsview;
}

.tags-list {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 12px;
  border: 1px solid $color-border;
  border-radius: 3px;
  cursor: pointer;
  white-space: nowrap;
  color: $color-text-regular;
  background: #fff;
  transition: all 0.2s;

  &:hover {
    color: $color-primary;
    border-color: $color-primary;
  }

  &.active {
    color: #fff;
    background: $color-primary;
    border-color: $color-primary;
  }
}

.tag-close {
  font-size: 12px;
  border-radius: 50%;
  &:hover {
    background: rgba(0, 0, 0, 0.15);
  }
}
</style>