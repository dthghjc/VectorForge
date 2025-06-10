from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.chat import Chat, Message
from app.models.user import User
from app.schemas.dify import (
    DifyMessageCreate,
    DifyMessageResponse
)
from app.core.security import verify_api_key_access
from app.core.exceptions import APIExceptions

router = APIRouter()

@router.post("/conversations/{conversation_id}/messages", response_model=DifyMessageResponse)
async def add_message(
    conversation_id: str,
    message_data: DifyMessageCreate,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_api_key_access)  # 验证API Key
):
    """
    向指定对话添加单条消息
    如果对话不存在则自动创建
    """
    try:
        # 获取用户ID
        target_user_id = message_data.user_id
        
        # 如果没有提供user_id，使用默认值
        if not target_user_id:
            target_user_id = "dify_default_user"
        
        # 检查对话是否存在，如果不存在则创建
        chat = db.query(Chat).filter(Chat.id == conversation_id).first()
        if not chat:
            # 自动创建新的对话
            chat = Chat(
                id=conversation_id,
                title=f"Chat - {conversation_id}",  # 默认标题
                user_id=target_user_id
            )
            db.add(chat)
            db.flush()  # 获取 ID 但不提交
        
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