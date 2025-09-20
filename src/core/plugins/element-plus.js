import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

/**
 * 设置 Element Plus
 * @param {object} app Vue应用实例
 */
export function setupElementPlus(app) {
  // 注册 Element Plus
  app.use(ElementPlus, {
    locale: zhCn,
    size: 'default',
    zIndex: 3000
  })
  
  // 注册所有图标
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }
  
  console.log('Element Plus setup completed')
}