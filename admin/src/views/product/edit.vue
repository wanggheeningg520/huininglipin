<template>
  <div class="page-container">
    <el-page-header :title="'返回'" @back="$router.back()">
      <template #content>
        <span class="page-header-title">{{ isEdit ? '编辑商品' : '新增商品' }}</span>
      </template>
    </el-page-header>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="edit-form" v-loading="loading">
      <el-card shadow="never" class="form-card">
        <template #header>基本信息</template>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品标题" prop="title">
              <el-input v-model="form.title" maxlength="60" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="副标题" prop="subtitle">
              <el-input v-model="form.subtitle" maxlength="100" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属分类" prop="categoryId">
              <el-cascader
                v-model="form.categoryId"
                :options="categoryOptions"
                :props="{ value: 'id', label: 'name', children: 'children', checkStrictly: true, emitPath: false }"
                placeholder="请选择分类"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="form.sort" :min="0" :max="999" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品状态">
              <el-radio-group v-model="form.status">
                <el-radio value="在售">在售</el-radio>
                <el-radio value="下架">下架</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <el-card shadow="never" class="form-card">
        <template #header>商品图片</template>
        <el-form-item label="主图" prop="mainImage">
          <ImageUpload v-model="form.mainImage" :limit="1" />
        </el-form-item>
        <el-form-item label="轮播图">
          <ImageUpload v-model="form.images" :limit="6" />
        </el-form-item>
      </el-card>

      <el-card shadow="never" class="form-card">
        <template #header>商品详情</template>
        <el-form-item label="详情内容">
          <RichEditor v-model="form.detailHtml" />
        </el-form-item>
      </el-card>

      <el-card shadow="never" class="form-card">
        <template #header>
          <div class="card-header-flex">
            <span>SKU 规格</span>
            <el-button type="primary" size="small" :icon="Plus" @click="addSku">添加 SKU</el-button>
          </div>
        </template>
        <el-table :data="form.skus" border>
          <el-table-column label="规格名" min-width="160">
            <template #default="{ row }">
              <el-input v-model="row.specJson['规格']" placeholder="如：5斤装" />
            </template>
          </el-table-column>
          <el-table-column label="销售价(元)" width="140">
            <template #default="{ row }">
              <el-input-number v-model="row.price" :min="0" :precision="2" controls-position="right" />
            </template>
          </el-table-column>
          <el-table-column label="划线价(元)" width="140">
            <template #default="{ row }">
              <el-input-number v-model="row.marketPrice" :min="0" :precision="2" controls-position="right" />
            </template>
          </el-table-column>
          <el-table-column label="库存" width="120">
            <template #default="{ row }">
              <el-input-number v-model="row.stock" :min="0" controls-position="right" />
            </template>
          </el-table-column>
          <el-table-column label="单位" width="100">
            <template #default="{ row }">
              <el-input v-model="row.unit" placeholder="件/盒/斤" />
            </template>
          </el-table-column>
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-select v-model="row.status">
                <el-option label="在售" value="在售" />
                <el-option label="停售" value="停售" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="{ $index }">
              <el-button link type="danger" @click="form.skus.splice($index, 1)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card shadow="never" class="form-card">
        <template #header>预售配置</template>
        <el-form-item label="是否预售">
          <el-switch v-model="form.isPresale" />
          <span class="form-tip">生鲜预售商品需配置预计发货日期</span>
        </el-form-item>
        <el-form-item v-if="form.isPresale" label="预计发货日期" prop="presaleDeliverDate">
          <el-date-picker v-model="form.presaleDeliverDate" type="date" value-format="YYYY-MM-DD" placeholder="选择发货日期" />
        </el-form-item>
        <el-form-item v-if="isFreshCategory" label="合规提示">
          <el-alert type="warning" :closable="false" show-icon title="生鲜商品不支持 7 天无理由退货，采用冷链物流配送" />
        </el-form-item>
      </el-card>

      <div class="form-actions">
        <el-button @click="$router.back()">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import ImageUpload from '@/components/ImageUpload.vue'
import RichEditor from '@/components/RichEditor.vue'
import {
  getProductDetail, createProduct, updateProduct, getCategoryTree,
  type Product, type Category, type Sku
} from '@/api/modules/product'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const categoryOptions = ref<Category[]>([])

const editId = computed(() => Number(route.query.id) || 0)
const isEdit = computed(() => editId.value > 0)

const formRef = ref<FormInstance>()
const form = reactive({
  id: 0,
  categoryId: undefined as number | undefined,
  title: '',
  subtitle: '',
  mainImage: '',
  images: [] as string[],
  detailHtml: '',
  isPresale: false,
  presaleDeliverDate: '',
  status: '下架' as '在售' | '下架',
  sort: 99,
  skus: [] as Sku[]
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入商品标题', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  mainImage: [{ required: true, message: '请上传主图', trigger: 'change' }],
  presaleDeliverDate: [{ required: true, message: '请选择预计发货日期', trigger: 'change' }]
}

// 是否生鲜分类（水果品类）
const isFreshCategory = computed(() => {
  if (!form.categoryId) return false
  // fresh 一级分类 id=1 或其子分类 11/12
  const findIn = (nodes: Category[]): boolean => {
    for (const n of nodes) {
      if (n.id === form.categoryId && n.code === 'fresh') return true
      if (n.children && findIn(n.children)) return true
    }
    return false
  }
  return findIn(categoryOptions.value)
})

function addSku(): void {
  form.skus.push({
    id: Date.now(),
    productId: form.id,
    specJson: { 规格: '' },
    price: 0,
    marketPrice: null,
    stock: 0,
    sales: 0,
    unit: '件',
    status: '在售'
  })
}

async function loadData(): Promise<void> {
  loading.value = true
  try {
    categoryOptions.value = await getCategoryTree()
    if (isEdit.value) {
      const detail = await getProductDetail(editId.value)
      Object.assign(form, detail)
    }
  } finally {
    loading.value = false
  }
}

async function handleSubmit(): Promise<void> {
  if (!formRef.value) return
  await formRef.value.validate()
  if (!form.skus.length) {
    ElMessage.warning('请至少添加一个 SKU')
    return
  }
  submitting.value = true
  try {
    const payload = { ...form }
    if (isEdit.value) {
      await updateProduct(editId.value, payload)
      ElMessage.success('编辑成功')
    } else {
      await createProduct(payload)
      ElMessage.success('新增成功')
    }
    router.back()
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.page-header-title {
  font-size: 16px;
  font-weight: 600;
}
.edit-form {
  margin-top: 16px;
}
.form-card {
  margin-bottom: 16px;
}
.card-header-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.form-tip {
  margin-left: 12px;
  color: $color-text-secondary;
  font-size: 13px;
}
.form-actions {
  text-align: center;
  padding: 16px 0;
}
</style>