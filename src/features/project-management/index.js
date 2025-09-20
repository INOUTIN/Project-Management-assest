// 项目管理模块入口文件
export { default as routes } from './routes.js'

// 导出组件
export { default as ProjectManagementView } from './views/ProjectManagementView.vue'

// 模块配置
export const moduleConfig = {
  name: 'project-management',
  displayName: '项目管理',
  description: '项目和任务的创建、编辑、管理功能',
  version: '1.0.0',
  dependencies: ['dashboard'],
  routes: true,
  store: false,
  services: false
}