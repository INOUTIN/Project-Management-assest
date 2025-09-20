export const appConfig = {
  // 应用基本信息
  app: {
    name: '项目管理工具',
    version: '1.0.0',
    description: '企业内部轻量化项目管理工具',
    author: 'Your Company'
  },
  
  // 开发环境配置
  development: {
    apiBaseUrl: 'http://localhost:3001/api',
    enableMockData: true,
    enableDebugMode: true
  },
  
  // 生产环境配置
  production: {
    apiBaseUrl: '/api',
    enableMockData: false,
    enableDebugMode: false
  },
  
  // 存储配置
  storage: {
    type: 'localStorage', // localStorage | indexedDB | memory
    prefix: 'pmt_', // 存储键前缀
    version: '1.0'
  },
  
  // 界面配置
  ui: {
    theme: 'light', // light | dark | auto
    language: 'zh-CN',
    pageSize: 20,
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm:ss'
  },
  
  // 业务配置
  business: {
    // 项目状态
    projectStatus: {
      NOT_STARTED: { value: 'not_started', label: '未开始', color: '#909399' },
      IN_PROGRESS: { value: 'in_progress', label: '进行中', color: '#409EFF' },
      COMPLETED: { value: 'completed', label: '已完成', color: '#67C23A' },
      OVERDUE: { value: 'overdue', label: '超期', color: '#F56C6C' }
    },
    
    // 任务状态
    taskStatus: {
      NOT_STARTED: { value: 'not_started', label: '未开始', color: '#909399' },
      IN_PROGRESS: { value: 'in_progress', label: '进行中', color: '#409EFF' },
      COMPLETED: { value: 'completed', label: '已完成', color: '#67C23A' },
      OVERDUE: { value: 'overdue', label: '超期', color: '#F56C6C' }
    },
    
    // 优先级
    priority: {
      LOW: { value: 'low', label: '低', color: '#909399' },
      MEDIUM: { value: 'medium', label: '中', color: '#E6A23C' },
      HIGH: { value: 'high', label: '高', color: '#F56C6C' },
      URGENT: { value: 'urgent', label: '紧急', color: '#F56C6C' }
    },
    
    // 提醒设置
    reminder: {
      overdueWarningDays: [7, 14], // 超期提醒天数
      autoRefreshInterval: 300000, // 自动刷新间隔(毫秒)
      enableNotifications: true
    }
  }
}