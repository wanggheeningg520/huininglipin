<template>
  <el-dialog
    v-model="visible"
    :title="title"
    :width="width"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      :disabled="readonly"
    >
      <slot name="form" :form="formData" />
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button v-if="!readonly" type="primary" :loading="submitting" @click="handleSubmit">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title: string
  width?: string
  data?: Record<string, unknown>
  rules?: FormRules
  readonly?: boolean
}>(), {
  width: '500px',
  data: () => ({}),
  rules: () => ({}),
  readonly: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [data: Record<string, unknown>, done: () => void]
}>()

const visible = ref(props.modelValue)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const formData = reactive<Record<string, unknown>>({})

watch(() => props.modelValue, (v) => {
  visible.value = v
  if (v) {
    Object.keys(formData).forEach((k) => delete formData[k])
    Object.assign(formData, props.data)
  }
})
watch(visible, (v) => emit('update:modelValue', v))

function handleClose(): void {
  formRef.value?.resetFields()
}

async function handleSubmit(): Promise<void> {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    submitting.value = true
    emit('submit', { ...formData }, () => {
      submitting.value = false
      visible.value = false
    })
  } catch {
    ElMessage.warning('请完善表单信息')
  }
}
</script>