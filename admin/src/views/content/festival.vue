<template>
  <div class="page-container">
    <div class="table-container">
      <div class="toolbar">
        <el-button v-permission="'content:festival'" type="primary" :icon="Plus" @click="handleAdd">新增节日</el-button>
        <el-button :icon="Refresh" @click="loadData">刷新</el-button>
        <span class="toolbar-tip">农历节日配一次，年年自动按当年公历日期上线</span>
      </div>

      <el-table v-loading="loading" :data="list" border>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="节日名称" width="120" />
        <el-table-column label="日历类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.calendarType === '农历' ? 'warning' : 'info'" size="small">
              {{ row.calendarType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="日期" width="100">
          <template #default="{ row }">{{ row.month }}月{{ row.day }}日</template>
        </el-table-column>
        <el-table-column prop="prepDays" label="备货提前期" width="110">
          <template #default="{ row }">{{ row.prepDays }} 天</template>
        </el-table-column>
        <el-table-column label="销售窗口" min-width="280">
          <template #default="{ row }">
            {{ row.saleStart?.slice(0, 16) }} ~ {{ row.saleEnd?.slice(0, 16) }}
          </template>
        </el-table-column>
        <el-table-column label="Banner" width="100">
          <template #default="{ row }">
            <el-image :src="row.bannerImage" style="width: 60px; height: 24px" fit="cover" :preview-src-list="[row.bannerImage]" />
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="在线状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isOnline ? 'success' : 'info'" size="small">
              {{ row.isOnline ? '已上线' : '未上线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="启用" width="90">
          <template #default="{ row }">
            <StatusTag :status="row.status" type="product" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'content:festival'" link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button v-permission="'content:festival'" link type="primary" @click="handleToggleStatus(row)">
              {{ row.status === '启用' ? '停用' : '启用' }}
            </el-button>
            <el-button v-permission="'content:festival'" link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          layout="total, prev, pager, next"
          background
          @change="loadData"
        />
      </div>
    </div>

    <!-- 节日表单弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="640px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="节日名称" prop="name">
          <el-input v-model="form.name" placeholder="如：中秋节" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="日历类型" prop="calendarType">
              <el-radio-group v-model="form.calendarType">
                <el-radio value="公历">公历</el-radio>
                <el-radio value="农历">农历</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="月" prop="month">
              <el-input-number v-model="form.month" :min="1" :max="12" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="日" prop="day">
              <el-input-number v-model="form.day" :min="1" :max="form.calendarType === '农历' ? 30 : 31" controls-position="right" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备货提前期" prop="prepDays">
          <el-input-number v-model="form.prepDays" :min="0" :max="90" controls-position="right" />
          <span class="form-tip">天（销售开始前 N 天提醒备货）</span>
        </el-form-item>
        <el-form-item label="销售开始" prop="saleStart">
          <el-date-picker v-model="form.saleStart" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="选择开始时间" style="width: 100%" />
        </el-form-item>
        <el-form-item label="销售结束" prop="saleEnd">
          <el-date-picker v-model="form.saleEnd" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="选择结束时间" style="width: 100%" />
        </el-form-item>
        <el-form-item label="Banner 图" prop="bannerImage">
          <ImageUpload v-model="form.bannerImage" :limit="1" />
        </el-form-item>
        <el-form-item label="链接">
          <el-input v-model="form.linkUrl" placeholder="如：/festival/1" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio value="启用">启用</el-radio>
            <el-radio value="停用">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import StatusTag from '@/components/StatusTag.vue'
import ImageUpload from '@/components/ImageUpload.vue'
import {
  getFestivalList, createFestival, updateFestival, deleteFestival, updateFestivalStatus,
  type Festival
} from '@/api/modules/content'

const loading = ref(false)
const list = ref<Festival[]>([])
const total = ref(0)

const query = reactive({ page: 1, pageSize: 20 })

async function loadData(): Promise<void> {
  loading.value = true
  try {
    const res = await getFestivalList(query)
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

// 表单
const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitting = ref(false)
const formRef = ref<FormInstance>()
const editingId = ref<number | null>(null)

const form = reactive({
  name: '',
  calendarType: '公历' as '公历' | '农历',
  month: 1,
  day: 1,
  prepDays: 15,
  saleStart: '',
  saleEnd: '',
  bannerImage: '',
  linkUrl: '',
  sort: 99,
  status: '启用' as '启用' | '停用'
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入节日名称', trigger: 'blur' }],
  month: [{ required: true, message: '请选择月份', trigger: 'change' }],
  day: [{ required: true, message: '请选择日期', trigger: 'change' }],
  saleStart: [{ required: true, message: '请选择销售开始时间', trigger: 'change' }],
  saleEnd: [{ required: true, message: '请选择销售结束时间', trigger: 'change' }],
  bannerImage: [{ required: true, message: '请上传 Banner 图', trigger: 'change' }]
}

function resetForm(): void {
  form.name = ''
  form.calendarType = '公历'
  form.month = 1
  form.day = 1
  form.prepDays = 15
  form.saleStart = ''
  form.saleEnd = ''
  form.bannerImage = ''
  form.linkUrl = ''
  form.sort = 99
  form.status = '启用'
  editingId.value = null
}

function handleAdd(): void {
  resetForm()
  dialogTitle.value = '新增节日'
  dialogVisible.value = true
}

function handleEdit(row: Festival): void {
  resetForm()
  editingId.value = row.id
  Object.assign(form, row)
  dialogTitle.value = '编辑节日'
  dialogVisible.value = true
}

async function handleSubmit(): Promise<void> {
  if (!formRef.value) return
  await formRef.value.validate()

  // 农历校验
  if (form.calendarType === '农历') {
    if (form.month < 1 || form.month > 12) {
      ElMessage.error('农历月份不合法')
      return
    }
    if (form.day < 1 || form.day > 30) {
      ElMessage.error('农历日期不合法')
      return
    }
  }
  // 销售窗口校验
  if (form.saleEnd <= form.saleStart) {
    ElMessage.error('销售结束时间必须晚于开始时间')
    return
  }

  submitting.value = true
  try {
    if (editingId.value) {
      await updateFestival(editingId.value, { ...form })
      ElMessage.success('编辑成功')
    } else {
      await createFestival({ ...form })
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    submitting.value = false
  }
}

async function handleToggleStatus(row: Festival): Promise<void> {
  const newStatus = row.status === '启用' ? '停用' : '启用'
  await updateFestivalStatus(row.id, newStatus)
  ElMessage.success(`已${newStatus}`)
  loadData()
}

async function handleDelete(row: Festival): Promise<void> {
  await ElMessageBox.confirm(`确定删除节日「${row.name}」吗？`, '提示', { type: 'warning' })
  await deleteFestival(row.id)
  ElMessage.success('删除成功')
  loadData()
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.toolbar {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.toolbar-tip {
  margin-left: 12px;
  color: $color-text-secondary;
  font-size: 13px;
}
.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.form-tip {
  margin-left: 8px;
  color: $color-text-secondary;
  font-size: 13px;
}
</style>