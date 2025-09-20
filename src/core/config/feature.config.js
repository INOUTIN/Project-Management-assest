export const featureConfig = {
  // 仪表盘功能
  dashboard: {
    enabled: true,
    modules: {
      projectStats: true,        // 项目统计
      taskStats: true,           // 任务统计
      overdueReminder: true,     // 超期提醒
      projectCards: true,        // 项目卡片
      quickActions: true         // 快速操作
    }
  },
  
  // 项目管理功能
  projectManagement: {
    enabled: true,
    modules: {
      projectList: true,         // 项目列表
      projectEditor: true,       // 项目编辑
      taskManagement: true,      // 任务管理
      projectTemplates: false,   // 项目模板(未来功能)
      projectArchive: false      // 项目归档(未来功能)
    }
  },
  
  // 甘特图功能
  ganttChart: {
    enabled: true,
    modules: {
      timelineView: true,        // 时间轴视图
      taskDependencies: true,    // 任务依赖
      progressTracking: true,    // 进度跟踪
      resourceManagement: false, // 资源管理(未来功能)
      criticalPath: false        // 关键路径(未来功能)
    }
  },
  
  // 报表功能(未来扩展)
  reporting: {
    enabled: false,
    modules: {
      projectReports: false,     // 项目报表
      taskReports: false,        // 任务报表
      exportPDF: false,          // PDF导出
      exportExcel: false,        // Excel导出
      customReports: false       // 自定义报表
    }
  },
  
  // 用户管理(未来扩展)
  userManagement: {
    enabled: false,
    modules: {
      userProfiles: false,       // 用户档案
      roleManagement: false,     // 角色管理
      permissions: false,        // 权限管理
      teamManagement: false      // 团队管理
    }
  },
  
  // 系统设置(未来扩展)
  systemSettings: {
    enabled: false,
    modules: {
      generalSettings: false,    // 通用设置
      notificationSettings: false, // 通知设置
      backupRestore: false,      // 备份恢复
      systemLogs: false          // 系统日志
    }
  },
  
  // 集成功能(未来扩展)
  integrations: {
    enabled: false,
    modules: {
      emailIntegration: false,   // 邮件集成
      calendarSync: false,       // 日历同步
      thirdPartyApis: false,     // 第三方API
      webhooks: false            // Webhook
    }
  }
}

// 功能检查工具
export class FeatureChecker {
  static isEnabled(featurePath) {
    const paths = featurePath.split('.')
    let current = featureConfig
    
    for (const path of paths) {
      if (!current[path]) {
        return false
      }
      current = current[path]
    }
    
    return current === true || (typeof current === 'object' && current.enabled === true)
  }
  
  static getEnabledModules(feature) {
    const featureObj = featureConfig[feature]
    if (!featureObj || !featureObj.enabled) {
      return []
    }
    
    const enabledModules = []
    if (featureObj.modules) {
      Object.entries(featureObj.modules).forEach(([module, enabled]) => {
        if (enabled) {
          enabledModules.push(module)
        }
      })
    }
    
    return enabledModules
  }
}