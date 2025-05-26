from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.chat import Message
from app.schemas.chat import MessageAuditCreate, MessageAuditResponse, MessageUpdate
from app.schemas.user import UserBrief
from app.crud.user import user_crud, audit_crud
from app.api.v1.sql.auth import get_current_reviewer, get_current_admin, get_current_user

router = APIRouter()

@router.post("/messages/{message_id}/audit", response_model=MessageAuditResponse)
async def audit_message(
    message_id: str,
    audit_data: MessageAuditCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_reviewer)
):
    """
    审核消息
    """
    # 检查消息是否存在
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="消息不存在")
    
    # 创建审核记录
    audit = audit_crud.create_audit(
        db=db,
        message_id=message_id,
        reviewer_id=current_user.id,
        status=audit_data.status,
        comment=audit_data.comment
    )
    
    # 更新消息的审核状态
    message.audit_status = audit_data.status
    db.commit()
    
    # 更新用户标注统计
    if audit_data.status == "approved":
        user_crud.update_annotation_stats(db, message.chat.user_id, approved=True)
    elif audit_data.status == "rejected":
        user_crud.update_annotation_stats(db, message.chat.user_id, approved=False)
    
    return audit

@router.get("/messages/pending", response_model=List[dict])
async def get_pending_messages(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_reviewer)
):
    """
    获取待审核的消息列表
    """
    messages = db.query(Message).filter(
        Message.audit_status == "pending"
    ).offset(skip).limit(limit).all()
    
    result = []
    for message in messages:
        result.append({
            "id": message.id,
            "content": message.content,
            "role": message.role,
            "chat_id": message.chat_id,
            "chat_title": message.chat.title,
            "user": {
                "id": message.chat.user.id,
                "username": message.chat.user.username,
                "nickname": message.chat.user.nickname
            },
            "created_at": message.created_at,
            "audit_status": message.audit_status
        })
    
    return result

@router.get("/messages/{message_id}/audits", response_model=List[MessageAuditResponse])
async def get_message_audits(
    message_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取消息的审核记录
    """
    audits = audit_crud.get_audits_by_message(db, message_id)
    return audits

@router.get("/reviewers", response_model=List[UserBrief])
async def get_reviewers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    获取所有审核员列表（管理员权限）
    """
    reviewers = user_crud.get_reviewers(db)
    return reviewers

@router.get("/stats")
async def get_audit_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_reviewer)
):
    """
    获取审核统计信息
    """
    # 总消息数
    total_messages = db.query(Message).count()
    
    # 待审核消息数
    pending_messages = db.query(Message).filter(Message.audit_status == "pending").count()
    
    # 已通过消息数
    approved_messages = db.query(Message).filter(Message.audit_status == "approved").count()
    
    # 已拒绝消息数
    rejected_messages = db.query(Message).filter(Message.audit_status == "rejected").count()
    
    # 当前用户的审核统计
    user_audits = audit_crud.get_audits_by_reviewer(db, current_user.id)
    user_audit_count = len(user_audits)
    
    return {
        "total_messages": total_messages,
        "pending_messages": pending_messages,
        "approved_messages": approved_messages,
        "rejected_messages": rejected_messages,
        "approval_rate": round(approved_messages / max(total_messages - pending_messages, 1) * 100, 2),
        "user_audit_count": user_audit_count,
        "user_approval_rate": current_user.approval_rate
    }

@router.put("/messages/{message_id}/flag")
async def flag_message(
    message_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_reviewer)
):
    """
    标记消息（用于特殊关注）
    """
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="消息不存在")
    
    # 切换标记状态
    message.is_flagged = "1" if message.is_flagged == "0" else "0"
    db.commit()
    
    return {"message": "标记状态已更新", "is_flagged": message.is_flagged == "1"}

@router.get("/my-audits", response_model=List[MessageAuditResponse])
async def get_my_audits(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取当前用户的审核记录
    """
    audits = audit_crud.get_audits_by_reviewer(db, current_user.id, skip, limit)
    return audits 