<template>
  <div class="app-layout">
    <!-- 顶部导航 -->
    <header class="app-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="app-title">{{ appConfig.app.name }}</h1>
        </div>
        
        <nav class="header-nav">
          <router-link 
            v-for="item in navigationItems" 
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ active: $route.path === item.path }"
          >
            <el-icon v-if="item.icon">
              <component :is="item.icon" />
            </el-icon>
            {{ item.label }}
          </router-link>
        </nav>
        
        <div class="header-right">
          <el-button 
            :icon="isDark ? 'Sunny' : 'Moon'" 
            circle 
            @click="toggleTheme"
            :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
          />
          
          <el-dropdown trigger="click">
            <el-button :icon="'Setting'" circle />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="openSettings">系统设置</el-dropdown-item>
                <el-dropdown-item @click="exportData">导出数据</el-dropdown-item>
                <el-dropdown-item @click="importData">导入数据</el-dropdown-item>
                <el-dropdown-item divided @click="clearData">清空数据</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>
    
    <!-- 主要内容区域 -->
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    
    <!-- 全局加载遮罩 -->
    <div v-if="appStore.ui.loading" class="loading-overlay">
      <el-loading-spinner />
      <p>加载中...</p>
    </div>
    
    <!-- 通知容器 -->
    <div class="notification-container">
      <transition-group name="notification" tag="div">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="['notification', `notification-${notification.type}`]"
          @click="dismissNotification(notification.id)"
        >
          <el-icon class="notification-icon">
            <component :is="getNotificationIcon(notification.type)" />
          </el-icon>
          <div class="notification-content">
            <h4 v-if="notification.title">{{ notification.title }}</h4>
            <p>{{ notification.message }}</p>
          </div>
          <el-button 
            :icon="'Close'" 
            size="small" 
            text 
            @click.stop="dismissNotification(notification.id)"
          />
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@core/store/modules/app'
import { appConfig } from '@core/config/app.config'
import { FeatureChecker } from '@core/config/feature.config'

const router = useRouter()
const appStore = useAppStore()

// 主题相关
const isDark = computed(() => appStore.ui.theme === 'dark')

// 导航项目
const navigationItems = computed(() => {
  const items = []
  
  if (FeatureChecker.isEnabled('dashboard')) {
    items.push({
      path: '/dashboard',
      label: '仪表盘',
      icon: 'DataBoard'
    })
  }
  
  if (FeatureChecker.isEnabled('projectManagement')) {
    items.push({
      path: '/projects',
      label: '项目管理',
      icon: 'FolderOpened'
    })
  }
  
  return items
})

// 通知相关
const notifications = computed(() => 
  appStore.system.notifications.filter(n => !n.read).slice(0, 5)
)

// 方法
const toggleTheme = () => {
  const newTheme = isDark.value ? 'light' : 'dark'
  appStore.setTheme(newTheme)
}

const openSettings = () => {
  // 打开设置对话框
  console.log('Open settings')
}

const exportData = async () => {
  try {
    // 导出数据逻辑
    appStore.addNotification({
      type: 'success',
      title: '导出成功',
      message: '数据已成功导出'
    })
  } catch (error) {
    appStore.addError('导出数据失败', error.message)
  }
}

const importData = () => {
  // 导入数据逻辑
  console.log('Import data')
}

const clearData = async () => {
  try {
    await ElMessageBox.confirm(
      '此操作将清空所有数据，是否继续？',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 清空数据逻辑
    appStore.addNotification({
      type: 'success',
      title: '清空成功',
      message: '所有数据已清空'
    })
  } catch {
    // 用户取消
  }
}

const dismissNotification = (id) => {
  appStore.markNotificationAsRead(id)
}

const getNotificationIcon = (type) => {
  const icons = {
    success: 'SuccessFilled',
    warning: 'WarningFilled',
    error: 'CircleCloseFilled',
    info: 'InfoFilled'
  }
  return icons[type] || 'InfoFilled'
}

onMounted(() => {
  // 设置初始主题
  document.documentElement.setAttribute('data-theme', appStore.ui.theme)
})
</script>

<style lang="scss" scoped>
.app-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-page);
}

.app-header {
  height: var(--header-height);
  background-color: var(--color-bg-white);
  border-bottom: 1px solid var(--color-border-lighter);
  box-shadow: var(--shadow-base);
  z-index: 1000;
  
  .header-content {
    height: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--spacing-md);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .header-left {
    .app-title {
      font-size: var(--font-size-large);
      font-weight: 600;
      color: var(--color-primary);
      margin: 0;
    }
  }
  
  .header-nav {
    display: flex;
    gap: var(--spacing-lg);
    
    .nav-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: var(--border-radius-base);
      color: var(--color-text-regular);
      text-decoration: none;
      transition: var(--transition-base);
      
      &:hover {
        background-color: var(--color-fill-light);
        color: var(--color-primary);
      }
      
      &.active {
        background-color: var(--color-primary-light-9);
        color: var(--color-primary);
        font-weight: 500;
      }
    }
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }
}

.app-main {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  
  p {
    margin-top: var(--spacing-md);
    color: var(--color-text-secondary);
  }
}

.notification-container {
  position: fixed;
  top: calc(var(--header-height) + var(--spacing-md));
  right: var(--spacing-md);
  z-index: 2000;
  max-width: 400px;
}

.notification {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  background-color: var(--color-bg-white);
  border-radius: var(--border-radius-base);
  box-shadow: var(--shadow-light);
  cursor: pointer;
  transition: var(--transition-base);
  
  &:hover {
    transform: translateX(-4px);
  }
  
  .notification-icon {
    font-size: 20px;
    margin-top: 2px;
  }
  
  .notification-content {
    flex: 1;
    
    h4 {
      margin: 0 0 4px 0;
      font-size: var(--font-size-base);
      font-weight: 600;
    }
    
    p {
      margin: 0;
      font-size: var(--font-size-small);
      color: var(--color-text-secondary);
      line-height: 1.4;
    }
  }
  
  &.notification-success {
    border-left: 4px solid var(--color-success);
    
    .notification-icon {
      color: var(--color-success);
    }
  }
  
  &.notification-warning {
    border-left: 4px solid var(--color-warning);
    
    .notification-icon {
      color: var(--color-warning);
    }
  }
  
  &.notification-error {
    border-left: 4px solid var(--color-danger);
    
    .notification-icon {
      color: var(--color-danger);
    }
  }
  
  &.notification-info {
    border-left: 4px solid var(--color-info);
    
    .notification-icon {
      color: var(--color-info);
    }
  }
}

// 过渡动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.notification-enter-active {
  transition: all 0.3s ease;
}

.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

// 响应式
@media (max-width: 768px) {
  .header-content {
    padding: 0 var(--spacing-sm);
  }
  
  .header-nav {
    gap: var(--spacing-sm);
    
    .nav-item {
      padding: var(--spacing-xs) var(--spacing-sm);
      font-size: var(--font-size-small);
    }
  }
  
  .notification-container {
    left: var(--spacing-sm);
    right: var(--spacing-sm);
    max-width: none;
  }
}
</style>