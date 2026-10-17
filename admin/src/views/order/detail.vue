<template>
  <div class="page-container" v-loading="loading">
    <el-page-header :title="'返回'" @back="$router.back()">
      <template #content>
        <span class="page-header-title">订单详情 · {{ order?.orderNo }}</span>
      </template>
    </el-page-header>

    <template v-if="order">
      <!-- 状态与基本信息 -->
      <el-card shadow="never" class="detail-card">
        <template #header>订单状态</template>
        <el-descriptions :column="4" border>
          <el-descriptions-item label="订单号">{{ order.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <StatusTag :status="order.status" type="order" />
          </el-descriptions-item>
          <el-descriptions-item label="订单类型">
            <el-tag v-if="order.orderType === '预售'" type="warning" size="small">预售单</el-tag>
            <span v-else>普通订单</span>
          </el-descriptions-item>
          <el-descriptions-item label="支付状态">{{ order.payStatus }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ formatDateTime(order.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="支付时间">{{ formatDateTime(order.payTime) }}</el-descriptions-item>
          <el-descriptions-item label="支付方式">{{ order.payType || '-' }}</el-descriptions-item>
          <el-descriptions-item label="交易号">{{ order.tradeNo || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 预售信息 -->
      <el-card v-if="order.isPresale" shadow="never" class="detail-card">
        <template #header>预售信息</template>
        <el-alert type="warning" :closable="false" show-icon>
          <template #title>
            预售订单 · 预计发货日期：{{ order.presaleDeliverDate }}（先锁单后发货，到货后采摘备货）
          </template>
        </el-alert>
      </el-card>

      <!-- 商品信息 -->
      <el-card shadow="never" class="detail-card">
        <template #header>商品信息</template>
        <el-table :data="order.items" border>
          <el-table-column label="图片" width="80">
            <template #default="{ row }">
              <el-image :src="row.mainImage" style="width: 50px; height: 50px" fit="cover" />
            </template>
          </el-table-column>
          <el-table-column prop="productTitle" label="商品名称" min-width="200" />
          <el-table-column label="规格">
            <template #default="{ row }">{{ Object.values(row.specJson).join(' / ') }}</template>
          </el-table-column>
          <el-table-column prop="price" label="单价" width="100">
            <template #default="{ row }">¥{{ row.price }}</template>
          </el-table-column>
          <el-table-column prop="qty" label="数量" width="80" />
          <el-table-column prop="amount" label="小计" width="100">
            <template #default="{ row }">¥{{ row.amount }}</template>
          </el-table-column>
        </el-table>
        <div class="order-amount">
          <span>订单总额：<strong>¥{{ order.totalAmount }}</strong></span>
          <span style="margin-left: 24px">实付金额：<strong style="color: #f5222d">¥{{ order.payAmount }}</strong></span>
        </div>
      </el-card>

      <!-- 收货信息 -->
      <el-card shadow="never" class="detail-card">
        <template #header>收货信息</template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="收货人">{{ order.receiverName }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ order.receiverPhone }}</el-descriptions-item>
          <el-descriptions-item label="收货地址" :span="2">{{ order.receiverAddress }}</el-descriptions-item>
          <el-descriptions-item label="订单备注" :span="2">{{ order.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 物流信息 -->
      <el-card v-if="order.logisticsNo" shadow="never" class="detail-card">
        <template #header>物流信息</template>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="物流公司">{{ order.logisticsCompany }}</el-descriptions-item>
          <el-descriptions-item label="运单号">{{ order.logisticsNo }}</el-descriptions-item>
          <el-descriptions-item label="发货时间">{{ formatDateTime(order.shipTime) }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 操作 -->
      <div class="detail-actions">
        <el-button @click="$router.back()">返回</el-button>
        <el-button v-permission="'order:ship'" v-if="order.status === '待发货'" type="primary" @click="$router.push(`/order/ship?orderNo=${order.orderNo}`)">
          发货
        </el-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import StatusTag from '@/components/StatusTag.vue'
import { formatDateTime } from '@/utils/format'
import { getOrderDetail, type Order } from '@/api/modules/order'

const route = useRoute()
const loading = ref(false)
const order = ref<Order | null>(null)

async function loadData(): Promise<void> {
  const orderNo = route.query.orderNo as string
  if (!orderNo) return
  loading.value = true
  try {
    order.value = await getOrderDetail(orderNo)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.page-header-title {
  font-size: 16px;
  font-weight: 600;
}
.detail-card {
  margin-top: 16px;
}
.order-amount {
  margin-top: 16px;
  text-align: right;
  font-size: 14px;
}
.detail-actions {
  margin-top: 24px;
  text-align: center;
}
</style>