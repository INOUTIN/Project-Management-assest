<template>
  <div id="app" class="app">
    <!-- 全局加载状态 -->
    <div v-if="globalLoading" class="global-loading" v-loading="true">
      <div class="loading-content">
        <el-icon class="is-loading"><Loading /></el-icon>
        <p>加载中...</p>
      </div>
    </div>
    
    <!-- 主要内容区域 -->
    <router-view v-slot="{ Component, route }">
      <transition
        :name="route.meta.transition || 'fade'"
        mode="out-in"
        appear
      >
        <keep-alive :include="keepAliveComponents">
          <component :is="Component" :key="route.fullPath" />
        </keep-alive>
      </transition>
    </router-view>
    
    <!-- 全局通知容器 -->
    <div id="global-notifications"></div>
    
    <!-- 全局模态框容器 -->
    <div id="global-modals"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Loading } from '@element-plus/icons-vue'

// 路由实例
const router = useRouter()
const route = useRoute()

// 全局状态
const globalLoading = ref(false)

// 需要缓存的组件
const keepAliveComponents = computed(() => {
  // 根据路由配置决定哪些组件需要缓存
  return route.meta.keepAlive ? [route.name] : []
})

// 全局加载状态管理
const setGlobalLoading = (loading) => {
  globalLoading.value = loading
}

// 路由变化处理
const handleRouteChange = (to, from) => {
  // 路由变化时的处理逻辑
  console.log('Route changed:', from.path, '->', to.path)
  
  // 可以在这里添加页面访问统计、权限检查等逻辑
}

// 错误处理
const handleGlobalError = (error) => {
  console.error('Global error caught:', error)
  
  // 显示用户友好的错误信息
  ElMessage.error('系统出现错误，请稍后重试')
}

// 键盘快捷键处理
const handleKeyboardShortcuts = (event) => {
  // Ctrl/Cmd + K: 快速搜索
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault()
    // 触发全局搜索
    console.log('Global search triggered')
  }
  
  // ESC: 关闭模态框
  if (event.key === 'Escape') {
    // 触发关闭模态框事件
    window.eventBus?.emit('modal:close')
  }
}

// 生命周期钩子
onMounted(() => {
  console.log('🎉 App component mounted')
  
  // 监听路由变化
  router.beforeEach(handleRouteChange)
  
  // 监听全局错误
  window.addEventListener('error', handleGlobalError)
  window.addEventListener('unhandledrejection', handleGlobalError)
  
  // 监听键盘事件
  document.addEventListener('keydown', handleKeyboardShortcuts)
  
  // 暴露全局方法
  window.setGlobalLoading = setGlobalLoading
  
  // 应用初始化完成事件
  window.eventBus?.emit('app:ready')
})

onUnmounted(() => {
  // 清理事件监听器
  window.removeEventListener('error', handleGlobalError)
  window.removeEventListener('unhandledrejection', handleGlobalError)
  document.removeEventListener('keydown', handleKeyboardShortcuts)
})
</script>

<style lang="scss">
// 全局样式
#app {
  min-height: 100vh;
  background: var(--color-bg-light);
  color: var(--color-text-primary);
  font-family: var(--font-family-base);
  line-height: 1.6;
  
  // 确保应用占满整个视口
  display: flex;
  flex-direction: column;
}

// 全局加载状态
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  
  .el-loading-mask {
    background: transparent;
  }
}

// 路由过渡动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s ease;
}

.slide-left-enter-from {
  transform: translateX(100%);
}

.slide-left-leave-to {
  transform: translateX(-100%);
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease;
}

.slide-right-enter-from {
  transform: translateX(-100%);
}

.slide-right-leave-to {
  transform: translateX(100%);
}

// 响应式设计
@media (max-width: 768px) {
  #app {
    font-size: 14px;
  }
}

// 暗色主题支持
@media (prefers-color-scheme: dark) {
  #app {
    background: var(--color-bg-dark);
    color: var(--color-text-primary-dark);
  }
  
  .global-loading {
    background: rgba(0, 0, 0, 0.8);
  }
}

// 高对比度模式支持
@media (prefers-contrast: high) {
  #app {
    border: 2px solid var(--color-border-strong);
  }
}

// 减少动画模式支持
@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active,
  .slide-left-enter-active,
  .slide-left-leave-active,
  .slide-right-enter-active,
  .slide-right-leave-active {
    transition: none;
  }
}

// 打印样式
@media print {
  #app {
    background: white;
    color: black;
  }
  
  .global-loading,
  #global-notifications,
  #global-modals {
    display: none;
  }
}
</style>