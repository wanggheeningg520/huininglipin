<template>
  <div class="page-container">
    <div class="table-container">
      <div class="toolbar">
        <el-button v-permission="'system:role'" type="primary" :icon="Plus" @click="handleAdd">新增角色</el-button>
      </div>
      <el-table v-loading="loading" :data="list" border>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="角色名称" width="160" />
        <el-table-column prop="code" label="角色编码" width="160" />
        <el-table-column prop="remark" label="备注" min-width="180" />
        <el-table-column label="权限数" width="90">
          <template #default="{ row }">{{ row.permissions?.length || 0 }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }"><StatusTag :status="row.status" type="product" /></template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'system:role'" link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button v-permission="'system:role'" link type="primary" @click="handlePermission(row)">分配权限</el-button>
            <el-button v-permission="'system:role'" link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 角色表单 -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑角色' : '新增角色'" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="角色名称" prop="name"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="角色编码" prop="code"><el-input v-model="form.code" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item>
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

    <!-- 权限分配 -->
    <el-dialog v-model="permVisible" title="分配权限" width="560px">
      <div class="perm-header">角色：{{ permRow?.name }}</div>
      <el-tree
        ref="permTreeRef"
        :data="permTreeData"
        :props="{ label: 'name', children: 'children' }"
        node-key="permission"
        show-checkbox
        :default-checked-keys="permRow?.permissions || []"
        check-strictly
      />
      <template #footer>
        <el-button @click="permVisible = false">取消</el-button>
        <el-button type="primary" :loading="permSubmitting" @click="submitPermission">保存</el-button>
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
import { getRoleList, createRole, updateRole, deleteRole, type Role } from '@/api/modules/system'
import { useUserStore } from '@/store/modules/user'
import type { MenuNode } from '@/types'

const userStore = useUserStore()
const loading = ref(false)
const list = ref<Role[]>([])

async function loadData(): Promise<void> {
  loading.value = true
  try { list.value = await getRoleList() } finally { loading.value = false }
}

const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const editingId = ref<number | null>(null)
const form = reactive({ name: '', code: '', remark: '', status: '启用' as '启用' | '停用', permissions: [] as string[] })
const rules: FormRules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入角色编码', trigger: 'blur' }]
}

function handleAdd(): void {
  editingId.value = null
  Object.assign(form, { name: '', code: '', remark: '', status: '启用', permissions: [] })
  dialogVisible.value = true
}
function handleEdit(row: Role): void {
  editingId.value = row.id
  Object.assign(form, row)
  dialogVisible.value = true
}
async function handleSubmit(): Promise<void> {
  if (!formRef.value) return
  await formRef.value.validate()
  submitting.value = true
  try {
    if (editingId.value) { await updateRole(editingId.value, { ...form }); ElMessage.success('编辑成功') }
    else { await createRole({ ...form }); ElMessage.success('新增成功') }
    dialogVisible.value = false; loadData()
  } finally { submitting.value = false }
}
async function handleDelete(row: Role): Promise<void> {
  await ElMessageBox.confirm(`确定删除角色「${row.name}」？`, '提示', { type: 'warning' })
  await deleteRole(row.id); ElMessage.success('删除成功'); loadData()
}

// 权限分配
const permVisible = ref(false)
const permSubmitting = ref(false)
const permRow = ref<Role | null>(null)
const permTreeRef = ref()

const permTreeData = ref<MenuNode[]>([])
function buildPermTree(): void {
  permTreeData.value = userStore.menus
}

function handlePermission(row: Role): void {
  permRow.value = row
  buildPermTree()
  permVisible.value = true
}
async function submitPermission(): Promise<void> {
  if (!permRow.value || !permTreeRef.value) return
  const checked = permTreeRef.value.getCheckedKeys() as string[]
  permSubmitting.value = true
  try {
    await updateRole(permRow.value.id, { permissions: checked })
    ElMessage.success('权限分配成功')
    permVisible.value = false; loadData()
  } finally { permSubmitting.value = false }
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.toolbar { margin-bottom: 16px; }
.perm-header { margin-bottom: 12px; font-weight: 600; }
</style>