<template>
  <div class="table-pro">
    <div v-if="$slots.search" class="table-search">
      <slot name="search" />
    </div>
    <div class="table-body">
      <div v-if="$slots.toolbar" class="table-toolbar">
        <slot name="toolbar" />
      </div>
      <el-table
        v-loading="loading"
        :data="data"
        :border="border"
        :stripe="stripe"
        :row-key="rowKey"
        @selection-change="onSelectionChange"
        style="width: 100%"
      >
        <slot />
      </el-table>
      <div v-if="showPagination" class="table-pagination">
        <el-pagination
          v-model:current-page="innerPage"
          v-model:page-size="innerPageSize"
          :total="total"
          :page-sizes="pageSizes"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @change="onPageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  data: Record<string, unknown>[]
  loading?: boolean
  total?: number
  page?: number
  pageSize?: number
  pageSizes?: number[]
  showPagination?: boolean
  border?: boolean
  stripe?: boolean
  rowKey?: string
}>(), {
  loading: false,
  total: 0,
  page: 1,
  pageSize: 20,
  pageSizes: () => [10, 20, 50, 100],
  showPagination: true,
  border: true,
  stripe: true,
  rowKey: 'id'
})

const emit = defineEmits<{
  'update:page': [page: number]
  'update:pageSize': [pageSize: number]
  'page-change': [page: number, pageSize: number]
  'selection-change': [rows: Record<string, unknown>[]]
}>()

const innerPage = ref(props.page)
const innerPageSize = ref(props.pageSize)

watch(() => props.page, (v) => { innerPage.value = v })
watch(() => props.pageSize, (v) => { innerPageSize.value = v })

function onPageChange(): void {
  emit('update:page', innerPage.value)
  emit('update:pageSize', innerPageSize.value)
  emit('page-change', innerPage.value, innerPageSize.value)
}

function onSelectionChange(rows: Record<string, unknown>[]): void {
  emit('selection-change', rows)
}
</script>

<style scoped lang="scss">
.table-pro {
  width: 100%;
}
.table-search {
  background: $color-bg-card;
  padding: 16px 16px 0;
  border-radius: $radius-md;
  margin-bottom: 16px;
  box-shadow: $shadow-card;
}
.table-body {
  background: $color-bg-card;
  padding: 16px;
  border-radius: $radius-md;
  box-shadow: $shadow-card;
}
.table-toolbar {
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
}
.table-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>