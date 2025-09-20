// 插件管理器
class PluginManager {
  constructor() {
    this.plugins = new Map()
    this.installedPlugins = new Set()
    this.hooks = new Map()
  }

  /**
   * 注册插件
   */
  register(plugin) {
    if (!plugin.name) {
      throw new Error('Plugin must have a name')
    }

    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin ${plugin.name} is already registered`)
      return
    }

    this.plugins.set(plugin.name, plugin)
    console.log(`Plugin ${plugin.name} registered`)
  }

  /**
   * 安装插件
   */
  install(pluginName, app, options = {}) {
    const plugin = this.plugins.get(pluginName)
    
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found`)
    }

    if (this.installedPlugins.has(pluginName)) {
      console.warn(`Plugin ${pluginName} is already installed`)
      return
    }

    // 检查依赖
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.installedPlugins.has(dep)) {
          throw new Error(`Plugin ${pluginName} requires ${dep} to be installed first`)
        }
      }
    }

    // 安装插件
    if (typeof plugin.install === 'function') {
      plugin.install(app, options)
    }

    // 注册钩子
    if (plugin.hooks) {
      for (const [hookName, handler] of Object.entries(plugin.hooks)) {
        this.addHook(hookName, handler)
      }
    }

    this.installedPlugins.add(pluginName)
    console.log(`Plugin ${pluginName} installed`)
  }

  /**
   * 卸载插件
   */
  uninstall(pluginName, app) {
    const plugin = this.plugins.get(pluginName)
    
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found`)
    }

    if (!this.installedPlugins.has(pluginName)) {
      console.warn(`Plugin ${pluginName} is not installed`)
      return
    }

    // 卸载插件
    if (typeof plugin.uninstall === 'function') {
      plugin.uninstall(app)
    }

    // 移除钩子
    if (plugin.hooks) {
      for (const hookName of Object.keys(plugin.hooks)) {
        this.removeHook(hookName, plugin.hooks[hookName])
      }
    }

    this.installedPlugins.delete(pluginName)
    console.log(`Plugin ${pluginName} uninstalled`)
  }

  /**
   * 添加钩子
   */
  addHook(hookName, handler) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, [])
    }
    this.hooks.get(hookName).push(handler)
  }

  /**
   * 移除钩子
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
   * 触发钩子
   */
  triggerHook(hookName, ...args) {
    if (!this.hooks.has(hookName)) return
    
    const handlers = this.hooks.get(hookName)
    for (const handler of handlers) {
      try {
        handler(...args)
      } catch (error) {
        console.error(`Error in hook ${hookName}:`, error)
      }
    }
  }

  /**
   * 获取已安装的插件列表
   */
  getInstalledPlugins() {
    return Array.from(this.installedPlugins)
  }

  /**
   * 获取所有注册的插件
   */
  getAllPlugins() {
    return Array.from(this.plugins.keys())
  }

  /**
   * 检查插件是否已安装
   */
  isInstalled(pluginName) {
    return this.installedPlugins.has(pluginName)
  }

  /**
   * Vue 插件安装方法
   */
  install(app) {
    // 提供插件管理器实例
    app.provide('pluginManager', this)
    
    // 全局属性
    app.config.globalProperties.$pluginManager = this
    
    // 触发应用安装钩子
    this.triggerHook('app:install', app)
  }
}

// 创建插件管理器实例
export const pluginManager = new PluginManager()

// 默认导出
export default {
  install(app) {
    pluginManager.install(app)
  }
}