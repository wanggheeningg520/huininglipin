<template>
  <div class="page-container">
    <div class="search-bar">
      <el-form inline>
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" placeholder="昵称/手机号" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-container">
      <el-table v-loading="loading" :data="list" border>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="头像" width="70">
          <template #default="{ row }"><el-avatar :size="36" :src="row.avatar" /></template>
        </el-table-column>
        <el-table-column prop="nickname" label="昵称" width="140" />
        <el-table-column label="手机号" width="140">
          <template #default="{ row }">{{ maskPhone(row.phone) }}</template>
        </el-table-column>
        <el-table-column prop="level" label="等级" width="80">
          <template #default="{ row }">
            <el-tag size="small">Lv{{ row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="points" label="积分" width="100" />
        <el-table-column prop="orderCount" label="订单数" width="90" />
        <el-table-column prop="totalAmount" label="消费总额" width="110">
          <template #default="{ row }">¥{{ row.totalAmount }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }"><StatusTag :status="row.status" type="product" /></template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column prop="lastLoginAt" label="最后登录" width="170">
          <template #default="{ row }">{{ formatDateTime(row.lastLoginAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination v-model:current-page="query.page" v-model:page-size="query.pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper" background @change="loadData" />
      </div>
    </div>

    <!-- 会员详情弹窗 -->
    <el-dialog v-model="detailVisible" title="会员详情" width="560px">
      <template v-if="detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="会员ID">{{ detail.id }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ detail.nickname }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ maskPhone(detail.phone) }}</el-descriptions-item>
          <el-descriptions-item label="等级">Lv{{ detail.level }}</el-descriptions-item>
          <el-descriptions-item label="积分">{{ detail.points }}</el-descriptions-item>
          <el-descriptions-item label="状态"><StatusTag :status="detail.status" type="product" /></el-descriptions-item>
          <el-descriptions-item label="订单数">{{ detail.orderCount }}</el-descriptions-item>
          <el-descriptions-item label="消费总额">¥{{ detail.totalAmount }}</el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ formatDateTime(detail.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="最后登录">{{ formatDateTime(detail.lastLoginAt) }}</el-descriptions-item>
          <el-descriptions-item label="openid" :span="2">{{ detail.openid }}</el-descriptions-item>
        </el-descriptions>
        <el-alert style="margin-top: 16px" type="info" :closable="false" show-icon title="积分变动功能一期未开放" />
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import StatusTag from '@/components/StatusTag.vue'
import { maskPhone, formatDateTime } from '@/utils/format'
import { getMemberList, getMemberDetail, type Member } from '@/api/modules/member'

const loading = ref(false)
const list = ref<Member[]>([])
const total = ref(0)
const query = reactive({ keyword: '', page: 1, pageSize: 20 })

async function loadData(): Promise<void> {
  loading.value = true
  try {
    const res = await getMemberList({ keyword: query.keyword || undefined, page: query.page, pageSize: query.pageSize })
    list.value = res.list; total.value = res.total
  } finally { loading.value = false }
}

function handleSearch(): void { query.page = 1; loadData() }
function handleReset(): void { query.keyword = ''; query.page = 1; loadData() }

const detailVisible = ref(false)
const detail = ref<Member | null>(null)
async function viewDetail(row: Member): Promise<void> {
  detail.value = await getMemberDetail(row.id)
  detailVisible.value = true
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>