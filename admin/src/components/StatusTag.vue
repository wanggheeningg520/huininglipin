<template>
  <el-tag :type="tagType" :effect="effect" size="small">{{ label }}</el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  status: string
  type?: 'order' | 'refund' | 'common' | 'product' | 'presale'
  effect?: 'light' | 'dark' | 'plain'
  mapping?: Record<string, { type: 'primary' | 'success' | 'warning' | 'info' | 'danger'; label?: string }>
}>(), {
  type: 'common',
  effect: 'light'
})

const defaultMappings: Record<string, Record<string, { type: 'primary' | 'success' | 'warning' | 'info' | 'danger'; label?: string }>> = {
  order: {
    待支付: { type: 'warning' },
    待发货: { type: 'primary' },
    待收货: { type: 'primary' },
    已完成: { type: 'success' },
    已取消: { type: 'info' },
    已退款: { type: 'danger' },
    退款中: { type: 'warning' }
  },
  refund: {
    待审核: { type: 'warning' },
    已通过: { type: 'success' },
    已拒绝: { type: 'danger' },
    已退款: { type: 'success' }
  },
  product: {
    在售: { type: 'success' },
    下架: { type: 'info' },
    启用: { type: 'success' },
    停用: { type: 'info' },
    正常: { type: 'success' },
    禁用: { type: 'danger' }
  },
  presale: {
    是: { type: 'warning', label: '预售' },
    否: { type: 'info', label: '现货' }
  },
  common: {}
}

const mapping = computed(() => props.mapping || defaultMappings[props.type] || {})
const tagType = computed(() => mapping.value[props.status]?.type || 'info')
const label = computed(() => mapping.value[props.status]?.label || props.status)
</script>