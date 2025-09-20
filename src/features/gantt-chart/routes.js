// 甘特图模块路由配置
export default [
  {
    path: '/gantt/:id',
    name: 'GanttChart',
    component: () => import('./views/GanttChartView.vue'),
    meta: {
      title: '项目甘特图',
      requiresAuth: false,
      keepAlive: false,
      transition: 'slide-left'
    },
    props: true
  }
]