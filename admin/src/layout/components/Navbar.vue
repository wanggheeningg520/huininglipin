<template>
  <header class="navbar">
    <div class="navbar-left">
      <el-icon class="collapse-btn" @click="appStore.toggleSidebar">
        <Expand v-if="appStore.sidebarCollapsed" />
        <Fold v-else />
      </el-icon>
      <Breadcrumb />
    </div>
    <div class="navbar-right">
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-info">
          <el-avatar :size="32" :icon="UserFilled" />
          <span class="username">{{ userStore.userInfo?.realName || '用户' }}</span>
          <el-icon><CaretBottom /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">个人中心</el-dropdown-item>
            <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { UserFilled, Expand, Fold, CaretBottom } from '@element-plus/icons-vue'
import Breadcrumb from './Breadcrumb.vue'
import { useUserStore } from '@/store/modules/user'
import { useAppStore } from '@/store/modules/app'
import { resetRouter } from '@/router'

const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()

async function handleCommand(command: string): Promise<void> {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await userStore.logout()
      resetRouter()
      ElMessage.success('已退出登录')
      router.push('/login')
    } catch {
      // 取消
    }
  } else if (command === 'profile') {
    ElMessage.info('个人中心功能待开发')
  }
}
</script>

<style scoped lang="scss">
.navbar {
  height: $navbar-height;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: $color-bg-card;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  z-index: $z-navbar;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: $color-text-regular;
  &:hover {
    color: $color-primary;
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  .username {
    font-size: 14px;
    color: $color-text-regular;
  }
}
</style>