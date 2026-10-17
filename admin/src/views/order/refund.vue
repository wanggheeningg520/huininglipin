<template>
  <div class="page-container">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form inline>
        <el-form-item label="退款状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 130px">
            <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
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
      <el-table v-loading="loading" :data="list" border>
        <el-table-column prop="refundNo" label="退款单号" width="200" fixed />
        <el-table-column prop="orderNo" label="原订单号" width="200" />
        <el-table-column prop="amount" label="退款金额" width="110">
          <template #default="{ row }">¥{{ row.amount }}</template>
        </el-table-column>
        <el-table-column prop="reason" label="退款原因" min-width="140" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <StatusTag :status="row.status" type="refund" />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="申请时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column prop="auditTime" label="审核时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.auditTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === '待审核'">
              <el-button v-permission="'order:refund:audit'" link type="primary" @click="openAudit(row, 'pass')">通过</el-button>
              <el-button v-permission="'order:refund:audit'" link type="danger" @click="openAudit(row, 'reject')">拒绝</el-button>
            </template>
            <el-button link type="primary" @click="viewDetail(row)">详情</el-button>
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

    <!-- 审核弹窗 -->
    <el-dialog v-model="auditVisible" :title="auditTitle" width="480px">
      <el-form label-width="100px">
        <el-form-item label="退款单号">{{ auditRow?.refundNo }}</el-form-item>
        <el-form-item label="原订单号">{{ auditRow?.orderNo }}</el-form-item>
        <el-form-item label="退款金额">¥{{ auditRow?.amount }}</el-form-item>
        <el-form-item label="退款原因">{{ auditRow?.reason }}</el-form-item>
        <el-form-item v-if="isFreshOrder" label="生鲜提示">
          <el-alert type="warning" :closable="false" show-icon title="生鲜商品已签收退款需人工处理，生鲜不支持无理由退货" />
        </el-form-item>
        <el-form-item label="审核备注">
          <el-input v-model="auditForm.auditRemark" type="textarea" :rows="3" placeholder="请输入审核备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditVisible = false">取消</el-button>
        <el-button :type="auditAction === 'pass' ? 'success' : 'danger'" :loading="auditSubmitting" @click="submitAudit">
          {{ auditAction === 'pass' ? '确认通过（原路退回）' : '确认拒绝' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import StatusTag from '@/components/StatusTag.vue'
import { formatDateTime } from '@/utils/format'
import { getRefundList, auditRefund, type Refund } from '@/api/modules/order'

const loading = ref(false)
const list = ref<Refund[]>([])
const total = ref(0)

const statusOptions = ['待审核', '已通过', '已拒绝', '已退款']

const query = reactive({
  status: '',
  page: 1,
  pageSize: 20
})

async function loadData(): Promise<void> {
  loading.value = true
  try {
    const res = await getRefundList({
      status: query.status || undefined,
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
  query.status = ''
  query.page = 1
  loadData()
}

// 审核
const auditVisible = ref(false)
const auditSubmitting = ref(false)
const auditRow = ref<Refund | null>(null)
const auditAction = ref<'pass' | 'reject'>('pass')
const auditForm = reactive({ auditRemark: '' })

const auditTitle = computed(() => auditAction.value === 'pass' ? '退款审核 · 通过' : '退款审核 · 拒绝')
const isFreshOrder = computed(() => {
  // 简化判断：若退款原因含"质量"且订单已收货，视为生鲜争议
  if (!auditRow.value) return false
  return auditRow.value.order.status === '待收货' || auditRow.value.order.status === '已完成'
})

function openAudit(row: Refund, action: 'pass' | 'reject'): void {
  auditRow.value = row
  auditAction.value = action
  auditForm.auditRemark = ''
  auditVisible.value = true
}

async function submitAudit(): Promise<void> {
  if (!auditRow.value) return
  auditSubmitting.value = true
  try {
    await auditRefund(auditRow.value.refundNo, auditAction.value, auditForm.auditRemark)
    ElMessage.success(auditAction.value === 'pass' ? '已通过，原路退回微信' : '已拒绝，订单恢复')
    auditVisible.value = false
    loadData()
  } finally {
    auditSubmitting.value = false
  }
}

function viewDetail(row: Refund): void {
  // 简单展示
  ElMessage.info(`退款单 ${row.refundNo}，状态：${row.status}`)
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