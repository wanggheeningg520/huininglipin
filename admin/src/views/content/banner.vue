<template>
  <div class="page-container">
    <div class="table-container">
      <div class="toolbar">
        <el-button v-permission="'content:banner'" type="primary" :icon="Plus" @click="handleAdd">新增 Banner</el-button>
      </div>

      <el-table v-loading="loading" :data="list" border>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="position" label="位置" width="120">
          <template #default="{ row }">{{ positionMap[row.position] || row.position }}</template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="140" />
        <el-table-column label="图片" width="120">
          <template #default="{ row }">
            <el-image :src="row.image" style="width: 80px; height: 32px" fit="cover" :preview-src-list="[row.image]" />
          </template>
        </el-table-column>
        <el-table-column prop="linkType" label="链接类型" width="100" />
        <el-table-column prop="linkValue" label="链接值" min-width="140" show-overflow-tooltip />
        <el-table-column label="时间窗" min-width="280">
          <template #default="{ row }">{{ row.startTime?.slice(0, 10) }} ~ {{ row.endTime?.slice(0, 10) }}</template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }"><StatusTag :status="row.status" type="product" /></template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'content:banner'" link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button v-permission="'content:banner'" link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination v-model:current-page="query.page" v-model:page-size="query.pageSize" :total="total" layout="total, prev, pager, next" background @change="loadData" />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑 Banner' : '新增 Banner'" width="560px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="位置" prop="position">
          <el-select v-model="form.position" style="width: 100%">
            <el-option label="首页顶部" value="home_top" />
            <el-option label="分类页顶部" value="category_top" />
            <el-option label="节日页顶部" value="festival_top" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="图片" prop="image">
          <ImageUpload v-model="form.image" :limit="1" />
        </el-form-item>
        <el-form-item label="链接类型" prop="linkType">
          <el-select v-model="form.linkType">
            <el-option label="无" value="无" />
            <el-option label="商品" value="商品" />
            <el-option label="分类" value="分类" />
            <el-option label="专题" value="专题" />
            <el-option label="外链" value="外链" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.linkType !== '无'" label="链接值">
          <el-input v-model="form.linkValue" :placeholder="form.linkType === '外链' ? 'https://' : 'ID 或名称'" />
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker v-model="form.startTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker v-model="form.endTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
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
import ImageUpload from '@/components/ImageUpload.vue'
import { getBannerList, createBanner, updateBanner, deleteBanner, type Banner } from '@/api/modules/content'

const positionMap: Record<string, string> = { home_top: '首页顶部', category_top: '分类页顶部', festival_top: '节日页顶部' }
const loading = ref(false)
const list = ref<Banner[]>([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 20 })

async function loadData(): Promise<void> {
  loading.value = true
  try {
    const res = await getBannerList(query)
    list.value = res.list; total.value = res.total
  } finally { loading.value = false }
}

const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const editingId = ref<number | null>(null)
const form = reactive({
  position: 'home_top', title: '', image: '', linkType: '无', linkValue: '',
  startTime: '', endTime: '', sort: 99, status: '启用' as '启用' | '停用'
})
const rules: FormRules = {
  position: [{ required: true, message: '请选择位置', trigger: 'change' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  image: [{ required: true, message: '请上传图片', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }]
}

function handleAdd(): void {
  editingId.value = null
  Object.assign(form, { position: 'home_top', title: '', image: '', linkType: '无', linkValue: '', startTime: '', endTime: '', sort: 99, status: '启用' })
  dialogVisible.value = true
}
function handleEdit(row: Banner): void {
  editingId.value = row.id
  Object.assign(form, row)
  dialogVisible.value = true
}
async function handleSubmit(): Promise<void> {
  if (!formRef.value) return
  await formRef.value.validate()
  submitting.value = true
  try {
    if (editingId.value) { await updateBanner(editingId.value, { ...form }); ElMessage.success('编辑成功') }
    else { await createBanner({ ...form }); ElMessage.success('新增成功') }
    dialogVisible.value = false; loadData()
  } finally { submitting.value = false }
}
async function handleDelete(row: Banner): Promise<void> {
  await ElMessageBox.confirm(`确定删除 Banner「${row.title}」？`, '提示', { type: 'warning' })
  await deleteBanner(row.id); ElMessage.success('删除成功'); loadData()
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.toolbar { margin-bottom: 16px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>