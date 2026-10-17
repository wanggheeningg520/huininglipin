<template>
  <div class="page-container">
    <div class="table-container">
      <div class="toolbar">
        <el-button v-permission="'content:notice'" type="primary" :icon="Plus" @click="handleAdd">新增公告</el-button>
      </div>
      <el-table v-loading="loading" :data="list" border>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="title" label="标题" min-width="180" />
        <el-table-column prop="content" label="内容" min-width="240" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === '系统' ? 'info' : row.type === '活动' ? 'success' : 'warning'" size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }"><StatusTag :status="row.status" type="product" /></template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'content:notice'" link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button v-permission="'content:notice'" link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination v-model:current-page="query.page" v-model:page-size="query.pageSize" :total="total" layout="total, prev, pager, next" background @change="loadData" />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑公告' : '新增公告'" width="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="标题" prop="title"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type">
            <el-option label="系统" value="系统" />
            <el-option label="活动" value="活动" />
            <el-option label="公告" value="公告" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sort" :min="0" :max="999" /></el-form-item>
        <el-form-item label="状态">
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
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import StatusTag from '@/components/StatusTag.vue'
import { formatDateTime } from '@/utils/format'
import { getNoticeList, createNotice, updateNotice, deleteNotice, type Notice } from '@/api/modules/content'

const loading = ref(false)
const list = ref<Notice[]>([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 20 })

async function loadData(): Promise<void> {
  loading.value = true
  try { const res = await getNoticeList(query); list.value = res.list; total.value = res.total } finally { loading.value = false }
}

const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const editingId = ref<number | null>(null)
const form = reactive({ title: '', content: '', type: '公告' as '系统' | '活动' | '公告', sort: 99, status: '启用' as '启用' | '停用' })
const rules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }]
}

function handleAdd(): void {
  editingId.value = null
  Object.assign(form, { title: '', content: '', type: '公告', sort: 99, status: '启用' })
  dialogVisible.value = true
}
function handleEdit(row: Notice): void {
  editingId.value = row.id
  Object.assign(form, row)
  dialogVisible.value = true
}
async function handleSubmit(): Promise<void> {
  if (!formRef.value) return
  await formRef.value.validate()
  submitting.value = true
  try {
    if (editingId.value) { await updateNotice(editingId.value, { ...form }); ElMessage.success('编辑成功') }
    else { await createNotice({ ...form }); ElMessage.success('新增成功') }
    dialogVisible.value = false; loadData()
  } finally { submitting.value = false }
}
async function handleDelete(row: Notice): Promise<void> {
  await ElMessageBox.confirm(`确定删除公告「${row.title}」？`, '提示', { type: 'warning' })
  await deleteNotice(row.id); ElMessage.success('删除成功'); loadData()
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.toolbar { margin-bottom: 16px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>