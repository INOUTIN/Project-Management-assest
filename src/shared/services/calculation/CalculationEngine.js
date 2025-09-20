import dayjs from 'dayjs'

/**
 * 计算引擎 - 统一的数据计算服务
 */
export class CalculationEngine {
  constructor() {
    this.calculators = new Map()
    this.registerDefaultCalculators()
  }
  
  /**
   * 注册计算器
   * @param {string} name 计算器名称
   * @param {object} calculator 计算器实例
   */
  register(name, calculator) {
    this.calculators.set(name, calculator)
  }
  
  /**
   * 执行计算
   * @param {string} type 计算类型
   * @param {*} data 计算数据
   * @param {object} options 计算选项
   * @returns {*} 计算结果
   */
  calculate(type, data, options = {}) {
    const calculator = this.calculators.get(type)
    if (!calculator) {
      throw new Error(`Calculator ${type} not found`)
    }
    
    try {
      return calculator.calculate(data, options)
    } catch (error) {
      console.error(`Calculation error for type ${type}:`, error)
      throw error
    }
  }
  
  /**
   * 注册默认计算器
   */
  registerDefaultCalculators() {
    this.register('projectStats', new ProjectStatsCalculator())
    this.register('taskStats', new TaskStatsCalculator())
    this.register('overdueReminder', new OverdueReminderCalculator())
    this.register('ganttData', new GanttDataCalculator())
    this.register('progress', new ProgressCalculator())
  }
}

/**
 * 项目统计计算器
 */
export class ProjectStatsCalculator {
  calculate(projects, options = {}) {
    if (!Array.isArray(projects)) {
      throw new Error('Projects must be an array')
    }
    
    const now = dayjs()
    
    // 基础统计
    const totalProjects = projects.length
    const completedProjects = projects.filter(p => p.status === 'completed').length
    const inProgressProjects = projects.filter(p => p.status === 'in_progress').length
    const notStartedProjects = projects.filter(p => p.status === 'not_started').length
    
    // 超期项目计算
    const overdueProjects = projects.filter(project => {
      if (project.status === 'completed') return false
      return dayjs(project.endDate).isBefore(now, 'day')
    }).length
    
    // 完成率和超期率
    const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0
    const overdueRate = totalProjects > 0 ? (overdueProjects / totalProjects) * 100 : 0
    
    // 按状态分组
    const statusDistribution = {
      not_started: notStartedProjects,
      in_progress: inProgressProjects,
      completed: completedProjects,
      overdue: overdueProjects
    }
    
    // 时间范围统计
    const timeRangeStats = this.calculateTimeRangeStats(projects, now)
    
    return {
      total: totalProjects,
      completed: completedProjects,
      inProgress: inProgressProjects,
      notStarted: notStartedProjects,
      overdue: overdueProjects,
      completionRate: Math.round(completionRate * 100) / 100,
      overdueRate: Math.round(overdueRate * 100) / 100,
      statusDistribution,
      timeRangeStats
    }
  }
  
  calculateTimeRangeStats(projects, now) {
    const thisWeek = projects.filter(p => 
      dayjs(p.createdAt).isAfter(now.subtract(7, 'day'))
    ).length
    
    const thisMonth = projects.filter(p => 
      dayjs(p.createdAt).isAfter(now.subtract(30, 'day'))
    ).length
    
    const thisQuarter = projects.filter(p => 
      dayjs(p.createdAt).isAfter(now.subtract(90, 'day'))
    ).length
    
    return {
      thisWeek,
      thisMonth,
      thisQuarter
    }
  }
}

/**
 * 任务统计计算器
 */
export class TaskStatsCalculator {
  calculate(tasks, options = {}) {
    if (!Array.isArray(tasks)) {
      throw new Error('Tasks must be an array')
    }
    
    const now = dayjs()
    
    // 基础统计
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length
    const notStartedTasks = tasks.filter(t => t.status === 'not_started').length
    
    // 超期任务计算
    const overdueTasks = tasks.filter(task => {
      if (task.status === 'completed') return false
      return dayjs(task.endDate).isBefore(now, 'day')
    }).length
    
    // 里程碑统计
    const milestones = tasks.filter(t => t.isMilestone)
    const completedMilestones = milestones.filter(m => m.status === 'completed').length
    
    // 完成率和超期率
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    const overdueRate = totalTasks > 0 ? (overdueTasks / totalTasks) * 100 : 0
    const milestoneCompletionRate = milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0
    
    // 按优先级统计
    const priorityStats = this.calculatePriorityStats(tasks)
    
    // 按责任人统计
    const assigneeStats = this.calculateAssigneeStats(tasks)
    
    return {
      total: totalTasks,
      completed: completedTasks,
      inProgress: inProgressTasks,
      notStarted: notStartedTasks,
      overdue: overdueTasks,
      milestones: {
        total: milestones.length,
        completed: completedMilestones,
        completionRate: Math.round(milestoneCompletionRate * 100) / 100
      },
      completionRate: Math.round(completionRate * 100) / 100,
      overdueRate: Math.round(overdueRate * 100) / 100,
      priorityStats,
      assigneeStats
    }
  }
  
  calculatePriorityStats(tasks) {
    const priorities = ['low', 'medium', 'high', 'urgent']
    const stats = {}
    
    priorities.forEach(priority => {
      const priorityTasks = tasks.filter(t => t.priority === priority)
      stats[priority] = {
        total: priorityTasks.length,
        completed: priorityTasks.filter(t => t.status === 'completed').length,
        overdue: priorityTasks.filter(t => 
          t.status !== 'completed' && dayjs(t.endDate).isBefore(dayjs(), 'day')
        ).length
      }
    })
    
    return stats
  }
  
  calculateAssigneeStats(tasks) {
    const assigneeMap = new Map()
    
    tasks.forEach(task => {
      if (!task.assignee) return
      
      if (!assigneeMap.has(task.assignee)) {
        assigneeMap.set(task.assignee, {
          total: 0,
          completed: 0,
          inProgress: 0,
          overdue: 0
        })
      }
      
      const stats = assigneeMap.get(task.assignee)
      stats.total++
      
      if (task.status === 'completed') {
        stats.completed++
      } else if (task.status === 'in_progress') {
        stats.inProgress++
      }
      
      if (task.status !== 'completed' && dayjs(task.endDate).isBefore(dayjs(), 'day')) {
        stats.overdue++
      }
    })
    
    return Object.fromEntries(assigneeMap)
  }
}

/**
 * 超期提醒计算器
 */
export class OverdueReminderCalculator {
  calculate(tasks, options = {}) {
    const { days = [7, 14] } = options
    const now = dayjs()
    
    const result = {}
    
    days.forEach(dayCount => {
      const targetDate = now.add(dayCount, 'day')
      
      const upcomingTasks = tasks.filter(task => {
        if (task.status === 'completed') return false
        
        const endDate = dayjs(task.endDate)
        return endDate.isAfter(now) && endDate.isBefore(targetDate, 'day')
      })
      
      // 按剩余天数排序
      upcomingTasks.sort((a, b) => {
        const aDays = dayjs(a.endDate).diff(now, 'day')
        const bDays = dayjs(b.endDate).diff(now, 'day')
        return aDays - bDays
      })
      
      // 添加剩余天数信息
      const tasksWithDaysLeft = upcomingTasks.map(task => ({
        ...task,
        daysLeft: dayjs(task.endDate).diff(now, 'day'),
        urgencyLevel: this.getUrgencyLevel(dayjs(task.endDate).diff(now, 'day'))
      }))
      
      result[`${dayCount}days`] = tasksWithDaysLeft
    })
    
    // 已超期任务
    const overdueTasks = tasks.filter(task => {
      if (task.status === 'completed') return false
      return dayjs(task.endDate).isBefore(now, 'day')
    }).map(task => ({
      ...task,
      daysOverdue: now.diff(dayjs(task.endDate), 'day'),
      urgencyLevel: 'critical'
    }))
    
    result.overdue = overdueTasks
    
    return result
  }
  
  getUrgencyLevel(daysLeft) {
    if (daysLeft <= 1) return 'critical'
    if (daysLeft <= 3) return 'high'
    if (daysLeft <= 7) return 'medium'
    return 'low'
  }
}

/**
 * 甘特图数据计算器
 */
export class GanttDataCalculator {
  calculate(project, options = {}) {
    if (!project || !project.tasks) {
      throw new Error('Project with tasks is required')
    }
    
    const tasks = project.tasks
    const { timeUnit = 'day' } = options
    
    // 计算项目时间范围
    const timeRange = this.calculateTimeRange(tasks)
    
    // 生成时间轴
    const timeline = this.generateTimeline(timeRange.start, timeRange.end, timeUnit)
    
    // 计算任务位置和进度
    const taskData = tasks.map(task => this.calculateTaskData(task, timeRange, timeline))
    
    // 计算依赖关系
    const dependencies = this.calculateDependencies(tasks)
    
    // 计算关键路径
    const criticalPath = this.calculateCriticalPath(tasks, dependencies)
    
    return {
      project: {
        ...project,
        timeRange,
        duration: timeRange.duration
      },
      timeline,
      tasks: taskData,
      dependencies,
      criticalPath,
      statistics: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        overdueTasks: tasks.filter(t => 
          t.status !== 'completed' && dayjs(t.endDate).isBefore(dayjs(), 'day')
        ).length
      }
    }
  }
  
  calculateTimeRange(tasks) {
    if (tasks.length === 0) {
      const now = dayjs()
      return {
        start: now.toDate(),
        end: now.add(30, 'day').toDate(),
        duration: 30
      }
    }
    
    const startDates = tasks.map(t => dayjs(t.startDate))
    const endDates = tasks.map(t => dayjs(t.endDate))
    
    const start = dayjs.min(startDates)
    const end = dayjs.max(endDates)
    
    return {
      start: start.toDate(),
      end: end.toDate(),
      duration: end.diff(start, 'day')
    }
  }
  
  generateTimeline(start, end, timeUnit) {
    const timeline = []
    let current = dayjs(start)
    const endDate = dayjs(end)
    
    while (current.isBefore(endDate) || current.isSame(endDate, timeUnit)) {
      timeline.push({
        date: current.toDate(),
        label: current.format('MM-DD'),
        isWeekend: current.day() === 0 || current.day() === 6,
        isToday: current.isSame(dayjs(), 'day')
      })
      current = current.add(1, timeUnit)
    }
    
    return timeline
  }
  
  calculateTaskData(task, timeRange, timeline) {
    const startDate = dayjs(task.startDate)
    const endDate = dayjs(task.endDate)
    const projectStart = dayjs(timeRange.start)
    
    // 计算任务在时间轴上的位置
    const startOffset = startDate.diff(projectStart, 'day')
    const duration = endDate.diff(startDate, 'day') + 1
    
    // 计算进度
    const progress = this.calculateTaskProgress(task)
    
    return {
      ...task,
      startOffset,
      duration,
      progress,
      isOverdue: task.status !== 'completed' && endDate.isBefore(dayjs(), 'day'),
      isCritical: false, // 将在关键路径计算中更新
      position: {
        left: (startOffset / timeRange.duration) * 100,
        width: (duration / timeRange.duration) * 100
      }
    }
  }
  
  calculateTaskProgress(task) {
    if (task.status === 'completed') return 100
    if (task.status === 'not_started') return 0
    
    // 对于进行中的任务，基于时间进度估算
    const startDate = dayjs(task.startDate)
    const endDate = dayjs(task.endDate)
    const now = dayjs()
    
    if (now.isBefore(startDate)) return 0
    if (now.isAfter(endDate)) return 100
    
    const totalDuration = endDate.diff(startDate, 'day')
    const elapsedDuration = now.diff(startDate, 'day')
    
    return Math.min(Math.max((elapsedDuration / totalDuration) * 100, 0), 100)
  }
  
  calculateDependencies(tasks) {
    // 简化的依赖关系计算
    // 实际项目中可能需要更复杂的依赖管理
    return []
  }
  
  calculateCriticalPath(tasks, dependencies) {
    // 简化的关键路径计算
    // 实际项目中需要实现完整的CPM算法
    return []
  }
}

/**
 * 进度计算器
 */
export class ProgressCalculator {
  calculate(entity, options = {}) {
    const { type = 'auto' } = options
    
    switch (type) {
      case 'project':
        return this.calculateProjectProgress(entity)
      case 'task':
        return this.calculateTaskProgress(entity)
      case 'auto':
        return entity.tasks ? this.calculateProjectProgress(entity) : this.calculateTaskProgress(entity)
      default:
        throw new Error(`Unknown progress calculation type: ${type}`)
    }
  }
  
  calculateProjectProgress(project) {
    if (!project.tasks || project.tasks.length === 0) {
      return { progress: 0, status: 'not_started' }
    }
    
    const tasks = project.tasks
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    
    const progress = (completedTasks / totalTasks) * 100
    
    let status = 'not_started'
    if (progress === 100) {
      status = 'completed'
    } else if (progress > 0) {
      status = 'in_progress'
    }
    
    // 检查是否超期
    const now = dayjs()
    if (status !== 'completed' && dayjs(project.endDate).isBefore(now, 'day')) {
      status = 'overdue'
    }
    
    return {
      progress: Math.round(progress * 100) / 100,
      status,
      completedTasks,
      totalTasks,
      remainingTasks: totalTasks - completedTasks
    }
  }
  
  calculateTaskProgress(task) {
    let progress = 0
    let status = task.status || 'not_started'
    
    switch (status) {
      case 'completed':
        progress = 100
        break
      case 'in_progress':
        // 基于时间进度估算
        progress = this.calculateTimeBasedProgress(task)
        break
      case 'not_started':
      default:
        progress = 0
        break
    }
    
    // 检查是否超期
    const now = dayjs()
    if (status !== 'completed' && dayjs(task.endDate).isBefore(now, 'day')) {
      status = 'overdue'
    }
    
    return {
      progress: Math.round(progress * 100) / 100,
      status
    }
  }
  
  calculateTimeBasedProgress(task) {
    const startDate = dayjs(task.startDate)
    const endDate = dayjs(task.endDate)
    const now = dayjs()
    
    if (now.isBefore(startDate)) return 0
    if (now.isAfter(endDate)) return 100
    
    const totalDuration = endDate.diff(startDate, 'day')
    const elapsedDuration = now.diff(startDate, 'day')
    
    return Math.min(Math.max((elapsedDuration / totalDuration) * 100, 0), 100)
  }
}

// 创建全局计算引擎实例
export const calculationEngine = new CalculationEngine()