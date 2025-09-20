/**
 * 仪表盘路由配置
 */
export default [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('./views/DashboardView.vue'),
    meta: {
      title: '仪表盘',
      icon: 'dashboard',
      requiresAuth: false,
      keepAlive: true,
      breadcrumb: [
        { text: '首页', to: '/dashboard' }
      ]
    }
  }
]