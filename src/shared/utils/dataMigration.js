/**
 * 数据迁移工具 - 处理旧版本数据格式的迁移
 */

import { projectDataService } from '@/shared/services/data/ProjectDataService.js'

/**
 * 迁移旧版本项目数据
 */
export async function migrateProjectData() {
  try {
    // 检查是否有旧版本数据
    const oldProjectsData = localStorage.getItem('pmt_projects_data')
    if (!oldProjectsData) {
      console.log('No legacy project data found')
      return
    }

    console.log('Found legacy project data, starting migration...')
    
    // 使用单例实例
    const oldProjects = JSON.parse(oldProjectsData)
    
    // 检查新版本是否已有数据
    const existingProjects = await projectDataService.findAll()
    if (existingProjects.length > 0) {
      console.log('New format data already exists, skipping migration')
      return
    }

    // 迁移每个项目
    let migratedCount = 0
    for (const project of oldProjects) {
      try {
        // 确保项目数据格式正确
        const migratedProject = {
          name: project.name || '未命名项目',
          description: project.description || '',
          status: project.status || 'not_started',
          priority: project.priority || 'medium',
          startDate: project.startDate || new Date().toISOString(),
          endDate: project.endDate || new Date().toISOString(),
          tasks: project.tasks || [],
          // 保留原有的时间戳
          createdAt: project.createdAt || new Date().toISOString(),
          updatedAt: project.updatedAt || new Date().toISOString()
        }

        // 如果有原始ID，尝试保留
        if (project.id) {
          // 直接使用存储服务保存，绕过create方法的ID生成
          await projectDataService.storage.save(project.id, {
            id: project.id,
            ...migratedProject
          })
        } else {
          await projectDataService.create(migratedProject)
        }
        
        migratedCount++
      } catch (error) {
        console.error('Failed to migrate project:', project, error)
      }
    }

    console.log(`Successfully migrated ${migratedCount} projects`)
    
    // 迁移完成后，备份旧数据并删除
    localStorage.setItem('pmt_projects_data_backup', oldProjectsData)
    localStorage.removeItem('pmt_projects_data')
    
    console.log('Migration completed, old data backed up and removed')
    
  } catch (error) {
    console.error('Data migration failed:', error)
  }
}

/**
 * 迁移旧版本任务数据
 */
export async function migrateTaskData() {
  try {
    // 检查是否有旧版本任务数据
    const oldTasksData = localStorage.getItem('pmt_tasks_data')
    if (!oldTasksData) {
      console.log('No legacy task data found')
      return
    }

    console.log('Found legacy task data, starting migration...')
    
    // 这里可以添加任务数据迁移逻辑
    // 目前先备份旧数据
    localStorage.setItem('pmt_tasks_data_backup', oldTasksData)
    
    console.log('Task data backed up')
    
  } catch (error) {
    console.error('Task data migration failed:', error)
  }
}

/**
 * 执行所有数据迁移
 */
export async function runDataMigration() {
  console.log('Starting data migration...')
  
  await migrateProjectData()
  await migrateTaskData()
  
  console.log('Data migration completed')
}

/**
 * 检查是否需要数据迁移
 */
export function needsMigration() {
  const hasOldProjectData = localStorage.getItem('pmt_projects_data')
  const hasOldTaskData = localStorage.getItem('pmt_tasks_data')
  
  return !!(hasOldProjectData || hasOldTaskData)
}