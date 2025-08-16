from app.models.base import Base, TimestampMixin, get_current_beijing_time
from sqlalchemy import Column, String, ForeignKey, Integer, Text, DateTime, Enum, Boolean, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import JSON
import uuid
import enum
from datetime import datetime

class TaskStatus(enum.Enum):
    """任务状态枚举"""
    CREATED = "created"         # 已创建
    ASSIGNED = "assigned"       # 已分配
    IN_PROGRESS = "in_progress" # 进行中
    COMPLETED = "completed"     # 已完成
    CANCELLED = "cancelled"     # 已取消

class TaskPriority(enum.Enum):
    """任务优先级枚举"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"

class AnnotationTask(Base, TimestampMixin):
    """标注任务主表"""
    __tablename__ = 'annotation_tasks'
    __table_args__ = (
        Index('ix_annotation_tasks_status', 'status'),
        Index('ix_annotation_tasks_assigned_to_id', 'assigned_to_id'),
        Index('ix_annotation_tasks_created_by_id', 'created_by_id'),
        Index('ix_annotation_tasks_deadline', 'deadline'),
    )
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False, comment="任务标题")
    description = Column(Text, nullable=True, comment="任务描述")
    
    # 任务属性
    status = Column(Enum(TaskStatus), default=TaskStatus.CREATED, nullable=False, comment="任务状态")
    priority = Column(Enum(TaskPriority), default=TaskPriority.NORMAL, nullable=False, comment="任务优先级")
    
    # 任务统计
    total_chats = Column(Integer, default=0, nullable=False, comment="总对话数")
    completed_chats = Column(Integer, default=0, nullable=False, comment="已完成对话数")
    
    # 时间管理
    deadline = Column(DateTime, nullable=True, comment="截止时间")
    
    # 创建者和分配者
    created_by_id = Column(String(36), ForeignKey('users.id'), nullable=False, comment="创建者ID")
    assigned_to_id = Column(String(36), ForeignKey('users.id'), nullable=True, comment="分配给标注员ID")
    
    # 任务配置
    auto_assign = Column(Boolean, default=False, nullable=False, comment="是否自动分配")
    max_annotations_per_chat = Column(Integer, default=1, nullable=False, comment="每个对话最大标注次数")
    
    # 扩展字段
    task_metadata = Column(JSON, nullable=True, comment="任务元数据")
    
    # 关系映射
    created_by = relationship("User", foreign_keys=[created_by_id], backref="created_tasks")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id], backref="assigned_tasks")
    task_chats = relationship("TaskChat", back_populates="task", cascade="all, delete-orphan")
    task_logs = relationship("TaskLog", back_populates="task", cascade="all, delete-orphan")
    
    @property
    def completion_rate(self) -> float:
        """任务完成率"""
        if self.total_chats == 0:
            return 0.0
        return round((self.completed_chats / self.total_chats) * 100, 2)
    
    @property
    def is_overdue(self) -> bool:
        """任务是否已逾期"""
        if not self.deadline:
            return False
        # 使用与持久化一致的时间并处理 naive/aware 差异，避免比较异常
        now = get_current_beijing_time()
        deadline = self.deadline
        if deadline.tzinfo is None:
            return now.replace(tzinfo=None) > deadline and self.status != TaskStatus.COMPLETED
        return now > deadline and self.status != TaskStatus.COMPLETED

class TaskChat(Base, TimestampMixin):
    """任务对话关联表"""
    __tablename__ = 'task_chats'
    __table_args__ = (
        Index('ix_task_chats_task_id', 'task_id'),
        Index('ix_task_chats_chat_id', 'chat_id'),
        Index('ix_task_chats_annotation_status', 'annotation_status'),
    )
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id = Column(String(36), ForeignKey('annotation_tasks.id'), nullable=False)
    chat_id = Column(String(36), ForeignKey('chats.id'), nullable=False)
    
    # 标注状态
    annotation_status = Column(String(20), default="pending", nullable=False, comment="标注状态: pending/completed/skipped")
    annotation_result = Column(String(20), nullable=True, comment="标注结果: approved/rejected/flagged")
    annotation_comment = Column(Text, nullable=True, comment="标注备注")
    
    # 标注员信息
    annotated_by_id = Column(String(36), ForeignKey('users.id'), nullable=True)
    annotated_at = Column(DateTime, nullable=True, comment="标注时间")
    
    # 关系映射
    task = relationship("AnnotationTask", back_populates="task_chats")
    chat = relationship("Chat")
    annotated_by = relationship("User")

class TaskLog(Base, TimestampMixin):
    """任务操作日志"""
    __tablename__ = 'task_logs'
    __table_args__ = (
        Index('ix_task_logs_task_id', 'task_id'),
        Index('ix_task_logs_user_id', 'user_id'),
    )
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id = Column(String(36), ForeignKey('annotation_tasks.id'), nullable=False)
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False)
    
    action = Column(String(50), nullable=False, comment="操作类型")
    description = Column(Text, nullable=True, comment="操作描述")
    old_value = Column(JSON, nullable=True, comment="操作前的值")
    new_value = Column(JSON, nullable=True, comment="操作后的值")
    
    # 关系映射
    task = relationship("AnnotationTask", back_populates="task_logs")
    user = relationship("User") 