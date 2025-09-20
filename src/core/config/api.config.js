import { appConfig } from './app.config.js'

const isDevelopment = import.meta.env.DEV

export const apiConfig = {
  // 基础配置
  baseURL: isDevelopment ? appConfig.development.apiBaseUrl : appConfig.production.apiBaseUrl,
  timeout: 10000,
  
  // 请求头配置
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  
  // 重试配置
  retry: {
    times: 3,
    delay: 1000
  },
  
  // 缓存配置
  cache: {
    enabled: true,
    ttl: 300000, // 5分钟
    maxSize: 100
  },
  
  // API端点配置
  endpoints: {
    // 项目相关
    projects: {
      list: '/projects',
      detail: '/projects/:id',
      create: '/projects',
      update: '/projects/:id',
      delete: '/projects/:id',
      statistics: '/projects/statistics'
    },
    
    // 任务相关
    tasks: {
      list: '/tasks',
      detail: '/tasks/:id',
      create: '/tasks',
      update: '/tasks/:id',
      delete: '/tasks/:id',
      byProject: '/projects/:projectId/tasks',
      overdue: '/tasks/overdue',
      upcoming: '/tasks/upcoming'
    },
    
    // 统计相关
    statistics: {
      dashboard: '/statistics/dashboard',
      projects: '/statistics/projects',
      tasks: '/statistics/tasks',
      overdue: '/statistics/overdue'
    },
    
    // 用户相关(预留)
    users: {
      profile: '/users/profile',
      list: '/users',
      create: '/users',
      update: '/users/:id',
      delete: '/users/:id'
    }
  }
}

// URL构建工具
export class ApiUrlBuilder {
  static build(endpoint, params = {}) {
    let url = apiConfig.endpoints
    
    // 解析嵌套路径
    const paths = endpoint.split('.')
    for (const path of paths) {
      url = url[path]
    }
    
    if (!url) {
      throw new Error(`API endpoint not found: ${endpoint}`)
    }
    
    // 替换路径参数
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, value)
    })
    
    return url
  }
}