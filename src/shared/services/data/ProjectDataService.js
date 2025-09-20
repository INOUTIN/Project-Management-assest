import { BaseDataService } from './BaseDataService.js'
import { LocalStorageService } from '../storage/LocalStorageService.js'
import { calculationEngine } from '../calculation/CalculationEngine.js'
import { ValidationUtils } from '@shared/utils/validation.js'
import { PROJECT_STATUS, TASK_STATUS } from '@shared/utils/constants.js'
import { DateUtils } from '@shared/utils/date.js'

/**
 * 项目数据服务
 */
export class ProjectDataService extends BaseDataService {
  constructor() {
    const storage = new LocalStorageService('pmt_projects_')
    super(storage, 'project')
  }
  
  /**
   * 验证项目数据
   * @param {object} project 项目数据
   */
  validateEntity(project) {
    super.validateEntity(project)
    
    const validation = ValidationUtils.validateProject(project)
    if (!validation.isValid) {
      throw new Error(`Project validation failed: ${Object.values(validation.errors).join(', ')}`)
    }
  }
  
  /**
   * 创建项目
   * @param {object} projectData 项目数据
   * @returns {Promise<object>} 创建的项目
   */
  async create(projectData) {
    // 设置默认值
    const project = {
      name: '',
      description: '',
      status: PROJECT_STATUS.NOT_STARTED,
      priority: 'medium',
      startDate: new Date().toISOString(),
      endDate: DateUtils.format(DateUtils.addWorkdays(new Date(), 30), 'YYYY-MM-DD'),
      tasks: [],
      ...projectData
    }
    
    return await super.create(project)
  }
  
  /**
   * 更新项目状态
   * @param {string} projectId 项目ID
   * @param {string} status 新状态
   * @returns {Promise<object>} 更新后的项目
   */
  async updateStatus(projectId, status) {
    const project = await this.findById(projectId)
    if (!project) {
      throw new Error(`Project with id ${projectId} not found`)
    }
    
    return await this.update(projectId, { status })
  }
  
  /**
   * 获取项目及其任务
   * @param {string} projectId 项目ID
   * @returns {Promise<object>} 项目及任务数据
   */
  async getProjectWithTasks(projectId) {
    const project = await this.findById(projectId)
    if (!project) {
      throw new Error(`Project with id ${projectId} not found`)
    }
    
    // 获取项目的所有任务 - 使用单例
    const { taskDataService } = await import('./TaskDataService.js')
    const tasks = await taskDataService.findByProject(projectId)
    
    return {
      ...project,
      tasks
    }
  }
  
  /**
   * 添加任务到项目
   * @param {string} projectId 项目ID
   * @param {object} taskData 任务数据
   * @returns {Promise<object>} 创建的任务
   */
  async addTask(projectId, taskData) {
    const project = await this.findById(projectId)
    if (!project) {
      throw new Error(`Project with id ${projectId} not found`)
    }
    
    // 创建任务 - 使用单例
    const { taskDataService } = await import('./TaskDataService.js')
    const task = await taskDataService.create({
      ...taskData,
      projectId
    })
    
    // 状态计算已统一到甘特图页面
    
    return task
  }
  
  /**
   * 从项目中移除任务
   * @param {string} projectId 项目ID
   * @param {string} taskId 任务ID
   * @returns {Promise<boolean>} 是否成功
   */
  async removeTask(projectId, taskId) {
    const { taskDataService } = await import('./TaskDataService.js')
    const success = await taskDataService.delete(taskId)
    
    if (success) {
      // 状态计算已统一到甘特图页面
    }
    
    return success
  }
  
  // 状态计算逻辑已统一到甘特图页面，此方法已废弃
  async updateProjectStatusBasedOnTasks(projectId) {
    // 不再执行状态计算，状态由甘特图页面统一计算
    console.log('状态计算已统一到甘特图页面，跳过此方法')
  }
  
  /**
   * 获取项目统计信息
   * @param {string} projectId 项目ID
   * @returns {Promise<object>} 统计信息
   */
  async getProjectStatistics(projectId) {
    const projectWithTasks = await this.getProjectWithTasks(projectId)
    
    return calculationEngine.calculate('projectStats', [projectWithTasks])
  }
  
  /**
   * 获取所有项目的统计信息
   * @returns {Promise<object>} 统计信息
   */
  async getAllProjectsStatistics() {
    const projects = await this.findAll()
    
    // 为每个项目获取任务
    const projectsWithTasks = await Promise.all(
      projects.map(async (project) => {
        const tasks = await this.getProjectTasks(project.id)
        return { ...project, tasks }
      })
    )
    
    return calculationEngine.calculate('projectStats', projectsWithTasks)
  }
  
  // 状态计算逻辑已统一到甘特图页面，这些方法已废弃
  async recalculateAllProjectStatuses() {
    console.log('状态计算已统一到甘特图页面，跳过批量重新计算')
    return []
  }
  
  /**
   * 获取所有项目（状态由甘特图页面统一计算）
   * @param {object} filters 过滤条件
   * @param {object} options 查询选项
   * @returns {Promise<Array>} 项目列表
   */
  async findAllWithUpdatedStatus(filters = {}, options = {}) {
    // 直接返回项目列表，状态由甘特图页面统一计算
    return await this.findAll(filters, options)
  }
  
  /**
   * 获取项目的任务列表
   * @param {string} projectId 项目ID
   * @returns {Promise<Array>} 任务列表
   */
  async getProjectTasks(projectId) {
    const { taskDataService } = await import('./TaskDataService.js')
    return await taskDataService.findByProject(projectId)
  }
  
  /**
   * 搜索项目
   * @param {string} keyword 关键词
   * @param {object} filters 过滤条件
   * @returns {Promise<Array>} 搜索结果
   */
  async search(keyword, filters = {}) {
    const allProjects = await this.findAll()
    
    let results = allProjects
    
    // 关键词搜索
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase()
      results = results.filter(project => 
        project.name.toLowerCase().includes(lowerKeyword) ||
        (project.description && project.description.toLowerCase().includes(lowerKeyword))
      )
    }
    
    // 状态过滤
    if (filters.status) {
      results = results.filter(project => project.status === filters.status)
    }
    
    // 优先级过滤
    if (filters.priority) {
      results = results.filter(project => project.priority === filters.priority)
    }
    
    // 日期范围过滤
    if (filters.startDate && filters.endDate) {
      results = results.filter(project => 
        DateUtils.isBetween(project.startDate, filters.startDate, filters.endDate) ||
        DateUtils.isBetween(project.endDate, filters.startDate, filters.endDate)
      )
    }
    
    return results
  }
  
  /**
   * 获取超期项目
   * @returns {Promise<Array>} 超期项目列表
   */
  async getOverdueProjects() {
    const projects = await this.findAll()
    
    return projects.filter(project => 
      project.status !== PROJECT_STATUS.COMPLETED && 
      DateUtils.isOverdue(project.endDate)
    )
  }
  
  /**
   * 获取即将到期的项目
   * @param {number} days 天数
   * @returns {Promise<Array>} 即将到期的项目列表
   */
  async getUpcomingProjects(days = 7) {
    const projects = await this.findAll()
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + days)
    
    return projects.filter(project => {
      if (project.status === PROJECT_STATUS.COMPLETED) return false
      
      const endDate = new Date(project.endDate)
      const now = new Date()
      
      return endDate > now && endDate <= targetDate
    })
  }
  
  /**
   * 复制项目
   * @param {string} projectId 源项目ID
   * @param {object} options 复制选项
   * @returns {Promise<object>} 新项目
   */
  async duplicateProject(projectId, options = {}) {
    const sourceProject = await this.getProjectWithTasks(projectId)
    if (!sourceProject) {
      throw new Error(`Project with id ${projectId} not found`)
    }
    
    const {
      includeTasks = true,
      namePrefix = '副本 - ',
      resetDates = true
    } = options
    
    // 创建新项目
    const newProjectData = {
      ...sourceProject,
      name: namePrefix + sourceProject.name,
      status: PROJECT_STATUS.NOT_STARTED
    }
    
    // 重置日期
    if (resetDates) {
      const now = new Date()
      newProjectData.startDate = now.toISOString()
      newProjectData.endDate = DateUtils.addWorkdays(now, 30).toISOString()
    }
    
    delete newProjectData.id
    delete newProjectData.tasks
    delete newProjectData.createdAt
    delete newProjectData.updatedAt
    
    const newProject = await this.create(newProjectData)
    
    // 复制任务
    if (includeTasks && sourceProject.tasks.length > 0) {
      const { taskDataService } = await import('./TaskDataService.js')
      
      for (const task of sourceProject.tasks) {
        const newTaskData = {
          ...task,
          projectId: newProject.id,
          status: TASK_STATUS.NOT_STARTED
        }
        
        // 重置任务日期
        if (resetDates) {
          const taskDuration = DateUtils.diffInDays(task.startDate, task.endDate)
          newTaskData.startDate = newProject.startDate
          newTaskData.endDate = DateUtils.format(
            DateUtils.addWorkdays(new Date(newProject.startDate), taskDuration),
            'YYYY-MM-DD'
          )
        }
        
        delete newTaskData.id
        delete newTaskData.createdAt
        delete newTaskData.updatedAt
        
        await taskDataService.create(newTaskData)
      }
    }
    
    return newProject
  }
  
  /**
   * 导出项目数据
   * @param {Array} projectIds 项目ID列表，如果为空则导出所有项目
   * @returns {Promise<object>} 导出数据
   */
  async exportProjects(projectIds = []) {
    let projects
    
    if (projectIds.length > 0) {
      projects = await Promise.all(
        projectIds.map(id => this.getProjectWithTasks(id))
      )
    } else {
      const allProjects = await this.findAll()
      projects = await Promise.all(
        allProjects.map(project => this.getProjectWithTasks(project.id))
      )
    }
    
    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      projects: projects.filter(Boolean)
    }
  }
  
  /**
   * 导入项目数据
   * @param {object} importData 导入数据
   * @param {object} options 导入选项
   * @returns {Promise<Array>} 导入结果
   */
  async importProjects(importData, options = {}) {
    const { overwrite = false, validateData = true } = options
    
    if (!importData.projects || !Array.isArray(importData.projects)) {
      throw new Error('Invalid import data format')
    }
    
    const results = []
    const { taskDataService } = await import('./TaskDataService.js')
    
    for (const projectData of importData.projects) {
      try {
        // 验证数据
        if (validateData) {
          const validation = ValidationUtils.validateProject(projectData)
          if (!validation.isValid) {
            results.push({
              success: false,
              project: projectData.name,
              error: `Validation failed: ${Object.values(validation.errors).join(', ')}`
            })
            continue
          }
        }
        
        // 检查是否已存在
        const existing = await this.findAll({ name: projectData.name })
        if (existing.length > 0 && !overwrite) {
          results.push({
            success: false,
            project: projectData.name,
            error: 'Project already exists'
          })
          continue
        }
        
        // 导入项目
        const { tasks, ...projectInfo } = projectData
        delete projectInfo.id
        delete projectInfo.createdAt
        delete projectInfo.updatedAt
        
        const newProject = await this.create(projectInfo)
        
        // 导入任务
        if (tasks && tasks.length > 0) {
          for (const taskData of tasks) {
            const { id, createdAt, updatedAt, ...taskInfo } = taskData
            taskInfo.projectId = newProject.id
            
            await taskDataService.create(taskInfo)
          }
        }
        
        results.push({
          success: true,
          project: projectData.name,
          id: newProject.id
        })
        
      } catch (error) {
        results.push({
          success: false,
          project: projectData.name || 'Unknown',
          error: error.message
        })
      }
    }
    
    return results
  }
}

// 创建单例实例
export const projectDataService = new ProjectDataService()