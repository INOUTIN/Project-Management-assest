import { BaseDataService } from './BaseDataService.js'
import { LocalStorageService } from '../storage/LocalStorageService.js'
import { calculationEngine } from '../calculation/CalculationEngine.js'
import { ValidationUtils } from '@shared/utils/validation.js'
import { TASK_STATUS, PRIORITY } from '@shared/utils/constants.js'
import { DateUtils } from '@shared/utils/date.js'

/**
 * 任务数据服务
 */
export class TaskDataService extends BaseDataService {
  constructor() {
    const storage = new LocalStorageService('pmt_tasks_')
    super(storage, 'task')
  }
  
  /**
   * 验证任务数据
   * @param {object} task 任务数据
   */
  validateEntity(task) {
    super.validateEntity(task)
    
    const validation = ValidationUtils.validateTask(task)
    if (!validation.isValid) {
      throw new Error(`Task validation failed: ${Object.values(validation.errors).join(', ')}`)
    }
    
    // 验证项目ID
    if (!task.projectId) {
      throw new Error('Task must belong to a project')
    }
  }
  
  /**
   * 创建任务
   * @param {object} taskData 任务数据
   * @returns {Promise<object>} 创建的任务
   */
  async create(taskData) {
    // 设置默认值
    const task = {
      name: '',
      description: '',
      status: TASK_STATUS.NOT_STARTED,
      priority: PRIORITY.MEDIUM,
      isMilestone: false,
      assignee: '',
      startDate: new Date().toISOString(),
      endDate: DateUtils.format(DateUtils.addWorkdays(new Date(), 7), 'YYYY-MM-DD'),
      progress: 0,
      dependencies: [],
      tags: [],
      ...taskData
    }
    
    return await super.create(task)
  }
  
  /**
   * 更新任务状态
   * @param {string} taskId 任务ID
   * @param {string} status 新状态
   * @returns {Promise<object>} 更新后的任务
   */
  async updateStatus(taskId, status) {
    const task = await this.findById(taskId)
    if (!task) {
      throw new Error(`Task with id ${taskId} not found`)
    }
    
    const updates = { status }
    
    // 如果标记为完成，设置进度为100%
    if (status === TASK_STATUS.COMPLETED) {
      updates.progress = 100
      updates.completedAt = new Date().toISOString()
    }
    
    return await this.update(taskId, updates)
  }
  
  /**
   * 更新任务进度
   * @param {string} taskId 任务ID
   * @param {number} progress 进度百分比
   * @returns {Promise<object>} 更新后的任务
   */
  async updateProgress(taskId, progress) {
    const task = await this.findById(taskId)
    if (!task) {
      throw new Error(`Task with id ${taskId} not found`)
    }
    
    const updates = { progress: Math.max(0, Math.min(100, progress)) }
    
    // 根据进度自动更新状态
    if (progress === 0) {
      updates.status = TASK_STATUS.NOT_STARTED
    } else if (progress === 100) {
      updates.status = TASK_STATUS.COMPLETED
      updates.completedAt = new Date().toISOString()
    } else if (task.status === TASK_STATUS.NOT_STARTED) {
      updates.status = TASK_STATUS.IN_PROGRESS
    }
    
    return await this.update(taskId, updates)
  }
  
  /**
   * 根据项目ID查找任务
   * @param {string} projectId 项目ID
   * @param {object} options 查询选项
   * @returns {Promise<Array>} 任务列表
   */
  async findByProject(projectId, options = {}) {
    const filters = { projectId, ...options.filters }
    return await this.findAll(filters, options)
  }
  
  /**
   * 根据责任人查找任务
   * @param {string} assignee 责任人
   * @param {object} options 查询选项
   * @returns {Promise<Array>} 任务列表
   */
  async findByAssignee(assignee, options = {}) {
    const filters = { assignee, ...options.filters }
    return await this.findAll(filters, options)
  }
  
  /**
   * 获取超期任务
   * @param {object} filters 额外过滤条件
   * @returns {Promise<Array>} 超期任务列表
   */
  async getOverdueTasks(filters = {}) {
    const allTasks = await this.findAll(filters)
    
    return allTasks.filter(task => 
      task.status !== TASK_STATUS.COMPLETED && 
      DateUtils.isOverdue(task.endDate)
    )
  }
  
  /**
   * 获取即将到期的任务
   * @param {number} days 天数
   * @param {object} filters 额外过滤条件
   * @returns {Promise<Array>} 即将到期的任务列表
   */
  async getUpcomingTasks(days = 7, filters = {}) {
    const allTasks = await this.findAll(filters)
    
    return calculationEngine.calculate('overdueReminder', allTasks, { days: [days] })[`${days}days`]
  }
  
  /**
   * 获取里程碑任务
   * @param {string} projectId 项目ID（可选）
   * @returns {Promise<Array>} 里程碑任务列表
   */
  async getMilestoneTasks(projectId = null) {
    const filters = { isMilestone: true }
    if (projectId) {
      filters.projectId = projectId
    }
    
    return await this.findAll(filters, {
      sortBy: 'endDate',
      sortOrder: 'asc'
    })
  }
  
  /**
   * 获取任务统计信息
   * @param {object} filters 过滤条件
   * @returns {Promise<object>} 统计信息
   */
  async getTaskStatistics(filters = {}) {
    const tasks = await this.findAll(filters)
    return calculationEngine.calculate('taskStats', tasks)
  }
  
  /**
   * 搜索任务
   * @param {string} keyword 关键词
   * @param {object} filters 过滤条件
   * @returns {Promise<Array>} 搜索结果
   */
  async search(keyword, filters = {}) {
    const allTasks = await this.findAll()
    
    let results = allTasks
    
    // 关键词搜索
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase()
      results = results.filter(task => 
        task.name.toLowerCase().includes(lowerKeyword) ||
        (task.description && task.description.toLowerCase().includes(lowerKeyword)) ||
        (task.assignee && task.assignee.toLowerCase().includes(lowerKeyword))
      )
    }
    
    // 应用过滤器
    results = this.applyFilters(results, filters)
    
    return results
  }
  
  /**
   * 批量更新任务状态
   * @param {Array} taskIds 任务ID列表
   * @param {string} status 新状态
   * @returns {Promise<Array>} 更新结果
   */
  async batchUpdateStatus(taskIds, status) {
    const results = []
    
    for (const taskId of taskIds) {
      try {
        const updatedTask = await this.updateStatus(taskId, status)
        results.push({ success: true, taskId, task: updatedTask })
      } catch (error) {
        results.push({ success: false, taskId, error: error.message })
      }
    }
    
    return results
  }
  
  /**
   * 批量分配任务
   * @param {Array} taskIds 任务ID列表
   * @param {string} assignee 责任人
   * @returns {Promise<Array>} 分配结果
   */
  async batchAssign(taskIds, assignee) {
    const results = []
    
    for (const taskId of taskIds) {
      try {
        const updatedTask = await this.update(taskId, { assignee })
        results.push({ success: true, taskId, task: updatedTask })
      } catch (error) {
        results.push({ success: false, taskId, error: error.message })
      }
    }
    
    return results
  }
  
  /**
   * 复制任务
   * @param {string} taskId 源任务ID
   * @param {object} options 复制选项
   * @returns {Promise<object>} 新任务
   */
  async duplicateTask(taskId, options = {}) {
    const sourceTask = await this.findById(taskId)
    if (!sourceTask) {
      throw new Error(`Task with id ${taskId} not found`)
    }
    
    const {
      namePrefix = '副本 - ',
      resetStatus = true,
      resetProgress = true,
      resetDates = false,
      newProjectId = null
    } = options
    
    const newTaskData = {
      ...sourceTask,
      name: namePrefix + sourceTask.name,
      projectId: newProjectId || sourceTask.projectId
    }
    
    // 重置状态和进度
    if (resetStatus) {
      newTaskData.status = TASK_STATUS.NOT_STARTED
    }
    
    if (resetProgress) {
      newTaskData.progress = 0
      delete newTaskData.completedAt
    }
    
    // 重置日期
    if (resetDates) {
      const now = new Date()
      const duration = DateUtils.diffInDays(sourceTask.startDate, sourceTask.endDate)
      newTaskData.startDate = now.toISOString()
      newTaskData.endDate = DateUtils.addWorkdays(now, duration).toISOString()
    }
    
    delete newTaskData.id
    delete newTaskData.createdAt
    delete newTaskData.updatedAt
    
    return await this.create(newTaskData)
  }
  
  /**
   * 移动任务到其他项目
   * @param {string} taskId 任务ID
   * @param {string} targetProjectId 目标项目ID
   * @returns {Promise<object>} 更新后的任务
   */
  async moveToProject(taskId, targetProjectId) {
    const task = await this.findById(taskId)
    if (!task) {
      throw new Error(`Task with id ${taskId} not found`)
    }
    
    return await this.update(taskId, { projectId: targetProjectId })
  }
  
  /**
   * 设置任务依赖关系
   * @param {string} taskId 任务ID
   * @param {Array} dependencyIds 依赖任务ID列表
   * @returns {Promise<object>} 更新后的任务
   */
  async setDependencies(taskId, dependencyIds) {
    const task = await this.findById(taskId)
    if (!task) {
      throw new Error(`Task with id ${taskId} not found`)
    }
    
    // 验证依赖任务是否存在
    for (const depId of dependencyIds) {
      const depTask = await this.findById(depId)
      if (!depTask) {
        throw new Error(`Dependency task with id ${depId} not found`)
      }
      
      // 检查循环依赖
      if (await this.hasCircularDependency(taskId, depId)) {
        throw new Error(`Circular dependency detected between ${taskId} and ${depId}`)
      }
    }
    
    return await this.update(taskId, { dependencies: dependencyIds })
  }
  
  /**
   * 检查循环依赖
   * @param {string} taskId 任务ID
   * @param {string} dependencyId 依赖任务ID
   * @returns {Promise<boolean>} 是否存在循环依赖
   */
  async hasCircularDependency(taskId, dependencyId) {
    const visited = new Set()
    
    const checkDependency = async (currentId) => {
      if (visited.has(currentId)) {
        return currentId === taskId
      }
      
      visited.add(currentId)
      
      const currentTask = await this.findById(currentId)
      if (!currentTask || !currentTask.dependencies) {
        return false
      }
      
      for (const depId of currentTask.dependencies) {
        if (await checkDependency(depId)) {
          return true
        }
      }
      
      return false
    }
    
    return await checkDependency(dependencyId)
  }
  
  /**
   * 获取任务的依赖链
   * @param {string} taskId 任务ID
   * @returns {Promise<Array>} 依赖链
   */
  async getDependencyChain(taskId) {
    const task = await this.findById(taskId)
    if (!task || !task.dependencies || task.dependencies.length === 0) {
      return []
    }
    
    const chain = []
    
    for (const depId of task.dependencies) {
      const depTask = await this.findById(depId)
      if (depTask) {
        chain.push(depTask)
        
        // 递归获取依赖的依赖
        const subChain = await this.getDependencyChain(depId)
        chain.push(...subChain)
      }
    }
    
    return chain
  }
  
  /**
   * 获取被依赖的任务列表
   * @param {string} taskId 任务ID
   * @returns {Promise<Array>} 被依赖的任务列表
   */
  async getDependentTasks(taskId) {
    const allTasks = await this.findAll()
    
    return allTasks.filter(task => 
      task.dependencies && task.dependencies.includes(taskId)
    )
  }
  
  /**
   * 自动调度任务日期
   * @param {string} projectId 项目ID
   * @returns {Promise<Array>} 调度结果
   */
  async autoScheduleTasks(projectId) {
    const tasks = await this.findByProject(projectId)
    const results = []
    
    // 按依赖关系排序任务
    const sortedTasks = await this.topologicalSort(tasks)
    
    for (const task of sortedTasks) {
      try {
        let newStartDate = new Date(task.startDate)
        
        // 检查依赖任务的完成时间
        if (task.dependencies && task.dependencies.length > 0) {
          let latestEndDate = new Date(0)
          
          for (const depId of task.dependencies) {
            const depTask = await this.findById(depId)
            if (depTask) {
              const depEndDate = new Date(depTask.endDate)
              if (depEndDate > latestEndDate) {
                latestEndDate = depEndDate
              }
            }
          }
          
          // 设置开始时间为依赖任务完成后的下一个工作日
          if (latestEndDate > new Date(0)) {
            newStartDate = DateUtils.addWorkdays(latestEndDate, 1)
          }
        }
        
        // 计算新的结束时间
        const duration = DateUtils.diffInWorkdays(task.startDate, task.endDate)
        const newEndDate = DateUtils.addWorkdays(newStartDate, duration)
        
        // 更新任务日期
        const updatedTask = await this.update(task.id, {
          startDate: newStartDate.toISOString(),
          endDate: newEndDate.toISOString()
        })
        
        results.push({ success: true, taskId: task.id, task: updatedTask })
      } catch (error) {
        results.push({ success: false, taskId: task.id, error: error.message })
      }
    }
    
    return results
  }
  
  /**
   * 拓扑排序任务（按依赖关系）
   * @param {Array} tasks 任务列表
   * @returns {Promise<Array>} 排序后的任务列表
   */
  async topologicalSort(tasks) {
    const taskMap = new Map(tasks.map(task => [task.id, task]))
    const visited = new Set()
    const visiting = new Set()
    const result = []
    
    const visit = (taskId) => {
      if (visiting.has(taskId)) {
        throw new Error(`Circular dependency detected involving task ${taskId}`)
      }
      
      if (visited.has(taskId)) {
        return
      }
      
      visiting.add(taskId)
      
      const task = taskMap.get(taskId)
      if (task && task.dependencies) {
        for (const depId of task.dependencies) {
          if (taskMap.has(depId)) {
            visit(depId)
          }
        }
      }
      
      visiting.delete(taskId)
      visited.add(taskId)
      
      if (task) {
        result.push(task)
      }
    }
    
    for (const task of tasks) {
      if (!visited.has(task.id)) {
        visit(task.id)
      }
    }
    
    return result
  }
  
  /**
   * 获取任务的甘特图数据
   * @param {string} projectId 项目ID
   * @returns {Promise<object>} 甘特图数据
   */
  async getGanttData(projectId) {
    const tasks = await this.findByProject(projectId, {
      sortBy: 'startDate',
      sortOrder: 'asc'
    })
    
    // 获取项目信息
    const { projectDataService } = await import('./ProjectDataService.js')
    const project = await projectDataService.findById(projectId)
    
    return calculationEngine.calculate('ganttData', { ...project, tasks })
  }
}

// 创建单例实例
export const taskDataService = new TaskDataService()