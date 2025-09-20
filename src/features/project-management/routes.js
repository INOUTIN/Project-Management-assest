// 项目管理模块路由配置
export default [
  {
    path: '/projects',
    name: 'ProjectManagement',
    component: () => import('./views/ProjectManagementView.vue'),
    meta: {
      title: '项目管理',
      requiresAuth: false,
      keepAlive: true,
      transition: 'fade'
    }
  }
]