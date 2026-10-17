<template>
  <!-- 递归菜单渲染组件（备用，当前 Sidebar 已直接渲染两级菜单） -->
  <template v-for="menu in menus" :key="menu.path">
    <el-sub-menu v-if="menu.children && menu.children.length" :index="menu.path">
      <template #title>
        <el-icon v-if="menu.icon"><component :is="menu.icon" /></el-icon>
        <span>{{ menu.name }}</span>
      </template>
      <MenuRender :menus="menu.children" />
    </el-sub-menu>
    <el-menu-item v-else :index="menu.path">
      <el-icon v-if="menu.icon"><component :is="menu.icon" /></el-icon>
      <template #title>{{ menu.name }}</template>
    </el-menu-item>
  </template>
</template>

<script setup lang="ts">
import type { MenuNode } from '@/types'
defineProps<{ menus: MenuNode[] }>()
</script>