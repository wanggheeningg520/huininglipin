<template>
  <div class="page-container">
    <div class="table-container">
      <div class="toolbar">
        <el-button v-permission="'system:admin'" type="primary" :icon="Plus" @click="handleAdd">新增管理员</el-button>
      </div>
      <el-table v-loading="loading" :data="list" border>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="username" label="账号" width="140" />
        <el-table-column prop="realName" label="姓名" width="120" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column label="角色" min-width="180">
          <template #default="{ row }">
            <el-tag v-for="r in row.roleNames" :key="r" size="small" style="margin-right: 4px">{{ r }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }"><StatusTag :status="row.status" type="product" /></template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'system:admin'" link type="primary" @click="handleEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑管理员' : '新增管理员'" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="账号" prop="username"><el-input v-model="form.username" :disabled="!!editingId" /></el-form-item>
        <el-form-item label="姓名" prop="realName"><el-input v-model="form.realName" /></el-form-item>
        <el-form-item v-if="!editingId" label="密码" prop="password"><el-input v-model="form.password" type="password" show-password /></el-form-item>
        <el-form-item label="手机号" prop="phone"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="角色" prop="roleIds">
          <el-select v-model="form.roleIds" multiple placeholder="请选择角色" style="width: 100%">
            <el-option v-for="r in roles" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
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
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import StatusTag from '@/components/StatusTag.vue'
import { formatDateTime } from '@/utils/format'
import { getAdminList, createAdmin, updateAdmin, getRoleList, type AdminUser, type Role } from '@/api/modules/system'

const loading = ref(false)
const list = ref<AdminUser[]>([])
const roles = ref<Role[]>([])

async function loadData(): Promise<void> {
  loading.value = true
  try {
    const [admins, roleList] = await Promise.all([getAdminList(), getRoleList()])
    list.value = admins
    roles.value = roleList
  } finally { loading.value = false }
}

const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const editingId = ref<number | null>(null)
const form = reactive({
  username: '', realName: '', password: '', phone: '',
  roleIds: [] as number[], roleNames: [] as string[],
  status: '启用' as '启用' | '停用'
})
const rules: FormRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  roleIds: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

function handleAdd(): void {
  editingId.value = null
  Object.assign(form, { username: '', realName: '', password: '', phone: '', roleIds: [], roleNames: [], status: '启用' })
  dialogVisible.value = true
}
function handleEdit(row: AdminUser): void {
  editingId.value = row.id
  Object.assign(form, row)
  form.password = ''
  dialogVisible.value = true
}
async function handleSubmit(): Promise<void> {
  if (!formRef.value) return
  await formRef.value.validate()
  submitting.value = true
  try {
    form.roleNames = form.roleIds.map((id) => roles.value.find((r) => r.id === id)?.name || '')
    if (editingId.value) { await updateAdmin(editingId.value, { ...form }); ElMessage.success('编辑成功') }
    else { await createAdmin({ ...form }); ElMessage.success('新增成功') }
    dialogVisible.value = false; loadData()
  } finally { submitting.value = false }
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.toolbar { margin-bottom: 16px; }
</style>