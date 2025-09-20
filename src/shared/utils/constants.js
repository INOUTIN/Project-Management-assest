/**
 * 应用常量定义
 */

// 项目状态
export const PROJECT_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
  // 复合状态（按照6条规则）
  OVERDUE_NOT_STARTED: 'overdue_not_started',
  OVERDUE_IN_PROGRESS: 'overdue_in_progress',
  COMPLETED_OVERDUE: 'completed_overdue'
}

// 任务状态
export const TASK_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  OVERDUE: 'overdue'
}

// 优先级
export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
}

// 状态标签映射
export const STATUS_LABELS = {
  [PROJECT_STATUS.NOT_STARTED]: '未开始',
  [PROJECT_STATUS.IN_PROGRESS]: '进行中',
  [PROJECT_STATUS.COMPLETED]: '已完成',
  [PROJECT_STATUS.OVERDUE]: '超期',
  // 复合状态标签
  [PROJECT_STATUS.OVERDUE_NOT_STARTED]: '超期+未开始',
  [PROJECT_STATUS.OVERDUE_IN_PROGRESS]: '超期+进行中',
  [PROJECT_STATUS.COMPLETED_OVERDUE]: '已完成+超期'
}

// 优先级标签映射
export const PRIORITY_LABELS = {
  [PRIORITY.LOW]: '低',
  [PRIORITY.MEDIUM]: '中',
  [PRIORITY.HIGH]: '高',
  [PRIORITY.URGENT]: '紧急'
}

// 状态颜色映射
export const STATUS_COLORS = {
  [PROJECT_STATUS.NOT_STARTED]: '#909399',        // 灰色
  [PROJECT_STATUS.IN_PROGRESS]: '#E6A23C',        // 黄色
  [PROJECT_STATUS.COMPLETED]: '#67C23A',          // 绿色
  [PROJECT_STATUS.OVERDUE]: '#F56C6C',            // 红色
  // 复合状态颜色（按照6条规则）
  [PROJECT_STATUS.OVERDUE_NOT_STARTED]: '#F56C6C', // 红色
  [PROJECT_STATUS.OVERDUE_IN_PROGRESS]: '#E6A23C', // 黄色
  [PROJECT_STATUS.COMPLETED_OVERDUE]: '#67C23A'    // 绿色
}

// 优先级颜色映射
export const PRIORITY_COLORS = {
  [PRIORITY.LOW]: '#909399',
  [PRIORITY.MEDIUM]: '#E6A23C',
  [PRIORITY.HIGH]: '#F56C6C',
  [PRIORITY.URGENT]: '#F56C6C'
}

// 日期格式
export const DATE_FORMATS = {
  DATE: 'YYYY-MM-DD',
  TIME: 'HH:mm:ss',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  DISPLAY_DATE: 'MM月DD日',
  DISPLAY_DATETIME: 'MM月DD日 HH:mm'
}

// 存储键
export const STORAGE_KEYS = {
  PROJECTS: 'projects',
  TASKS: 'tasks',
  USER_PREFERENCES: 'user_preferences',
  APP_STATE: 'app_state'
}

// API 状态码
export const API_STATUS = {
  SUCCESS: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500
}

// 分页配置
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100
}

// 文件类型
export const FILE_TYPES = {
  IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  DOCUMENT: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
  ARCHIVE: ['zip', 'rar', '7z', 'tar', 'gz']
}

// 通知类型
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info'
}

// 主题
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
}

// 语言
export const LANGUAGES = {
  ZH_CN: 'zh-CN',
  EN_US: 'en-US'
}

// 甘特图配置
export const GANTT_CONFIG = {
  TIME_UNITS: ['day', 'week', 'month'],
  DEFAULT_TIME_UNIT: 'day',
  MIN_TASK_WIDTH: 20,
  TASK_HEIGHT: 30,
  ROW_HEIGHT: 40
}

// 图表颜色
export const CHART_COLORS = {
  PRIMARY: '#409EFF',
  SUCCESS: '#67C23A',
  WARNING: '#E6A23C',
  DANGER: '#F56C6C',
  INFO: '#909399',
  SERIES: [
    '#409EFF', '#67C23A', '#E6A23C', '#F56C6C', 
    '#909399', '#C71585', '#FF8C00', '#32CD32'
  ]
}

// 验证规则
export const VALIDATION_RULES = {
  PROJECT_NAME: {
    required: true,
    minLength: 2,
    maxLength: 100
  },
  TASK_NAME: {
    required: true,
    minLength: 2,
    maxLength: 200
  },
  DESCRIPTION: {
    maxLength: 1000
  },
  EMAIL: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  }
}

// 默认值
export const DEFAULTS = {
  PROJECT: {
    status: PROJECT_STATUS.NOT_STARTED,
    priority: PRIORITY.MEDIUM,
    description: ''
  },
  TASK: {
    status: TASK_STATUS.NOT_STARTED,
    priority: PRIORITY.MEDIUM,
    isMilestone: false,
    description: ''
  },
  PAGINATION: {
    page: 1,
    pageSize: PAGINATION.DEFAULT_PAGE_SIZE
  }
}

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  SERVER_ERROR: '服务器错误，请稍后重试',
  VALIDATION_ERROR: '数据验证失败',
  NOT_FOUND: '请求的资源不存在',
  UNAUTHORIZED: '未授权访问',
  FORBIDDEN: '访问被拒绝',
  TIMEOUT: '请求超时',
  UNKNOWN_ERROR: '未知错误'
}

// 成功消息
export const SUCCESS_MESSAGES = {
  CREATED: '创建成功',
  UPDATED: '更新成功',
  DELETED: '删除成功',
  SAVED: '保存成功',
  IMPORTED: '导入成功',
  EXPORTED: '导出成功'
}

// 操作类型
export const OPERATION_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  READ: 'read',
  IMPORT: 'import',
  EXPORT: 'export'
}

// 权限
export const PERMISSIONS = {
  PROJECT_CREATE: 'project:create',
  PROJECT_READ: 'project:read',
  PROJECT_UPDATE: 'project:update',
  PROJECT_DELETE: 'project:delete',
  TASK_CREATE: 'task:create',
  TASK_READ: 'task:read',
  TASK_UPDATE: 'task:update',
  TASK_DELETE: 'task:delete'
}