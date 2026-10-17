<template>
  <div class="page-container">
    <div class="table-container">
      <div class="toolbar">
        <span class="title">菜单树（只读展示，完整 CRUD 由后端配置）</span>
        <el-button :icon="Refresh" @click="loadData">刷新</el-button>
      </div>
      <el-table v-loading="loading" :data="menuTree" row-key="id" border default-expand-all :tree-props="{ children: 'children' }">
        <el-table-column prop="name" label="菜单名称" min-width="180" />
        <el-table-column prop="path" label="路由路径" min-width="160" />
        <el-table-column prop="component" label="组件" min-width="160">
          <template #default="{ row }">{{ row.component || '-' }}</template>
        </el-table-column>
        <el-table-column prop="permission" label="权限标识" width="180" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.type === 'directory' ? 'info' : row.type === 'menu' ? 'success' : 'warning'">
              {{ row.type === 'directory' ? '目录' : row.type === 'menu' ? '菜单' : '按钮' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="visible" label="可见" width="80">
          <template #default="{ row }">{{ row.visible ? '是' : '否' }}</template>
        </el-table-column>
      </el-table>
      <div class="tip">
        <el-alert type="info" :closable="false" show-icon title="一期不展示卡券管理、企业客户、分销管理菜单（不绑定角色）。菜单完整 CRUD 通过后端 system/menu 接口配置。" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { getMenuTree } from '@/api/modules/system'
import type { MenuNode } from '@/types'

const loading = ref(false)
const menuTree = ref<MenuNode[]>([])

async function loadData(): Promise<void> {
  loading.value = true
  try { menuTree.value = await getMenuTree() } finally { loading.value = false }
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.toolbar { margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
.title { font-size: 15px; font-weight: 600; }
.tip { margin-top: 16px; }
</style>