<template>
  <div class="not-found">
    <div class="not-found__container">
      <div class="not-found__illustration">
        <div class="not-found__number">404</div>
        <div class="not-found__icon">
          <el-icon :size="120" color="var(--color-text-secondary)">
            <DocumentDelete />
          </el-icon>
        </div>
      </div>
      
      <div class="not-found__content">
        <h1 class="not-found__title">页面未找到</h1>
        <p class="not-found__description">
          抱歉，您访问的页面不存在或已被移除。
        </p>
        
        <div class="not-found__suggestions">
          <h3>您可以尝试：</h3>
          <ul>
            <li>检查网址是否正确</li>
            <li>返回首页重新导航</li>
            <li>使用搜索功能查找内容</li>
          </ul>
        </div>
        
        <div class="not-found__actions">
          <el-button type="primary" @click="goHome" :icon="House">
            返回首页
          </el-button>
          <el-button @click="goBack" :icon="ArrowLeft">
            返回上页
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- 快捷导航 -->
    <div class="not-found__quick-nav">
      <h3>快捷导航</h3>
      <div class="quick-nav-grid">
        <router-link 
          to="/dashboard" 
          class="quick-nav-item"
        >
          <el-icon :size="24">
            <DataBoard />
          </el-icon>
          <span>仪表盘</span>
        </router-link>
        
        <router-link 
          to="/projects" 
          class="quick-nav-item"
        >
          <el-icon :size="24">
            <FolderOpened />
          </el-icon>
          <span>项目管理</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { 
  DocumentDelete, 
  House, 
  ArrowLeft, 
  DataBoard, 
  FolderOpened 
} from '@element-plus/icons-vue'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>

<style lang="scss" scoped>
.not-found {
  min-height: 100vh;
  background: var(--color-bg-light);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-extra-large);
  text-align: center;

  &__container {
    max-width: 600px;
    width: 100%;
  }

  &__illustration {
    position: relative;
    margin-bottom: var(--spacing-extra-large);
  }

  &__number {
    font-size: 120px;
    font-weight: 900;
    color: var(--color-primary-light-7);
    line-height: 1;
    margin-bottom: var(--spacing-medium);
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  }

  &__icon {
    margin-bottom: var(--spacing-large);
  }

  &__content {
    margin-bottom: var(--spacing-extra-large);
  }

  &__title {
    font-size: var(--font-size-extra-large);
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-medium);
  }

  &__description {
    font-size: var(--font-size-medium);
    color: var(--color-text-secondary);
    line-height: 1.6;
    margin-bottom: var(--spacing-large);
  }

  &__suggestions {
    background: var(--color-bg-white);
    border-radius: var(--border-radius-base);
    padding: var(--spacing-large);
    margin-bottom: var(--spacing-large);
    box-shadow: var(--shadow-lighter);
    text-align: left;

    h3 {
      font-size: var(--font-size-medium);
      color: var(--color-text-primary);
      margin-bottom: var(--spacing-medium);
    }

    ul {
      list-style: none;
      padding: 0;

      li {
        position: relative;
        padding-left: var(--spacing-large);
        margin-bottom: var(--spacing-small);
        color: var(--color-text-regular);

        &::before {
          content: '•';
          position: absolute;
          left: 0;
          color: var(--color-primary);
          font-weight: bold;
        }
      }
    }
  }

  &__actions {
    display: flex;
    gap: var(--spacing-medium);
    justify-content: center;
    flex-wrap: wrap;
  }

  &__quick-nav {
    margin-top: var(--spacing-extra-large);
    padding-top: var(--spacing-extra-large);
    border-top: 1px solid var(--color-border-lighter);
    width: 100%;
    max-width: 400px;

    h3 {
      font-size: var(--font-size-medium);
      color: var(--color-text-primary);
      margin-bottom: var(--spacing-medium);
    }
  }
}

.quick-nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-medium);
}

.quick-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-small);
  padding: var(--spacing-large);
  background: var(--color-bg-white);
  border-radius: var(--border-radius-base);
  box-shadow: var(--shadow-lighter);
  transition: var(--transition-base);
  text-decoration: none;
  color: var(--color-text-primary);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-light);
    color: var(--color-primary);
  }

  span {
    font-size: var(--font-size-small);
    font-weight: 500;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .not-found {
    padding: var(--spacing-large);

    &__number {
      font-size: 80px;
    }

    &__title {
      font-size: var(--font-size-large);
    }

    &__actions {
      flex-direction: column;
      align-items: center;

      .el-button {
        width: 200px;
      }
    }

    &__suggestions {
      text-align: center;

      ul {
        text-align: left;
        display: inline-block;
      }
    }
  }

  .quick-nav-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .not-found {
    &__number {
      font-size: 60px;
    }

    &__icon {
      .el-icon {
        font-size: 80px !important;
      }
    }
  }

  .quick-nav-grid {
    grid-template-columns: 1fr;
  }
}

// 动画效果
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.not-found__container {
  animation: fadeInUp 0.6s ease-out;
}

.not-found__quick-nav {
  animation: fadeInUp 0.6s ease-out 0.2s both;
}

// 暗色主题适配
@media (prefers-color-scheme: dark) {
  .not-found {
    &__number {
      color: var(--color-primary-light-5);
    }
  }
}
</style>