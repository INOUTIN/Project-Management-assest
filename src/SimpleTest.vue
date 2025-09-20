<template>
  <div style="padding: 20px; background: white; min-height: 100vh;">
    <h1 style="color: red; font-size: 32px;">🎉 测试成功！</h1>
    <p style="font-size: 18px; color: blue;">如果你能看到这个页面，说明 Vue 应用正常工作！</p>
    
    <div style="margin: 20px 0; padding: 20px; border: 2px solid green; background: #f0f9ff;">
      <h2>基础功能测试</h2>
      <p>当前时间: <strong>{{ currentTime }}</strong></p>
      <p>计数器: <strong style="color: red; font-size: 24px;">{{ counter }}</strong></p>
      <button 
        @click="counter++" 
        style="padding: 10px 20px; background: #409eff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;"
      >
        点击增加计数 (+1)
      </button>
    </div>

    <div style="margin: 20px 0; padding: 20px; border: 2px solid orange; background: #fff7ed;">
      <h2>Element Plus 测试</h2>
      <el-button type="primary" size="large">Element Plus 按钮</el-button>
      <el-button type="success" @click="showMessage">显示消息</el-button>
    </div>

    <div style="margin: 20px 0; padding: 20px; border: 2px solid purple; background: #faf5ff;">
      <h2>路由测试</h2>
      <p>当前路由: <strong>{{ $route.path }}</strong></p>
      <button 
        @click="goToDashboard"
        style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;"
      >
        跳转到仪表盘
      </button>
      <button 
        @click="goToProjectManagement"
        style="padding: 10px 20px; background: #f59e0b; color: white; border: none; border-radius: 4px; cursor: pointer;"
      >
        跳转到项目管理
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const currentTime = ref('')
const counter = ref(0)

const showMessage = () => {
  ElMessage.success('Element Plus 消息组件工作正常！')
}

const goToDashboard = () => {
  router.push('/dashboard')
}

const goToProjectManagement = () => {
  router.push('/project-management')
}

onMounted(() => {
  currentTime.value = new Date().toLocaleString()
  console.log('🎉 简单测试页面已成功挂载！')
  console.log('当前路由:', router.currentRoute.value.path)
})
</script>