<template>
  <div class="page-container">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form inline>
        <el-form-item label="商品">
          <el-select
            v-model="selectedProductId"
            filterable
            remote
            :remote-method="searchProduct"
            placeholder="搜索商品名称"
            style="width: 280px"
            @change="loadProductSkus"
          >
            <el-option v-for="p in productOptions" :key="p.id" :label="p.title" :value="p.id" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <!-- SKU 库存表 -->
    <div class="table-container">
      <div class="section-title">SKU 库存列表</div>
      <el-table v-loading="loading" :data="skus" border>
        <el-table-column prop="id" label="SKU ID" width="100" />
        <el-table-column label="规格" min-width="160">
          <template #default="{ row }">
            {{ Object.values(row.specJson).join(' / ') || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="price" label="销售价" width="100">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column prop="stock" label="当前库存" width="100" />
        <el-table-column prop="sales" label="累计销量" width="100" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <StatusTag :status="row.status" type="product" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160">
          <template #default="{ row }">
            <el-button v-permission="'product:stock'" link type="primary" @click="openAdjust(row)">调整库存</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 库存流水 -->
    <div class="table-container" style="margin-top: 16px">
      <div class="section-title">库存变动流水</div>
      <el-table v-loading="logLoading" :data="logs" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="skuId" label="SKU ID" width="100" />
        <el-table-column prop="changeType" label="变动类型" width="120" />
        <el-table-column prop="changeQty" label="变动数量" width="100">
          <template #default="{ row }">
            <span :style="{ color: row.changeQty > 0 ? '#52c41a' : '#f5222d' }">
              {{ row.changeQty > 0 ? '+' : '' }}{{ row.changeQty }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="beforeQty" label="变动前" width="100" />
        <el-table-column prop="afterQty" label="变动后" width="100" />
        <el-table-column prop="refOrderNo" label="关联订单" width="180">
          <template #default="{ row }">{{ row.refOrderNo || '-' }}</template>
        </el-table-column>
        <el-table-column prop="operator" label="操作人" width="100" />
        <el-table-column prop="createdAt" label="时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          v-model:current-page="logPage"
          v-model:page-size="logPageSize"
          :total="logTotal"
          layout="total, prev, pager, next"
          background
          @change="loadLogs"
        />
      </div>
    </div>

    <!-- 调整库存弹窗 -->
    <el-dialog v-model="adjustVisible" title="调整库存" width="420px">
      <el-form label-width="100px">
        <el-form-item label="SKU">{{ adjustRow?.id }}</el-form-item>
        <el-form-item label="当前库存">{{ adjustRow?.stock }}</el-form-item>
        <el-form-item label="调整类型">
          <el-radio-group v-model="adjustForm.type">
            <el-radio value="add">增加</el-radio>
            <el-radio value="sub">减少</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="调整数量">
          <el-input-number v-model="adjustForm.qty" :min="1" />
        </el-form-item>
        <el-form-item label="调整后">
          <span style="font-weight: 600">{{ afterStock }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustVisible = false">取消</el-button>
        <el-button type="primary" :loading="adjustSubmitting" @click="submitAdjust">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import StatusTag from '@/components/StatusTag.vue'
import { formatDateTime } from '@/utils/format'
import {
  getProductList, getStockLogs, adjustStock,
  type Product, type Sku, type StockLog
} from '@/api/modules/product'

const route = useRoute()
const loading = ref(false)
const logLoading = ref(false)
const productOptions = ref<Product[]>([])
const selectedProductId = ref<number | undefined>(Number(route.query.productId) || undefined)
const skus = ref<Sku[]>([])

const logs = ref<StockLog[]>([])
const logTotal = ref(0)
const logPage = ref(1)
const logPageSize = ref(10)

async function searchProduct(keyword: string): Promise<void> {
  const res = await getProductList({ keyword, page: 1, pageSize: 20 })
  productOptions.value = res.list
}

async function loadProductSkus(): Promise<void> {
  if (!selectedProductId.value) return
  loading.value = true
  try {
    const res = await getProductList({ keyword: '', page: 1, pageSize: 100 })
    productOptions.value = res.list
    const prod = res.list.find((p) => p.id === selectedProductId.value)
    skus.value = prod?.skus || []
  } finally {
    loading.value = false
  }
}

async function loadLogs(): Promise<void> {
  logLoading.value = true
  try {
    const res = await getStockLogs({ page: logPage.value, pageSize: logPageSize.value })
    logs.value = res.list
    logTotal.value = res.total
  } finally {
    logLoading.value = false
  }
}

// 调整库存
const adjustVisible = ref(false)
const adjustSubmitting = ref(false)
const adjustRow = ref<Sku | null>(null)
const adjustForm = reactive({ type: 'add' as 'add' | 'sub', qty: 1 })

const afterStock = computed(() => {
  if (!adjustRow.value) return 0
  return adjustForm.type === 'add'
    ? adjustRow.value.stock + adjustForm.qty
    : adjustRow.value.stock - adjustForm.qty
})

function openAdjust(row: Sku): void {
  adjustRow.value = row
  adjustForm.type = 'add'
  adjustForm.qty = 1
  adjustVisible.value = true
}

async function submitAdjust(): Promise<void> {
  if (!adjustRow.value) return
  if (afterStock.value < 0) {
    ElMessage.warning('调整后库存不能为负')
    return
  }
  adjustSubmitting.value = true
  try {
    const changeQty = adjustForm.type === 'add' ? adjustForm.qty : -adjustForm.qty
    await adjustStock(adjustRow.value.id, changeQty, '运营调整')
    ElMessage.success('库存调整成功')
    adjustVisible.value = false
    loadProductSkus()
    loadLogs()
  } finally {
    adjustSubmitting.value = false
  }
}

onMounted(() => {
  searchProduct('')
  if (selectedProductId.value) loadProductSkus()
  loadLogs()
})
</script>

<style scoped lang="scss">
.section-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
  color: $color-text-primary;
}
.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>