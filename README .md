# 项目管理工具 (Project Management Tool · Supabase Edition)

一个轻量化的企业内部项目管理工具，提供项目统计、任务管理、进度跟踪等功能；在原有 **仪表盘 / 项目管理 /（规划中的）甘特图** 基础上，新增 **Supabase（Postgres + Auth + Realtime）** 的接入说明与环境变量规范。

---

## ✨ 功能特性
- **仪表盘**：项目/任务统计、完成率分析、超期提醒、项目卡片。  
- **项目管理**：列表/编辑/新建项目与任务、状态跟踪。  
- **甘特图（规划中）**：时间轴、依赖关系、进度视图。

> 本 README 新增：环境变量模板、Supabase 初始化脚本位置、RLS 策略示例、部署与安全清单。

---

## 🚀 快速开始

### 环境要求
- Node.js ≥ 16（推荐 18+）  
- npm ≥ 8 或 yarn ≥ 1.22

### 1) 获取代码
```bash
git clone <repository-url>
cd project-management-tool
```

### 2) 安装依赖
```bash
npm install
```

### 3) 配置环境变量（重要）
在项目根目录新增或确认存在 `.env.example`（已提交到仓库）并在本地创建 **`.env.development`** / **`.env.production`**：
```dotenv
# ---- Supabase ----
VITE_SUPABASE_URL=YOUR_SUPABASE_URL_HERE
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE
```
> `.env*` 文件已通过 `.gitignore` 忽略，避免把密钥推到仓库；仅 `.env.example` 会被提交用于提示同事如何配置。

### 4) 初始化 Supabase
1. 在 Supabase 控制台新建项目，拿到 **Project URL** 与 **anon key**；  
2. 执行数据库初始化 SQL（建议放在 `docs/db/schema.sql`，并在仓库中附上）：  
   - `projects / tasks / task_history` 等表结构  
   - 索引（如 `idx_tasks_project`、`idx_tasks_assignee`）  
3. 开启 **Row Level Security (RLS)** 并添加策略（最小可用示例）：  
   - 项目仅 owner 可读写；  
   - 任务由创建者/指派人/项目 owner 读写；  
   - 历史表只读；  
4.（可选）创建触发器：在 `tasks` 的 INSERT/UPDATE/DELETE 时写入 `task_history`。

> 以上 SQL 与策略建议随代码一并提供，团队可直接复制到 Supabase SQL Editor 执行。

### 5) 启动开发服务器
```bash
npm run dev
# 浏览器访问 http://localhost:5173
```

### 6) 构建与本地预览
```bash
npm run build
npm run preview
```

---

## 🏗️ 技术架构
- **前端**：Vue 3（Composition API）+ Vite + Element Plus + Pinia + Vue Router + SCSS + Day.js  
- **规范**：ESLint + Prettier  

### 目录结构
```
src/
├── core/                    # 核心系统层（配置/路由/状态/插件）
├── shared/                  # 共享资源层（services/utils/components/composables）
├── features/                # 功能模块（dashboard / project-management / gantt-chart）
└── plugins/                 # 插件系统
```

---

## 🔌 与后端的对接（Supabase）
### 读取/写入
在前端通过 `@supabase/supabase-js` 调用：
- `supabase.from('projects').select()/insert()/update()/delete()`  
- `supabase.from('tasks')...`  
- 通过 Realtime 订阅 `tasks` 表变化，驱动 UI 自动刷新。

### 鉴权
- 推荐先用 Magic Link（邮件登录），后续再扩展 SSO/域名白名单；  
- 组件层通过 `getSession()/onAuthStateChange` 控制访问。

### 权限（RLS）与团队协作
- 初期：owner 权限或“登录即读写（限内部）”；  
- 需要多人共享：新增 `project_members(project_id, user_id, role)`，在 RLS 中以成员表判断可见与可写。

---

## 📦 常用命令
```bash
# 开发
npm run dev
# 构建
npm run build
# 预览
npm run preview
# 代码检查/格式化/类型检查（如有配置）
npm run lint
npm run format
npm run type-check
```

---

## 🔐 安全与合规清单
- **环境变量**：`.env*` 不入库，仅 `.env.example` 提示字段；  
- **RLS**：强制按用户隔离数据行；  
- **输入校验 & XSS 防护**：前后端同时处理；  
- **最小权限**：仅暴露必要的 `select/insert/update/delete`；  
- **密钥轮换**：若曾误提交密钥，请立刻在 Supabase 后台旋转 anon key。  

---

## ☁️ 部署指引
### 静态前端
- **Vercel / Netlify / Cloudflare Pages / Nginx**：上传 `dist/` 或接入仓库自动构建；  
- 在平台环境变量面板配置：  
  - `VITE_SUPABASE_URL`  
  - `VITE_SUPABASE_ANON_KEY`

### 数据库与鉴权
- 由 Supabase 托管（无需自建后台），保留 SQL/策略文件于 `docs/db/` 便于审计与复制。

### GitHub Pages（可选）
- 若选择 GH Pages，请使用单独的 `gh-pages` 分支推送 `dist/` 产物（main 分支无需含 `dist/`）。

---

## 🗺️ Roadmap
- 甘特图模块完善（依赖/关键路径/拖拽编辑）  
- 角色与权限（Owner/Editor/Viewer）  
- 活动审计面板（基于 `task_history`）

---

## 🤝 贡献
欢迎贡献代码！流程：Fork → 新分支 → 提交 → PR。

---

## 📄 许可证
MIT

---

## 📞 联系方式
- 维护者：<Lou Yu>  
- 邮箱：<250477007@qq.com>  
- 项目地址：<https://github.com/your-username/project-management-tool>
