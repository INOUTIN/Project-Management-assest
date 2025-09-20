import { ref, computed } from 'vue'
import { projectDataService } from '@shared/services/data/ProjectDataService.js'
import { DateUtils } from '@shared/utils/date.js'

/**
 * 项目数据中心 - 整个系统的唯一数据源和计算逻辑
 * 所有页面都应该使用这个数据中心，而不是直接调用数据服务
 */

// 全局数据状态
const projectsData = ref([])
const loading = ref(false)
const error = ref(null)
const lastUpdated = ref(null)

// ===== 唯一的判断规则（按照6条规则） =====

/**
 * 判断任务是否超期（规则7）
 * 规则7：任务超期 = 当天时间已经晚于任务计划完成时间 AND (任务实际完成时间为空 OR 任务实际完成时间晚于任务计划完成时间)
 * @param {Object} task 任务对象
 * @returns {boolean} 是否超期
 */
const isTaskOverdue = (task) => {
  if (!task.endDate) return false
  
  const today = new Date()
  const endDate = new Date(task.endDate)
  
  // 设置时间为当天结束时间进行比较
  today.setHours(23, 59, 59, 999)
  endDate.setHours(23, 59, 59, 999)
  
  // 当天时间已经晚于任务计划完成时间
  const isPastDue = today > endDate
  
  if (!isPastDue) return false
  
  // 检查实际完成时间
  if (!task.actualEndDate) {
    // 实际完成时间为空 = 超期
    return true
  }
  
  // 实际完成时间晚于计划完成时间 = 超期
  const actualEndDate = new Date(task.actualEndDate)
  return actualEndDate > endDate
}

/**
 * 判断项目是否超期（规则8）
 * 规则8：项目超期 = 当天时间已经晚于项目计划完成时间 AND (最后一个任务实际完成时间为空 OR 实际完成时间晚于计划完成时间)
 * @param {Object} project 项目对象
 * @returns {boolean} 是否超期
 */
const isProjectOverdue = (project) => {
  if (!project.endDate) return false
  
  const today = new Date()
  const projectEndDate = new Date(project.endDate)
  
  // 设置时间为当天结束时间进行比较
  today.setHours(23, 59, 59, 999)
  projectEndDate.setHours(23, 59, 59, 999)
  
  // 当天时间已经晚于项目计划完成时间
  const isPastDue = today > projectEndDate
  
  if (!isPastDue) return false
  
  // 找到最后一个任务（按计划结束时间排序）
  const tasks = project.tasks || []
  if (tasks.length === 0) return true
  
  const lastTask = tasks.reduce((latest, task) => {
    if (!task.endDate) return latest
    if (!latest || new Date(task.endDate) > new Date(latest.endDate)) {
      return task
    }
    return latest
  }, null)
  
  if (!lastTask) return true
  
  // 检查最后一个任务的实际完成时间
  if (!lastTask.actualEndDate) {
    // 最后一个任务实际完成时间为空 = 项目超期
    return true
  }
  
  // 最后一个任务实际完成时间晚于项目计划完成时间 = 项目超期
  const lastTaskActualEndDate = new Date(lastTask.actualEndDate)
  return lastTaskActualEndDate > projectEndDate
}

/**
 * 验证任务的实际时间是否有效
 * 规则：实际完成时间不能晚于当天时间，否则判定无效
 * @param {Object} task 任务对象
 * @returns {Object} 验证后的任务对象
 */
const validateTaskActualTimes = (task) => {
  if (!task.actualEndDate) return task
  
  const today = new Date()
  const actualEndDate = new Date(task.actualEndDate)
  
  // 设置今天为当天结束时间
  today.setHours(23, 59, 59, 999)
  
  // 如果实际完成时间晚于当天时间，则判定为无效，清空实际完成时间
  if (actualEndDate > today) {
    return {
      ...task,
      actualEndDate: null // 清空无效的实际完成时间
    }
  }
  
  return task
}

/**
 * 根据6条规则计算项目状态
 * @param {Object} project 项目对象
 * @returns {string} 项目状态
 */
const calculateProjectStatus = (project) => {
  const tasks = (project.tasks || []).map(validateTaskActualTimes) // 验证所有任务的实际时间
  const isOverdue = isProjectOverdue(project)
  
  if (tasks.length === 0) {
    // 规则1&2: 0任务项目
    return isOverdue ? 'overdue_not_started' : 'not_started'
  }
  
  // 有任务的项目 - 检查实际时间信息（使用验证后的任务数据）
  const tasksWithActualStart = tasks.filter(task => task.actualStartDate)
  const tasksWithActualEnd = tasks.filter(task => task.actualStartDate && task.actualEndDate)
  
  if (tasksWithActualEnd.length === tasks.length) {
    // 规则5&6: 所有任务都有实际起止时间 = 已完成
    return isOverdue ? 'completed_overdue' : 'completed'
  } else if (tasksWithActualStart.length > 0) {
    // 规则3&4: 有任务有实际开始时间 = 进行中
    return isOverdue ? 'overdue_in_progress' : 'in_progress'
  } else {
    // 有任务但都没有实际开始时间 = 未开始
    return isOverdue ? 'overdue_not_started' : 'not_started'
  }
}

/**
 * 计算任务统计信息
 * @param {Array} tasks 任务数组
 * @returns {Object} 任务统计
 */
const calculateTaskStats = (tasks) => {
  if (!tasks || tasks.length === 0) {
    return {
      total: 0,
      completed: 0,
      inProgress: 0,
      overdue: 0,
      completionRate: 0
    }
  }
  
  // 验证所有任务的实际时间
  const validatedTasks = tasks.map(validateTaskActualTimes)
  
  const completed = validatedTasks.filter(task => task.actualStartDate && task.actualEndDate).length
  const inProgress = validatedTasks.filter(task => task.actualStartDate && !task.actualEndDate).length
  const overdue = validatedTasks.filter(task => isTaskOverdue(task)).length
  
  return {
    total: validatedTasks.length,
    completed,
    inProgress,
    overdue,
    completionRate: Math.round((completed / validatedTasks.length) * 100)
  }
}

/**
 * 更新项目的完整状态信息（包括状态和统计）
 * @param {Object} project 项目对象
 * @returns {Object} 更新后的项目对象
 */
const updateProjectWithCalculatedStatus = (project) => {
  const calculatedStatus = calculateProjectStatus(project)
  const taskStats = calculateTaskStats(project.tasks)
  
  return {
    ...project,
    calculatedStatus,
    taskStats
  }
}

// ===== 唯一的数据管理方法 =====

/**
 * 加载所有项目数据并计算状态
 */
const loadAllProjects = async () => {
  loading.value = true
  error.value = null
  
  try {
    // 从数据库加载原始项目数据
    const rawProjects = await projectDataService.findAll()
    
    // 使用唯一的计算逻辑处理每个项目
    const processedProjects = rawProjects.map(project => updateProjectWithCalculatedStatus(project))
    
    // 更新全局数据
    projectsData.value = processedProjects
    lastUpdated.value = new Date().toISOString()
    
    console.log('数据中心：已加载并计算', processedProjects.length, '个项目的状态')
    
  } catch (err) {
    error.value = err.message
    console.error('数据中心加载失败:', err)
  } finally {
    loading.value = false
  }
}

/**
 * 获取单个项目数据
 * @param {string} projectId 项目ID
 * @returns {Object|null} 项目数据
 */
const getProjectById = async (projectId) => {
  // 先检查内存中是否有数据
  let project = projectsData.value.find(p => p.id === projectId)
  
  if (!project) {
    // 如果内存中没有，从数据库加载
    const rawProject = await projectDataService.findById(projectId)
    if (rawProject) {
      project = updateProjectWithCalculatedStatus(rawProject)
      
      // 更新内存中的数据
      const index = projectsData.value.findIndex(p => p.id === projectId)
      if (index >= 0) {
        projectsData.value[index] = project
      } else {
        projectsData.value.push(project)
      }
    }
  }
  
  return project
}

/**
 * 创建新项目
 * @param {Object} projectData 项目数据
 */
const createProject = async (projectData) => {
  // 使用唯一的计算逻辑处理新项目
  const processedProject = updateProjectWithCalculatedStatus(projectData)
  
  // 保存到数据库
  const createdProject = await projectDataService.create(processedProject)
  
  // 添加到内存中
  projectsData.value.push(createdProject)
  
  console.log('数据中心：已创建项目', createdProject.name)
  return createdProject
}

/**
 * 更新项目数据
 * @param {string} projectId 项目ID
 * @param {Object} projectData 项目数据
 */
const updateProject = async (projectId, projectData) => {
  // 使用唯一的计算逻辑更新项目
  const updatedProject = updateProjectWithCalculatedStatus(projectData)
  
  // 保存到数据库
  await projectDataService.update(projectId, updatedProject)
  
  // 更新内存中的数据
  const index = projectsData.value.findIndex(p => p.id === projectId)
  if (index >= 0) {
    projectsData.value[index] = updatedProject
  }
  
  console.log('数据中心：已更新项目', updatedProject.name)
  return updatedProject
}

/**
 * 删除项目
 * @param {string} projectId 项目ID
 */
const deleteProject = async (projectId) => {
  await projectDataService.delete(projectId)
  
  // 从内存中移除
  const index = projectsData.value.findIndex(p => p.id === projectId)
  if (index >= 0) {
    projectsData.value.splice(index, 1)
  }
}

// ===== 唯一的统计计算方法 =====

/**
 * 计算所有项目的统计信息
 */
const calculateProjectStatistics = () => {
  const projects = projectsData.value
  const total = projects.length
  
  if (total === 0) {
    return {
      total: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
      completionRate: 0,
      overdueRate: 0
    }
  }
  
  // 按状态分类统计
  const statusCounts = {
    not_started: 0,
    in_progress: 0,
    completed: 0,
    overdue_not_started: 0,
    overdue_in_progress: 0,
    completed_overdue: 0
  }
  
  projects.forEach(project => {
    const status = project.calculatedStatus || 'not_started'
    statusCounts[status] = (statusCounts[status] || 0) + 1
  })
  
  // 合并统计
  const inProgress = statusCounts.in_progress + statusCounts.overdue_in_progress
  const completed = statusCounts.completed + statusCounts.completed_overdue
  const overdue = statusCounts.overdue_not_started + statusCounts.overdue_in_progress + statusCounts.completed_overdue
  
  return {
    total,
    inProgress,
    completed,
    overdue,
    completionRate: Math.round((completed / total) * 100),
    overdueRate: Math.round((overdue / total) * 100)
  }
}

/**
 * 计算所有任务的统计信息
 */
const calculateTaskStatistics = () => {
  const allTasks = projectsData.value.flatMap(project => project.tasks || [])
  const total = allTasks.length
  
  if (total === 0) {
    return {
      total: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
      completionRate: 0,
      overdueRate: 0
    }
  }
  
  const completed = allTasks.filter(task => task.actualStartDate && task.actualEndDate).length
  const inProgress = allTasks.filter(task => task.actualStartDate && !task.actualEndDate).length
  const overdue = allTasks.filter(task => isTaskOverdue(task)).length
  
  return {
    total,
    inProgress,
    completed,
    overdue,
    completionRate: Math.round((completed / total) * 100),
    overdueRate: Math.round((overdue / total) * 100)
  }
}

/**
 * 计算超期提醒
 * @param {number} days 提前天数
 * @returns {Array} 超期任务列表
 */
const calculateOverdueReminders = (days = 7) => {
  const allTasks = projectsData.value.flatMap(project => 
    (project.tasks || []).map(task => ({
      ...task,
      projectName: project.name,
      projectId: project.id
    }))
  )
  
  const now = new Date()
  const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
  
  return allTasks.filter(task => {
    if (task.status === 'completed') return false
    if (!task.endDate) return false
    
    const endDate = new Date(task.endDate)
    return endDate >= now && endDate <= targetDate
  })
}

// ===== 计算属性 =====

const projectStatistics = computed(() => calculateProjectStatistics())
const taskStatistics = computed(() => calculateTaskStatistics())
const reminders7Days = computed(() => calculateOverdueReminders(7))
const reminders14Days = computed(() => calculateOverdueReminders(14))

// ===== 导出数据中心 =====

export const useProjectDataCenter = () => {
  return {
    // 数据状态
    projectsData,
    loading,
    error,
    lastUpdated,
    
    // 数据管理方法
    loadAllProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    
    // 计算方法（供甘特图页面使用）
    updateProjectWithCalculatedStatus,
    calculateProjectStatus,
    calculateTaskStats,
    isTaskOverdue,
    isProjectOverdue,
    
    // 统计数据
    projectStatistics,
    taskStatistics,
    reminders7Days,
    reminders14Days,
    
    // 统计计算方法
    calculateProjectStatistics,
    calculateTaskStatistics,
    calculateOverdueReminders
  }
}

// 创建全局单例实例
let globalDataCenter = null

export const getGlobalProjectDataCenter = () => {
  if (!globalDataCenter) {
    globalDataCenter = useProjectDataCenter()
  }
  return globalDataCenter
}