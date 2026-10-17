<template>
  <div class="page-container" v-loading="loading">
    <el-page-header :title="'返回'" @back="$router.back()">
      <template #content>
        <span class="page-header-title">发货操作 · {{ order?.orderNo }}</span>
      </template>
    </el-page-header>

    <template v-if="order">
      <el-card shadow="never" class="ship-card">
        <template #header>订单信息</template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ order.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <StatusTag :status="order.status" type="order" />
          </el-descriptions-item>
          <el-descriptions-item label="买家">{{ order.userNickname }}</el-descriptions-item>
          <el-descriptions-item label="支付金额">¥{{ order.payAmount }}</el-descriptions-item>
          <el-descriptions-item label="收货人">{{ order.receiverName }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ order.receiverPhone }}</el-descriptions-item>
          <el-descriptions-item label="收货地址" :span="2">{{ order.receiverAddress }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card v-if="order.isPresale" shadow="never" class="ship-card">
        <el-alert type="warning" :closable="false" show-icon>
          <template #title>
            预售单 · 预计发货日期：{{ order.presaleDeliverDate }}（请确认到货后再发货）
          </template>
        </el-alert>
      </el-card>

      <el-card shadow="never" class="ship-card">
        <template #header>填写物流信息</template>
        <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
          <el-form-item label="物流公司" prop="logisticsCompany">
            <el-select v-model="form.logisticsCompany" placeholder="请选择物流公司" style="width: 280px">
              <el-option label="顺丰速运" value="顺丰速运" />
              <el-option label="中通快递" value="中通快递" />
              <el-option label="圆通速递" value="圆通速递" />
              <el-option label="韵达快递" value="韵达快递" />
              <el-option label="申通快递" value="申通快递" />
              <el-option label="京东物流" value="京东物流" />
              <el-option label="EMS" value="EMS" />
            </el-select>
          </el-form-item>
          <el-form-item label="运单号" prop="logisticsNo">
            <el-input v-model="form.logisticsNo" placeholder="请输入运单号" style="width: 320px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="submitting" @click="handleSubmit">确认发货</el-button>
            <el-button @click="$router.back()">取消</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import StatusTag from '@/components/StatusTag.vue'
import { getOrderDetail, shipOrder, type Order } from '@/api/modules/order'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const order = ref<Order | null>(null)
const formRef = ref<FormInstance>()

const form = reactive({
  logisticsCompany: '',
  logisticsNo: ''
})

const rules: FormRules = {
  logisticsCompany: [{ required: true, message: '请选择物流公司', trigger: 'change' }],
  logisticsNo: [{ required: true, message: '请输入运单号', trigger: 'blur' }]
}

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

async function handleSubmit(): Promise<void> {
  if (!formRef.value) return
  await formRef.value.validate()
  submitting.value = true
  try {
    await shipOrder(order.value!.orderNo, form.logisticsCompany, form.logisticsNo)
    ElMessage.success('发货成功，已推送订阅消息')
    router.push('/order/list')
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
.ship-card {
  margin-top: 16px;
}
</style>