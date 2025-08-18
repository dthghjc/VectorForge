## 任务模块 API / CRUD / 数据库设计说明

本说明文档覆盖任务模块从数据库模型、CRUD 实现到 API 设计与权限规则，帮助前后端对齐契约并指导后续扩展。

### 模块目标与术语
- 任务（`AnnotationTask`）用于组织对话标注工作，支持分配、进度统计与日志记录。
- 任务对话（`TaskChat`）表示任务与某个对话（`Chat`）的关联及其标注状态。
- 任务日志（`TaskLog`）记录任务关键操作。


## 数据库设计（`app/models/task.py`）

### 枚举
- `TaskStatus`: `created` | `assigned` | `in_progress` | `completed` | `cancelled`
- `TaskPriority`: `low` | `normal` | `high` | `urgent`

### 表：`AnnotationTask`
- 主键：`id` (uuid)
- 关键字段：
  - `title`、`description`
  - `status`（`TaskStatus`，默认 `created`）
  - `priority`（`TaskPriority`，默认 `normal`）
  - `total_chats`、`completed_chats`（统计字段）
  - `deadline`（截止时间）
  - `created_by_id`（创建者）、`assigned_to_id`（被分配标注员）
  - 配置：`auto_assign`（是否自动分配）、`max_annotations_per_chat`、`task_metadata`（JSON 扩展）
- 关系：
  - `created_by`、`assigned_to`（到 `User`）
  - `task_chats`（到 `TaskChat`，`cascade="all, delete-orphan"`）
  - `task_logs`（到 `TaskLog`，`cascade="all, delete-orphan"`）
- 计算属性：
  - `completion_rate`：`completed_chats / total_chats` 百分比
  - `is_overdue`：基于当前北京时区时间与 `deadline` 比较（未完成且超时）
- 索引：`status`、`assigned_to_id`、`created_by_id`、`deadline`

### 表：`TaskChat`
- 主键：`id` (uuid)
- 外键：`task_id -> annotation_tasks.id`，`chat_id -> chats.id`
- 标注字段：
  - `annotation_status`：`pending` | `completed` | `skipped`（默认 `pending`）
  - `annotation_result`：`approved` | `rejected` | `flagged`（值域由上层业务约定）
  - `annotation_comment`
  - `annotated_by_id`、`annotated_at`
- 关系：`task`、`chat`、`annotated_by`
- 索引：`task_id`、`chat_id`、`annotation_status`

### 表：`TaskLog`
- 主键：`id` (uuid)
- 外键：`task_id -> annotation_tasks.id`，`user_id -> users.id`
- 字段：`action`、`description`、`old_value`（JSON）、`new_value`（JSON）
- 关系：`task`、`user`
- 索引：`task_id`、`user_id`


## CRUD 实现（`app/crud/task.py`）

> 所有时间语义统一使用 `get_current_beijing_time()`，查询尽量使用聚合/一次性加载，避免 N+1。

### create_task(db, task_create, created_by_id) -> `AnnotationTask`
- 逻辑：
  - 根据 `task_create` 创建 `AnnotationTask`，`status` 取决于是否指定 `assigned_to_id`（有则 `ASSIGNED`，否则 `CREATED`）。
  - `total_chats = len(chat_ids)`；为每个 `chat_id` 生成 `TaskChat` 记录。
  - 写入两类日志：`create_task`，若有分配则追加 `assign_task` 日志。
  - `commit` 后 `refresh` 返回任务。
- 注意：`router` 已预先校验 `chat_ids` 存在性与被分配用户的可标注权限。

### get_task_by_id(db, task_id)
- 使用 `selectinload` 仅加载必要关系：`created_by`、`assigned_to`、`task_chats`。

### get_task_basic_by_id(db, task_id)
- 轻量查询，仅用于存在性/权限检查，避免加载额外关系。

### get_tasks(db, params, current_user_id) -> List[`AnnotationTask`]
- 过滤：`status`、`priority`、`assigned_to_id`、`created_by_id`、`overdue_only`（`deadline < now && status != completed`）。
- 用户范围：若传入 `current_user_id`，仅返回与该用户相关（创建者或被分配者）的任务。
- 排序与分页：`order_by(created_at desc)`，配合 `offset/limit`。

### update_task(db, task_id, task_update, updated_by_id)
- 基于 `exclude_unset` 动态更新字段，记录 `old_values/new_values` 日志。

### assign_task(db, task_id, assigned_to_id, assigned_by_id)
- 更新 `assigned_to_id`，将 `status` 置为 `ASSIGNED`，记录分配日志。

### get_task_chats(db, task_id, annotation_status) -> List[`TaskChat`]
- 使用 `selectinload(TaskChat.chat, TaskChat.annotated_by)` 预加载。
- 可选按 `annotation_status` 过滤。

### annotate_chat(db, task_chat_id, annotation_result, annotation_comment, annotated_by_id) -> `TaskChat`
- 设置：
  - `annotation_status = completed`
  - `annotation_result`、`annotation_comment`、`annotated_by_id`、`annotated_at = now`
- 同步任务统计：
  - 重新统计该任务下 `TaskChat(annotation_status == completed)` 的数量写入 `completed_chats`。
  - 若 `completed_chats >= total_chats` → 任务 `status = COMPLETED`；
  - 否则若当前任务 `status == ASSIGNED` → 置为 `IN_PROGRESS`。
- 记录 `annotate_chat` 日志并提交。

### get_task_stats(db, user_id) -> Dict
- 单条聚合 SQL 计算：
  - `total_tasks`、`pending_tasks`（`created/assigned`）、`in_progress_tasks`、`completed_tasks`、`overdue_tasks`。
  - `total_chats`、`completed_chats`。
  - `overall_completion_rate = completed_chats / total_chats`（百分比，保留两位小数）。
- 若传入 `user_id`，限定统计范围为与该用户相关的任务。

### get_task_logs(db, task_id)
- `selectinload(user)` 并按 `created_at desc` 返回。

### delete_task(db, task_id, deleted_by_id) -> bool
- 先删除 `TaskChat`、`TaskLog`，再删除任务并 `commit`；失败回滚并抛出异常。
- 说明：模型上已有 `cascade`，此处采取显式删除以可控性更强。

### 内部工具：_log_action(db, task_id, user_id, action, description, old_value, new_value)
- 统一写入 `TaskLog`，在同一事务内提交。


## API 设计（`app/api/v1/task/router.py`）

> 所有接口均依赖 FastAPI 的依赖注入：`db: Session = Depends(get_db)`；权限通过 `get_current_user`/`get_current_admin` 控制。错误通过 `APIExceptions` 抛出（`bad_request`/`forbidden`/`not_found`）。

### 列表总览

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| POST | `/api/v1/task/` | 管理员 | 创建任务（批量绑定对话，可选直接分配） |
| GET | `/api/v1/task/` | 登录用户 | 任务列表（管理员全部；非管理员仅相关） |
| GET | `/api/v1/task/{task_id}` | 登录用户 | 任务详情（管理员或相关用户） |
| PUT | `/api/v1/task/{task_id}` | 管理员 | 更新任务（标题、描述、优先级、截止等） |
| POST | `/api/v1/task/{task_id}/assign` | 管理员 | 分配任务给标注员 |
| GET | `/api/v1/task/{task_id}/chats` | 登录用户 | 查询任务内对话（可按标注状态过滤） |
| POST | `/api/v1/task/{task_id}/chats/{task_chat_id}/annotate` | 被分配标注员/管理员 | 完成单个对话标注 |
| GET | `/api/v1/task/stats/overview` | 登录用户 | 任务统计（管理员全局，非管理员仅自己相关） |
| GET | `/api/v1/task/{task_id}/logs` | 管理员 | 查看任务操作日志 |
| DELETE | `/api/v1/task/{task_id}` | 管理员 | 删除任务（含关联数据） |
| GET | `/api/v1/task/chats/pending` | 管理员 | 获取可用于创建任务的待审核对话 |

> 实际前缀可能由更上层 Router 挂载决定，以上以 `task` 子路由为准。

### 关键端点详解

#### 创建任务：POST `/`
- 请求体 `TaskCreate`（推断字段）：
  - `title`、`description?`、`priority?`、`deadline?`
  - `assigned_to_id?`、`auto_assign?`（当前仅存储）、`max_annotations_per_chat?`、`task_metadata?`
  - `chat_ids: string[]`（必填）
- 前置校验：
  - `chat_ids` 均存在（一次性 `count` 校验）
  - 若有 `assigned_to_id`：用户存在且 `can_annotate == True`
- 结果：返回 `TaskResponse`（包含基础信息与统计字段）。

#### 获取任务列表：GET `/`
- 查询参数：
  - `status?`、`priority?`、`assigned_to_id?`、`created_by_id?`
  - `overdue_only?`（仅逾期）
  - 分页：`skip`、`limit (1..100)`
- 权限：管理员全部，非管理员仅与自己相关（创建者或被分配者）。

#### 任务详情：GET `/{task_id}`
- 权限：管理员或任务创建者/被分配者。
- 返回：`TaskDetailResponse`，包含任务基本信息与 `task_chats` 概览。

#### 更新任务：PUT `/{task_id}`
- 权限：管理员。
- 行为：字段级差异更新并记录变更日志。

#### 分配任务：POST `/{task_id}/assign`
- 权限：管理员。
- 请求体 `TaskAssign`：`assigned_to_id`。
- 校验：用户存在且 `can_annotate == True`。
- 结果：任务 `status = ASSIGNED` 并写日志。

#### 任务内对话列表：GET `/{task_id}/chats`
- 参数：`annotation_status? = pending|completed|skipped`。
- 权限：管理员或任务相关用户。
- 性能优化：一次性聚合查询各 `chat_id` 的消息数量，避免 N+1；返回时为每个 `TaskChat` 动态补充：
  - `chat_title = task_chat.chat.title`
  - `chat_message_count = 聚合数`

#### 对话标注：POST `/{task_id}/chats/{task_chat_id}/annotate`
- 权限：仅任务的被分配标注员可以标注；管理员也允许。
- 额外要求：当前用户需具备 `can_annotate == True`。
- 请求体 `TaskChatAnnotate`：
  - `annotation_result`（枚举值的 `.value` 被持久化）
  - `annotation_comment?`
- 后置：更新 `TaskChat` 标注信息、任务统计与状态流转，写入日志。

#### 任务统计：GET `/stats/overview`
- 权限：登录用户（管理员全局统计，非管理员仅自己相关）。
- 返回 `TaskStats`：
  - `total_tasks`、`pending_tasks`、`in_progress_tasks`、`completed_tasks`、`overdue_tasks`
  - `total_chats`、`completed_chats`、`overall_completion_rate`

#### 任务日志：GET `/{task_id}/logs`
- 权限：管理员。
- 返回 `TaskLogResponse[]`，按时间倒序。

#### 删除任务：DELETE `/{task_id}`
- 权限：管理员。
- 行为：显式删除关联 `TaskChat` 与 `TaskLog` 后删除任务，事务提交。

#### 可创建任务的待审核对话：GET `/chats/pending`
- 权限：管理员。
- 目的：为创建任务挑选对话来源，返回尚未被任何任务纳入且有 `pending` 消息的对话。
- 细节：
  - 子查询统计每个对话的 `pending_count`
  - 子查询获取每个对话的 `last_message_at`
  - `NOT EXISTS TaskChat(chat_id == Chat.id)` 排除已被纳入任务的对话
  - 仅返回 `pending_count > 0` 的对话


## 权限与状态机

### 权限矩阵（简化）
- 管理员：可创建/更新/分配/删除任务、查看全部任务/日志、获取待审核对话。
- 普通用户：
  - 列表：仅能看到与自己相关的任务。
  - 详情/对话列表：仅能访问与自己相关的任务。
  - 标注：仅当自己被分配到该任务，且具备 `can_annotate == True`。

### 状态流转
- 创建：`CREATED`（未分配）或 `ASSIGNED`（已分配）
- 标注进行中：若任务为 `ASSIGNED` 且有对话完成，则置为 `IN_PROGRESS`
- 完成：当 `completed_chats >= total_chats` → `COMPLETED`
- 取消：`CANCELLED` 目前未在接口中显式使用，可按业务需要扩展。


## 契约与 Schemas（推断）

> `router` 引用的 `app.schemas.task` 包含：`TaskCreate`、`TaskUpdate`、`TaskAssign`、`TaskChatAnnotate`、`TaskResponse`、`TaskDetailResponse`、`TaskChatResponse`、`TaskLogResponse`、`TaskStats`、`TaskQueryParams`、`TaskStatusEnum`、`TaskPriorityEnum`。以下为契约要点（字段以实际实现为准）。

- `TaskCreate`：见“创建任务”段落。
- `TaskUpdate`：可更新字段子集（如 `title`、`description`、`priority`、`deadline`、`task_metadata` 等）。
- `TaskAssign`：`assigned_to_id: string`
- `TaskChatAnnotate`：`annotation_result`（枚举）、`annotation_comment?`
- `TaskResponse/TaskDetailResponse`：包含任务基本信息、`completion_rate`、`is_overdue`、统计字段；详情可能嵌入 `task_chats` 概览。
- `TaskChatResponse`：`TaskChat` 基本字段 + 衍生的 `chat_title`、`chat_message_count`（由接口层填充）。
- `TaskLogResponse`：日志字段 + `user` 基本信息。
- `TaskStats`：见“任务统计”段落。


## 性能与一致性

- 关系加载：大量使用 `selectinload`，在多条主记录场景下优于 `joinedload`，避免笛卡尔积膨胀。
- 聚合计算：统计信息与消息数量采用单次聚合查询，避免 N+1。
- 时间处理：统一使用北京时区当前时间，处理好 naive/aware 差异（见 `is_overdue`）。
- 计数一致性：`completed_chats` 在标注时实时重算；如存在高并发，可考虑改为累加并增加幂等保护。
- 索引：`status/assigned_to_id/created_by_id/deadline`、`task_id/chat_id/annotation_status` 等高频过滤列均建索引。


## 典型请求示例（简化）

```json
POST /api/v1/task/
{
  "title": "对话审核任务 #1",
  "description": "审核最近的20个对话",
  "priority": "high",
  "deadline": "2025-08-31T23:59:59",
  "assigned_to_id": "user-123",
  "chat_ids": ["chat-1", "chat-2", "chat-3"],
  "task_metadata": {"dataset": "v1"}
}
```

```json
POST /api/v1/task/{task_id}/chats/{task_chat_id}/annotate
{
  "annotation_result": "approved",
  "annotation_comment": "回答准确，无需修改"
}
```


## 扩展建议

- 增加任务取消/重启接口，完善 `CANCELLED` 流转。
- `max_annotations_per_chat` 当前未在标注流程中强制约束，可在 `annotate_chat` 增加校验与多轮标注支持。
- `auto_assign` 策略可在创建任务后自动拆分并按负载分配给多人。
- `pending` 对话的筛选可增加时间窗口、数据源、标签等更多维度条件。


