<template>
  <div class="page-container">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #e8f5e9"><el-icon :size="28" color="#2b7a4b"><ShoppingCart /></el-icon></div>
            <div class="stat-info">
              <div class="stat-label">今日订单数</div>
              <div class="stat-value">{{ stats.todayOrderCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #fff8e1"><el-icon :size="28" color="#faad14"><Money /></el-icon></div>
            <div class="stat-info">
              <div class="stat-label">今日销售额</div>
              <div class="stat-value">¥{{ stats.todaySalesAmount?.toFixed(2) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #e3f2fd"><el-icon :size="28" color="#1890ff"><Box /></el-icon></div>
            <div class="stat-info">
              <div class="stat-label">待发货数</div>
              <div class="stat-value">{{ stats.pendingShipCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #fce4ec"><el-icon :size="28" color="#f5222d"><Goods /></el-icon></div>
            <div class="stat-info">
              <div class="stat-label">在售商品数</div>
              <div class="stat-value">{{ stats.productCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 次级统计 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="mini-stat">
            <span class="mini-label">待退款审核</span>
            <span class="mini-value">{{ stats.pendingRefundCount }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="mini-stat">
            <span class="mini-label">会员总数</span>
            <span class="mini-value">{{ stats.memberCount }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="mini-stat">
            <span class="mini-label">数据看板深度版</span>
            <span class="mini-value" style="font-size: 14px; color: #909399">二期开放</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区 -->
    <el-row :gutter="16">
      <el-col :span="16">
        <el-card shadow="hover">
          <template #header>近 7 天订单趋势</template>
          <div ref="trendChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>分类销量占比</template>
          <div ref="pieChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ShoppingCart, Money, Box, Goods } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getDashboardStats, type DashboardStats } from '@/api/modules/system'

const stats = ref<DashboardStats>({
  todayOrderCount: 0,
  todaySalesAmount: 0,
  pendingShipCount: 0,
  productCount: 0,
  pendingRefundCount: 0,
  memberCount: 0,
  orderTrend: [],
  categorySales: []
})

const trendChartRef = ref<HTMLDivElement>()
const pieChartRef = ref<HTMLDivElement>()
let trendChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null

async function loadData(): Promise<void> {
  try {
    stats.value = await getDashboardStats()
    await nextTick()
    renderCharts()
  } catch {
    // ignore
  }
}

function renderCharts(): void {
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
    trendChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['订单数', '销售额'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: stats.value.orderTrend.map((t) => t.date) },
      yAxis: [
        { type: 'value', name: '订单数' },
        { type: 'value', name: '销售额(元)' }
      ],
      series: [
        { name: '订单数', type: 'bar', data: stats.value.orderTrend.map((t) => t.count) },
        { name: '销售额', type: 'line', yAxisIndex: 1, smooth: true, data: stats.value.orderTrend.map((t) => t.amount) }
      ]
    })
  }
  if (pieChartRef.value) {
    pieChart = echarts.init(pieChartRef.value)
    pieChart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: stats.value.categorySales.map((c) => ({ name: c.name, value: c.value }))
      }]
    })
  }
}

function handleResize(): void {
  trendChart?.resize()
  pieChart?.resize()
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', handleResize)
})

import { onBeforeUnmount } from 'vue'
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  pieChart?.dispose()
})
</script>

<style scoped lang="scss">
.stat-row {
  margin-bottom: 16px;
}
.stat-card {
  :deep(.el-card__body) {
    padding: 20px;
  }
}
.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}
.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-label {
  font-size: 13px;
  color: $color-text-secondary;
}
.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: $color-text-primary;
  margin-top: 4px;
}
.mini-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.mini-label {
  color: $color-text-regular;
}
.mini-value {
  font-size: 20px;
  font-weight: 600;
  color: $color-primary;
}
.chart-box {
  height: 320px;
}
</style>