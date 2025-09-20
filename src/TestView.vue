<template>
  <div class="test-view">
    <h1>测试页面</h1>
    <p>如果你能看到这个页面，说明 Vue 和路由工作正常</p>
    <el-button type="primary">Element Plus 按钮测试</el-button>
    <div class="test-data">
      <h2>数据测试</h2>
      <p>当前时间: {{ currentTime }}</p>
      <p>计数器: {{ counter }}</p>
      <el-button @click="counter++">增加计数</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const currentTime = ref('')
const counter = ref(0)

onMounted(() => {
  currentTime.value = new Date().toLocaleString()
  console.log('测试页面已挂载')
})
</script>

<style scoped>
.test-view {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-data {
  margin-top: 20px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}
</style>