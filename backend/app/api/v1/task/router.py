from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, exists

from app.db.session import get_db
from app.models.user import User
from app.models.chat import Chat, Message
from app.models.task import TaskChat
from app.crud.task import task_crud
from app.schemas.task import (
    TaskCreate, TaskUpdate, TaskAssign, TaskChatAnnotate,
    TaskResponse, TaskDetailResponse, TaskChatResponse, TaskLogResponse,
    TaskStats, TaskQueryParams, TaskStatusEnum, TaskPriorityEnum
)
from app.api.v1.auth.router import get_current_user, get_current_admin
from app.core.exceptions import APIExceptions

router = APIRouter()

@router.post("/", response_model=TaskResponse)
async def create_task(
    task_create: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    创建新的标注任务
    只有管理员可以创建任务
    """
    # 验证对话ID是否存在（只做计数，避免加载大量行）
    existing_count = db.query(func.count(Chat.id)).filter(
        Chat.id.in_(task_create.chat_ids)
    ).scalar()
    if int(existing_count or 0) != len(task_create.chat_ids):
        raise APIExceptions.bad_request("部分对话ID不存在")
    
    # 如果指定了分配用户，验证用户是否存在且有标注权限
    if task_create.assigned_to_id:
        assigned_user = db.query(User).filter(User.id == task_create.assigned_to_id).first()
        if not assigned_user:
            raise APIExceptions.bad_request("分配的用户不存在")
        if not assigned_user.can_annotate:
            raise APIExceptions.bad_request("分配的用户没有标注权限")
    
    task = task_crud.create_task(db, task_create, current_user.id)
    return task

@router.get("/", response_model=List[TaskResponse])
async def get_tasks(
    status: Optional[TaskStatusEnum] = Query(None, description="任务状态"),
    priority: Optional[TaskPriorityEnum] = Query(None, description="任务优先级"),
    assigned_to_id: Optional[str] = Query(None, description="分配给用户ID"),
    created_by_id: Optional[str] = Query(None, description="创建者ID"),
    overdue_only: bool = Query(False, description="只显示逾期任务"),
    skip: int = Query(0, ge=0, description="跳过数量"),
    limit: int = Query(20, ge=1, le=100, description="限制数量"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取任务列表
    管理员可以查看所有任务，标注员只能查看分配给自己的任务
    """
    params = TaskQueryParams(
        status=status,
        priority=priority,
        assigned_to_id=assigned_to_id,
        created_by_id=created_by_id,
        overdue_only=overdue_only,
        skip=skip,
        limit=limit
    )
    
    # 如果不是管理员，只能查看相关任务
    user_filter = None if current_user.is_superuser else current_user.id
    
    tasks = task_crud.get_tasks(db, params, user_filter)
    return tasks

@router.get("/{task_id}", response_model=TaskDetailResponse)
async def get_task_detail(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取任务详情
    """
    task = task_crud.get_task_by_id(db, task_id)
    if not task:
        raise APIExceptions.not_found("任务不存在")
    
    # 权限检查：管理员或任务相关用户可查看
    if not current_user.is_superuser:
        if task.created_by_id != current_user.id and task.assigned_to_id != current_user.id:
            raise APIExceptions.forbidden("无权访问此任务")
    
    return task

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    更新任务信息
    只有管理员可以更新任务
    """
    task = task_crud.update_task(db, task_id, task_update, current_user.id)
    if not task:
        raise APIExceptions.not_found("任务不存在")
    
    return task

@router.post("/{task_id}/assign", response_model=TaskResponse)
async def assign_task(
    task_id: str,
    assign_data: TaskAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    分配任务给标注员
    只有管理员可以分配任务
    """
    # 验证被分配用户是否存在且有标注权限
    assigned_user = db.query(User).filter(User.id == assign_data.assigned_to_id).first()
    if not assigned_user:
        raise APIExceptions.bad_request("分配的用户不存在")
    if not assigned_user.can_annotate:
        raise APIExceptions.bad_request("分配的用户没有标注权限")
    
    task = task_crud.assign_task(db, task_id, assign_data.assigned_to_id, current_user.id)
    if not task:
        raise APIExceptions.not_found("任务不存在")
    
    return task

@router.get("/{task_id}/chats", response_model=List[TaskChatResponse])
async def get_task_chats(
    task_id: str,
    annotation_status: Optional[str] = Query(None, description="标注状态: pending/completed/skipped"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取任务中的对话列表
    """
    # 权限检查
    task = task_crud.get_task_basic_by_id(db, task_id)
    if not task:
        raise APIExceptions.not_found("任务不存在")
    
    if not current_user.is_superuser:
        if task.created_by_id != current_user.id and task.assigned_to_id != current_user.id:
            raise APIExceptions.forbidden("无权访问此任务")
    
    task_chats = task_crud.get_task_chats(db, task_id, annotation_status)
    
    # 如果没有task_chats，直接返回空列表
    if not task_chats:
        return task_chats
    
    # 一次性查询所有相关对话的消息数量，避免N+1查询
    from sqlalchemy import func
    chat_ids = [tc.chat_id for tc in task_chats if tc.chat_id]
    
    if chat_ids:
        # 使用聚合查询一次性获取所有对话的消息数量
        message_counts = dict(
            db.query(
                Message.chat_id,
                func.count(Message.id).label('message_count')
            ).filter(
                Message.chat_id.in_(chat_ids)
            ).group_by(Message.chat_id).all()
        )
    else:
        message_counts = {}
    
    # 添加对话信息
    for task_chat in task_chats:
        if task_chat.chat:
            task_chat.chat_title = task_chat.chat.title
            # 从预查询的结果中获取消息数量
            task_chat.chat_message_count = message_counts.get(task_chat.chat_id, 0)
    
    return task_chats

@router.post("/{task_id}/chats/{task_chat_id}/annotate", response_model=TaskChatResponse)
async def annotate_task_chat(
    task_id: str,
    task_chat_id: str,
    annotation: TaskChatAnnotate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    标注任务中的对话
    只有分配给任务的标注员可以进行标注
    """
    # 权限检查
    task = task_crud.get_task_basic_by_id(db, task_id)
    if not task:
        raise APIExceptions.not_found("任务不存在")
    
    # 只有分配给任务的用户可以标注（管理员也可以）
    if not current_user.is_superuser and task.assigned_to_id != current_user.id:
        raise APIExceptions.forbidden("只有分配给任务的标注员可以进行标注")
    
    # 检查用户是否有标注权限
    if not current_user.can_annotate:
        raise APIExceptions.forbidden("用户没有标注权限")
    
    task_chat = task_crud.annotate_chat(
        db, task_chat_id, annotation.annotation_result.value, 
        annotation.annotation_comment, current_user.id
    )
    
    if not task_chat:
        raise APIExceptions.not_found("任务对话不存在")
    
    return task_chat

@router.get("/stats/overview", response_model=TaskStats)
async def get_task_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取任务统计信息
    管理员可以查看全局统计，标注员只能查看自己相关的统计
    """
    user_filter = None if current_user.is_superuser else current_user.id
    stats = task_crud.get_task_stats(db, user_filter)
    return TaskStats(**stats)

@router.get("/{task_id}/logs", response_model=List[TaskLogResponse])
async def get_task_logs(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    获取任务操作日志
    只有管理员可以查看日志
    """
    task = task_crud.get_task_by_id(db, task_id)
    if not task:
        raise APIExceptions.not_found("任务不存在")
    
    logs = task_crud.get_task_logs(db, task_id)
    return logs

@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    删除任务
    只有管理员可以删除任务
    """
    success = task_crud.delete_task(db, task_id, current_user.id)
    if not success:
        raise APIExceptions.not_found("任务不存在")
    
    return {"message": "任务删除成功"}

@router.get("/chats/pending", response_model=List[dict])
async def get_pending_chats(
    limit: int = Query(50, ge=1, le=200, description="限制数量"),
    skip: int = Query(0, ge=0, description="跳过数量"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    获取待审核的对话列表，用于创建任务
    只有管理员可以访问
    优化版本：使用单次查询避免N+1问题
    """
    from sqlalchemy import func, case
    
    # 使用子查询计算每个chat的待审核消息数量
    pending_count_subquery = db.query(
        Message.chat_id,
        func.count(Message.id).label('pending_count')
    ).filter(
        Message.audit_status == "pending"
    ).group_by(Message.chat_id).subquery()
    
    # 使用子查询获取每个chat的最新消息时间
    latest_message_subquery = db.query(
        Message.chat_id,
        func.max(Message.created_at).label('last_message_at')
    ).group_by(Message.chat_id).subquery()
    
    # NOT EXISTS 子查询：排除已被纳入任何任务的对话
    assigned_exists = db.query(TaskChat.id).filter(TaskChat.chat_id == Chat.id).exists()

    # 主查询：一次性获取所有数据，包括join子查询结果，并排除已分配到任务的对话
    query = db.query(
        Chat.id,
        Chat.title,
        Chat.created_at,
        Chat.user_id,
        func.coalesce(pending_count_subquery.c.pending_count, 0).label('pending_message_count'),
        func.coalesce(latest_message_subquery.c.last_message_at, Chat.created_at).label('last_message_at')
    ).outerjoin(
        pending_count_subquery, 
        Chat.id == pending_count_subquery.c.chat_id
    ).outerjoin(
        latest_message_subquery,
        Chat.id == latest_message_subquery.c.chat_id
    ).filter(
        # 只返回有待审核消息的对话
        pending_count_subquery.c.pending_count > 0,
        ~assigned_exists
    ).order_by(
        Chat.created_at.desc()
    ).offset(skip).limit(limit)
    
    # 执行查询并构造结果
    results = query.all()
    
    return [
        {
            "id": row.id,
            "title": row.title,
            "pending_message_count": row.pending_message_count,
            "last_message_at": row.last_message_at,
            "created_at": row.created_at,
            "user_id": row.user_id
        }
        for row in results
    ] 