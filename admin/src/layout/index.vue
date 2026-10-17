<template>
  <div class="layout-container">
    <!-- 侧边栏 -->
    <aside class="layout-sidebar" :class="{ collapsed: appStore.sidebarCollapsed }">
      <div class="logo">
        <span v-if="!appStore.sidebarCollapsed" class="logo-text">慧宁甄选</span>
        <span v-else class="logo-text-small">慧</span>
      </div>
      <Sidebar />
    </aside>

    <!-- 右侧主区域 -->
    <div class="layout-main">
      <Navbar />
      <TagsView />
      <main class="layout-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <keep-alive :include="cachedViews">
              <component :is="Component" />
            </keep-alive>
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Sidebar from './components/Sidebar.vue'
import Navbar from './components/Navbar.vue'
import TagsView from './components/TagsView.vue'
import { useAppStore } from '@/store/modules/app'

const appStore = useAppStore()

const cachedViews = computed(() =>
  appStore.tagViews.map((t) => t.name).filter(Boolean)
)
</script>

<style scoped lang="scss">
.layout-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.layout-sidebar {
  width: $sidebar-width;
  background: $color-primary-dark;
  transition: width 0.28s;
  overflow: hidden;
  flex-shrink: 0;

  &.collapsed {
    width: $sidebar-width-collapsed;
  }
}

.logo {
  height: $navbar-height;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-text-small {
  font-size: 22px;
  font-weight: 700;
}

.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.layout-content {
  flex: 1;
  overflow-y: auto;
  background: $color-bg-page;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>