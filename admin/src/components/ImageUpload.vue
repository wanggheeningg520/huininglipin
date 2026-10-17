<template>
  <div class="image-upload">
    <el-upload
      :action="uploadAction"
      :headers="uploadHeaders"
      :file-list="fileList"
      list-type="picture-card"
      :limit="limit"
      :before-upload="beforeUpload"
      :on-success="handleSuccess"
      :on-remove="handleRemove"
      :on-exceed="handleExceed"
      :accept="accept"
    >
      <el-icon><Plus /></el-icon>
      <template #tip>
        <div class="upload-tip">支持 {{ accept }} 格式，单张不超过 {{ maxSizeMB }}MB{{ limit > 1 ? `，最多 ${limit} 张` : '' }}</div>
      </template>
    </el-upload>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { UploadFile, UploadFiles, UploadProps, UploadUserFile } from 'element-plus'

const props = withDefaults(defineProps<{
  modelValue: string | string[]
  limit?: number
  maxSizeMB?: number
  accept?: string
}>(), {
  limit: 1,
  maxSizeMB: 5,
  accept: 'image/png,image/jpeg,image/jpg,image/webp'
})

const emit = defineEmits<{ 'update:modelValue': [value: string | string[]] }>()

const isMultiple = computed(() => props.limit > 1)
const uploadAction = ref('/api/v1/admin/oss/upload')
const uploadHeaders = computed(() => ({}))

const fileList = ref<UploadUserFile[]>([])

// 同步外部值
watch(
  () => props.modelValue,
  (val) => {
    if (isMultiple.value) {
      const arr = (val as string[]) || []
      fileList.value = arr.map((url, i) => ({ name: `image-${i}`, url } as UploadUserFile))
    } else {
      const url = val as string
      fileList.value = url ? [{ name: 'image', url } as UploadUserFile] : []
    }
  },
  { immediate: true }
)

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const isOkType = props.accept.split(',').some((t) => file.type === t.trim())
  if (!isOkType) {
    ElMessage.error('图片格式不支持')
    return false
  }
  const isOkSize = file.size / 1024 / 1024 < props.maxSizeMB
  if (!isOkSize) {
    ElMessage.error(`图片大小不能超过 ${props.maxSizeMB}MB`)
    return false
  }
  return true
}

function handleSuccess(_response: unknown, _file: UploadFile, files: UploadFiles): void {
  emitValue(files)
}
function handleRemove(_file: UploadFile, files: UploadFiles): void {
  emitValue(files)
}
function handleExceed(): void {
  ElMessage.warning(`最多上传 ${props.limit} 张图片`)
}

function emitValue(files: UploadFiles): void {
  const urls = files.map((f) => f.url || '').filter(Boolean)
  emit('update:modelValue', isMultiple.value ? urls : (urls[0] || ''))
}
</script>

<style scoped lang="scss">
.image-upload {
  width: 100%;
}
.upload-tip {
  font-size: 12px;
  color: $color-text-secondary;
  line-height: 1.5;
}
</style>