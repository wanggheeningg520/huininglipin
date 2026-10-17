<template>
  <div class="page-container">
    <div class="table-container">
      <div class="toolbar">
        <el-button v-permission="'content:topic'" type="primary" :icon="Plus" @click="handleAdd">新增专题</el-button>
      </div>
      <el-table v-loading="loading" :data="list" border>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="title" label="专题名称" min-width="160" />
        <el-table-column label="Banner" width="120">
          <template #default="{ row }"><el-image :src="row.banner" style="width:80px;height:32px" fit="cover" :preview-src-list="[row.banner]" /></template>
        </el-table-column>
        <el-table-column label="关联商品" min-width="160">
          <template #default="{ row }">{{ row.productIds?.length || 0 }} 个商品</template>
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
            <el-button v-permission="'content:topic'" link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button v-permission="'content:topic'" link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination v-model:current-page="query.page" v-model:page-size="query.pageSize" :total="total" layout="total, prev, pager, next" background @change="loadData" />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑专题' : '新增专题'" width="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="专题名称" prop="title">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="Banner" prop="banner">
          <ImageUpload v-model="form.banner" :limit="1" />
        </el-form-item>
        <el-form-item label="关联商品ID">
          <el-input v-model="productIdsText" type="textarea" :rows="3" placeholder="多个 ID 用逗号分隔，如 1,2,3" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
        </el-form-item>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import StatusTag from '@/components/StatusTag.vue'
import ImageUpload from '@/components/ImageUpload.vue'
import { formatDateTime } from '@/utils/format'
import { getTopicList, createTopic, updateTopic, deleteTopic, type Topic } from '@/api/modules/content'

const loading = ref(false)
const list = ref<Topic[]>([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 20 })

async function loadData(): Promise<void> {
  loading.value = true
  try { const res = await getTopicList(query); list.value = res.list; total.value = res.total } finally { loading.value = false }
}

const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const editingId = ref<number | null>(null)
const form = reactive({ title: '', banner: '', productIds: [] as number[], sort: 99, status: '启用' as '启用' | '停用' })
const productIdsText = computed({
  get: () => form.productIds.join(','),
  set: (v: string) => { form.productIds = v.split(',').map((s) => Number(s.trim())).filter((n) => n > 0) }
})
const rules: FormRules = {
  title: [{ required: true, message: '请输入专题名称', trigger: 'blur' }],
  banner: [{ required: true, message: '请上传 Banner', trigger: 'change' }]
}

function handleAdd(): void {
  editingId.value = null
  Object.assign(form, { title: '', banner: '', productIds: [], sort: 99, status: '启用' })
  dialogVisible.value = true
}
function handleEdit(row: Topic): void {
  editingId.value = row.id
  Object.assign(form, row)
  dialogVisible.value = true
}
async function handleSubmit(): Promise<void> {
  if (!formRef.value) return
  await formRef.value.validate()
  submitting.value = true
  try {
    if (editingId.value) { await updateTopic(editingId.value, { ...form }); ElMessage.success('编辑成功') }
    else { await createTopic({ ...form }); ElMessage.success('新增成功') }
    dialogVisible.value = false; loadData()
  } finally { submitting.value = false }
}
async function handleDelete(row: Topic): Promise<void> {
  await ElMessageBox.confirm(`确定删除专题「${row.title}」？`, '提示', { type: 'warning' })
  await deleteTopic(row.id); ElMessage.success('删除成功'); loadData()
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.toolbar { margin-bottom: 16px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>