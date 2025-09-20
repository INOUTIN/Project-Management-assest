<template>
  <div class="dashboard-settings">
    <el-form :model="settings" label-width="120px">
      <el-form-item label="自动刷新">
        <el-switch
          v-model="settings.autoRefresh"
          @change="handleAutoRefreshChange"
        />
        <span class="form-help">开启后将定期自动刷新数据</span>
      </el-form-item>
      
      <el-form-item 
        label="刷新间隔" 
        v-if="settings.autoRefresh"
      >
        <el-select
          v-model="settings.refreshInterval"
          @change="handleRefreshIntervalChange"
        >
          <el-option label="1分钟" :value="60000" />
          <el-option label="3分钟" :value="180000" />
          <el-option label="5分钟" :value="300000" />
          <el-option label="10分钟" :value="600000" />
          <el-option label="30分钟" :value="1800000" />
        </el-select>
        <span class="form-help">设置数据自动刷新的时间间隔</span>
      </el-form-item>
      
      <el-form-item label="默认视图">
        <el-radio-group v-model="settings.defaultViewMode">
          <el-radio label="grid">网格视图</el-radio>
          <el-radio label="list">列表视图</el-radio>
        </el-radio-group>
      </el-form-item>
      
      <el-form-item label="显示设置">
        <el-checkbox-group v-model="settings.displayOptions">
          <el-checkbox label="showProjectStats">显示项目统计</el-checkbox>
          <el-checkbox label="showTaskStats">显示任务统计</el-checkbox>
          <el-checkbox label="showReminders">显示超期提醒</el-checkbox>
          <el-checkbox label="showRecentProjects">显示最近项目</el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      
      <el-form-item label="提醒设置">
        <div class="reminder-settings">
          <el-form-item label="7天提醒">
            <el-switch v-model="settings.reminders.urgent" />
          </el-form-item>
          <el-form-item label="14天提醒">
            <el-switch v-model="settings.reminders.normal" />
          </el-form-item>
          <el-form-item label="桌面通知">
            <el-switch 
              v-model="settings.reminders.desktop"
              @change="handleDesktopNotificationChange"
            />
          </el-form-item>
        </div>
      </el-form-item>
      
      <el-form-item label="数据导出">
        <el-button-group>
          <el-button @click="handleExportData('json')">
            导出JSON
          </el-button>
          <el-button @click="handleExportData('csv')">
            导出CSV
          </el-button>
        </el-button-group>
      </el-form-item>
      
      <el-form-item label="数据管理">
        <el-button-group>
          <el-button @click="handleClearCache">
            清除缓存
          </el-button>
          <el-button 
            type="danger" 
            @click="handleResetSettings"
          >
            重置设置
          </el-button>
        </el-button-group>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps({
  autoRefresh: {
    type: Boolean,
    default: true
  },
  refreshInterval: {
    type: Number,
    default: 300000 // 5分钟
  }
})

const emit = defineEmits([
  'update:auto-refresh',
  'update:refresh-interval'
])

// 设置数据
const settings = ref({
  autoRefresh: props.autoRefresh,
  refreshInterval: props.refreshInterval,
  defaultViewMode: 'grid',
  displayOptions: [
    'showProjectStats',
    'showTaskStats', 
    'showReminders',
    'showRecentProjects'
  ],
  reminders: {
    urgent: true,
    normal: true,
    desktop: false
  }
})

// 监听props变化
watch(() => props.autoRefresh, (newVal) => {
  settings.value.autoRefresh = newVal
})

watch(() => props.refreshInterval, (newVal) => {
  settings.value.refreshInterval = newVal
})

// 方法
const handleAutoRefreshChange = (value) => {
  emit('update:auto-refresh', value)
  ElMessage.success(value ? '已开启自动刷新' : '已关闭自动刷新')
}

const handleRefreshIntervalChange = (value) => {
  emit('update:refresh-interval', value)
  const minutes = value / 60000
  ElMessage.success(`刷新间隔已设置为 ${minutes} 分钟`)
}

const handleDesktopNotificationChange = async (value) => {
  if (value) {
    // 请求桌面通知权限
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        settings.value.reminders.desktop = false
        ElMessage.warning('桌面通知权限被拒绝')
        return
      }
      ElMessage.success('桌面通知已开启')
    } else {
      settings.value.reminders.desktop = false
      ElMessage.warning('浏览器不支持桌面通知')
    }
  } else {
    ElMessage.success('桌面通知已关闭')
  }
}

const handleExportData = async (format) => {
  try {
    ElMessage.info(`正在导出${format.toUpperCase()}格式数据...`)
    
    // 这里应该调用实际的导出逻辑
    // const data = await exportService.exportDashboardData(format)
    
    // 模拟导出
    setTimeout(() => {
      ElMessage.success(`${format.toUpperCase()}数据导出成功`)
    }, 1000)
    
  } catch (error) {
    ElMessage.error('数据导出失败: ' + error.message)
  }
}

const handleClearCache = async () => {
  try {
    await ElMessageBox.confirm(
      '清除缓存将删除所有本地存储的数据，确定要继续吗？',
      '确认清除缓存',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 清除本地存储
    localStorage.clear()
    sessionStorage.clear()
    
    ElMessage.success('缓存清除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('缓存清除失败: ' + error.message)
    }
  }
}

const handleResetSettings = async () => {
  try {
    await ElMessageBox.confirm(
      '重置设置将恢复所有默认配置，确定要继续吗？',
      '确认重置设置',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 重置设置
    settings.value = {
      autoRefresh: true,
      refreshInterval: 300000,
      defaultViewMode: 'grid',
      displayOptions: [
        'showProjectStats',
        'showTaskStats', 
        'showReminders',
        'showRecentProjects'
      ],
      reminders: {
        urgent: true,
        normal: true,
        desktop: false
      }
    }
    
    // 触发更新事件
    emit('update:auto-refresh', true)
    emit('update:refresh-interval', 300000)
    
    ElMessage.success('设置已重置为默认值')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('设置重置失败: ' + error.message)
    }
  }
}

// 保存设置到本地存储
const saveSettings = () => {
  try {
    localStorage.setItem('dashboard-settings', JSON.stringify(settings.value))
  } catch (error) {
    console.warn('Failed to save settings to localStorage:', error)
  }
}

// 从本地存储加载设置
const loadSettings = () => {
  try {
    const saved = localStorage.getItem('dashboard-settings')
    if (saved) {
      const parsed = JSON.parse(saved)
      settings.value = { ...settings.value, ...parsed }
    }
  } catch (error) {
    console.warn('Failed to load settings from localStorage:', error)
  }
}

// 监听设置变化并保存
watch(settings, saveSettings, { deep: true })

// 组件挂载时加载设置
loadSettings()
</script>

<style lang="scss" scoped>
.dashboard-settings {
  .form-help {
    margin-left: 8px;
    color: var(--color-text-secondary);
    font-size: 13px;
  }
  
  .reminder-settings {
    .el-form-item {
      margin-bottom: 12px;
      
      :deep(.el-form-item__label) {
        width: 80px !important;
        font-size: 13px;
      }
    }
  }
  
  .el-button-group {
    .el-button {
      margin-right: 0;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .dashboard-settings {
    :deep(.el-form-item__label) {
      width: 100px !important;
    }
    
    .el-button-group {
      display: flex;
      flex-direction: column;
      
      .el-button {
        margin-bottom: 8px;
        border-radius: 4px !important;
        
        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
}
</style>