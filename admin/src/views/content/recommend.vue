<template>
  <div class="page-container">
    <div class="table-container">
      <div class="toolbar">
        <el-button v-permission="'content:recommend'" type="primary" :icon="Plus" @click="handleAdd">新增推荐</el-button>
      </div>
      <el-table v-loading="loading" :data="list" border>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="productId" label="商品ID" width="90" />
        <el-table-column label="商品图" width="80">
          <template #default="{ row }"><el-image :src="row.mainImage" style="width:50px;height:50px" fit="cover" /></template>
        </el-table-column>
        <el-table-column prop="productTitle" label="商品名称" min-width="200" />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }"><StatusTag :status="row.status" type="product" /></template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'content:recommend'" link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button v-permission="'content:recommend'" link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination v-model:current-page="query.page" v-model:page-size="query.pageSize" :total="total" layout="total, prev, pager, next" background @change="loadData" />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑推荐' : '新增推荐'" width="420px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="商品ID" prop="productId">
          <el-input-number v-model="form.productId" :min="1" controls-position="right" />
        </el-form-item>
        <el-form-item label="商品名称" prop="productTitle">
          <el-input v-model="form.productTitle" />
        </el-form-item>
        <el-form-item label="主图URL">
          <el-input v-model="form.mainImage" placeholder="商品主图 URL" />
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
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import StatusTag from '@/components/StatusTag.vue'
import { getRecommendList, createRecommend, updateRecommend, deleteRecommend, type Recommend } from '@/api/modules/content'

const loading = ref(false)
const list = ref<Recommend[]>([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 20 })

async function loadData(): Promise<void> {
  loading.value = true
  try { const res = await getRecommendList(query); list.value = res.list; total.value = res.total } finally { loading.value = false }
}

const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const editingId = ref<number | null>(null)
const form = reactive({ productId: 1, productTitle: '', mainImage: '', sort: 99, status: '启用' as '启用' | '停用' })
const rules: FormRules = {
  productId: [{ required: true, message: '请输入商品ID', trigger: 'blur' }],
  productTitle: [{ required: true, message: '请输入商品名称', trigger: 'blur' }]
}

function handleAdd(): void {
  editingId.value = null
  Object.assign(form, { productId: 1, productTitle: '', mainImage: '', sort: 99, status: '启用' })
  dialogVisible.value = true
}
function handleEdit(row: Recommend): void {
  editingId.value = row.id
  Object.assign(form, row)
  dialogVisible.value = true
}
async function handleSubmit(): Promise<void> {
  if (!formRef.value) return
  await formRef.value.validate()
  submitting.value = true
  try {
    if (editingId.value) { await updateRecommend(editingId.value, { ...form }); ElMessage.success('编辑成功') }
    else { await createRecommend({ ...form }); ElMessage.success('新增成功') }
    dialogVisible.value = false; loadData()
  } finally { submitting.value = false }
}
async function handleDelete(row: Recommend): Promise<void> {
  await ElMessageBox.confirm('确定删除该推荐？', '提示', { type: 'warning' })
  await deleteRecommend(row.id); ElMessage.success('删除成功'); loadData()
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.toolbar { margin-bottom: 16px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>