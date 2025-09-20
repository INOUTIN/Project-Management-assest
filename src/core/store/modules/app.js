import { defineStore } from 'pinia'
import { appConfig } from '@core/config/app.config'

export const useAppStore = defineStore('app', {
  state: () => ({
    // 应用基本信息
    appInfo: {
      name: appConfig.app.name,
      version: appConfig.app.version,
      initialized: false
    },
    
    // 当前路由信息
    currentRoute: null,
    routeHistory: [],
    
    // 用户界面状态
    ui: {
      theme: appConfig.ui.theme,
      language: appConfig.ui.language,
      sidebarCollapsed: false,
      loading: false,
      pageLoading: false
    },
    
    // 系统状态
    system: {
      online: navigator.onLine,
      lastSyncTime: null,
      notifications: [],
      errors: []
    },
    
    // 用户偏好设置
    preferences: {
      dateFormat: appConfig.ui.dateFormat,
      timeFormat: appConfig.ui.timeFormat,
      pageSize: appConfig.ui.pageSize,
      autoRefresh: true,
      enableNotifications: true
    }
  }),
  
  getters: {
    isInitialized: (state) => state.appInfo.initialized,
    
    currentTheme: (state) => state.ui.theme,
    
    isOnline: (state) => state.system.online,
    
    hasUnreadNotifications: (state) => 
      state.system.notifications.some(n => !n.read),
    
    unreadNotificationCount: (state) => 
      state.system.notifications.filter(n => !n.read).length,
    
    recentRoutes: (state) => 
      state.routeHistory.slice(-5).reverse()
  },
  
  actions: {
    // 初始化应用
    async initialize() {
      try {
        this.setLoading(true)
        
        // 检查本地存储数据
        await this.loadUserPreferences()
        
        // 初始化系统监听器
        this.setupSystemListeners()
        
        // 标记为已初始化
        this.appInfo.initialized = true
        
        console.log('App initialized successfully')
      } catch (error) {
        console.error('App initialization failed:', error)
        this.addError('应用初始化失败')
      } finally {
        this.setLoading(false)
      }
    },
    
    // 设置加载状态
    setLoading(loading) {
      this.ui.loading = loading
    },
    
    // 设置页面加载状态
    setPageLoading(loading) {
      this.ui.pageLoading = loading
    },
    
    // 切换侧边栏
    toggleSidebar() {
      this.ui.sidebarCollapsed = !this.ui.sidebarCollapsed
    },
    
    // 设置主题
    setTheme(theme) {
      this.ui.theme = theme
      document.documentElement.setAttribute('data-theme', theme)
    },
    
    // 设置语言
    setLanguage(language) {
      this.ui.language = language
    },
    
    // 记录路由访问
    recordRouteAccess(routeInfo) {
      this.routeHistory.push({
        ...routeInfo,
        id: Date.now()
      })
      
      // 保持历史记录在合理范围内
      if (this.routeHistory.length > 50) {
        this.routeHistory = this.routeHistory.slice(-30)
      }
    },
    
    // 设置当前路由
    setCurrentRoute(route) {
      this.currentRoute = {
        path: route.path,
        name: route.name,
        params: route.params,
        query: route.query,
        meta: route.meta
      }
    },
    
    // 添加通知
    addNotification(notification) {
      const id = Date.now()
      this.system.notifications.push({
        id,
        type: 'info',
        read: false,
        timestamp: new Date(),
        ...notification
      })
      
      // 自动清理旧通知
      if (this.system.notifications.length > 100) {
        this.system.notifications = this.system.notifications.slice(-50)
      }
      
      return id
    },
    
    // 标记通知为已读
    markNotificationAsRead(id) {
      const notification = this.system.notifications.find(n => n.id === id)
      if (notification) {
        notification.read = true
      }
    },
    
    // 清除所有通知
    clearNotifications() {
      this.system.notifications = []
    },
    
    // 添加错误
    addError(message, details = null) {
      this.system.errors.push({
        id: Date.now(),
        message,
        details,
        timestamp: new Date()
      })
      
      // 同时添加为通知
      this.addNotification({
        type: 'error',
        title: '系统错误',
        message
      })
    },
    
    // 清除错误
    clearErrors() {
      this.system.errors = []
    },
    
    // 更新用户偏好
    updatePreferences(preferences) {
      this.preferences = { ...this.preferences, ...preferences }
    },
    
    // 加载用户偏好
    async loadUserPreferences() {
      try {
        const saved = localStorage.getItem('pmt_user_preferences')
        if (saved) {
          const preferences = JSON.parse(saved)
          this.updatePreferences(preferences)
        }
      } catch (error) {
        console.warn('Failed to load user preferences:', error)
      }
    },
    
    // 保存用户偏好
    async saveUserPreferences() {
      try {
        localStorage.setItem('pmt_user_preferences', JSON.stringify(this.preferences))
      } catch (error) {
        console.warn('Failed to save user preferences:', error)
      }
    },
    
    // 设置系统监听器
    setupSystemListeners() {
      // 网络状态监听
      window.addEventListener('online', () => {
        this.system.online = true
        this.addNotification({
          type: 'success',
          title: '网络连接',
          message: '网络连接已恢复'
        })
      })
      
      window.addEventListener('offline', () => {
        this.system.online = false
        this.addNotification({
          type: 'warning',
          title: '网络连接',
          message: '网络连接已断开'
        })
      })
      
      // 页面可见性监听
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.preferences.autoRefresh) {
          // 页面重新可见时可以触发数据刷新
          this.system.lastSyncTime = new Date()
        }
      })
    }
  },
  
  persist: {
    key: 'app',
    paths: ['ui.theme', 'ui.language', 'ui.sidebarCollapsed', 'preferences']
  }
})