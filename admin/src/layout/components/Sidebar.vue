<template>
  <el-menu
    :default-active="activeMenu"
    :collapse="appStore.sidebarCollapsed"
    :unique-opened="true"
    router
    background-color="#1f5c36"
    text-color="#bfcbd9"
    active-text-color="#ffffff"
  >
    <template v-for="menu in filteredMenus" :key="menu.path">
      <!-- 含子菜单 -->
      <el-sub-menu v-if="menu.children && menu.children.length" :index="menu.path">
        <template #title>
          <el-icon v-if="menu.icon"><component :is="resolveIcon(menu.icon)" /></el-icon>
          <span>{{ menu.name }}</span>
        </template>
        <el-menu-item
          v-for="child in menu.children"
          :key="child.path"
          :index="child.path"
        >
          <el-icon v-if="child.icon"><component :is="resolveIcon(child.icon)" /></el-icon>
          <template #title>{{ child.name }}</template>
        </el-menu-item>
      </el-sub-menu>
      <!-- 单菜单 -->
      <el-menu-item v-else :index="menu.path">
        <el-icon v-if="menu.icon"><component :is="resolveIcon(menu.icon)" /></el-icon>
        <template #title>{{ menu.name }}</template>
      </el-menu-item>
    </template>
  </el-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { useUserStore } from '@/store/modules/user'
import { usePermissionStore } from '@/store/modules/permission'
import { useAppStore } from '@/store/modules/app'
import type { MenuNode } from '@/types'

const route = useRoute()
const userStore = useUserStore()
const permissionStore = usePermissionStore()
const appStore = useAppStore()

const activeMenu = computed(() => route.path)

const filteredMenus = computed<MenuNode[]>(() => {
  return permissionStore.filterMenus(userStore.menus)
})

// 图标解析
const iconMap = ElementPlusIconsVue as unknown as Record<string, { new (): unknown }>
function resolveIcon(name?: string | null) {
  if (!name) return null
  return iconMap[name] || null
}
</script>

<style scoped lang="scss">
:deep(.el-menu) {
  border-right: none;
}
:deep(.el-menu--collapse) {
  width: $sidebar-width-collapsed;
}
</style>