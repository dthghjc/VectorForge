from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.chat import Chat, Message
from app.models.user import User
from app.schemas.dify import (
    DifyConversationCreate, 
    DifyConversationResponse,
    DifyMessageCreate,
    DifyMessageResponse,
    DifyConversationList,
    DifyErrorResponse
)
from app.core.security import get_api_key_user
from app.core.exceptions import APIExceptions
from app.crud.user import user_crud

router = APIRouter()

@router.post("/conversations", response_model=DifyConversationResponse)
async def create_conversation(
    conversation_data: DifyConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_api_key_user)
):
    """
    创建对话并批量上传消息
    用于 Dify 上传完整对话历史
    """
    try:
        # 检查对话是否已存在
        existing_chat = db.query(Chat).filter(Chat.id == conversation_data.conversation_id).first()
        if existing_chat:
            raise APIExceptions.chat_id_exists()
        
        # 获取或创建用户
        target_user = current_user
        if conversation_data.user_id:
            target_user = user_crud.get_user_by_id(db, conversation_data.user_id)
            if not target_user:
                # 如果用户不存在，使用当前 API 用户
                target_user = current_user
        
        # 创建对话
        chat = Chat(
            id=conversation_data.conversation_id,
            title=conversation_data.title or "Dify Conversation",
            user_id=target_user.id
        )
        db.add(chat)
        db.flush()  # 获取 ID 但不提交
        
        # 批量创建消息
        messages = []
        for msg_data in conversation_data.messages:
            # 验证角色
            if msg_data.role not in ["user", "assistant", "system"]:
                raise APIExceptions.invalid_role()
            
            message = Message(
                chat_id=chat.id,
                role=msg_data.role,
                content=msg_data.content,
                meta_data=msg_data.metadata or {}
            )
            messages.append(message)
        
        db.add_all(messages)
        db.commit()
        db.refresh(chat)
        
        return DifyConversationResponse(
            conversation_id=chat.id,
            title=chat.title,
            message_count=len(messages),
            created_at=chat.created_at
        )
        
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise APIExceptions.internal_server_error(f"Failed to create conversation: {str(e)}")

@router.post("/conversations/{conversation_id}/messages", response_model=DifyMessageResponse)
async def add_message(
    conversation_id: str,
    message_data: DifyMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_api_key_user)
):
    """
    向指定对话添加单条消息
    """
    try:
        # 检查对话是否存在
        chat = db.query(Chat).filter(Chat.id == conversation_id).first()
        if not chat:
            raise APIExceptions.chat_not_found()
        
        # 验证角色
        if message_data.role not in ["user", "assistant", "system"]:
            raise APIExceptions.invalid_role()
        
        # 创建消息
        message = Message(
            chat_id=conversation_id,
            role=message_data.role,
            content=message_data.content,
            meta_data=message_data.metadata or {}
        )
        
        db.add(message)
        db.commit()
        db.refresh(message)
        
        return DifyMessageResponse(
            message_id=message.id,
            conversation_id=message.chat_id,
            role=message.role,
            content=message.content,
            created_at=message.created_at
        )
        
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise APIExceptions.internal_server_error(f"Failed to add message: {str(e)}")

@router.get("/conversations", response_model=DifyConversationList)
async def list_conversations(
    page: int = 1,
    page_size: int = 20,
    user_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_api_key_user)
):
    """
    获取对话列表
    """
    try:
        offset = (page - 1) * page_size
        
        query = db.query(Chat)
        if user_id:
            query = query.filter(Chat.user_id == user_id)
        
        total = query.count()
        chats = query.order_by(Chat.created_at.desc()).offset(offset).limit(page_size).all()
        
        conversations = []
        for chat in chats:
            message_count = db.query(Message).filter(Message.chat_id == chat.id).count()
            conversations.append({
                "conversation_id": chat.id,
                "title": chat.title,
                "user_id": chat.user_id,
                "message_count": message_count,
                "created_at": chat.created_at.isoformat(),
                "updated_at": chat.updated_at.isoformat()
            })
        
        return DifyConversationList(
            conversations=conversations,
            total=total,
            page=page,
            page_size=page_size
        )
        
    except Exception as e:
        raise APIExceptions.internal_server_error(f"Failed to list conversations: {str(e)}")

@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_api_key_user)
):
    """
    获取指定对话的详细信息和消息
    """
    try:
        chat = db.query(Chat).filter(Chat.id == conversation_id).first()
        if not chat:
            raise APIExceptions.chat_not_found()
        
        messages = db.query(Message).filter(
            Message.chat_id == conversation_id
        ).order_by(Message.created_at.asc()).all()
        
        return {
            "conversation_id": chat.id,
            "title": chat.title,
            "user_id": chat.user_id,
            "created_at": chat.created_at.isoformat(),
            "updated_at": chat.updated_at.isoformat(),
            "messages": [
                {
                    "message_id": msg.id,
                    "role": msg.role,
                    "content": msg.content,
                    "metadata": msg.meta_data,
                    "created_at": msg.created_at.isoformat()
                }
                for msg in messages
            ]
        }
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise APIExceptions.internal_server_error(f"Failed to get conversation: {str(e)}")

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_api_key_user)
):
    """
    删除指定对话
    """
    try:
        chat = db.query(Chat).filter(Chat.id == conversation_id).first()
        if not chat:
            raise APIExceptions.chat_not_found()
        
        # 删除相关消息
        db.query(Message).filter(Message.chat_id == conversation_id).delete()
        
        # 删除对话
        db.delete(chat)
        db.commit()
        
        return {"status": "success", "message": "Conversation deleted"}
        
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise APIExceptions.internal_server_error(f"Failed to delete conversation: {str(e)}") 