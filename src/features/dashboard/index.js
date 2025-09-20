import routes from './routes.js'
import store from './store.js'

/**
 * 仪表盘功能模块
 */
export default {
  name: 'dashboard',
  version: '1.0.0',
  description: '项目管理仪表盘',
  dependencies: [
    'shared/services',
    'shared/components',
    'shared/utils'
  ],
  
  /**
   * 安装模块
   * @param {object} app Vue应用实例
   * @param {object} options 安装选项
   */
  install(app, options = {}) {
    // 检查功能开关
    const featureConfig = app.config.globalProperties.$featureConfig
    if (!featureConfig?.dashboard?.enabled) {
      console.warn('Dashboard module is disabled')
      return
    }
    
    try {
      // 注册路由
      if (routes && routes.length > 0) {
        app.config.globalProperties.$router.addRoute({
          path: '/dashboard',
          name: 'Dashboard',
          component: () => import('./views/DashboardView.vue'),
          meta: {
            title: '仪表盘',
            requiresAuth: false,
            icon: 'dashboard'
          }
        })
      }
      
      // 注册Store模块
      if (store) {
        const pinia = app.config.globalProperties.$pinia
        if (pinia) {
          // Pinia store会自动注册
          console.log('Dashboard store registered')
        }
      }
      
      // 注册组件
      this.registerComponents(app)
      
      // 初始化服务
      this.initServices(app, options)
      
      console.log('Dashboard module installed successfully')
      
    } catch (error) {
      console.error('Failed to install dashboard module:', error)
      throw error
    }
  },
  
  /**
   * 卸载模块
   * @param {object} app Vue应用实例
   */
  uninstall(app) {
    try {
      // 移除路由
      const router = app.config.globalProperties.$router
      if (router.hasRoute('Dashboard')) {
        router.removeRoute('Dashboard')
      }
      
      // 清理Store
      // Pinia stores会自动清理
      
      console.log('Dashboard module uninstalled successfully')
      
    } catch (error) {
      console.error('Failed to uninstall dashboard module:', error)
    }
  },
  
  /**
   * 注册组件
   * @param {object} app Vue应用实例
   */
  registerComponents(app) {
    // 注册仪表盘专用组件
    const components = [
      'StatCard',
      'ProjectCard',
      'OverdueAlert',
      'QuickActions'
    ]
    
    components.forEach(componentName => {
      try {
        const component = () => import(`./components/${componentName}.vue`)
        app.component(`Dashboard${componentName}`, component)
      } catch (error) {
        console.warn(`Failed to register component Dashboard${componentName}:`, error)
      }
    })
  },
  
  /**
   * 初始化服务
   * @param {object} app Vue应用实例
   * @param {object} options 选项
   */
  initServices(app, options) {
    // 初始化仪表盘数据服务
    const dashboardService = {
      async getDashboardData() {
        const { projectDataService } = await import('@shared/services/data/ProjectDataService.js')
        const { taskDataService } = await import('@shared/services/data/TaskDataService.js')
        const { calculationEngine } = await import('@shared/services/calculation/CalculationEngine.js')
        
        try {
          // 获取所有项目和任务
          const [projects, tasks] = await Promise.all([
            projectDataService.findAll(),
            taskDataService.findAll()
          ])
          
          // 计算统计数据
          const [projectStats, taskStats, overdueReminders] = await Promise.all([
            calculationEngine.calculate('projectStats', projects),
            calculationEngine.calculate('taskStats', tasks),
            calculationEngine.calculate('overdueReminder', tasks, { days: [7, 14] })
          ])
          
          return {
            projects,
            tasks,
            statistics: {
              projects: projectStats,
              tasks: taskStats
            },
            reminders: overdueReminders,
            lastUpdated: new Date().toISOString()
          }
        } catch (error) {
          console.error('Failed to load dashboard data:', error)
          throw error
        }
      },
      
      async refreshData() {
        return await this.getDashboardData()
      }
    }
    
    // 将服务注入到应用中
    app.provide('dashboardService', dashboardService)
    app.config.globalProperties.$dashboardService = dashboardService
  },
  
  /**
   * 获取模块配置
   */
  getConfig() {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
      features: {
        projectStats: true,
        taskStats: true,
        overdueReminders: true,
        projectCards: true,
        quickActions: true
      },
      permissions: {
        view: 'dashboard:view',
        refresh: 'dashboard:refresh'
      }
    }
  }
}