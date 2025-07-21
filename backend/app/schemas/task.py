from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

# 枚举类型
class TaskStatusEnum(str, Enum):
    CREATED = "created"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TaskPriorityEnum(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"

class AnnotationResultEnum(str, Enum):
    APPROVED = "approved"
    REJECTED = "rejected"
    FLAGGED = "flagged"

# 基础用户信息
class UserBasic(BaseModel):
    id: str
    username: str
    
    class Config:
        from_attributes = True

# 任务创建 Schema
class TaskCreate(BaseModel):
    title: str = Field(..., max_length=255, description="任务标题")
    description: Optional[str] = Field(None, description="任务描述")
    priority: TaskPriorityEnum = Field(TaskPriorityEnum.NORMAL, description="任务优先级")
    deadline: Optional[datetime] = Field(None, description="截止时间")
    assigned_to_id: Optional[str] = Field(None, description="分配给标注员ID")
    chat_ids: List[str] = Field(..., description="待标注对话ID列表")
    auto_assign: bool = Field(False, description="是否自动分配")
    max_annotations_per_chat: int = Field(1, ge=1, description="每个对话最大标注次数")
    task_metadata: Optional[Dict[str, Any]] = Field(None, description="任务元数据")

# 任务更新 Schema
class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    status: Optional[TaskStatusEnum] = None
    priority: Optional[TaskPriorityEnum] = None
    deadline: Optional[datetime] = None
    assigned_to_id: Optional[str] = None
    task_metadata: Optional[Dict[str, Any]] = None

# 任务分配 Schema
class TaskAssign(BaseModel):
    assigned_to_id: str = Field(..., description="分配给标注员ID")

# 任务对话标注 Schema
class TaskChatAnnotate(BaseModel):
    annotation_result: AnnotationResultEnum = Field(..., description="标注结果")
    annotation_comment: Optional[str] = Field(None, description="标注备注")

# 任务对话响应 Schema
class TaskChatResponse(BaseModel):
    id: str
    task_id: str
    chat_id: str
    annotation_status: str
    annotation_result: Optional[str]
    annotation_comment: Optional[str]
    annotated_by_id: Optional[str]
    annotated_at: Optional[datetime]
    created_at: datetime
    
    # 关联的对话信息
    chat_title: Optional[str] = None
    chat_message_count: Optional[int] = None
    
    class Config:
        from_attributes = True

# 任务响应 Schema
class TaskResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    status: str
    priority: str
    total_chats: int
    completed_chats: int
    completion_rate: float
    deadline: Optional[datetime]
    created_by_id: str
    assigned_to_id: Optional[str]
    auto_assign: bool
    max_annotations_per_chat: int
    task_metadata: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    is_overdue: bool
    
    # 关联数据
    created_by: Optional[UserBasic] = None
    assigned_to: Optional[UserBasic] = None
    
    class Config:
        from_attributes = True

# 任务详情响应 Schema
class TaskDetailResponse(TaskResponse):
    task_chats: List[TaskChatResponse] = []

# 任务日志 Schema
class TaskLogResponse(BaseModel):
    id: str
    task_id: str
    user_id: str
    action: str
    description: Optional[str]
    old_value: Optional[Dict[str, Any]]
    new_value: Optional[Dict[str, Any]]
    created_at: datetime
    
    # 关联用户信息
    user: Optional[UserBasic] = None
    
    class Config:
        from_attributes = True

# 任务统计 Schema
class TaskStats(BaseModel):
    total_tasks: int = 0
    pending_tasks: int = 0
    in_progress_tasks: int = 0
    completed_tasks: int = 0
    overdue_tasks: int = 0
    total_chats: int = 0
    completed_chats: int = 0
    overall_completion_rate: float = 0.0

# 任务查询参数 Schema
class TaskQueryParams(BaseModel):
    status: Optional[TaskStatusEnum] = None
    priority: Optional[TaskPriorityEnum] = None
    assigned_to_id: Optional[str] = None
    created_by_id: Optional[str] = None
    overdue_only: bool = False
    skip: int = Field(0, ge=0)
    limit: int = Field(20, ge=1, le=100)

# 待审核对话 Schema
class PendingChat(BaseModel):
    id: str
    title: str
    message_count: int
    last_message_at: datetime
    created_at: datetime
    user_id: str
    username: Optional[str] = None
    
    class Config:
        from_attributes = True 