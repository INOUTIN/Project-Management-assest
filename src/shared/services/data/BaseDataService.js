import { globalEventBus, EVENT_NAMES } from '../EventBus.js'
import { v4 as uuidv4 } from 'uuid'

/**
 * 基础数据服务类 - 提供通用的CRUD操作
 */
export class BaseDataService {
  constructor(storage, entityName) {
    this.storage = storage
    this.entityName = entityName
    this.cache = new Map()
    this.eventBus = globalEventBus
    this.cacheEnabled = true
    this.cacheTTL = 300000 // 5分钟缓存
  }
  
  /**
   * 创建实体
   * @param {object} entity 实体数据
   * @returns {Promise<object>} 创建的实体
   */
  async create(entity) {
    try {
      // 生成ID和时间戳
      const newEntity = {
        id: uuidv4(),
        ...entity,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      // 验证数据
      this.validateEntity(newEntity)
      
      // 保存到存储
      await this.storage.save(newEntity.id, newEntity)
      
      // 更新缓存
      if (this.cacheEnabled) {
        this.cache.set(newEntity.id, {
          data: newEntity,
          timestamp: Date.now()
        })
      }
      
      // 触发事件
      this.eventBus.emit(`${this.entityName}:created`, newEntity)
      this.eventBus.emit(EVENT_NAMES.DATA_SAVED, {
        entityType: this.entityName,
        operation: 'create',
        entity: newEntity
      })
      
      return newEntity
    } catch (error) {
      this.handleError('create', error)
      throw error
    }
  }
  
  /**
   * 更新实体
   * @param {string} id 实体ID
   * @param {object} updates 更新数据
   * @returns {Promise<object>} 更新后的实体
   */
  async update(id, updates) {
    try {
      // 获取现有实体
      const existing = await this.findById(id)
      if (!existing) {
        throw new Error(`${this.entityName} with id ${id} not found`)
      }
      
      // 合并更新
      const updatedEntity = {
        ...existing,
        ...updates,
        id, // 确保ID不被覆盖
        createdAt: existing.createdAt, // 保持创建时间
        updatedAt: new Date().toISOString()
      }
      
      // 验证数据
      this.validateEntity(updatedEntity)
      
      // 保存到存储
      await this.storage.save(id, updatedEntity)
      
      // 更新缓存
      if (this.cacheEnabled) {
        this.cache.set(id, {
          data: updatedEntity,
          timestamp: Date.now()
        })
      }
      
      // 触发事件
      this.eventBus.emit(`${this.entityName}:updated`, {
        previous: existing,
        current: updatedEntity,
        changes: this.getChanges(existing, updatedEntity)
      })
      this.eventBus.emit(EVENT_NAMES.DATA_SAVED, {
        entityType: this.entityName,
        operation: 'update',
        entity: updatedEntity
      })
      
      return updatedEntity
    } catch (error) {
      this.handleError('update', error)
      throw error
    }
  }
  
  /**
   * 删除实体
   * @param {string} id 实体ID
   * @returns {Promise<boolean>} 删除是否成功
   */
  async delete(id) {
    try {
      // 获取要删除的实体
      const entity = await this.findById(id)
      if (!entity) {
        throw new Error(`${this.entityName} with id ${id} not found`)
      }
      
      // 从存储中删除
      await this.storage.delete(id)
      
      // 从缓存中删除
      if (this.cacheEnabled) {
        this.cache.delete(id)
      }
      
      // 触发事件
      this.eventBus.emit(`${this.entityName}:deleted`, entity)
      this.eventBus.emit(EVENT_NAMES.DATA_SAVED, {
        entityType: this.entityName,
        operation: 'delete',
        entity
      })
      
      return true
    } catch (error) {
      this.handleError('delete', error)
      throw error
    }
  }
  
  /**
   * 根据ID查找实体
   * @param {string} id 实体ID
   * @returns {Promise<object|null>} 找到的实体或null
   */
  async findById(id) {
    try {
      // 检查缓存
      if (this.cacheEnabled && this.cache.has(id)) {
        const cached = this.cache.get(id)
        if (Date.now() - cached.timestamp < this.cacheTTL) {
          return cached.data
        } else {
          this.cache.delete(id)
        }
      }
      
      // 从存储中获取
      const entity = await this.storage.get(id)
      
      // 更新缓存
      if (entity && this.cacheEnabled) {
        this.cache.set(id, {
          data: entity,
          timestamp: Date.now()
        })
      }
      
      return entity
    } catch (error) {
      this.handleError('findById', error)
      throw error
    }
  }
  
  /**
   * 查找所有实体
   * @param {object} filters 过滤条件
   * @param {object} options 查询选项
   * @returns {Promise<Array>} 实体列表
   */
  async findAll(filters = {}, options = {}) {
    try {
      // 从存储中获取所有数据
      const allEntities = await this.storage.getAll()
      
      // 应用过滤器
      let filteredEntities = this.applyFilters(allEntities, filters)
      
      // 应用排序
      if (options.sortBy) {
        filteredEntities = this.applySorting(filteredEntities, options.sortBy, options.sortOrder)
      }
      
      // 应用分页
      if (options.page && options.pageSize) {
        const startIndex = (options.page - 1) * options.pageSize
        filteredEntities = filteredEntities.slice(startIndex, startIndex + options.pageSize)
      }
      
      // 触发事件
      this.eventBus.emit(EVENT_NAMES.DATA_LOADED, {
        entityType: this.entityName,
        count: filteredEntities.length,
        filters,
        options
      })
      
      return filteredEntities
    } catch (error) {
      this.handleError('findAll', error)
      throw error
    }
  }
  
  /**
   * 统计实体数量
   * @param {object} filters 过滤条件
   * @returns {Promise<number>} 实体数量
   */
  async count(filters = {}) {
    try {
      const allEntities = await this.storage.getAll()
      const filteredEntities = this.applyFilters(allEntities, filters)
      return filteredEntities.length
    } catch (error) {
      this.handleError('count', error)
      throw error
    }
  }
  
  /**
   * 批量操作
   * @param {Array} operations 操作列表
   * @returns {Promise<Array>} 操作结果
   */
  async batch(operations) {
    const results = []
    
    try {
      for (const operation of operations) {
        const { type, data } = operation
        
        switch (type) {
          case 'create':
            results.push(await this.create(data))
            break
          case 'update':
            results.push(await this.update(data.id, data))
            break
          case 'delete':
            results.push(await this.delete(data.id))
            break
          default:
            throw new Error(`Unknown operation type: ${type}`)
        }
      }
      
      return results
    } catch (error) {
      this.handleError('batch', error)
      throw error
    }
  }
  
  /**
   * 清空缓存
   */
  clearCache() {
    this.cache.clear()
  }
  
  /**
   * 验证实体数据
   * @param {object} entity 实体数据
   */
  validateEntity(entity) {
    if (!entity.id) {
      throw new Error('Entity must have an id')
    }
    
    // 子类可以重写此方法添加特定验证
  }
  
  /**
   * 应用过滤器
   * @param {Array} entities 实体列表
   * @param {object} filters 过滤条件
   * @returns {Array} 过滤后的实体列表
   */
  applyFilters(entities, filters) {
    return entities.filter(entity => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === undefined || value === null) return true
        
        const entityValue = this.getNestedValue(entity, key)
        
        if (Array.isArray(value)) {
          return value.includes(entityValue)
        }
        
        if (typeof value === 'object' && value.operator) {
          return this.applyOperatorFilter(entityValue, value)
        }
        
        return entityValue === value
      })
    })
  }
  
  /**
   * 应用排序
   * @param {Array} entities 实体列表
   * @param {string} sortBy 排序字段
   * @param {string} sortOrder 排序顺序
   * @returns {Array} 排序后的实体列表
   */
  applySorting(entities, sortBy, sortOrder = 'asc') {
    return entities.sort((a, b) => {
      const aValue = this.getNestedValue(a, sortBy)
      const bValue = this.getNestedValue(b, sortBy)
      
      let comparison = 0
      if (aValue > bValue) comparison = 1
      if (aValue < bValue) comparison = -1
      
      return sortOrder === 'desc' ? -comparison : comparison
    })
  }
  
  /**
   * 获取嵌套属性值
   * @param {object} obj 对象
   * @param {string} path 属性路径
   * @returns {*} 属性值
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }
  
  /**
   * 应用操作符过滤
   * @param {*} value 实体值
   * @param {object} filter 过滤条件
   * @returns {boolean} 是否匹配
   */
  applyOperatorFilter(value, filter) {
    const { operator, operand } = filter
    
    switch (operator) {
      case 'gt': return value > operand
      case 'gte': return value >= operand
      case 'lt': return value < operand
      case 'lte': return value <= operand
      case 'ne': return value !== operand
      case 'contains': return String(value).includes(operand)
      case 'startsWith': return String(value).startsWith(operand)
      case 'endsWith': return String(value).endsWith(operand)
      default: return value === operand
    }
  }
  
  /**
   * 获取变更内容
   * @param {object} previous 之前的数据
   * @param {object} current 当前的数据
   * @returns {object} 变更内容
   */
  getChanges(previous, current) {
    const changes = {}
    
    Object.keys(current).forEach(key => {
      if (previous[key] !== current[key]) {
        changes[key] = {
          from: previous[key],
          to: current[key]
        }
      }
    })
    
    return changes
  }
  
  /**
   * 错误处理
   * @param {string} operation 操作名称
   * @param {Error} error 错误对象
   */
  handleError(operation, error) {
    console.error(`Error in ${this.entityName} ${operation}:`, error)
    
    this.eventBus.emit(EVENT_NAMES.DATA_ERROR, {
      entityType: this.entityName,
      operation,
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}