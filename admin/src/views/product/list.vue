<template>
  <div class="page-container">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form inline :model="query">
        <el-form-item label="商品名称">
          <el-input v-model="query.keyword" placeholder="请输入商品名称" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="分类">
          <el-cascader
            v-model="query.categoryId"
            :options="categoryOptions"
            :props="{ value: 'id', label: 'name', children: 'children', checkStrictly: true, emitPath: false }"
            placeholder="请选择分类"
            clearable
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="在售" value="在售" />
            <el-option label="下架" value="下架" />
          </el-select>
        </el-form-item>
        <el-form-item label="预售">
          <el-select v-model="query.isPresale" placeholder="全部" clearable style="width: 100px">
            <el-option label="预售" value="true" />
            <el-option label="现货" value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格 -->
    <div class="table-container">
      <div class="toolbar">
        <el-button v-permission="'product:write'" type="primary" :icon="Plus" @click="goEdit(0)">新增商品</el-button>
        <el-button v-permission="'product:status'" :icon="Upload" @click="batchAction('on')">批量上架</el-button>
        <el-button v-permission="'product:status'" :icon="Download" @click="batchAction('off')">批量下架</el-button>
      </div>

      <el-table v-loading="loading" :data="list" border @selection-change="onSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="主图" width="80">
          <template #default="{ row }">
            <el-image :src="row.mainImage" style="width: 50px; height: 50px" fit="cover" :preview-src-list="[row.mainImage]" />
          </template>
        </el-table-column>
        <el-table-column prop="title" label="商品标题" min-width="200" show-overflow-tooltip />
        <el-table-column label="价格区间" width="140">
          <template #default="{ row }">
            <span v-if="row.skus?.length">¥{{ Math.min(...row.skus.map((s: Sku) => s.price)) }} 起</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="库存" width="100">
          <template #default="{ row }">
            {{ row.skus?.reduce((sum: number, s: Sku) => sum + s.stock, 0) || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="预售" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.isPresale" type="warning" size="small">预售</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <StatusTag :status="row.status" type="product" />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="goEdit(row.id)">编辑</el-button>
            <el-button v-permission="'product:status'" link type="primary" @click="toggleStatus(row)">
              {{ row.status === '在售' ? '下架' : '上架' }}
            </el-button>
            <el-button link type="primary" @click="goStock(row.id)">库存</el-button>
            <el-button v-permission="'product:presale'" link type="primary" @click="goPresale(row)">预售</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @change="loadData"
        />
      </div>
    </div>

    <!-- 预售配置弹窗 -->
    <el-dialog v-model="presaleVisible" title="预售配置" width="420px">
      <el-form label-width="110px">
        <el-form-item label="商品">{{ presaleRow?.title }}</el-form-item>
        <el-form-item label="开启预售">
          <el-switch v-model="presaleForm.isPresale" />
        </el-form-item>
        <el-form-item v-if="presaleForm.isPresale" label="预计发货日期">
          <el-date-picker v-model="presaleForm.presaleDeliverDate" type="date" value-format="YYYY-MM-DD" placeholder="选择发货日期" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="presaleVisible = false">取消</el-button>
        <el-button type="primary" :loading="presaleSubmitting" @click="submitPresale">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search, Refresh, Upload, Download } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import StatusTag from '@/components/StatusTag.vue'
import { formatDateTime } from '@/utils/format'
import {
  getProductList, updateProductStatus, batchProductAction, updatePresale,
  getCategoryTree, type Product, type Category, type Sku
} from '@/api/modules/product'

const router = useRouter()
const loading = ref(false)
const list = ref<Product[]>([])
const total = ref(0)
const selected = ref<Product[]>([])
const categoryOptions = ref<Category[]>([])

const query = reactive({
  keyword: '',
  categoryId: undefined as number | undefined,
  status: '',
  isPresale: '',
  page: 1,
  pageSize: 20
})

async function loadData(): Promise<void> {
  loading.value = true
  try {
    const res = await getProductList({
      keyword: query.keyword || undefined,
      categoryId: query.categoryId,
      status: query.status || undefined,
      isPresale: query.isPresale || undefined,
      page: query.page,
      pageSize: query.pageSize
    })
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

async function loadCategories(): Promise<void> {
  categoryOptions.value = await getCategoryTree()
}

function handleSearch(): void {
  query.page = 1
  loadData()
}
function handleReset(): void {
  query.keyword = ''
  query.categoryId = undefined
  query.status = ''
  query.isPresale = ''
  query.page = 1
  loadData()
}

function onSelectionChange(rows: Product[]): void {
  selected.value = rows
}

function goEdit(id: number): void {
  router.push(`/product/edit${id ? `?id=${id}` : ''}`)
}
function goStock(id: number): void {
  router.push(`/product/stock?productId=${id}`)
}

async function toggleStatus(row: Product): Promise<void> {
  const newStatus = row.status === '在售' ? '下架' : '在售'
  await updateProductStatus(row.id, newStatus)
  ElMessage.success(`已${newStatus}`)
  loadData()
}

async function batchAction(action: 'on' | 'off'): Promise<void> {
  if (!selected.value.length) {
    ElMessage.warning('请先选择商品')
    return
  }
  await ElMessageBox.confirm(`确定批量${action === 'on' ? '上架' : '下架'} ${selected.value.length} 个商品？`, '提示', { type: 'warning' })
  const res = await batchProductAction(selected.value.map((r) => r.id), action)
  ElMessage.success(`成功 ${res.success} 条`)
  loadData()
}

// 预售配置
const presaleVisible = ref(false)
const presaleSubmitting = ref(false)
const presaleRow = ref<Product | null>(null)
const presaleForm = reactive({ isPresale: false, presaleDeliverDate: '' })

function goPresale(row: Product): void {
  presaleRow.value = row
  presaleForm.isPresale = row.isPresale
  presaleForm.presaleDeliverDate = row.presaleDeliverDate || ''
  presaleVisible.value = true
}

async function submitPresale(): Promise<void> {
  if (!presaleRow.value) return
  if (presaleForm.isPresale && !presaleForm.presaleDeliverDate) {
    ElMessage.warning('请选择预计发货日期')
    return
  }
  presaleSubmitting.value = true
  try {
    await updatePresale(presaleRow.value.id, presaleForm.isPresale, presaleForm.presaleDeliverDate)
    ElMessage.success('预售配置成功')
    presaleVisible.value = false
    loadData()
  } finally {
    presaleSubmitting.value = false
  }
}

onMounted(() => {
  loadData()
  loadCategories()
})
</script>

<style scoped lang="scss">
.toolbar {
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
}
.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>