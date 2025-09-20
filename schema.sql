-- docs/db/schema.sql
-- Project Management Tool · Supabase Edition
-- 一键初始化：表结构 / 索引 / RLS 策略 / 触发器（任务历史）

-- 0) 扩展（Supabase 通常已内置 pgcrypto，如无则创建）
create extension if not exists pgcrypto;

-- 1) 表
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  status text default 'todo',      -- todo/doing/done
  assignee uuid references auth.users(id),
  due_date date,
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists task_history (
  id bigserial primary key,
  task_id uuid references tasks(id) on delete cascade,
  actor uuid references auth.users(id),
  action text not null,            -- created / updated / moved / deleted
  diff jsonb,
  created_at timestamptz default now()
);

-- 2) 索引
create index if not exists idx_tasks_project on tasks(project_id);
create index if not exists idx_tasks_assignee on tasks(assignee);
create index if not exists idx_tasks_updated on tasks(updated_at desc);

-- 3) RLS 开启
alter table projects enable row level security;
alter table tasks enable row level security;
alter table task_history enable row level security;

-- 4) RLS 策略（最小可用：owner/创建者/受派人可见）
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='projects') then
    create policy proj_read   on projects for select using (auth.uid() = owner);
    create policy proj_insert on projects for insert with check (auth.uid() = owner);
    create policy proj_update on projects for update using (auth.uid() = owner);
    create policy proj_delete on projects for delete using (auth.uid() = owner);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tasks') then
    create policy task_read on tasks for select using (
      auth.uid() = created_by
      or auth.uid() = assignee
      or auth.uid() = (select owner from projects p where p.id = tasks.project_id)
    );
    create policy task_insert on tasks for insert with check (auth.uid() = created_by);
    create policy task_update on tasks for update using (
      auth.uid() = created_by
      or auth.uid() = assignee
      or auth.uid() = (select owner from projects p where p.id = tasks.project_id)
    );
    create policy task_delete on tasks for delete using (
      auth.uid() = created_by
      or auth.uid() = (select owner from projects p where p.id = tasks.project_id)
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='task_history') then
    create policy hist_read on task_history for select using (true);
  end if;
end$$;

-- 5) 触发器：记录任务变更到历史表
create or replace function log_task_history()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    insert into task_history(task_id, actor, action, diff)
    values (NEW.id, NEW.created_by, 'created', to_jsonb(NEW));
    return NEW;
  elsif (TG_OP = 'UPDATE') then
    insert into task_history(task_id, actor, action, diff)
    values (NEW.id, auth.uid(), 'updated', jsonb_strip_nulls(to_jsonb(NEW) - to_jsonb(OLD)));
    return NEW;
  elsif (TG_OP = 'DELETE') then
    insert into task_history(task_id, actor, action, diff)
    values (OLD.id, auth.uid(), 'deleted', to_jsonb(OLD));
    return OLD;
  end if;
end;
$$ language plpgsql;

drop trigger if exists trg_log_task_history on tasks;
create trigger trg_log_task_history
after insert or update or delete on tasks
for each row execute function log_task_history();

-- 使用说明：
-- 1) 将本文件内容复制到 Supabase 控制台的 SQL Editor 执行；或
-- 2) 通过 psql 连接数据库执行：\i docs/db/schema.sql；或
-- 3) 作为初始化基线纳入 CI/CD（后续变更新增增量脚本）。
