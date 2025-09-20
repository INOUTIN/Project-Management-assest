-- docs/db/schema_annotated.sql  -- 带中文注释版本
-- Project Management Tool · Supabase Edition

-- 0) 扩展（Supabase 通常已内置 pgcrypto，如无则创建）
create extension if not exists pgcrypto;                           -- 启用 pgcrypto，用于生成 UUID 等加密函数

-- 1) 表
create table if not exists projects (                              -- 创建 projects 表：存放项目
  id uuid primary key default gen_random_uuid(),                   -- 主键：UUID，默认随机生成
  name text not null,                                              -- 项目名称（必填）
  owner uuid references auth.users(id),                            -- 拥有者用户ID，引用 Supabase 内置 auth.users 表
  created_at timestamptz default now()                             -- 创建时间，默认当前时间（含时区）
);                                                                  -- 结束 projects 表定义

create table if not exists tasks (                                  -- 创建 tasks 表：存放任务
  id uuid primary key default gen_random_uuid(),                   -- 主键：UUID，默认随机生成
  project_id uuid references projects(id) on delete cascade,       -- 所属项目ID，引用 projects，项目删除则级联删除任务
  title text not null,                                             -- 任务标题（必填）
  status text default 'todo',                                      -- 任务状态：todo/doing/done，默认 todo
  assignee uuid references auth.users(id),                         -- 指派人用户ID（可空）
  due_date date,                                                   -- 截止日期（仅日期）
  updated_at timestamptz default now(),                            -- 最近更新时间（用于排序/实时刷新）
  created_by uuid references auth.users(id),                       -- 创建者用户ID
  created_at timestamptz default now()                             -- 创建时间
);                                                                  -- 结束 tasks 表定义

create table if not exists task_history (                           -- 创建 task_history 表：记录任务变更历史
  id bigserial primary key,                                        -- 自增主键（历史记录ID）
  task_id uuid references tasks(id) on delete cascade,             -- 关联的任务ID，任务删掉则历史一并删除
  actor uuid references auth.users(id),                            -- 操作人用户ID
  action text not null,                                            -- 动作类型：created/updated/moved/deleted 等
  diff jsonb,                                                      -- 变更差异（JSON 格式，按需存储字段变更）
  created_at timestamptz default now()                             -- 历史记录创建时间
);                                                                  -- 结束 task_history 表定义

-- 2) 索引
create index if not exists idx_tasks_project on tasks(project_id);  -- 给 tasks.project_id 建索引（按项目过滤更快）
create index if not exists idx_tasks_assignee on tasks(assignee);   -- 给 tasks.assignee 建索引（按指派人查询更快）
create index if not exists idx_tasks_updated on tasks(updated_at desc); -- 给 tasks.updated_at 建倒序索引（最近更新优先）

-- 3) RLS 开启
alter table projects enable row level security;                     -- 开启 projects 表的行级安全（RLS）
alter table tasks enable row level security;                        -- 开启 tasks 表的 RLS
alter table task_history enable row level security;                 -- 开启 task_history 表的 RLS

-- 4) RLS 策略（最小可用：owner/创建者/受派人可见）
do $$                                                               -- 使用 DO 代码块，避免重复创建策略
begin                                                                -- 开始匿名代码块
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='projects') then  -- 若 projects 尚无策略
    create policy proj_read   on projects for select using (auth.uid() = owner);      -- 读取：仅当当前用户是项目 owner
    create policy proj_insert on projects for insert with check (auth.uid() = owner); -- 插入：仅允许 owner 身份插入自身项目
    create policy proj_update on projects for update using (auth.uid() = owner);      -- 更新：仅 owner 可更新
    create policy proj_delete on projects for delete using (auth.uid() = owner);      -- 删除：仅 owner 可删除
  end if;                                                            -- 结束 projects 策略判断

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tasks') then     -- 若 tasks 尚无策略
    create policy task_read on tasks for select using (                                               -- 读取任务的策略：
      auth.uid() = created_by                                                                         --   当前用户为任务创建者
      or auth.uid() = assignee                                                                        --   或为任务被指派人
      or auth.uid() = (select owner from projects p where p.id = tasks.project_id)                    --   或为所属项目的 owner
    );                                                                                                -- 结束 task_read 策略
    create policy task_insert on tasks for insert with check (auth.uid() = created_by);               -- 插入任务：创建者必须是当前用户
    create policy task_update on tasks for update using (                                             -- 更新任务：
      auth.uid() = created_by                                                                         --   创建者
      or auth.uid() = assignee                                                                        --   或指派人
      or auth.uid() = (select owner from projects p where p.id = tasks.project_id)                    --   或项目 owner
    );                                                                                                -- 结束 task_update 策略
    create policy task_delete on tasks for delete using (                                             -- 删除任务：
      auth.uid() = created_by                                                                         --   创建者
      or auth.uid() = (select owner from projects p where p.id = tasks.project_id)                    --   或项目 owner
    );                                                                                                -- 结束 task_delete 策略
  end if;                                                        -- 结束 tasks 策略判断

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='task_history') then -- 若历史表尚无策略
    create policy hist_read on task_history for select using (true);                                   -- 历史表允许所有已登录用户读取（仅读）
  end if;                                                         -- 结束 task_history 策略判断
end$$;                                                            -- 结束 DO 代码块

-- 5) 触发器：记录任务变更到历史表
create or replace function log_task_history()                      -- 创建或替换触发器函数：记录任务历史
returns trigger as $$                                              -- 声明返回类型为 trigger
begin                                                              -- 函数体开始
  if (TG_OP = 'INSERT') then                                       -- 如果是插入操作
    insert into task_history(task_id, actor, action, diff)         -- 写入一条历史记录
    values (NEW.id, NEW.created_by, 'created', to_jsonb(NEW));     -- 记录创建者、动作类型、完整新记录
    return NEW;                                                    -- 返回新行
  elsif (TG_OP = 'UPDATE') then                                    -- 如果是更新操作
    insert into task_history(task_id, actor, action, diff)         -- 写入一条历史记录
    values (NEW.id, auth.uid(), 'updated', jsonb_strip_nulls(to_jsonb(NEW) - to_jsonb(OLD))); -- 记录操作者、差异 JSON
    return NEW;                                                    -- 返回更新后的行
  elsif (TG_OP = 'DELETE') then                                    -- 如果是删除操作
    insert into task_history(task_id, actor, action, diff)         -- 写入一条历史记录
    values (OLD.id, auth.uid(), 'deleted', to_jsonb(OLD));         -- 记录操作者、被删前的完整行
    return OLD;                                                    -- 返回旧行（删除时惯例）
  end if;                                                          -- 结束条件判断
end;                                                               -- 结束函数体
$$ language plpgsql;                                               -- 指定函数语言为 PL/pgSQL

drop trigger if exists trg_log_task_history on tasks;              -- 若触发器已存在则先删除，避免重复
create trigger trg_log_task_history                                -- 创建触发器：绑定到 tasks 表
after insert or update or delete on tasks                           -- 在插入/更新/删除后触发
for each row execute function log_task_history();                   -- 每行变更时调用 log_task_history 函数

-- 使用说明：
-- 1) 将本文件内容复制到 Supabase 控制台的 SQL Editor 执行；                 -- 控制台直接执行
-- 2) 或通过 psql 连接数据库执行：\i docs/db/schema_annotated.sql；            -- 命令行导入
-- 3) 作为初始化基线纳入 CI/CD（后续变更新增增量脚本）。                        -- 推荐纳入版本控制
