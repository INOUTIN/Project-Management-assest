import { DateUtils } from './date.js'
import { STATUS_LABELS, PRIORITY_LABELS, STATUS_COLORS, PRIORITY_COLORS } from './constants.js'

/**
 * 格式化工具类
 */
export class FormatUtils {
  /**
   * 格式化文件大小
   * @param {number} bytes 字节数
   * @param {number} decimals 小数位数
   * @returns {string} 格式化后的大小
   */
  static formatFileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }
  
  /**
   * 格式化数字
   * @param {number} number 数字
   * @param {object} options 格式化选项
   * @returns {string} 格式化后的数字
   */
  static formatNumber(number, options = {}) {
    const {
      decimals = 0,
      thousandsSeparator = ',',
      decimalSeparator = '.',
      prefix = '',
      suffix = ''
    } = options
    
    if (isNaN(number)) return '0'
    
    const num = Number(number)
    const fixed = num.toFixed(decimals)
    const parts = fixed.split('.')
    
    // 添加千位分隔符
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator)
    
    // 组合结果
    let result = parts.join(decimalSeparator)
    
    return prefix + result + suffix
  }
  
  /**
   * 格式化百分比
   * @param {number} value 数值
   * @param {number} total 总数
   * @param {number} decimals 小数位数
   * @returns {string} 百分比字符串
   */
  static formatPercentage(value, total, decimals = 1) {
    if (total === 0) return '0%'
    
    const percentage = (value / total) * 100
    return this.formatNumber(percentage, { decimals, suffix: '%' })
  }
  
  /**
   * 格式化货币
   * @param {number} amount 金额
   * @param {string} currency 货币符号
   * @param {number} decimals 小数位数
   * @returns {string} 格式化后的货币
   */
  static formatCurrency(amount, currency = '¥', decimals = 2) {
    return this.formatNumber(amount, {
      decimals,
      thousandsSeparator: ',',
      prefix: currency
    })
  }
  
  /**
   * 格式化状态
   * @param {string} status 状态值
   * @param {string} type 状态类型 (project|task)
   * @returns {object} 格式化后的状态信息
   */
  static formatStatus(status, type = 'project') {
    const labels = STATUS_LABELS
    const colors = STATUS_COLORS
    
    return {
      value: status,
      label: labels[status] || status,
      color: colors[status] || '#909399',
      type
    }
  }
  
  /**
   * 格式化优先级
   * @param {string} priority 优先级值
   * @returns {object} 格式化后的优先级信息
   */
  static formatPriority(priority) {
    return {
      value: priority,
      label: PRIORITY_LABELS[priority] || priority,
      color: PRIORITY_COLORS[priority] || '#909399'
    }
  }
  
  /**
   * 格式化项目信息
   * @param {object} project 项目对象
   * @returns {object} 格式化后的项目信息
   */
  static formatProject(project) {
    if (!project) return null
    
    const totalTasks = project.tasks ? project.tasks.length : 0
    const completedTasks = project.tasks ? project.tasks.filter(t => t.status === 'completed').length : 0
    const overdueTasks = project.tasks ? project.tasks.filter(t => 
      t.status !== 'completed' && DateUtils.isOverdue(t.endDate)
    ).length : 0
    
    return {
      ...project,
      formattedStatus: this.formatStatus(project.status, 'project'),
      formattedPriority: this.formatPriority(project.priority),
      formattedStartDate: DateUtils.getDisplayText(project.startDate),
      formattedEndDate: DateUtils.getDisplayText(project.endDate),
      formattedCreatedAt: DateUtils.getDisplayText(project.createdAt, { showRelative: true }),
      formattedUpdatedAt: DateUtils.getDisplayText(project.updatedAt, { showRelative: true }),
      statistics: {
        totalTasks,
        completedTasks,
        overdueTasks,
        completionRate: this.formatPercentage(completedTasks, totalTasks),
        overdueRate: this.formatPercentage(overdueTasks, totalTasks)
      }
    }
  }
  
  /**
   * 格式化任务信息
   * @param {object} task 任务对象
   * @returns {object} 格式化后的任务信息
   */
  static formatTask(task) {
    if (!task) return null
    
    const isOverdue = task.status !== 'completed' && DateUtils.isOverdue(task.endDate)
    const daysLeft = DateUtils.diffInDays(new Date(), task.endDate)
    
    return {
      ...task,
      formattedStatus: this.formatStatus(task.status, 'task'),
      formattedPriority: this.formatPriority(task.priority),
      formattedStartDate: DateUtils.getDisplayText(task.startDate),
      formattedEndDate: DateUtils.getDisplayText(task.endDate),
      formattedCreatedAt: DateUtils.getDisplayText(task.createdAt, { showRelative: true }),
      formattedUpdatedAt: DateUtils.getDisplayText(task.updatedAt, { showRelative: true }),
      isOverdue,
      daysLeft,
      urgencyLevel: this.getUrgencyLevel(daysLeft, isOverdue)
    }
  }
  
  /**
   * 获取紧急程度
   * @param {number} daysLeft 剩余天数
   * @param {boolean} isOverdue 是否超期
   * @returns {string} 紧急程度
   */
  static getUrgencyLevel(daysLeft, isOverdue) {
    if (isOverdue) return 'critical'
    if (daysLeft <= 1) return 'high'
    if (daysLeft <= 3) return 'medium'
    if (daysLeft <= 7) return 'low'
    return 'normal'
  }
  
  /**
   * 格式化时间段
   * @param {Date|string} startDate 开始时间
   * @param {Date|string} endDate 结束时间
   * @returns {string} 格式化后的时间段
   */
  static formatDateRange(startDate, endDate) {
    if (!startDate || !endDate) return ''
    
    const start = DateUtils.format(startDate, 'MM-DD')
    const end = DateUtils.format(endDate, 'MM-DD')
    const duration = DateUtils.diffInDays(startDate, endDate)
    
    return `${start} 至 ${end} (${duration}天)`
  }
  
  /**
   * 格式化用户名
   * @param {string} name 用户名
   * @param {string} email 邮箱
   * @returns {string} 格式化后的用户名
   */
  static formatUserName(name, email) {
    if (name && email) {
      return `${name} <${email}>`
    } else if (name) {
      return name
    } else if (email) {
      return email
    } else {
      return '未指定'
    }
  }
  
  /**
   * 格式化标签列表
   * @param {Array} tags 标签数组
   * @param {string} separator 分隔符
   * @returns {string} 格式化后的标签字符串
   */
  static formatTags(tags, separator = ', ') {
    if (!Array.isArray(tags) || tags.length === 0) return ''
    return tags.join(separator)
  }
  
  /**
   * 截断文本
   * @param {string} text 文本
   * @param {number} maxLength 最大长度
   * @param {string} suffix 后缀
   * @returns {string} 截断后的文本
   */
  static truncateText(text, maxLength = 100, suffix = '...') {
    if (!text || typeof text !== 'string') return ''
    
    if (text.length <= maxLength) return text
    
    return text.substring(0, maxLength - suffix.length) + suffix
  }
  
  /**
   * 格式化搜索高亮
   * @param {string} text 原文本
   * @param {string} keyword 关键词
   * @param {string} className CSS类名
   * @returns {string} 带高亮的HTML
   */
  static highlightText(text, keyword, className = 'highlight') {
    if (!text || !keyword) return text
    
    const regex = new RegExp(`(${keyword})`, 'gi')
    return text.replace(regex, `<span class="${className}">$1</span>`)
  }
  
  /**
   * 格式化列表为树形结构
   * @param {Array} list 平铺列表
   * @param {string} idField ID字段名
   * @param {string} parentField 父级字段名
   * @param {string} childrenField 子级字段名
   * @returns {Array} 树形结构
   */
  static formatListToTree(list, idField = 'id', parentField = 'parentId', childrenField = 'children') {
    if (!Array.isArray(list)) return []
    
    const map = new Map()
    const roots = []
    
    // 创建映射
    list.forEach(item => {
      map.set(item[idField], { ...item, [childrenField]: [] })
    })
    
    // 构建树形结构
    list.forEach(item => {
      const node = map.get(item[idField])
      const parentId = item[parentField]
      
      if (parentId && map.has(parentId)) {
        map.get(parentId)[childrenField].push(node)
      } else {
        roots.push(node)
      }
    })
    
    return roots
  }
  
  /**
   * 格式化树形结构为平铺列表
   * @param {Array} tree 树形结构
   * @param {string} childrenField 子级字段名
   * @returns {Array} 平铺列表
   */
  static formatTreeToList(tree, childrenField = 'children') {
    if (!Array.isArray(tree)) return []
    
    const result = []
    
    function traverse(nodes, level = 0) {
      nodes.forEach(node => {
        const { [childrenField]: children, ...item } = node
        result.push({ ...item, level })
        
        if (children && children.length > 0) {
          traverse(children, level + 1)
        }
      })
    }
    
    traverse(tree)
    return result
  }
  
  /**
   * 格式化URL参数
   * @param {object} params 参数对象
   * @returns {string} URL参数字符串
   */
  static formatUrlParams(params) {
    if (!params || typeof params !== 'object') return ''
    
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    
    return searchParams.toString()
  }
  
  /**
   * 解析URL参数
   * @param {string} search URL参数字符串
   * @returns {object} 参数对象
   */
  static parseUrlParams(search) {
    if (!search) return {}
    
    const params = {}
    const searchParams = new URLSearchParams(search)
    
    for (const [key, value] of searchParams) {
      params[key] = value
    }
    
    return params
  }
  
  /**
   * 格式化颜色值
   * @param {string} color 颜色值
   * @param {number} alpha 透明度
   * @returns {string} 格式化后的颜色
   */
  static formatColor(color, alpha = 1) {
    if (!color) return 'transparent'
    
    // 如果是十六进制颜色
    if (color.startsWith('#')) {
      if (alpha === 1) return color
      
      // 转换为RGB
      const hex = color.replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    
    return color
  }
}

// 导出常用格式化函数
export const formatFileSize = FormatUtils.formatFileSize
export const formatNumber = FormatUtils.formatNumber
export const formatPercentage = FormatUtils.formatPercentage
export const formatCurrency = FormatUtils.formatCurrency
export const formatStatus = FormatUtils.formatStatus
export const formatPriority = FormatUtils.formatPriority
export const formatProject = FormatUtils.formatProject
export const formatTask = FormatUtils.formatTask
export const truncateText = FormatUtils.truncateText