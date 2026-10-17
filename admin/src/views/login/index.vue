<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-left">
        <div class="brand">
          <h1 class="brand-title">慧宁甄选</h1>
          <p class="brand-subtitle">礼品商城管理后台</p>
          <div class="brand-features">
            <div class="feature-item">✓ 商品 · 订单 · 内容全流程管理</div>
            <div class="feature-item">✓ 节日日历自动编排</div>
            <div class="feature-item">✓ 生鲜预售精细运营</div>
          </div>
        </div>
      </div>
      <div class="login-right">
        <h2 class="login-title">账号登录</h2>
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          size="large"
          @keyup.enter="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入账号"
              :prefix-icon="User"
              clearable
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              :prefix-icon="Lock"
              show-password
              clearable
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              :loading="loading"
              class="login-btn"
              @click="handleLogin"
            >
              登 录
            </el-button>
          </el-form-item>
        </el-form>
        <div class="login-tips">
          <el-alert
            title="演示账号：admin / admin123（超管）"
            type="info"
            :closable="false"
            show-icon
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/store/modules/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive({
  username: 'admin',
  password: 'admin123'
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin(): Promise<void> {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    loading.value = true
    await userStore.login(form.username, form.password)
    ElMessage.success('登录成功')
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  } catch (err) {
    console.error('登录失败', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, $color-primary-dark 0%, $color-primary 100%);
}

.login-box {
  display: flex;
  width: 880px;
  height: 520px;
  background: #fff;
  border-radius: $radius-lg;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.login-left {
  width: 420px;
  background: linear-gradient(135deg, $color-primary 0%, $color-primary-light 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  padding: 48px;
}

.brand-title {
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 8px;
}

.brand-subtitle {
  font-size: 18px;
  opacity: 0.9;
  margin: 0 0 32px;
}

.brand-features {
  .feature-item {
    font-size: 14px;
    line-height: 2;
    opacity: 0.95;
  }
}

.login-right {
  flex: 1;
  padding: 60px 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.login-title {
  font-size: 24px;
  color: $color-text-primary;
  margin: 0 0 32px;
  text-align: center;
}

.login-btn {
  width: 100%;
}

.login-tips {
  margin-top: 16px;
}
</style>