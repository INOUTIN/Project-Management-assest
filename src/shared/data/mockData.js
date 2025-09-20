import { PROJECT_STATUS, TASK_STATUS, PRIORITY } from '@shared/utils/constants.js'
import { DateUtils } from '@shared/utils/date.js'

/**
 * 模拟项目数据
 */
export const mockProjects = [
  {
    id: 'proj-001',
    name: '企业官网重构项目',
    description: '对公司官网进行全面重构，提升用户体验和性能',
    startDate: DateUtils.addDays(new Date(), -30).toISOString(),
    endDate: DateUtils.addDays(new Date(), 30).toISOString(),
    status: PROJECT_STATUS.IN_PROGRESS,
    members: [
      { id: 'user-001', name: '张三', avatar: '', role: '项目经理' },
      { id: 'user-002', name: '李四', avatar: '', role: '前端开发' },
      { id: 'user-003', name: '王五', avatar: '', role: '后端开发' }
    ],
    createdAt: DateUtils.addDays(new Date(), -35).toISOString(),
    updatedAt: DateUtils.addDays(new Date(), -1).toISOString()
  },
  {
    id: 'proj-002',
    name: '移动端APP开发',
    description: '开发企业移动端应用，支持iOS和Android平台',
    startDate: DateUtils.addDays(new Date(), -20).toISOString(),
    endDate: DateUtils.addDays(new Date(), 45).toISOString(),
    status: PROJECT_STATUS.IN_PROGRESS,
    members: [
      { id: 'user-004', name: '赵六', avatar: '', role: '项目经理' },
      { id: 'user-005', name: '钱七', avatar: '', role: 'iOS开发' },
      { id: 'user-006', name: '孙八', avatar: '', role: 'Android开发' }
    ],
    createdAt: DateUtils.addDays(new Date(), -25).toISOString(),
    updatedAt: DateUtils.addDays(new Date(), -2).toISOString()
  },
  {
    id: 'proj-003',
    name: '数据分析平台',
    description: '构建企业数据分析平台，提供实时数据监控和分析功能',
    startDate: DateUtils.addDays(new Date(), -60).toISOString(),
    endDate: DateUtils.addDays(new Date(), -10).toISOString(),
    status: PROJECT_STATUS.COMPLETED,
    members: [
      { id: 'user-007', name: '周九', avatar: '', role: '项目经理' },
      { id: 'user-008', name: '吴十', avatar: '', role: '数据工程师' }
    ],
    createdAt: DateUtils.addDays(new Date(), -70).toISOString(),
    updatedAt: DateUtils.addDays(new Date(), -10).toISOString()
  },
  {
    id: 'proj-004',
    name: '客户关系管理系统',
    description: 'CRM系统升级改造，提升客户管理效率',
    startDate: DateUtils.addDays(new Date(), -15).toISOString(),
    endDate: DateUtils.addDays(new Date(), -5).toISOString(),
    status: PROJECT_STATUS.OVERDUE,
    members: [
      { id: 'user-009', name: '郑十一', avatar: '', role: '项目经理' },
      { id: 'user-010', name: '王十二', avatar: '', role: '系统分析师' }
    ],
    createdAt: DateUtils.addDays(new Date(), -20).toISOString(),
    updatedAt: DateUtils.addDays(new Date(), -3).toISOString()
  },
  {
    id: 'proj-005',
    name: '智能办公系统',
    description: '开发智能办公系统，整合各种办公工具',
    startDate: DateUtils.addDays(new Date(), 10).toISOString(),
    endDate: DateUtils.addDays(new Date(), 90).toISOString(),
    status: PROJECT_STATUS.NOT_STARTED,
    members: [
      { id: 'user-013', name: '李十三', avatar: '', role: '项目经理' }
    ],
    createdAt: DateUtils.addDays(new Date(), -5).toISOString(),
    updatedAt: DateUtils.addDays(new Date(), -1).toISOString()
  }
]

/**
 * 模拟任务数据
 */
export const mockTasks = [
  // 企业官网重构项目的任务
  {
    id: 'task-001',
    projectId: 'proj-001',
    name: '需求分析和设计',
    description: '分析现有网站问题，设计新的用户界面和交互流程',
    startDate: DateUtils.addDays(new Date(), -30).toISOString(),
    endDate: DateUtils.addDays(new Date(), -20).toISOString(),
    status: TASK_STATUS.COMPLETED,
    priority: PRIORITY.HIGH,
    isMilestone: true,
    assignee: '张三',
    progress: 100,
    dependencies: [],
    createdAt: DateUtils.addDays(new Date(), -35).toISOString(),
    updatedAt: DateUtils.addDays(new Date(), -20).toISOString()
  },
  {
    id: 'task-002',
    projectId: 'proj-001',
    name: '前端页面开发',
    description: '根据设计稿开发前端页面，包括首页、产品页、关于我们等',
    startDate: DateUtils.addDays(new Date(), -18).toISOString(),
    endDate: DateUtils.addDays(new Date(), 5).toISOString(),
    status: TASK_STATUS.IN_PROGRESS,
    priority: PRIORITY.HIGH,
    isMilestone: false,
    assignee: '李四',
    progress: 65,
    dependencies: ['task-001'],
    createdAt: DateUtils.addDays(new Date(), -25).toISOString(),
    updatedAt: DateUtils.addDays(new Date(), -1).toISOString()
  },
  {
    id: 'task-003',
    projectId: 'proj-001',
    name: '后端API开发',
    description: '开发网站所需的后端API接口',
    startDate: DateUtils.addDays(new Date(), -15).toISOString(),
    endDate: DateUtils.addDays(new Date(), 10).toISOString(),
    status: TASK_STATUS.IN_PROGRESS,
    priority: PRIORITY.MEDIUM,
    isMilestone: false,
    assignee: '王五',
    progress: 40,
    dependencies: ['task-001'],
    createdAt: DateUtils.addDays(new Date(), -20).toISOString(),
    updatedAt: DateUtils.addDays(new Date(), -2).toISOString()
  },
  {
    id: 'task-004',
    projectId: 'proj-001',
    name: '系统测试',
    description: '进行全面的系统测试，包括功能测试、性能测试等',
    startDate: DateUtils.addDays(new Date(), 8).toISOString(),
    endDate: DateUtils.addDays(new Date(), 20).toISOString(),
    status: TASK_STATUS.NOT_STARTED,
    priority: PRIORITY.HIGH,
    isMilestone: false,
    assignee: '张三',
    progress: 0,
    dependencies: ['task-002', 'task-003'],
    createdAt: DateUtils.addDays(new Date(), -15).toISOString(),
    updatedAt: DateUtils.addDays(new Date(), -15).toISOString()
  },
  {
    id: 'task-005',
    projectId: 'proj-001',
    name: '上线部署',
    description: '将网站部署到生产环境',
    startDate: DateUtils.addDays(new Date(), 22).toISOString(),
    endDate: DateUtils.addDays(new Date(), 30).toISOString(),
    status: TASK_STATUS.NOT_STARTED,
    priority: PRIORITY.HIGH,
    isMilestone: true,
    assignee: '王五',
    progress: 0,
    dependencies: ['task-004'],
    createdAt: DateUtils.addDays(new Date(), -10).toISOString(),
    updatedAt: DateUtils.addDays(new Date(), -10).toISOString()
  },

  // 移动端APP开发的任务
  {
    id: 'task-006',
    projectId: 'proj-002',
    name: 'UI/UX设计',
    description: '设计移动端应用的用户界面和用户体验',
    startDate: DateUtils.addDays(new Date(), -20).toISOString(),
    endDate: DateUtils.addDays(new Date(), -5).toISOString(),
    status: TASK_STATUS.COMPLETED,
    priority: PRIORITY.HIGH,
    isMilestone: true,
    assignee: '赵六',
    progress: 100,
    dependencies: [],
    createdAt: DateUtils.addDays(new Date(), -25).toISOString(),
    updatedAt: DateUtils.addDays(new Date(), -5).toISOString()
  },
  {
    id: 'task-007',
    projectId: 'proj-002',
    name: 'iOS应用开发',
    description: '开发iOS版本的移动应用',
    startDate: DateUtils.addDays(new Date(), -3).toISOString(),
    endDate: DateUtils.addDays(new Date(), 25).toISOString(),
    status: TASK_STATUS.IN_PROGRESS,
    priority: PRIORITY.HIGH,
    isMilestone: false,
    assignee: '钱七',
    progress: 30,
    dependencies: ['task-006'],
    createdAt: DateUtils.addDays(new Date(), -10).toISOString(),
    updatedAt: DateUtils.addDays(new Date(), -1).toISOString()
  },
  {
    id: 'task-008',
    projectId: 'proj-002',
    name: 'Android应用开发',
    description: '开发Android版本的移动应用',
    startDate: DateUtils.addDays(new Date(), -3).toISOString(),
    endDate: DateUtils.addDays(new Date(), 25).toISOString(),
    status: TASK_STATUS.IN_PROGRESS,
    priority: PRIORITY.HIGH,
    isMilestone: false,
    assignee: '孙八',
    progress: 25,
    dependencies: ['task-006'],
    createdAt: DateUtils.addDays(new Date(), -10).toISOString(),
    updatedAt: DateUtils.addDays(new Date(), -1).toISOString()
  },

  // 超期任务示例
  {
    id: 'task-009',
    projectId: 'proj-004',
    name: '数据库设计',
    description: 'CRM系统数据库结构设计',
    startDate: DateUtils.addDays(new Date(), -15).toISOString(),
    endDate: DateUtils.addDays(new Date(), -2).toISOString(),
    status: TASK_STATUS.IN_PROGRESS,
    priority: PRIORITY.HIGH,
    isMilestone: false,
    assignee: '郑十一',
    progress: 80,
    dependencies: [],
    createdAt: DateUtils.addDays(new Date(), -20).toISOString(),
    updatedAt: DateUtils.addDays(new Date(), -3).toISOString()
  },
  {
    id: 'task-010',
    projectId: 'proj-004',
    name: '系统架构设计',
    description: 'CRM系统整体架构设计',
    startDate: DateUtils.addDays(new Date(), -10).toISOString(),
    endDate: DateUtils.addDays(new Date(), 2).toISOString(),
    status: TASK_STATUS.IN_PROGRESS,
    priority: PRIORITY.MEDIUM,
    isMilestone: false,
    assignee: '王十二',
    progress: 60,
    dependencies: [],
    createdAt: DateUtils.addDays(new Date(), -15).toISOString(),
    updatedAt: DateUtils.addDays(new Date(), -2).toISOString()
  },

  // 即将到期的任务
  {
    id: 'task-011',
    projectId: 'proj-002',
    name: '应用测试',
    description: '移动应用功能测试和性能测试',
    startDate: DateUtils.addDays(new Date(), 20).toISOString(),
    endDate: DateUtils.addDays(new Date(), 35).toISOString(),
    status: TASK_STATUS.NOT_STARTED,
    priority: PRIORITY.HIGH,
    isMilestone: false,
    assignee: '赵六',
    progress: 0,
    dependencies: ['task-007', 'task-008'],
    createdAt: DateUtils.addDays(new Date(), -5).toISOString(),
    updatedAt: DateUtils.addDays(new Date(), -5).toISOString()
  },
  {
    id: 'task-012',
    projectId: 'proj-001',
    name: '性能优化',
    description: '网站性能优化和SEO优化',
    startDate: DateUtils.addDays(new Date(), 1).toISOString(),
    endDate: DateUtils.addDays(new Date(), 8).toISOString(),
    status: TASK_STATUS.NOT_STARTED,
    priority: PRIORITY.MEDIUM,
    isMilestone: false,
    assignee: '李四',
    progress: 0,
    dependencies: ['task-002'],
    createdAt: DateUtils.addDays(new Date(), -8).toISOString(),
    updatedAt: DateUtils.addDays(new Date(), -8).toISOString()
  }
]

/**
 * 为任务添加项目名称
 */
export const enrichTasksWithProjectNames = (tasks, projects) => {
  const projectMap = new Map(projects.map(p => [p.id, p.name]))
  
  return tasks.map(task => ({
    ...task,
    projectName: projectMap.get(task.projectId) || '未知项目'
  }))
}

/**
 * 获取模拟数据
 */
export const getMockData = () => {
  const projects = mockProjects
  const tasks = enrichTasksWithProjectNames(mockTasks, projects)
  
  return {
    projects,
    tasks
  }
}

/**
 * 初始化模拟数据到本地存储
 */
export const initializeMockData = () => {
  const { projects, tasks } = getMockData()
  
  // 检查是否已有数据
  const existingProjects = localStorage.getItem('pmt_projects_data')
  const existingTasks = localStorage.getItem('pmt_tasks_data')
  
  if (!existingProjects) {
    localStorage.setItem('pmt_projects_data', JSON.stringify(projects))
    console.log('Mock projects data initialized')
  }
  
  if (!existingTasks) {
    localStorage.setItem('pmt_tasks_data', JSON.stringify(tasks))
    console.log('Mock tasks data initialized')
  }
  
  return { projects, tasks }
}