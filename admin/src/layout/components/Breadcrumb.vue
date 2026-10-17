<template>
  <el-breadcrumb class="breadcrumb" separator="/">
    <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
    <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path" :to="item.path">
      {{ item.title }}
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import type { MenuNode } from '@/types'

const route = useRoute()
const userStore = useUserStore()

interface Crumb { path: string; title: string }

const breadcrumbs = computed<Crumb[]>(() => {
  const result: Crumb[] = []
  const path = route.path
  if (path === '/dashboard') return result

  // 在菜单树中查找路径
  function findInMenus(menus: MenuNode[], parents: MenuNode[]): boolean {
    for (const m of menus) {
      if (m.path === path) {
        parents.forEach((p) => result.push({ path: p.path, title: p.name }))
        if (m.type === 'menu') result.push({ path: m.path, title: m.name })
        return true
      }
      if (m.children && findInMenus(m.children, [...parents, m])) {
        return true
      }
    }
    return false
  }
  findInMenus(userStore.menus, [])
  return result
})
</script>

<style scoped lang="scss">
.breadcrumb {
  font-size: 14px;
}
</style>