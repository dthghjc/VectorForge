from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import and_, or_, func, desc
from datetime import datetime

from app.models.task import AnnotationTask, TaskChat, TaskLog, TaskStatus, TaskPriority
from app.models.chat import Chat, Message
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate, TaskQueryParams
from app.models.base import get_current_beijing_time

class TaskCRUD:
    """任务 CRUD 操作"""
    
    def create_task(
        self, 
        db: Session, 
        task_create: TaskCreate, 
        created_by_id: str
    ) -> AnnotationTask:
        """创建新任务"""
        # 创建任务
        task = AnnotationTask(
            title=task_create.title,
            description=task_create.description,
            priority=task_create.priority,
            deadline=task_create.deadline,
            created_by_id=created_by_id,
            assigned_to_id=task_create.assigned_to_id,
            auto_assign=task_create.auto_assign,
            max_annotations_per_chat=task_create.max_annotations_per_chat,
            task_metadata=task_create.task_metadata,
            total_chats=len(task_create.chat_ids),
            status=TaskStatus.ASSIGNED if task_create.assigned_to_id else TaskStatus.CREATED
        )
        
        db.add(task)
        db.flush()  # 获取任务ID
        
        # 创建任务对话关联
        task_chats = []
        for chat_id in task_create.chat_ids:
            task_chat = TaskChat(
                task_id=task.id,
                chat_id=chat_id
            )
            task_chats.append(task_chat)
        
        db.add_all(task_chats)
        
        # 记录日志
        self._log_action(
            db, task.id, created_by_id, 
            "create_task", 
            f"创建任务: {task.title}",
            new_value={"task_id": task.id, "chat_count": len(task_create.chat_ids)}
        )
        
        if task_create.assigned_to_id:
            self._log_action(
                db, task.id, created_by_id,
                "assign_task",
                f"分配任务给用户: {task_create.assigned_to_id}",
                new_value={"assigned_to_id": task_create.assigned_to_id}
            )
        
        db.commit()
        db.refresh(task)
        return task
    
    def get_task_by_id(self, db: Session, task_id: str) -> Optional[AnnotationTask]:
        """根据ID获取任务"""
        return db.query(AnnotationTask).options(
            selectinload(AnnotationTask.created_by),
            selectinload(AnnotationTask.assigned_to),
            selectinload(AnnotationTask.task_chats).selectinload(TaskChat.chat),
            selectinload(AnnotationTask.task_chats).selectinload(TaskChat.annotated_by)
        ).filter(AnnotationTask.id == task_id).first()
    
    def get_tasks(
        self, 
        db: Session, 
        params: TaskQueryParams,
        current_user_id: Optional[str] = None
    ) -> List[AnnotationTask]:
        """获取任务列表"""
        query = db.query(AnnotationTask).options(
            selectinload(AnnotationTask.created_by),
            selectinload(AnnotationTask.assigned_to)
        )
        
        # 筛选条件
        if params.status:
            query = query.filter(AnnotationTask.status == params.status)
        
        if params.priority:
            query = query.filter(AnnotationTask.priority == params.priority)
        
        if params.assigned_to_id:
            query = query.filter(AnnotationTask.assigned_to_id == params.assigned_to_id)
        
        if params.created_by_id:
            query = query.filter(AnnotationTask.created_by_id == params.created_by_id)
        
        if params.overdue_only:
            now = get_current_beijing_time()
            query = query.filter(
                and_(
                    AnnotationTask.deadline.isnot(None),
                    AnnotationTask.deadline < now,
                    AnnotationTask.status != TaskStatus.COMPLETED
                )
            )
        
        # 如果提供了当前用户ID，只返回相关任务
        if current_user_id:
            query = query.filter(
                or_(
                    AnnotationTask.created_by_id == current_user_id,
                    AnnotationTask.assigned_to_id == current_user_id
                )
            )
        
        # 排序和分页
        query = query.order_by(desc(AnnotationTask.created_at))
        query = query.offset(params.skip).limit(params.limit)
        
        return query.all()
    
    def update_task(
        self, 
        db: Session, 
        task_id: str, 
        task_update: TaskUpdate,
        updated_by_id: str
    ) -> Optional[AnnotationTask]:
        """更新任务"""
        task = self.get_task_by_id(db, task_id)
        if not task:
            return None
        
        # 记录更新前的值
        old_values = {}
        new_values = {}
        
        update_data = task_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(task, field):
                old_values[field] = getattr(task, field)
                new_values[field] = value
                setattr(task, field, value)
        
        # 记录日志
        if old_values:
            self._log_action(
                db, task_id, updated_by_id,
                "update_task",
                f"更新任务: {', '.join(old_values.keys())}",
                old_value=old_values,
                new_value=new_values
            )
        
        db.commit()
        db.refresh(task)
        return task
    
    def assign_task(
        self, 
        db: Session, 
        task_id: str, 
        assigned_to_id: str,
        assigned_by_id: str
    ) -> Optional[AnnotationTask]:
        """分配任务"""
        task = self.get_task_by_id(db, task_id)
        if not task:
            return None
        
        old_assigned_to = task.assigned_to_id
        task.assigned_to_id = assigned_to_id
        task.status = TaskStatus.ASSIGNED
        
        # 记录日志
        self._log_action(
            db, task_id, assigned_by_id,
            "assign_task",
            f"分配任务给用户: {assigned_to_id}",
            old_value={"assigned_to_id": old_assigned_to},
            new_value={"assigned_to_id": assigned_to_id}
        )
        
        db.commit()
        db.refresh(task)
        return task
    
    def get_task_chats(
        self, 
        db: Session, 
        task_id: str,
        annotation_status: Optional[str] = None
    ) -> List[TaskChat]:
        """获取任务中的对话"""
        query = db.query(TaskChat).options(
            selectinload(TaskChat.chat),
            selectinload(TaskChat.annotated_by)
        ).filter(TaskChat.task_id == task_id)
        
        if annotation_status:
            query = query.filter(TaskChat.annotation_status == annotation_status)
        
        return query.all()
    
    def annotate_chat(
        self,
        db: Session,
        task_chat_id: str,
        annotation_result: str,
        annotation_comment: Optional[str],
        annotated_by_id: str
    ) -> Optional[TaskChat]:
        """标注任务中的对话"""
        task_chat = db.query(TaskChat).filter(
            TaskChat.id == task_chat_id
        ).first()
        
        if not task_chat:
            return None
        
        # 更新标注信息
        task_chat.annotation_status = "completed"
        task_chat.annotation_result = annotation_result
        task_chat.annotation_comment = annotation_comment
        task_chat.annotated_by_id = annotated_by_id
        task_chat.annotated_at = get_current_beijing_time()
        
        # 更新任务的完成统计
        task = db.query(AnnotationTask).filter(
            AnnotationTask.id == task_chat.task_id
        ).first()
        
        if task:
            # 计算已完成的对话数
            completed_count = db.query(TaskChat).filter(
                and_(
                    TaskChat.task_id == task.id,
                    TaskChat.annotation_status == "completed"
                )
            ).count()
            
            task.completed_chats = completed_count
            
            # 如果所有对话都已完成，更新任务状态
            if completed_count >= task.total_chats:
                task.status = TaskStatus.COMPLETED
            elif task.status == TaskStatus.ASSIGNED:
                task.status = TaskStatus.IN_PROGRESS
        
        # 记录日志
        self._log_action(
            db, task_chat.task_id, annotated_by_id,
            "annotate_chat",
            f"完成对话标注: {annotation_result}",
            new_value={
                "chat_id": task_chat.chat_id,
                "annotation_result": annotation_result,
                "annotation_comment": annotation_comment
            }
        )
        
        db.commit()
        db.refresh(task_chat)
        return task_chat
    
    def get_task_stats(self, db: Session, user_id: Optional[str] = None) -> Dict[str, Any]:
        """获取任务统计"""
        query = db.query(AnnotationTask)
        
        if user_id:
            query = query.filter(
                or_(
                    AnnotationTask.created_by_id == user_id,
                    AnnotationTask.assigned_to_id == user_id
                )
            )
        
        tasks = query.all()
        
        stats = {
            "total_tasks": len(tasks),
            "pending_tasks": 0,
            "in_progress_tasks": 0,
            "completed_tasks": 0,
            "overdue_tasks": 0,
            "total_chats": 0,
            "completed_chats": 0,
            "overall_completion_rate": 0.0
        }
        
        now = get_current_beijing_time()
        
        for task in tasks:
            stats["total_chats"] += task.total_chats
            stats["completed_chats"] += task.completed_chats
            
            if task.status == TaskStatus.CREATED or task.status == TaskStatus.ASSIGNED:
                stats["pending_tasks"] += 1
            elif task.status == TaskStatus.IN_PROGRESS:
                stats["in_progress_tasks"] += 1
            elif task.status == TaskStatus.COMPLETED:
                stats["completed_tasks"] += 1
            
            if task.is_overdue:
                stats["overdue_tasks"] += 1
        
        # 计算整体完成率
        if stats["total_chats"] > 0:
            stats["overall_completion_rate"] = round(
                (stats["completed_chats"] / stats["total_chats"]) * 100, 2
            )
        
        return stats
    
    def get_task_logs(self, db: Session, task_id: str) -> List[TaskLog]:
        """获取任务日志"""
        return db.query(TaskLog).options(
            selectinload(TaskLog.user)
        ).filter(TaskLog.task_id == task_id).order_by(desc(TaskLog.created_at)).all()
    
    def delete_task(self, db: Session, task_id: str, deleted_by_id: str) -> bool:
        """删除任务"""
        task = self.get_task_by_id(db, task_id)
        if not task:
            return False
        
        # 记录日志
        self._log_action(
            db, task_id, deleted_by_id,
            "delete_task",
            f"删除任务: {task.title}",
            old_value={"task_id": task_id, "title": task.title}
        )
        
        db.delete(task)
        db.commit()
        return True
    
    def _log_action(
        self,
        db: Session,
        task_id: str,
        user_id: str,
        action: str,
        description: str,
        old_value: Optional[Dict[str, Any]] = None,
        new_value: Optional[Dict[str, Any]] = None
    ):
        """记录任务操作日志"""
        log = TaskLog(
            task_id=task_id,
            user_id=user_id,
            action=action,
            description=description,
            old_value=old_value,
            new_value=new_value
        )
        db.add(log)

# 创建全局实例
task_crud = TaskCRUD() 