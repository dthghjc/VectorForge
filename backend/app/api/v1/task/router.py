from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, exists, case, text

from app.db.session import get_db
from app.models.user import User
from app.models.chat import Chat, Message
from app.models.task import TaskChat
from app.crud.task import task_crud
from app.schemas.task import (
    TaskCreate, TaskUpdate, TaskAssign, TaskChatAnnotate,
    TaskResponse, TaskDetailResponse, TaskChatResponse, TaskLogResponse,
    TaskStats, TaskQueryParams, TaskStatusEnum, TaskPriorityEnum,
    PendingChatResponse, PaginatedPendingChatsResponse
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

@router.get("/chats/pending", response_model=PaginatedPendingChatsResponse)
async def get_pending_chats(
    page: int = Query(1, ge=1, description="页码，从1开始"),
    page_size: int = Query(10, ge=1, le=100, description="每页数量"),
    search: Optional[str] = Query(None, description="搜索对话标题"),
    sort_by: str = Query("created_at", description="排序字段: created_at, pending_count, last_message_at"),
    sort_order: str = Query("desc", regex="^(asc|desc)$", description="排序方向: asc, desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    获取待审核的对话列表，用于创建任务
    
    性能优化说明：
    - 使用单个 CTE 查询减少子查询复杂度
    - 使用窗口函数优化计数和时间聚合
    - 建议为以下字段创建索引：
      - messages(chat_id, audit_status, created_at)
      - task_chats(chat_id)
      - chats(created_at, title)
    """
    
    # 计算偏移量
    skip = (page - 1) * page_size
    
    # 使用 CTE (Common Table Expression) 优化查询
    # 这种方式比多个子查询更高效，可读性更好
    
    # 构建动态 WHERE 条件
    search_condition = ""
    if search:
        search_condition = "AND c.title LIKE :search_pattern"
    
    # 构建 CTE 查询，一次性获取所有需要的聚合数据
    cte_query = text(f"""
        WITH chat_aggregates AS (
            SELECT 
                c.id,
                c.title,
                c.created_at,
                c.user_id,
                COALESCE(pending_stats.pending_count, 0) as pending_message_count,
                COALESCE(pending_stats.last_message_at, c.created_at) as last_message_at
            FROM chats c
            LEFT JOIN (
                SELECT 
                    chat_id,
                    COUNT(*) as pending_count,
                    MAX(created_at) as last_message_at
                FROM messages 
                WHERE audit_status = 'pending'
                GROUP BY chat_id
            ) pending_stats ON c.id = pending_stats.chat_id
            WHERE pending_stats.pending_count > 0
              AND NOT EXISTS (
                  SELECT 1 FROM task_chats tc WHERE tc.chat_id = c.id
              )
              {search_condition}
        ),
        total_count AS (
            SELECT COUNT(*) as total FROM chat_aggregates
        )
        SELECT 
            ca.*,
            tc.total
        FROM chat_aggregates ca
        CROSS JOIN total_count tc
        ORDER BY 
            CASE WHEN :sort_by = 'created_at' AND :sort_order = 'desc' THEN ca.created_at END DESC,
            CASE WHEN :sort_by = 'created_at' AND :sort_order = 'asc' THEN ca.created_at END ASC,
            CASE WHEN :sort_by = 'pending_count' AND :sort_order = 'desc' THEN ca.pending_message_count END DESC,
            CASE WHEN :sort_by = 'pending_count' AND :sort_order = 'asc' THEN ca.pending_message_count END ASC,
            CASE WHEN :sort_by = 'last_message_at' AND :sort_order = 'desc' THEN ca.last_message_at END DESC,
            CASE WHEN :sort_by = 'last_message_at' AND :sort_order = 'asc' THEN ca.last_message_at END ASC
        LIMIT :limit OFFSET :skip
    """)
    
    # 准备查询参数
    params = {
        "sort_by": sort_by,
        "sort_order": sort_order,
        "limit": page_size,
        "skip": skip
    }
    
    # 只有在有搜索条件时才添加搜索参数
    if search:
        params["search_pattern"] = f"%{search}%"
    
    # 执行优化后的查询
    result = db.execute(cte_query, params)
    
    rows = result.fetchall()
    
    # 如果没有结果，返回空数据
    if not rows:
        return {"total": 0, "items": []}
    
    # 从第一行获取总数（所有行的 total 字段都相同）
    total_count = rows[0].total
    
    # 构造响应数据
    items = [
        PendingChatResponse(
            id=row.id,
            title=row.title,
            pending_message_count=row.pending_message_count,
            last_message_at=row.last_message_at,
            created_at=row.created_at,
            user_id=row.user_id
        )
        for row in rows
    ]
    
    return {
        "total": total_count,
        "items": items
    }