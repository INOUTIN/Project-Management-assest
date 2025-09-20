<template>
  <div class="project-management">
    <div class="project-management__header">
      <h1 class="project-management__title">项目管理</h1>
      <el-button 
        type="primary" 
        :icon="Plus" 
        @click="showCreateDialog = true"
        class="project-management__create-btn"
      >
        新建项目
      </el-button>
    </div>

    <!-- 搜索和筛选 -->
    <div class="project-management__filters">
      <el-input
        v-model="searchQuery"
        placeholder="搜索项目名称..."
        :prefix-icon="Search"
        class="project-management__search"
        clearable
      />
      <el-select
        v-model="statusFilter"
        placeholder="项目状态"
        clearable
        class="project-management__status-filter"
      >
        <el-option label="全部状态" value="" />
        <el-option label="未开始" value="not_started" />
        <el-option label="进行中" value="in_progress" />
        <el-option label="已完成" value="completed" />
        <el-option label="超期" value="overdue" />
      </el-select>
    </div>

    <!-- 项目列表 -->
    <div class="project-management__content">
      <div v-if="loading" class="project-management__loading">
        <el-skeleton :rows="3" animated />
      </div>
      
      <div v-else-if="filteredProjects.length === 0" class="project-management__empty">
        <el-empty description="暂无项目数据" />
      </div>
      
      <div v-else class="project-management__grid">
        <ProjectCard
          v-for="project in filteredProjects"
          :key="project.id"
          :project="project"
          :show-actions="true"
          @click="handleProjectClick"
          @edit="handleEditProject"
          @delete="handleDeleteProject"
        />
      </div>
    </div>

    <!-- 新建项目对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="新建项目"
      width="800px"
      :before-close="handleCloseCreateDialog"
    >
      <ProjectForm
        :project="null"
        @submit="handleCreateProject"
        @cancel="showCreateDialog = false"
      />
    </el-dialog>

    <!-- 编辑项目对话框 -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑项目"
      width="800px"
      :before-close="handleCloseEditDialog"
    >
      <ProjectForm
        :project="editingProject"
        @submit="handleUpdateProject"
        @cancel="showEditDialog = false"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'

// 组件导入
import ProjectForm from '../components/ProjectForm.vue'

// 临时使用仪表盘的 ProjectCard
import ProjectCard from '@features/dashboard/components/ProjectCard.vue'

// 数据中心
import { getGlobalProjectDataCenter } from '@features/gantt-chart/composables/useProjectDataCenter.js'

const router = useRouter()

// 使用全局数据中心
const dataCenter = getGlobalProjectDataCenter()

// 解构数据中心的状态和方法
const {
  projectsData,
  loading,
  loadAllProjects,
  createProject,
  updateProject,
  deleteProject
} = dataCenter

// 响应式数据
const searchQuery = ref('')
const statusFilter = ref('')
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const editingProject = ref(null)

// 计算属性
const filteredProjects = computed(() => {
  let filtered = projectsData.value

  // 按搜索关键词筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(project => 
      project.name.toLowerCase().includes(query) ||
      (project.description && project.description.toLowerCase().includes(query))
    )
  }

  // 按状态筛选
  if (statusFilter.value) {
    filtered = filtered.filter(project => {
      const status = project.calculatedStatus || 'not_started'
      return status === statusFilter.value || status.includes(statusFilter.value)
    })
  }

  return filtered
})

// 方法
const loadProjects = async () => {
  try {
    await loadAllProjects()
    console.log('项目管理页面：已从数据中心加载项目', projectsData.value.length)
  } catch (error) {
    console.error('Failed to load projects:', error)
    ElMessage.error('加载项目数据失败')
  }
}

const handleProjectClick = (project) => {
  // 跳转到甘特图页面
  router.push(`/gantt/${project.id}`)
}

const handleEditProject = (project) => {
  editingProject.value = { ...project }
  showEditDialog.value = true
}

const handleDeleteProject = async (project) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除项目"${project.name}"吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await deleteProject(project.id)
    ElMessage.success('项目删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete project:', error)
      ElMessage.error('删除项目失败')
    }
  }
}

const handleCreateProject = async (projectData) => {
  try {
    await createProject(projectData)
    showCreateDialog.value = false
    ElMessage.success('项目创建成功')
  } catch (error) {
    console.error('Failed to create project:', error)
    ElMessage.error('创建项目失败')
  }
}

const handleUpdateProject = async (projectData) => {
  try {
    await updateProject(editingProject.value.id, projectData)
    showEditDialog.value = false
    editingProject.value = null
    ElMessage.success('项目更新成功')
  } catch (error) {
    console.error('Failed to update project:', error)
    ElMessage.error('更新项目失败')
  }
}

const handleCloseCreateDialog = (done) => {
  ElMessageBox.confirm('确定要关闭吗？未保存的数据将丢失。')
    .then(() => {
      done()
    })
    .catch(() => {
      // 取消关闭
    })
}

const handleCloseEditDialog = (done) => {
  ElMessageBox.confirm('确定要关闭吗？未保存的修改将丢失。')
    .then(() => {
      editingProject.value = null
      done()
    })
    .catch(() => {
      // 取消关闭
    })
}

// 生命周期
onMounted(() => {
  loadProjects()
})
</script>

<style lang="scss" scoped>
.project-management {
  padding: 24px;
  background: var(--color-bg-light);
  min-height: 100vh;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  &__title {
    font-size: 28px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }

  &__create-btn {
    height: 40px;
    padding: 0 20px;
    font-size: 14px;
  }

  &__filters {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
    align-items: center;
  }

  &__search {
    width: 300px;
  }

  &__status-filter {
    width: 150px;
  }

  &__content {
    min-height: 400px;
  }

  &__loading {
    padding: 20px;
  }

  &__empty {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 300px;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 20px;
  }

  // 响应式设计
  @media (max-width: 768px) {
    padding: 16px;

    &__header {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;
    }

    &__title {
      font-size: 24px;
      text-align: center;
    }

    &__filters {
      flex-direction: column;
      gap: 12px;
    }

    &__search,
    &__status-filter {
      width: 100%;
    }

    &__grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }
}

// 对话框样式调整
:deep(.el-dialog) {
  margin-top: 5vh;
  
  @media (max-width: 768px) {
    width: 95% !important;
    margin: 5vh auto;
  }
}

:deep(.el-dialog__body) {
  padding: 20px;
}
</style>