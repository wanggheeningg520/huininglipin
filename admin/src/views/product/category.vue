<template>
  <div class="page-container">
    <div class="table-container">
      <div class="toolbar">
        <el-button v-permission="'product:category:*'" type="primary" :icon="Plus" @click="handleAdd(null)">
          新增一级分类
        </el-button>
        <el-button :icon="Refresh" @click="loadData">刷新</el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="categoryTree"
        row-key="id"
        border
        default-expand-all
        :tree-props="{ children: 'children' }"
      >
        <el-table-column prop="name" label="分类名称" min-width="200">
          <template #default="{ row }">
            <span>{{ row.name }}</span>
            <el-tag v-if="row.code === 'accompany'" size="small" type="warning" style="margin-left: 8px">雅趣伴手礼</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="标识" width="120" />
        <el-table-column prop="icon" label="图标" width="80">
          <template #default="{ row }">
            <span v-if="row.icon">{{ row.icon }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <StatusTag :status="row.status" type="product" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'product:category:*'" link type="primary" @click="handleAdd(row)">新增子分类</el-button>
            <el-button v-permission="'product:category:*'" link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button v-permission="'product:category:*'" link type="primary" @click="handleToggleStatus(row)">
              {{ row.status === '启用' ? '停用' : '启用' }}
            </el-button>
            <el-button v-permission="'product:category:*'" link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分类表单弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="父分类">
          <el-input :value="form.parentId ? parentName : '一级分类'" disabled />
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="如：当季鲜果" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="分类标识" prop="code">
          <el-input v-model="form.code" placeholder="如：fresh" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="form.icon" placeholder="图标 URL 或 emoji" />
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
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import StatusTag from '@/components/StatusTag.vue'
import {
  getCategoryTree, createCategory, updateCategory, deleteCategory,
  type Category
} from '@/api/modules/product'

const loading = ref(false)
const categoryTree = ref<Category[]>([])

async function loadData(): Promise<void> {
  loading.value = true
  try {
    categoryTree.value = await getCategoryTree()
  } finally {
    loading.value = false
  }
}

// ---------- 表单 ----------
const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitting = ref(false)
const formRef = ref<FormInstance>()
const editingId = ref<number | null>(null)
const parentName = ref('')

const form = reactive({
  parentId: null as number | null,
  name: '',
  code: '',
  icon: '',
  sort: 99,
  status: '启用' as '启用' | '停用'
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入分类标识', trigger: 'blur' }],
  sort: [{ required: true, message: '请输入排序', trigger: 'blur' }]
}

function resetForm(): void {
  form.parentId = null
  form.name = ''
  form.code = ''
  form.icon = ''
  form.sort = 99
  form.status = '启用'
  editingId.value = null
}

function handleAdd(parent: Category | null): void {
  resetForm()
  form.parentId = parent?.id ?? null
  parentName.value = parent?.name ?? ''
  dialogTitle.value = parent ? `新增子分类（${parent.name}）` : '新增一级分类'
  dialogVisible.value = true
}

function handleEdit(row: Category): void {
  resetForm()
  editingId.value = row.id
  form.parentId = row.parentId
  form.name = row.name
  form.code = row.code
  form.icon = row.icon || ''
  form.sort = row.sort
  form.status = row.status
  // 查找父分类名
  const findParent = (nodes: Category[]): void => {
    for (const n of nodes) {
      if (n.id === row.parentId) { parentName.value = n.name; return }
      if (n.children) findParent(n.children)
    }
  }
  parentName.value = ''
  findParent(categoryTree.value)
  dialogTitle.value = '编辑分类'
  dialogVisible.value = true
}

async function handleSubmit(): Promise<void> {
  if (!formRef.value) return
  await formRef.value.validate()
  submitting.value = true
  try {
    if (editingId.value) {
      await updateCategory(editingId.value, { ...form })
      ElMessage.success('编辑成功')
    } else {
      await createCategory({ ...form })
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    submitting.value = false
  }
}

async function handleToggleStatus(row: Category): Promise<void> {
  const newStatus = row.status === '启用' ? '停用' : '启用'
  await updateCategory(row.id, { status: newStatus })
  ElMessage.success(`已${newStatus}`)
  loadData()
}

async function handleDelete(row: Category): Promise<void> {
  await ElMessageBox.confirm(`确定删除分类「${row.name}」吗？`, '提示', { type: 'warning' })
  await deleteCategory(row.id)
  ElMessage.success('删除成功')
  loadData()
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.toolbar {
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
}
</style>