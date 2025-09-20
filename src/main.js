import { createApp, nextTick } from 'vue'
import ElementPlus, { ElMessage, ElNotification, ElMessageBox } from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

import App from './App.vue'
import { createPinia } from 'pinia'
import { setupRouter } from '@/core/router'

// 导入全局样式
import '@/assets/styles/main.scss'

// 导入核心配置
import { appConfig } from '@/core/config/app.config.js'

// 导入插件管理器
import pluginManagerPlugin from '@/plugins'

// 导入模拟数据初始化
import { initializeMockData } from '@shared/data/mockData.js'

// 导入数据迁移工具
import { runDataMigration, needsMigration } from '@/shared/utils/dataMigration.js'

// 创建应用实例
const app = createApp(App)

// 创建 Pinia 实例
const pinia = createPinia()

// 设置路由
const router = setupRouter(app, pinia)

// 注册核心插件
app.use(pinia)
app.use(ElementPlus)

// 注册插件管理器
app.use(pluginManagerPlugin)

// 全局配置
app.config.globalProperties.$appConfig = appConfig
app.config.globalProperties.$message = ElMessage
app.config.globalProperties.$notify = ElNotification
app.config.globalProperties.$confirm = ElMessageBox.confirm

// 全局错误处理
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err)
  console.error('Component instance:', instance)
  console.error('Error info:', info)
  
  // 在生产环境中，可以将错误发送到错误监控服务
  if (import.meta.env.PROD) {
    // 发送错误到监控服务
    // errorReportingService.report(err, instance, info)
  }
}

// 开发环境配置
if (import.meta.env.DEV) {
  // 开发环境下的全局调试工具
  window.__APP__ = app
  window.__ROUTER__ = router
  window.__PINIA__ = pinia
  
  // 启用 Vue DevTools
  app.config.devtools = true
  
  console.log('🚀 Application starting in development mode')
  console.log('📊 App Config:', appConfig)
}

// 数据迁移（如果需要）
if (needsMigration()) {
  console.log('🔄 Running data migration...')
  runDataMigration().then(() => {
    console.log('✅ Data migration completed')
  }).catch(error => {
    console.error('❌ Data migration failed:', error)
  })
}

// 初始化模拟数据（仅在开发环境或启用模拟数据时）
if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK === 'true') {
  initializeMockData()
  console.log('📝 Mock data initialized')
}

// 挂载应用
app.mount('#app')

// 应用挂载后的钩子
nextTick(() => {
  console.log('✅ Application mounted successfully')
  
  // 触发应用挂载事件
  if (window.eventBus) {
    window.eventBus.emit('app:mounted', {
      app,
      router,
      pinia
    })
  }
})

export default app