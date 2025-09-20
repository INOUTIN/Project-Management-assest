import { createRouter, createWebHistory } from 'vue-router'
import { FeatureChecker } from '@core/config/feature.config'
import { setupRouterGuards } from './guards'

// 基础路由
const baseRoutes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/simple-test',
    name: 'SimpleTest',
    component: () => import('@/SimpleTest.vue'),
    meta: {
      title: '简单测试页面'
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@features/dashboard/views/DashboardView.vue'),
    meta: {
      title: '仪表盘',
      requiresFeature: 'dashboard'
    }
  },
  {
    path: '/project-management',
    name: 'ProjectManagement',
    component: () => import('@features/project-management/views/ProjectManagementView.vue'),
    meta: {
      title: '项目管理',
      requiresFeature: 'projectManagement'
    }
  },
  {
    path: '/gantt/:id',
    name: 'GanttChart',
    component: () => import('@features/gantt-chart/views/GanttChartView.vue'),
    meta: {
      title: '项目甘特图',
      requiresFeature: 'ganttChart'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@shared/components/layout/NotFoundView.vue')
  }
]

// 动态路由注册器
class RouteRegistry {
  constructor() {
    this.routes = [...baseRoutes]
    this.dynamicRoutes = []
  }

  // 注册功能模块路由
  registerFeatureRoutes(featureName, routes) {
    if (!FeatureChecker.isEnabled(featureName)) {
      console.warn(`Feature ${featureName} is disabled, skipping route registration`)
      return
    }

    const processedRoutes = routes.map(route => ({
      ...route,
      meta: {
        ...route.meta,
        feature: featureName
      }
    }))

    this.dynamicRoutes.push(...processedRoutes)
    this.routes.push(...processedRoutes)
  }

  // 获取所有路由
  getAllRoutes() {
    return this.routes.filter(route => {
      if (route.meta?.requiresFeature) {
        return FeatureChecker.isEnabled(route.meta.requiresFeature)
      }
      return true
    })
  }
}

// 创建路由注册器实例
export const routeRegistry = new RouteRegistry()

// 设置路由
export function setupRouter(app, store) {
  const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: routeRegistry.getAllRoutes(),
    scrollBehavior(to, from, savedPosition) {
      if (savedPosition) {
        return savedPosition
      } else {
        return { top: 0 }
      }
    }
  })

  // 设置路由守卫
  setupRouterGuards(router, store)

  // 注册到应用
  app.use(router)

  // 提供路由注册器
  app.provide('$routeRegistry', routeRegistry)

  return router
}