// ============================================================
// 应用 Store - 侧边栏折叠 / 标签页
// ============================================================
import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface TagView {
  path: string
  title: string
  name: string
}

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const tagViews = ref<TagView[]>([])
  const activeTag = ref('')

  function toggleSidebar(): void {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function addTagView(tag: TagView): void {
    if (!tagViews.value.find((t) => t.path === tag.path)) {
      tagViews.value.push(tag)
    }
    activeTag.value = tag.path
  }

  function removeTagView(path: string): void {
    const idx = tagViews.value.findIndex((t) => t.path === path)
    if (idx >= 0) {
      tagViews.value.splice(idx, 1)
      if (activeTag.value === path) {
        const next = tagViews.value[idx] || tagViews.value[idx - 1]
        activeTag.value = next ? next.path : '/dashboard'
      }
    }
  }

  function closeOtherTags(path: string): void {
    tagViews.value = tagViews.value.filter((t) => t.path === path)
    activeTag.value = path
  }

  return {
    sidebarCollapsed, tagViews, activeTag,
    toggleSidebar, addTagView, removeTagView, closeOtherTags
  }
}, {
  persist: {
    key: 'hn_admin_app',
    pick: ['sidebarCollapsed']
  }
})