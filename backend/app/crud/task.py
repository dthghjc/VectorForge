from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import and_, or_, func, desc, case
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
            # 查询被分配用户的用户名
            assigned_user = db.query(User).filter(User.id == task_create.assigned_to_id).first()
            assigned_username = assigned_user.username if assigned_user else task_create.assigned_to_id
            
            self._log_action(
                db, task.id, created_by_id,
                "assign_task",
                f"分配任务给用户: {assigned_username}",
                new_value={"assigned_to_id": task_create.assigned_to_id, "assigned_username": assigned_username}
            )
        
        db.commit()
        db.refresh(task)
        return task
    
    def get_task_by_id(self, db: Session, task_id: str) -> Optional[AnnotationTask]:
        """根据ID获取任务"""
        return db.query(AnnotationTask).options(
            selectinload(AnnotationTask.created_by),
            selectinload(AnnotationTask.assigned_to),
            # 任务详情只需要 TaskChat 基本字段，不需要加载 Chat/annotated_by 关系
            selectinload(AnnotationTask.task_chats)
        ).filter(AnnotationTask.id == task_id).first()

    def get_task_basic_by_id(self, db: Session, task_id: str) -> Optional[AnnotationTask]:
        """仅用于权限校验/存在性检查的轻量查询，避免关系加载造成的开销"""
        return db.query(AnnotationTask).filter(AnnotationTask.id == task_id).first()
    
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
        
        # 准备更新字段，记录变更前后的值用于日志
        old_values = {}
        new_values = {}
        
        update_data = task_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(task, field):
                old_values[field] = getattr(task, field)  # 记录更新前的值
                new_values[field] = value  # 记录新值
                setattr(task, field, value)  # 执行更新
        
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
        
        # 查询新分配用户的用户名
        assigned_user = db.query(User).filter(User.id == assigned_to_id).first()
        assigned_username = assigned_user.username if assigned_user else assigned_to_id
        
        # 查询原分配用户的用户名（如果有的话）
        old_username = None
        if old_assigned_to:
            old_user = db.query(User).filter(User.id == old_assigned_to).first()
            old_username = old_user.username if old_user else old_assigned_to
        
        # 记录日志
        self._log_action(
            db, task_id, assigned_by_id,
            "assign_task",
            f"分配任务给用户: {assigned_username}",
            old_value={"assigned_to_id": old_assigned_to, "old_username": old_username},
            new_value={"assigned_to_id": assigned_to_id, "assigned_username": assigned_username}
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

    def get_task_chats_paginated(
        self, 
        db: Session, 
        task_id: str, 
        annotation_status: Optional[str] = None,
        page: int = 1,
        page_size: int = 10
    ) -> dict:
        """
        获取任务中的对话列表（分页优化版）
        """
        from sqlalchemy import func
        from app.models.chat import Message
        
        # 构建基础查询
        query = db.query(TaskChat).filter(TaskChat.task_id == task_id)
        
        if annotation_status:
            query = query.filter(TaskChat.annotation_status == annotation_status)
        
        # 获取总数
        total = query.count()
        
        # 分页查询
        offset = (page - 1) * page_size
        task_chats = query.options(
            selectinload(TaskChat.chat),
            selectinload(TaskChat.annotated_by)
        ).order_by(TaskChat.created_at.desc()).offset(offset).limit(page_size).all()
        
        if not task_chats:
            return {
                "items": [],
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": 0
            }
        
        # 批量获取消息数量（只查询当前页的chat_ids）
        chat_ids = [tc.chat_id for tc in task_chats if tc.chat_id]
        message_counts = {}
        
        if chat_ids:
            message_counts = dict(
                db.query(
                    Message.chat_id,
                    func.count(Message.id).label('message_count')
                ).filter(
                    Message.chat_id.in_(chat_ids)
                ).group_by(Message.chat_id).all()
            )
        
        # 添加对话信息
        for task_chat in task_chats:
            if task_chat.chat:
                task_chat.chat_title = task_chat.chat.title
                task_chat.chat_message_count = message_counts.get(task_chat.chat_id, 0)
        
        # 计算总页数
        total_pages = (total + page_size - 1) // page_size
        
        # 转换为响应格式
        items_response = []
        for task_chat in task_chats:
            item = {
                "id": task_chat.id,
                "task_id": task_chat.task_id,
                "chat_id": task_chat.chat_id,
                "annotation_status": task_chat.annotation_status,
                "annotation_result": task_chat.annotation_result,
                "annotation_comment": task_chat.annotation_comment,
                "annotation_data": task_chat.annotation_data,
                "annotated_by_id": task_chat.annotated_by_id,
                "annotated_at": task_chat.annotated_at.isoformat() if task_chat.annotated_at else None,
                "created_at": task_chat.created_at.isoformat() if task_chat.created_at else None,
                "updated_at": task_chat.updated_at.isoformat() if task_chat.updated_at else None,
                # 添加的字段
                "chat_title": getattr(task_chat, 'chat_title', ''),
                "chat_message_count": getattr(task_chat, 'chat_message_count', 0),
            }
            items_response.append(item)
        
        return {
            "items": items_response,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }
    
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
    
    def annotate_chat_with_data(
        self,
        db: Session,
        task_chat_id: str,
        annotation_result: str,
        annotation_comment: Optional[str],
        annotation_data: Optional[Dict[str, Any]],
        annotated_by_id: str
    ) -> Optional[TaskChat]:
        """标注任务中的对话（支持 annotation_data JSON 字段）"""
        task_chat = db.query(TaskChat).filter(
            TaskChat.id == task_chat_id
        ).first()
        
        if not task_chat:
            return None
        
        # 更新标注信息
        task_chat.annotation_status = "completed"
        task_chat.annotation_result = annotation_result
        task_chat.annotation_comment = annotation_comment
        task_chat.annotation_data = annotation_data
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
            "annotate_chat_with_data",
            f"完成对话标注: {annotation_result}",
            new_value={
                "chat_id": task_chat.chat_id,
                "annotation_result": annotation_result,
                "annotation_comment": annotation_comment,
                "has_annotation_data": annotation_data is not None
            }
        )
        
        db.commit()
        db.refresh(task_chat)
        return task_chat
    
    def get_task_chat_detail(self, db: Session, task_chat_id: str) -> Optional[Dict[str, Any]]:
        """获取 TaskChat 详情，包含关联的 Task、Chat 和 Messages 数据"""
        from app.models.user import MessageAudit
        
        # 获取 TaskChat 及其关联数据
        task_chat = db.query(TaskChat).options(
            selectinload(TaskChat.task).selectinload(AnnotationTask.created_by),
            selectinload(TaskChat.task).selectinload(AnnotationTask.assigned_to),
            selectinload(TaskChat.chat).selectinload(Chat.messages).selectinload(Message.audits)
        ).filter(TaskChat.id == task_chat_id).first()
        
        if not task_chat:
            return None
        
        # 构造返回数据
        result = {
            # TaskChat 信息
            "id": task_chat.id,
            "task_id": task_chat.task_id,
            "chat_id": task_chat.chat_id,
            "annotation_status": task_chat.annotation_status,
            "annotation_result": task_chat.annotation_result,
            "annotation_comment": task_chat.annotation_comment,
            "annotation_data": task_chat.annotation_data,
            "annotated_by_id": task_chat.annotated_by_id,
            "annotated_at": task_chat.annotated_at.isoformat() if task_chat.annotated_at else None,
            "created_at": task_chat.created_at.isoformat(),
            "updated_at": task_chat.updated_at.isoformat(),
            
            # 关联的 Task 信息
            "task": {
                "id": task_chat.task.id,
                "title": task_chat.task.title,
                "description": task_chat.task.description,
                "status": task_chat.task.status.value,
                "priority": task_chat.task.priority.value,
                "total_chats": task_chat.task.total_chats,
                "completed_chats": task_chat.task.completed_chats,
                "completion_rate": task_chat.task.completion_rate,
                "deadline": task_chat.task.deadline.isoformat() if task_chat.task.deadline else None,
                "created_by_id": task_chat.task.created_by_id,
                "assigned_to_id": task_chat.task.assigned_to_id,
                "is_overdue": task_chat.task.is_overdue,
                "created_at": task_chat.task.created_at.isoformat(),
                "updated_at": task_chat.task.updated_at.isoformat(),
            },
            
            # 关联的 Chat 及 Messages 信息
            "chat": {
                "id": task_chat.chat.id,
                "title": task_chat.chat.title,
                "user_id": task_chat.chat.user_id,
                "created_at": task_chat.chat.created_at.isoformat(),
                "updated_at": task_chat.chat.updated_at.isoformat(),
                "messages": [
                    {
                        "id": message.id,
                        "role": message.role,
                        "content": message.content,
                        "chat_id": message.chat_id,
                        "meta_data": message.meta_data,
                        "audit_status": message.audit_status,
                        "is_flagged": message.is_flagged,
                        "created_at": message.created_at.isoformat(),
                        "updated_at": message.updated_at.isoformat(),
                        "audits": [
                            {
                                "id": audit.id,
                                "message_id": audit.message_id,
                                "annotator_id": audit.annotator_id,
                                "status": audit.status,
                                "comment": audit.comment,
                                "annotation_data": audit.annotation_data,
                                "created_at": audit.created_at.isoformat(),
                                "updated_at": audit.updated_at.isoformat(),
                            }
                            for audit in message.audits
                        ]
                    }
                    for message in task_chat.chat.messages
                ],
                "message_count": len(task_chat.chat.messages)
            },
            
            # 方便访问的字段
            "chat_title": task_chat.chat.title,
            "chat_message_count": len(task_chat.chat.messages),
        }
        
        return result
    
    def get_task_stats(self, db: Session, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        获取任务统计信息，使用单条聚合 SQL 避免全量加载

        参数:
            db: 数据库会话
            user_id: 可选，用户ID。如果提供，则只统计该用户相关的任务（创建者或被分配者）

        返回:
            stats: 任务统计字典，包括任务总数、各状态任务数、对话总数、完成对话数、逾期任务数、整体完成率等
        """
        now = get_current_beijing_time()

        base_query = db.query(
            func.count(AnnotationTask.id).label("total_tasks"),
            func.sum(case(
                (
                    or_(
                        AnnotationTask.status == TaskStatus.CREATED,
                        AnnotationTask.status == TaskStatus.ASSIGNED
                    ), 1
                ), else_=0
            )).label("pending_tasks"),
            func.sum(case((AnnotationTask.status == TaskStatus.IN_PROGRESS, 1), else_=0)).label("in_progress_tasks"),
            func.sum(case((AnnotationTask.status == TaskStatus.COMPLETED, 1), else_=0)).label("completed_tasks"),
            func.sum(case(
                (
                    and_(
                        AnnotationTask.deadline.isnot(None),
                        AnnotationTask.deadline < now,
                        AnnotationTask.status != TaskStatus.COMPLETED
                    ), 1
                ), else_=0
            )).label("overdue_tasks"),
            func.coalesce(func.sum(AnnotationTask.total_chats), 0).label("total_chats"),
            func.coalesce(func.sum(AnnotationTask.completed_chats), 0).label("completed_chats")
        )

        if user_id:
            base_query = base_query.filter(
                or_(
                    AnnotationTask.created_by_id == user_id,
                    AnnotationTask.assigned_to_id == user_id
                )
            )

        row = base_query.one()

        total_chats = int(row.total_chats or 0)
        completed_chats = int(row.completed_chats or 0)
        overall_completion_rate = round((completed_chats / total_chats) * 100, 2) if total_chats > 0 else 0.0

        return {
            "total_tasks": int(row.total_tasks or 0),
            "pending_tasks": int(row.pending_tasks or 0),
            "in_progress_tasks": int(row.in_progress_tasks or 0),
            "completed_tasks": int(row.completed_tasks or 0),
            "overdue_tasks": int(row.overdue_tasks or 0),
            "total_chats": total_chats,
            "completed_chats": completed_chats,
            "overall_completion_rate": overall_completion_rate,
        }
    
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
        
        try:
            # 删除相关的任务对话记录
            db.query(TaskChat).filter(TaskChat.task_id == task_id).delete()
            
            # 删除相关的任务日志记录
            db.query(TaskLog).filter(TaskLog.task_id == task_id).delete()
            
            # 最后删除任务本身
            db.delete(task)
            
            # 提交事务
            db.commit()
            
            # 可以考虑在独立的日志表中记录删除操作（不关联task_id）
            # 这里暂时省略，避免复杂化
            
            return True
        except Exception as e:
            # 如果删除失败，回滚事务
            db.rollback()
            raise e
    
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