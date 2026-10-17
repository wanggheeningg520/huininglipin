<template>
  <div class="page-container">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form inline :model="query">
        <el-form-item label="订单号">
          <el-input v-model="query.keyword" placeholder="请输入订单号" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 130px">
            <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单类型">
          <el-select v-model="query.orderType" placeholder="全部" clearable style="width: 120px">
            <el-option label="普通" value="普通" />
            <el-option label="预售" value="预售" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          <el-button v-permission="'order:export'" :icon="Download" @click="handleExport">导出</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格 -->
    <div class="table-container">
      <el-table v-loading="loading" :data="list" border>
        <el-table-column prop="orderNo" label="订单号" width="200" fixed />
        <el-table-column prop="orderType" label="类型" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.orderType === '预售'" type="warning" size="small">预售单</el-tag>
            <span v-else>普通</span>
          </template>
        </el-table-column>
        <el-table-column prop="userNickname" label="买家" width="120" />
        <el-table-column label="商品" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.items.map((i: OrderItem) => i.productTitle).join('；') }}
          </template>
        </el-table-column>
        <el-table-column prop="payAmount" label="支付金额" width="110">
          <template #default="{ row }">¥{{ row.payAmount }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <StatusTag :status="row.status" type="order" />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="下单时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="goDetail(row.orderNo)">详情</el-button>
            <el-button v-permission="'order:ship'" v-if="row.status === '待发货'" link type="primary" @click="goShip(row.orderNo)">发货</el-button>
            <el-button v-if="row.orderType === '预售'" link type="warning" @click="showPresaleInfo(row)">预售信息</el-button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Refresh, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import StatusTag from '@/components/StatusTag.vue'
import { formatDateTime, downloadCSV } from '@/utils/format'
import { getOrderList, exportOrders, type Order } from '@/api/modules/order'

type OrderItem = Order['items'][0]

const router = useRouter()
const loading = ref(false)
const list = ref<Order[]>([])
const total = ref(0)

const statusOptions = ['待支付', '待发货', '待收货', '已完成', '已取消', '已退款']

const query = reactive({
  keyword: '',
  status: '',
  orderType: '',
  page: 1,
  pageSize: 20
})

async function loadData(): Promise<void> {
  loading.value = true
  try {
    const res = await getOrderList({
      keyword: query.keyword || undefined,
      status: query.status || undefined,
      orderType: query.orderType || undefined,
      page: query.page,
      pageSize: query.pageSize
    })
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function handleSearch(): void {
  query.page = 1
  loadData()
}
function handleReset(): void {
  query.keyword = ''
  query.status = ''
  query.orderType = ''
  query.page = 1
  loadData()
}

function goDetail(orderNo: string): void {
  router.push(`/order/detail?orderNo=${orderNo}`)
}
function goShip(orderNo: string): void {
  router.push(`/order/ship?orderNo=${orderNo}`)
}

function showPresaleInfo(row: Order): void {
  ElMessage.info(`预售单 · 预计发货日：${row.presaleDeliverDate || '-'}`)
}

async function handleExport(): Promise<void> {
  try {
    await exportOrders({ ...query })
    // 导出当前列表为 CSV
    downloadCSV(`订单列表_${Date.now()}.csv`, list.value.map((o) => ({
      订单号: o.orderNo,
      类型: o.orderType,
      买家: o.userNickname,
      金额: o.payAmount,
      状态: o.status,
      下单时间: o.createdAt
    })))
    ElMessage.success('导出成功')
  } catch {
    // ignore
  }
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>