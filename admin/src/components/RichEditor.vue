<template>
  <div class="rich-editor">
    <div class="editor-toolbar">
      <el-button-group>
        <el-button size="small" @click="exec('bold')"><strong>B</strong></el-button>
        <el-button size="small" @click="exec('italic')"><em>I</em></el-button>
        <el-button size="small" @click="exec('underline')"><u>U</u></el-button>
      </el-button-group>
      <el-button-group style="margin-left: 8px">
        <el-button size="small" @click="exec('insertUnorderedList')">无序列表</el-button>
        <el-button size="small" @click="exec('insertOrderedList')">有序列表</el-button>
      </el-button-group>
      <el-button size="small" style="margin-left: 8px" @click="insertImage">插入图片</el-button>
      <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="onFileChange" />
    </div>
    <div
      ref="editorRef"
      class="editor-content"
      contenteditable="true"
      @input="onInput"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const editorRef = ref<HTMLDivElement>()
const fileInput = ref<HTMLInputElement>()

onMounted(() => {
  if (editorRef.value && props.modelValue) {
    editorRef.value.innerHTML = props.modelValue
  }
})

watch(
  () => props.modelValue,
  (val) => {
    if (editorRef.value && val !== editorRef.value.innerHTML) {
      editorRef.value.innerHTML = val || ''
    }
  }
)

function exec(command: string): void {
  document.execCommand(command, false)
  onInput()
}

function insertImage(): void {
  fileInput.value?.click()
}

function onFileChange(e: Event): void {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    document.execCommand('insertImage', false, reader.result as string)
    onInput()
  }
  reader.readAsDataURL(file)
  target.value = ''
}

function onInput(): void {
  if (editorRef.value) {
    emit('update:modelValue', editorRef.value.innerHTML)
  }
}
</script>

<style scoped lang="scss">
.rich-editor {
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  overflow: hidden;
}

.editor-toolbar {
  padding: 8px;
  background: #f5f7fa;
  border-bottom: 1px solid $color-border;
}

.editor-content {
  min-height: 200px;
  padding: 12px;
  outline: none;
  overflow-y: auto;

  :deep(img) {
    max-width: 100%;
  }
}
</style>