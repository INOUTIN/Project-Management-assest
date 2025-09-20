// 路由守卫配置
export function setupRouterGuards(router, store) {
  // 全局前置守卫
  router.beforeEach(async (to, from, next) => {
    // 设置页面标题
    if (to.meta?.title) {
      document.title = `${to.meta.title} - 项目管理工具`
    } else {
      document.title = '项目管理工具'
    }

    // 功能检查
    if (to.meta?.requiresFeature) {
      const { FeatureChecker } = await import('@core/config/feature.config')
      if (!FeatureChecker.isEnabled(to.meta.requiresFeature)) {
        console.warn(`Feature ${to.meta.requiresFeature} is disabled`)
        next('/dashboard')
        return
      }
    }

    // 权限检查 (如果需要)
    if (to.meta?.requiresAuth) {
      // 这里可以添加身份验证逻辑
      // const isAuthenticated = await checkAuth()
      // if (!isAuthenticated) {
      //   next('/login')
      //   return
      // }
    }

    next()
  })

  // 全局后置钩子
  router.afterEach((to, from) => {
    // 页面访问统计
    if (import.meta.env.DEV) {
      console.log(`Route changed: ${from.path} -> ${to.path}`)
    }

    // 滚动到顶部 (如果需要)
    if (to.meta?.scrollToTop !== false) {
      window.scrollTo(0, 0)
    }
  })

  // 路由错误处理
  router.onError((error) => {
    console.error('Router error:', error)
    
    // 在生产环境中可以发送错误报告
    if (import.meta.env.PROD) {
      // errorReportingService.report(error)
    }
  })
}