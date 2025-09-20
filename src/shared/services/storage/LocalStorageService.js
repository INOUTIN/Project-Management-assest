/**
 * 本地存储服务 - 基于 localStorage 的数据持久化
 */
export class LocalStorageService {
  constructor(prefix = 'pmt_') {
    this.prefix = prefix
    this.isAvailable = this.checkAvailability()
  }
  
  /**
   * 检查 localStorage 是否可用
   * @returns {boolean} 是否可用
   */
  checkAvailability() {
    try {
      const testKey = '__test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch (error) {
      console.warn('localStorage is not available:', error)
      return false
    }
  }
  
  /**
   * 生成完整的存储键
   * @param {string} key 原始键
   * @returns {string} 完整键
   */
  getFullKey(key) {
    return `${this.prefix}${key}`
  }
  
  /**
   * 保存数据
   * @param {string} key 键
   * @param {*} value 值
   * @returns {Promise<boolean>} 是否成功
   */
  async save(key, value) {
    if (!this.isAvailable) {
      throw new Error('localStorage is not available')
    }
    
    try {
      const serializedValue = JSON.stringify({
        data: value,
        timestamp: Date.now(),
        version: '1.0'
      })
      
      localStorage.setItem(this.getFullKey(key), serializedValue)
      return true
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        // 存储空间不足，尝试清理
        await this.cleanup()
        // 重试一次
        try {
          const serializedValue = JSON.stringify({
            data: value,
            timestamp: Date.now(),
            version: '1.0'
          })
          localStorage.setItem(this.getFullKey(key), serializedValue)
          return true
        } catch (retryError) {
          throw new Error('Storage quota exceeded and cleanup failed')
        }
      }
      throw error
    }
  }
  
  /**
   * 获取数据
   * @param {string} key 键
   * @returns {Promise<*>} 数据
   */
  async get(key) {
    if (!this.isAvailable) {
      return null
    }
    
    try {
      const serializedValue = localStorage.getItem(this.getFullKey(key))
      if (!serializedValue) {
        return null
      }
      
      const parsed = JSON.parse(serializedValue)
      
      // 检查数据版本兼容性
      if (parsed.version && parsed.version !== '1.0') {
        console.warn(`Data version mismatch for key ${key}`)
        return null
      }
      
      return parsed.data
    } catch (error) {
      console.error(`Error getting data for key ${key}:`, error)
      // 数据损坏，删除该项
      localStorage.removeItem(this.getFullKey(key))
      return null
    }
  }
  
  /**
   * 删除数据
   * @param {string} key 键
   * @returns {Promise<boolean>} 是否成功
   */
  async delete(key) {
    if (!this.isAvailable) {
      return false
    }
    
    try {
      localStorage.removeItem(this.getFullKey(key))
      return true
    } catch (error) {
      console.error(`Error deleting data for key ${key}:`, error)
      return false
    }
  }
  
  /**
   * 获取所有数据
   * @returns {Promise<Array>} 所有数据
   */
  async getAll() {
    if (!this.isAvailable) {
      return []
    }
    
    const results = []
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.prefix)) {
          const originalKey = key.substring(this.prefix.length)
          const data = await this.get(originalKey)
          if (data) {
            results.push(data)
          }
        }
      }
    } catch (error) {
      console.error('Error getting all data:', error)
    }
    
    return results
  }
  
  /**
   * 获取所有键
   * @returns {Promise<Array>} 所有键
   */
  async getAllKeys() {
    if (!this.isAvailable) {
      return []
    }
    
    const keys = []
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.prefix)) {
          keys.push(key.substring(this.prefix.length))
        }
      }
    } catch (error) {
      console.error('Error getting all keys:', error)
    }
    
    return keys
  }
  
  /**
   * 清空所有数据
   * @returns {Promise<boolean>} 是否成功
   */
  async clear() {
    if (!this.isAvailable) {
      return false
    }
    
    try {
      const keysToRemove = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key))
      return true
    } catch (error) {
      console.error('Error clearing data:', error)
      return false
    }
  }
  
  /**
   * 获取存储使用情况
   * @returns {Promise<object>} 使用情况统计
   */
  async getUsage() {
    if (!this.isAvailable) {
      return { used: 0, total: 0, available: 0 }
    }
    
    try {
      let used = 0
      let itemCount = 0
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.prefix)) {
          const value = localStorage.getItem(key)
          used += key.length + (value ? value.length : 0)
          itemCount++
        }
      }
      
      // 估算总容量（通常为 5-10MB）
      const estimatedTotal = 5 * 1024 * 1024 // 5MB
      
      return {
        used,
        total: estimatedTotal,
        available: estimatedTotal - used,
        itemCount,
        usagePercentage: (used / estimatedTotal) * 100
      }
    } catch (error) {
      console.error('Error getting storage usage:', error)
      return { used: 0, total: 0, available: 0, itemCount: 0, usagePercentage: 0 }
    }
  }
  
  /**
   * 清理过期或无效数据
   * @param {number} maxAge 最大保存时间（毫秒）
   * @returns {Promise<number>} 清理的项目数
   */
  async cleanup(maxAge = 30 * 24 * 60 * 60 * 1000) { // 默认30天
    if (!this.isAvailable) {
      return 0
    }
    
    let cleanedCount = 0
    const now = Date.now()
    
    try {
      const keysToRemove = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.prefix)) {
          try {
            const value = localStorage.getItem(key)
            if (value) {
              const parsed = JSON.parse(value)
              
              // 检查是否过期
              if (parsed.timestamp && (now - parsed.timestamp) > maxAge) {
                keysToRemove.push(key)
              }
              
              // 检查数据完整性
              if (!parsed.data || !parsed.timestamp) {
                keysToRemove.push(key)
              }
            }
          } catch (parseError) {
            // 数据损坏，标记删除
            keysToRemove.push(key)
          }
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        cleanedCount++
      })
      
      console.log(`Cleaned up ${cleanedCount} items from localStorage`)
    } catch (error) {
      console.error('Error during cleanup:', error)
    }
    
    return cleanedCount
  }
  
  /**
   * 导出数据
   * @returns {Promise<object>} 导出的数据
   */
  async export() {
    const data = {}
    const keys = await this.getAllKeys()
    
    for (const key of keys) {
      data[key] = await this.get(key)
    }
    
    return {
      version: '1.0',
      timestamp: Date.now(),
      data
    }
  }
  
  /**
   * 导入数据
   * @param {object} exportedData 导入的数据
   * @returns {Promise<boolean>} 是否成功
   */
  async import(exportedData) {
    if (!exportedData.data || !exportedData.version) {
      throw new Error('Invalid export data format')
    }
    
    try {
      for (const [key, value] of Object.entries(exportedData.data)) {
        await this.save(key, value)
      }
      return true
    } catch (error) {
      console.error('Error importing data:', error)
      return false
    }
  }
}