/**
 * 事件总线 - 用于模块间通信
 */
export class EventBus {
  constructor() {
    this.events = new Map()
    this.onceEvents = new Map()
    this.maxListeners = 100
  }
  
  /**
   * 注册事件监听器
   * @param {string} event 事件名称
   * @param {function} callback 回调函数
   * @param {object} options 选项
   */
  on(event, callback, options = {}) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function')
    }
    
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    
    const listeners = this.events.get(event)
    
    // 检查监听器数量限制
    if (listeners.length >= this.maxListeners) {
      console.warn(`Event "${event}" has reached maximum listeners (${this.maxListeners})`)
    }
    
    const listener = {
      callback,
      context: options.context || null,
      priority: options.priority || 0
    }
    
    listeners.push(listener)
    
    // 按优先级排序
    listeners.sort((a, b) => b.priority - a.priority)
    
    return this
  }
  
  /**
   * 注册一次性事件监听器
   * @param {string} event 事件名称
   * @param {function} callback 回调函数
   * @param {object} options 选项
   */
  once(event, callback, options = {}) {
    if (!this.onceEvents.has(event)) {
      this.onceEvents.set(event, [])
    }
    
    this.onceEvents.get(event).push({
      callback,
      context: options.context || null,
      priority: options.priority || 0
    })
    
    return this
  }
  
  /**
   * 触发事件
   * @param {string} event 事件名称
   * @param {*} data 事件数据
   */
  emit(event, data) {
    const timestamp = Date.now()
    const eventData = {
      type: event,
      data,
      timestamp,
      preventDefault: false,
      stopPropagation: false
    }
    
    // 执行一次性监听器
    if (this.onceEvents.has(event)) {
      const onceListeners = this.onceEvents.get(event)
      onceListeners.forEach(listener => {
        try {
          if (listener.context) {
            listener.callback.call(listener.context, eventData)
          } else {
            listener.callback(eventData)
          }
        } catch (error) {
          console.error(`Error in once event listener for "${event}":`, error)
        }
      })
      this.onceEvents.delete(event)
    }
    
    // 执行常规监听器
    if (this.events.has(event)) {
      const listeners = this.events.get(event)
      for (const listener of listeners) {
        if (eventData.stopPropagation) break
        
        try {
          if (listener.context) {
            listener.callback.call(listener.context, eventData)
          } else {
            listener.callback(eventData)
          }
        } catch (error) {
          console.error(`Error in event listener for "${event}":`, error)
        }
      }
    }
    
    return eventData
  }
  
  /**
   * 移除事件监听器
   * @param {string} event 事件名称
   * @param {function} callback 回调函数
   */
  off(event, callback) {
    if (this.events.has(event)) {
      const listeners = this.events.get(event)
      const index = listeners.findIndex(listener => listener.callback === callback)
      if (index > -1) {
        listeners.splice(index, 1)
        if (listeners.length === 0) {
          this.events.delete(event)
        }
      }
    }
    
    if (this.onceEvents.has(event)) {
      const onceListeners = this.onceEvents.get(event)
      const index = onceListeners.findIndex(listener => listener.callback === callback)
      if (index > -1) {
        onceListeners.splice(index, 1)
        if (onceListeners.length === 0) {
          this.onceEvents.delete(event)
        }
      }
    }
    
    return this
  }
  
  /**
   * 移除所有事件监听器
   * @param {string} event 事件名称，如果不提供则清除所有
   */
  clear(event) {
    if (event) {
      this.events.delete(event)
      this.onceEvents.delete(event)
    } else {
      this.events.clear()
      this.onceEvents.clear()
    }
    
    return this
  }
  
  /**
   * 获取事件监听器数量
   * @param {string} event 事件名称
   */
  listenerCount(event) {
    const regularCount = this.events.has(event) ? this.events.get(event).length : 0
    const onceCount = this.onceEvents.has(event) ? this.onceEvents.get(event).length : 0
    return regularCount + onceCount
  }
  
  /**
   * 获取所有事件名称
   */
  eventNames() {
    const regularEvents = Array.from(this.events.keys())
    const onceEvents = Array.from(this.onceEvents.keys())
    return [...new Set([...regularEvents, ...onceEvents])]
  }
}

// 创建全局事件总线实例
export const globalEventBus = new EventBus()

// 事件名称常量
export const EVENT_NAMES = {
  // 项目相关事件
  PROJECT_CREATED: 'project:created',
  PROJECT_UPDATED: 'project:updated',
  PROJECT_DELETED: 'project:deleted',
  PROJECT_STATUS_CHANGED: 'project:status_changed',
  
  // 任务相关事件
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_DELETED: 'task:deleted',
  TASK_STATUS_CHANGED: 'task:status_changed',
  TASK_OVERDUE: 'task:overdue',
  
  // 数据相关事件
  DATA_LOADED: 'data:loaded',
  DATA_SAVED: 'data:saved',
  DATA_ERROR: 'data:error',
  
  // UI相关事件
  THEME_CHANGED: 'ui:theme_changed',
  SIDEBAR_TOGGLED: 'ui:sidebar_toggled',
  NOTIFICATION_ADDED: 'ui:notification_added',
  
  // 系统相关事件
  APP_INITIALIZED: 'app:initialized',
  NETWORK_STATUS_CHANGED: 'app:network_status_changed',
  ERROR_OCCURRED: 'app:error_occurred'
}