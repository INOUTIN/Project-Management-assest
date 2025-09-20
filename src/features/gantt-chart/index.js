// 甘特图模块入口文件
export { default as routes } from './routes.js'

// 导出组件
export { default as GanttChartView } from './views/GanttChartView.vue'

// 模块配置
export const moduleConfig = {
  name: 'gantt-chart',
  displayName: '甘特图',
  description: '项目甘特图展示和管理',
  version: '1.0.0',
  dependencies: ['dashboard', 'project-management'],
  routes: true,
  store: false,
  services: false
}