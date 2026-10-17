<template>
  <div class="page-container">
    <div class="search-bar">
      <el-form inline>
        <el-form-item label="操作人">
          <el-input v-model="query.operator" placeholder="操作人" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="模块">
          <el-select v-model="query.module" placeholder="全部" clearable style="width: 150px">
            <el-option v-for="m in modules" :key="m" :label="m" :value="m" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-container">
      <el-table v-loading="loading" :data="list" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="operator" label="操作人" width="120" />
        <el-table-column prop="module" label="模块" width="120" />
        <el-table-column prop="action" label="操作" width="120" />
        <el-table-column prop="ip" label="IP" width="140" />
        <el-table-column label="变动前" min-width="180">
          <template #default="{ row }">
            <span v-if="row.beforeValue" class="json-text">{{ row.beforeValue }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="变动后" min-width="180">
          <template #default="{ row }">
            <span v-if="row.afterValue" class="json-text">{{ row.afterValue }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="操作时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination v-model:current-page="query.page" v-model:page-size="query.pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper" background @change="loadData" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { formatDateTime } from '@/utils/format'
import { getAuditLogList, type AuditLog } from '@/api/modules/system'

const loading = ref(false)
const list = ref<AuditLog[]>([])
const total = ref(0)
const modules = ['商品管理', '订单管理', '内容运营', '会员管理', '系统设置']

const query = reactive({ operator: '', module: '', page: 1, pageSize: 20 })

async function loadData(): Promise<void> {
  loading.value = true
  try {
    const res = await getAuditLogList({
      operator: query.operator || undefined,
      module: query.module || undefined,
      page: query.page,
      pageSize: query.pageSize
    })
    list.value = res.list; total.value = res.total
  } finally { loading.value = false }
}

function handleSearch(): void { query.page = 1; loadData() }
function handleReset(): void { query.operator = ''; query.module = ''; query.page = 1; loadData() }

onMounted(loadData)
</script>

<style scoped lang="scss">
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
.json-text {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: $color-text-secondary;
  word-break: break-all;
}
</style>