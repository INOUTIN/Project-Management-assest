import { globalEventBus, EVENT_NAMES } from '@shared/services/EventBus.js'

/**
 * 插件管理器 - 负责插件的注册、加载和管理
 */
export class PluginManager {
  constructor() {
    this.plugins = new Map()
    this.hooks = new Map()
    this.eventBus = globalEventBus
    this.initialized = false
  }
  
  /**
   * 初始化插件管理器
   */
  async initialize() {
    if (this.initialized) return
    
    try {
      // 注册系统钩子
      this.registerSystemHooks()
      
      // 触发初始化事件
      this.eventBus.emit(EVENT_NAMES.APP_INITIALIZED, {
        pluginManager: this,
        timestamp: new Date()
      })
      
      this.initialized = true
      console.log('Plugin manager initialized successfully')
    } catch (error) {
      console.error('Failed to initialize plugin manager:', error)
      throw error
    }
  }
  
  /**
   * 注册插件
   * @param {object} plugin 插件对象
   */
  async register(plugin) {
    if (!plugin || !plugin.name) {
      throw new Error('Plugin must have a name')
    }
    
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin ${plugin.name} is already registered`)
      return
    }
    
    try {
      // 验证插件
      this.validatePlugin(plugin)
      
      // 检查依赖
      if (plugin.dependencies) {
        await this.checkDependencies(plugin.dependencies)
      }
      
      // 注册插件
      this.plugins.set(plugin.name, {
        ...plugin,
        status: 'registered',
        registeredAt: new Date()
      })
      
      // 注册插件钩子
      if (plugin.hooks) {
        this.registerPluginHooks(plugin.name, plugin.hooks)
      }
      
      console.log(`Plugin ${plugin.name} registered successfully`)
      
      // 触发插件注册事件
      this.eventBus.emit('plugin:registered', {
        plugin: plugin.name,
        version: plugin.version
      })
      
    } catch (error) {
      console.error(`Failed to register plugin ${plugin.name}:`, error)
      throw error
    }
  }
  
  /**
   * 安装插件
   * @param {string} pluginName 插件名称
   * @param {object} app Vue应用实例
   * @param {object} options 安装选项
   */
  async install(pluginName, app, options = {}) {
    const plugin = this.plugins.get(pluginName)
    
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found`)
    }
    
    if (plugin.status === 'installed') {
      console.warn(`Plugin ${pluginName} is already installed`)
      return
    }
    
    try {
      // 执行安装前钩子
      await this.executeHook('plugin:before_install', {
        plugin: pluginName,
        app,
        options
      })
      
      // 执行插件安装
      if (plugin.install && typeof plugin.install === 'function') {
        await plugin.install(app, options)
      }
      
      // 更新插件状态
      plugin.status = 'installed'
      plugin.installedAt = new Date()
      
      console.log(`Plugin ${pluginName} installed successfully`)
      
      // 执行安装后钩子
      await this.executeHook('plugin:after_install', {
        plugin: pluginName,
        app,
        options
      })
      
      // 触发插件安装事件
      this.eventBus.emit('plugin:installed', {
        plugin: pluginName,
        version: plugin.version
      })
      
    } catch (error) {
      console.error(`Failed to install plugin ${pluginName}:`, error)
      plugin.status = 'error'
      plugin.error = error.message
      throw error
    }
  }
  
  /**
   * 执行钩子
   * @param {string} hookName 钩子名称
   * @param {*} context 上下文数据
   */
  async executeHook(hookName, context) {
    if (!this.hooks.has(hookName)) return
    
    const handlers = this.hooks.get(hookName)
    
    for (const handler of handlers) {
      try {
        await handler(context)
      } catch (error) {
        console.error(`Error executing hook ${hookName}:`, error)
      }
    }
  }
  
  /**
   * 添加钩子
   * @param {string} hookName 钩子名称
   * @param {function} handler 处理函数
   */
  addHook(hookName, handler) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, [])
    }
    this.hooks.get(hookName).push(handler)
  }
  
  /**
   * 移除钩子
   * @param {string} hookName 钩子名称
   * @param {function} handler 处理函数
   */
  removeHook(hookName, handler) {
    if (!this.hooks.has(hookName)) return
    
    const handlers = this.hooks.get(hookName)
    const index = handlers.indexOf(handler)
    if (index > -1) {
      handlers.splice(index, 1)
    }
  }
  
  /**
   * 验证插件
   * @param {object} plugin 插件对象
   */
  validatePlugin(plugin) {
    if (!plugin.name) {
      throw new Error('Plugin must have a name')
    }
    
    if (!plugin.version) {
      throw new Error('Plugin must have a version')
    }
    
    if (plugin.install && typeof plugin.install !== 'function') {
      throw new Error('Plugin install must be a function')
    }
  }
  
  /**
   * 检查依赖
   * @param {Array} dependencies 依赖列表
   */
  async checkDependencies(dependencies) {
    for (const dep of dependencies) {
      if (!this.plugins.has(dep)) {
        throw new Error(`Missing dependency: ${dep}`)
      }
    }
  }
  
  /**
   * 注册插件钩子
   * @param {string} pluginName 插件名称
   * @param {object} hooks 钩子对象
   */
  registerPluginHooks(pluginName, hooks) {
    Object.entries(hooks).forEach(([hookName, handler]) => {
      this.addHook(hookName, handler)
    })
  }
  
  /**
   * 移除插件钩子
   * @param {string} pluginName 插件名称
   */
  removePluginHooks(pluginName) {
    const plugin = this.plugins.get(pluginName)
    if (plugin && plugin.hooks) {
      Object.entries(plugin.hooks).forEach(([hookName, handler]) => {
        this.removeHook(hookName, handler)
      })
    }
  }
  
  /**
   * 注册系统钩子
   */
  registerSystemHooks() {
    // 菜单钩子
    this.addHook('menu:add', (menuItem) => {
      console.log('Adding menu item:', menuItem)
    })
    
    // 路由钩子
    this.addHook('route:add', (route) => {
      console.log('Adding route:', route)
    })
    
    // 组件钩子
    this.addHook('component:register', (component) => {
      console.log('Registering component:', component)
    })
  }
  
  /**
   * 获取插件信息
   * @param {string} pluginName 插件名称
   * @returns {object} 插件信息
   */
  getPlugin(pluginName) {
    return this.plugins.get(pluginName)
  }
  
  /**
   * 获取所有插件
   * @returns {Array} 插件列表
   */
  getAllPlugins() {
    return Array.from(this.plugins.values())
  }
  
  /**
   * 获取已安装的插件
   * @returns {Array} 已安装插件列表
   */
  getInstalledPlugins() {
    return this.getAllPlugins().filter(plugin => plugin.status === 'installed')
  }
}