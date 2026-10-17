<template>
  <div class="page-container">
    <div class="table-container">
      <div class="toolbar">
        <span class="title">系统参数配置</span>
        <el-button v-permission="'system:config'" type="primary" :loading="submitting" @click="handleSave">保存修改</el-button>
      </div>
      <el-table v-loading="loading" :data="list" border :span-method="spanMethod">
        <el-table-column prop="group" label="分组" width="120" />
        <el-table-column prop="name" label="参数名称" min-width="180" />
        <el-table-column prop="key" label="参数键" width="220" />
        <el-table-column label="参数值" width="200">
          <template #default="{ row }">
            <el-input v-model="row.value" size="small" :disabled="isFutureConfig(row)" />
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="说明" min-width="200" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="isFutureConfig(row)" type="info" size="small">二期/三期</el-tag>
            <el-tag v-else type="success" size="small">可配置</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div class="tip">
        <el-alert type="warning" :closable="false" show-icon>
          <template #title>
            修改支付超时时间等参数后立即生效。预付卡合规配置、分销开关为一期预留项，标注二期/三期开放。
          </template>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getSysConfigList, updateSysConfig, type SysConfig } from '@/api/modules/system'

const loading = ref(false)
const submitting = ref(false)
const list = ref<SysConfig[]>([])

// 预留项（二期/三期）
const futureKeys = ['presale_card_pay', 'distrib_enabled']
function isFutureConfig(row: SysConfig): boolean {
  return futureKeys.includes(row.key)
}

async function loadData(): Promise<void> {
  loading.value = true
  try { list.value = await getSysConfigList() } finally { loading.value = false }
}

// 分组合并单元格
function spanMethod({ rowIndex, columnIndex }: { row: SysConfig; rowIndex: number; columnIndex: number }): { rowspan: number; colspan: number } | undefined {
  if (columnIndex === 0) {
    // 计算同组连续行
    const cur = list.value[rowIndex]
    if (!cur) return undefined
    // 找到该组第一行
    const firstIdx = list.value.findIndex((r) => r.group === cur.group)
    if (rowIndex === firstIdx) {
      const count = list.value.filter((r) => r.group === cur.group).length
      return { rowspan: count, colspan: 1 }
    }
    return { rowspan: 0, colspan: 0 }
  }
  return undefined
}

async function handleSave(): Promise<void> {
  submitting.value = true
  try {
    await updateSysConfig(list.value)
    ElMessage.success('保存成功，参数已生效')
  } finally { submitting.value = false }
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.toolbar { margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
.title { font-size: 15px; font-weight: 600; }
.tip { margin-top: 16px; }
</style>