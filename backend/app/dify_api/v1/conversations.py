from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import json
import time
import uuid
from datetime import datetime
from typing import Generator, Dict, Any
import asyncio

from app.db.session import get_db
from app.models.chat import Chat, Message
from app.models.user import User
from app.schemas.dify import (
    DifyMessageCreate,
    DifyMessageResponse,
    ChatMessageRequest,
    ChatCompletionResponse,
    ChatMetadata,
    Usage,
    RetrieverResource,
    MessageEvent,
    MessageDeltaEvent,
    MessageEndEvent,
    ErrorEvent
)
from app.core.security import verify_api_key_access
from app.core.exceptions import APIExceptions
from app.services.openai_client import OpenAIClient
from app.core.config import settings

router = APIRouter()

# 初始化OpenAI客户端
openai_client = OpenAIClient()

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


@router.post("/chat-messages")
async def send_chat_message(
    request: ChatMessageRequest,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_api_key_access)
):
    """
    发送对话消息 - 支持streaming和blocking模式
    这是按照Dify API规范实现的中转式对话API
    """
    try:
        # 生成唯一ID
        task_id = str(uuid.uuid4())
        message_id = str(uuid.uuid4())
        
        # 处理会话ID
        conversation_id = request.conversation_id or str(uuid.uuid4())
        
        # 确保对话存在
        chat = db.query(Chat).filter(Chat.id == conversation_id).first()
        if not chat:
            # 自动创建新对话
            title = "新对话" if request.auto_generate_name else f"Chat - {conversation_id}"
            chat = Chat(
                id=conversation_id,
                title=title,
                user_id=request.user
            )
            db.add(chat)
            db.flush()
        
        # 保存用户消息
        user_message = Message(
            chat_id=conversation_id,
            role="user",
            content=request.query,
            meta_data={"inputs": request.inputs}
        )
        db.add(user_message)
        db.commit()
        db.refresh(user_message)
        
        # 根据响应模式返回不同格式
        if request.response_mode == "streaming":
            return StreamingResponse(
                generate_streaming_response(
                    conversation_id=conversation_id,
                    message_id=message_id,
                    task_id=task_id,
                    query=request.query,
                    user=request.user,
                    db=db
                ),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                }
            )
        else:
            # blocking模式
            return await generate_blocking_response(
                conversation_id=conversation_id,
                message_id=message_id,
                task_id=task_id,
                query=request.query,
                user=request.user,
                db=db
            )
            
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise APIExceptions.internal_server_error(f"Failed to send chat message: {str(e)}")


async def generate_streaming_response(
    conversation_id: str,
    message_id: str,
    task_id: str,
    query: str,
    user: str,
    db: Session
) -> Generator[str, None, None]:
    """生成流式响应"""
    try:
        created_at = int(time.time())
        
        # 获取对话历史
        messages = get_conversation_history(db, conversation_id)
        
        # 调用OpenAI API
        if not openai_client.client:
            # 如果OpenAI客户端未配置，返回模拟响应
            answer = f"这是对'{query}'的模拟回复。请配置OpenAI API密钥以获得真实的AI回复。"
            
            # 发送完整消息事件
            message_event = MessageEvent(
                conversation_id=conversation_id,
                message_id=message_id,
                created_at=created_at,
                answer=answer
            )
            yield f"data: {message_event.model_dump_json()}\n\n"
            
            # 发送结束事件
            metadata = create_mock_metadata()
            end_event = MessageEndEvent(
                conversation_id=conversation_id,
                message_id=message_id,
                created_at=created_at,
                metadata=metadata
            )
            yield f"data: {end_event.model_dump_json()}\n\n"
            
        else:
            # 真实OpenAI API调用
            stream = openai_client.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                max_tokens=settings.OPENAI_MAX_TOKENS,
                temperature=settings.OPENAI_TEMPERATURE,
                stream=True
            )
            
            full_answer = ""
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_answer += content
                    
                    # 发送增量事件
                    delta_event = MessageDeltaEvent(
                        conversation_id=conversation_id,
                        message_id=message_id,
                        created_at=created_at,
                        delta=content
                    )
                    yield f"data: {delta_event.model_dump_json()}\n\n"
            
            # 保存AI回复
            ai_message = Message(
                chat_id=conversation_id,
                role="assistant",
                content=full_answer,
                meta_data={}
            )
            db.add(ai_message)
            db.commit()
            
            # 发送结束事件
            metadata = create_usage_metadata(full_answer, query)
            end_event = MessageEndEvent(
                conversation_id=conversation_id,
                message_id=message_id,
                created_at=created_at,
                metadata=metadata
            )
            yield f"data: {end_event.model_dump_json()}\n\n"
            
    except Exception as e:
        # 发送错误事件
        error_event = ErrorEvent(error=str(e))
        yield f"data: {error_event.model_dump_json()}\n\n"


async def generate_blocking_response(
    conversation_id: str,
    message_id: str,
    task_id: str,
    query: str,
    user: str,
    db: Session
) -> ChatCompletionResponse:
    """生成阻塞式响应"""
    created_at = int(time.time())
    
    # 获取对话历史
    messages = get_conversation_history(db, conversation_id)
    
    if not openai_client.client:
        # 模拟响应
        answer = f"这是对'{query}'的模拟回复。请配置OpenAI API密钥以获得真实的AI回复。"
        metadata = create_mock_metadata()
    else:
        # 真实OpenAI API调用
        response = openai_client.client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            max_tokens=settings.OPENAI_MAX_TOKENS,
            temperature=settings.OPENAI_TEMPERATURE
        )
        
        answer = response.choices[0].message.content
        metadata = create_usage_metadata(answer, query)
        
        # 保存AI回复
        ai_message = Message(
            chat_id=conversation_id,
            role="assistant",
            content=answer,
            meta_data={}
        )
        db.add(ai_message)
        db.commit()
    
    return ChatCompletionResponse(
        task_id=task_id,
        id=message_id,
        message_id=message_id,
        conversation_id=conversation_id,
        answer=answer,
        metadata=metadata,
        created_at=created_at
    )


def get_conversation_history(db: Session, conversation_id: str) -> list:
    """获取对话历史"""
    messages = db.query(Message).filter(
        Message.chat_id == conversation_id
    ).order_by(Message.created_at.asc()).all()
    
    history = []
    for msg in messages:
        history.append({
            "role": msg.role,
            "content": msg.content
        })
    
    return history


def create_mock_metadata() -> ChatMetadata:
    """创建模拟元数据"""
    usage = Usage(
        prompt_tokens=50,
        prompt_unit_price="0.0001",
        prompt_price_unit="USD",
        prompt_price="0.005",
        completion_tokens=100,
        completion_unit_price="0.0002",
        completion_price_unit="USD", 
        completion_price="0.02",
        total_tokens=150,
        total_price="0.025",
        currency="USD",
        latency=1200.0
    )
    
    return ChatMetadata(
        usage=usage,
        retriever_resources=[]
    )


def create_usage_metadata(answer: str, query: str) -> ChatMetadata:
    """创建使用统计元数据"""
    # 简单的token估算 (实际项目中应该使用tiktoken等库)
    prompt_tokens = len(query.split()) * 1.3  # 粗略估算
    completion_tokens = len(answer.split()) * 1.3
    total_tokens = int(prompt_tokens + completion_tokens)
    
    usage = Usage(
        prompt_tokens=int(prompt_tokens),
        prompt_unit_price="0.0001",
        prompt_price_unit="USD",
        prompt_price=f"{prompt_tokens * 0.0001:.6f}",
        completion_tokens=int(completion_tokens),
        completion_unit_price="0.0002", 
        completion_price_unit="USD",
        completion_price=f"{completion_tokens * 0.0002:.6f}",
        total_tokens=total_tokens,
        total_price=f"{(prompt_tokens * 0.0001 + completion_tokens * 0.0002):.6f}",
        currency="USD",
        latency=800.0
    )
    
    return ChatMetadata(
        usage=usage,
        retriever_resources=[]
    )