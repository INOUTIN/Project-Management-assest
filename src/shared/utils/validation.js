import { VALIDATION_RULES } from './constants.js'

/**
 * 数据验证工具类
 */
export class ValidationUtils {
  /**
   * 验证项目数据
   * @param {object} project 项目数据
   * @returns {object} 验证结果
   */
  static validateProject(project) {
    const errors = {}
    
    // 验证项目名称
    if (!project.name || typeof project.name !== 'string') {
      errors.name = '项目名称不能为空'
    } else if (project.name.length < VALIDATION_RULES.PROJECT_NAME.minLength) {
      errors.name = `项目名称至少需要${VALIDATION_RULES.PROJECT_NAME.minLength}个字符`
    } else if (project.name.length > VALIDATION_RULES.PROJECT_NAME.maxLength) {
      errors.name = `项目名称不能超过${VALIDATION_RULES.PROJECT_NAME.maxLength}个字符`
    }
    
    // 验证描述
    if (project.description && project.description.length > VALIDATION_RULES.DESCRIPTION.maxLength) {
      errors.description = `描述不能超过${VALIDATION_RULES.DESCRIPTION.maxLength}个字符`
    }
    
    // 验证日期
    const dateValidation = this.validateDateRange(project.startDate, project.endDate)
    if (!dateValidation.isValid) {
      Object.assign(errors, dateValidation.errors)
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }
  
  /**
   * 验证任务数据
   * @param {object} task 任务数据
   * @returns {object} 验证结果
   */
  static validateTask(task) {
    const errors = {}
    
    // 验证任务名称
    if (!task.name || typeof task.name !== 'string') {
      errors.name = '任务名称不能为空'
    } else if (task.name.length < VALIDATION_RULES.TASK_NAME.minLength) {
      errors.name = `任务名称至少需要${VALIDATION_RULES.TASK_NAME.minLength}个字符`
    } else if (task.name.length > VALIDATION_RULES.TASK_NAME.maxLength) {
      errors.name = `任务名称不能超过${VALIDATION_RULES.TASK_NAME.maxLength}个字符`
    }
    
    // 验证描述
    if (task.description && task.description.length > VALIDATION_RULES.DESCRIPTION.maxLength) {
      errors.description = `描述不能超过${VALIDATION_RULES.DESCRIPTION.maxLength}个字符`
    }
    
    // 验证日期
    const dateValidation = this.validateDateRange(task.startDate, task.endDate)
    if (!dateValidation.isValid) {
      Object.assign(errors, dateValidation.errors)
    }
    
    // 验证责任人邮箱（如果提供）
    if (task.assignee && task.assignee.includes('@')) {
      if (!VALIDATION_RULES.EMAIL.pattern.test(task.assignee)) {
        errors.assignee = '邮箱格式不正确'
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }
  
  /**
   * 验证日期范围
   * @param {Date|string} startDate 开始日期
   * @param {Date|string} endDate 结束日期
   * @returns {object} 验证结果
   */
  static validateDateRange(startDate, endDate) {
    const errors = {}
    
    // 检查日期是否存在
    if (!startDate) {
      errors.startDate = '开始日期不能为空'
    }
    
    if (!endDate) {
      errors.endDate = '结束日期不能为空'
    }
    
    // 如果两个日期都存在，检查逻辑关系
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      // 检查日期有效性
      if (isNaN(start.getTime())) {
        errors.startDate = '开始日期格式不正确'
      }
      
      if (isNaN(end.getTime())) {
        errors.endDate = '结束日期格式不正确'
      }
      
      // 检查日期逻辑
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        if (start >= end) {
          errors.endDate = '结束日期必须晚于开始日期'
        }
        
        // 检查日期是否过于久远
        const now = new Date()
        const maxFutureDate = new Date(now.getFullYear() + 10, now.getMonth(), now.getDate())
        
        if (end > maxFutureDate) {
          errors.endDate = '结束日期不能超过10年'
        }
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }
  
  /**
   * 验证邮箱格式
   * @param {string} email 邮箱地址
   * @returns {boolean} 是否有效
   */
  static isValidEmail(email) {
    if (!email || typeof email !== 'string') return false
    return VALIDATION_RULES.EMAIL.pattern.test(email)
  }
  
  /**
   * 验证URL格式
   * @param {string} url URL地址
   * @returns {boolean} 是否有效
   */
  static isValidUrl(url) {
    if (!url || typeof url !== 'string') return false
    
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }
  
  /**
   * 验证手机号格式（中国大陆）
   * @param {string} phone 手机号
   * @returns {boolean} 是否有效
   */
  static isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') return false
    const phonePattern = /^1[3-9]\d{9}$/
    return phonePattern.test(phone)
  }
  
  /**
   * 验证身份证号格式（中国大陆）
   * @param {string} idCard 身份证号
   * @returns {boolean} 是否有效
   */
  static isValidIdCard(idCard) {
    if (!idCard || typeof idCard !== 'string') return false
    
    // 18位身份证号正则
    const idCardPattern = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/
    
    if (!idCardPattern.test(idCard)) return false
    
    // 验证校验码
    const factors = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
    const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
    
    let sum = 0
    for (let i = 0; i < 17; i++) {
      sum += parseInt(idCard[i]) * factors[i]
    }
    
    const checkCode = checkCodes[sum % 11]
    return checkCode === idCard[17].toUpperCase()
  }
  
  /**
   * 验证密码强度
   * @param {string} password 密码
   * @returns {object} 验证结果
   */
  static validatePassword(password) {
    const result = {
      isValid: false,
      strength: 'weak',
      errors: []
    }
    
    if (!password || typeof password !== 'string') {
      result.errors.push('密码不能为空')
      return result
    }
    
    // 长度检查
    if (password.length < 8) {
      result.errors.push('密码长度至少8位')
    }
    
    if (password.length > 128) {
      result.errors.push('密码长度不能超过128位')
    }
    
    // 复杂度检查
    const hasLowerCase = /[a-z]/.test(password)
    const hasUpperCase = /[A-Z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    
    let strengthScore = 0
    if (hasLowerCase) strengthScore++
    if (hasUpperCase) strengthScore++
    if (hasNumbers) strengthScore++
    if (hasSpecialChar) strengthScore++
    
    // 确定强度等级
    if (strengthScore >= 3 && password.length >= 8) {
      result.strength = 'strong'
      result.isValid = true
    } else if (strengthScore >= 2 && password.length >= 6) {
      result.strength = 'medium'
      result.isValid = true
    } else {
      result.strength = 'weak'
      result.errors.push('密码强度不足，建议包含大小写字母、数字和特殊字符')
    }
    
    return result
  }
  
  /**
   * 验证文件类型
   * @param {File} file 文件对象
   * @param {Array} allowedTypes 允许的文件类型
   * @returns {boolean} 是否有效
   */
  static isValidFileType(file, allowedTypes) {
    if (!file || !file.name) return false
    
    const extension = file.name.split('.').pop().toLowerCase()
    return allowedTypes.includes(extension)
  }
  
  /**
   * 验证文件大小
   * @param {File} file 文件对象
   * @param {number} maxSize 最大大小（字节）
   * @returns {boolean} 是否有效
   */
  static isValidFileSize(file, maxSize) {
    if (!file) return false
    return file.size <= maxSize
  }
  
  /**
   * 清理和标准化输入
   * @param {string} input 输入字符串
   * @returns {string} 清理后的字符串
   */
  static sanitizeInput(input) {
    if (!input || typeof input !== 'string') return ''
    
    return input
      .trim() // 去除首尾空格
      .replace(/\s+/g, ' ') // 多个空格替换为单个空格
      .replace(/[<>]/g, '') // 移除可能的HTML标签字符
  }
  
  /**
   * 验证JSON格式
   * @param {string} jsonString JSON字符串
   * @returns {object} 验证结果
   */
  static validateJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString)
      return {
        isValid: true,
        data: parsed,
        error: null
      }
    } catch (error) {
      return {
        isValid: false,
        data: null,
        error: error.message
      }
    }
  }
  
  /**
   * 批量验证
   * @param {object} data 要验证的数据
   * @param {object} rules 验证规则
   * @returns {object} 验证结果
   */
  static validateBatch(data, rules) {
    const errors = {}
    let isValid = true
    
    Object.entries(rules).forEach(([field, rule]) => {
      const value = data[field]
      const fieldErrors = []
      
      // 必填验证
      if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
        fieldErrors.push(`${rule.label || field}不能为空`)
      }
      
      // 如果有值，进行其他验证
      if (value) {
        // 长度验证
        if (rule.minLength && value.length < rule.minLength) {
          fieldErrors.push(`${rule.label || field}长度不能少于${rule.minLength}个字符`)
        }
        
        if (rule.maxLength && value.length > rule.maxLength) {
          fieldErrors.push(`${rule.label || field}长度不能超过${rule.maxLength}个字符`)
        }
        
        // 正则验证
        if (rule.pattern && !rule.pattern.test(value)) {
          fieldErrors.push(`${rule.label || field}格式不正确`)
        }
        
        // 自定义验证函数
        if (rule.validator && typeof rule.validator === 'function') {
          const customResult = rule.validator(value, data)
          if (customResult !== true) {
            fieldErrors.push(customResult || `${rule.label || field}验证失败`)
          }
        }
      }
      
      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors
        isValid = false
      }
    })
    
    return {
      isValid,
      errors
    }
  }
}

// 导出常用验证函数
export const validateProject = ValidationUtils.validateProject
export const validateTask = ValidationUtils.validateTask
export const validateDateRange = ValidationUtils.validateDateRange
export const isValidEmail = ValidationUtils.isValidEmail
export const sanitizeInput = ValidationUtils.sanitizeInput