"""
Dify API 中转代理模块
前端通过JWT认证调用，后端转发到Dify API
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import httpx
import json
import time
import uuid
from datetime import datetime
from typing import Generator, Dict, Any, AsyncGenerator
import asyncio
import logging

from app.db.session import get_db
from app.models.chat import Chat, Message
from app.models.user import User
from app.schemas.dify import (
    ChatMessageRequest,
    ChatCompletionResponse,
    StreamingEvent
)
from app.api.v1.auth.router import get_current_user
from app.core.config import settings
from app.core.exceptions import APIExceptions

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/chat-messages")
async def proxy_chat_message(
    request: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Dify 对话消息代理端点
    - 前端使用JWT认证
    - 后端转发到Dify API
    - 支持streaming和blocking模式
    """
    if not settings.DIFY_API_KEY:
        raise APIExceptions.internal_server_error("Dify API key not configured")
    
    try:
        # 生成唯一ID
        # task_id = str(uuid.uuid4())
        # message_id = str(uuid.uuid4())
        
        # 处理会话ID
        conversation_id = request.conversation_id
        
        # 确保对话存在（在本地数据库中记录）
        # chat = db.query(Chat).filter(Chat.id == conversation_id).first()
        # if not chat:
        #     # 自动创建新对话
        #     title = "新对话" if request.auto_generate_name else f"Chat - {conversation_id}"
        #     chat = Chat(
        #         id=conversation_id,
        #         title=title,
        #         user_id=current_user.id  # 使用JWT认证的用户ID
        #     )
        #     db.add(chat)
        #     db.flush()
        
        # 保存用户消息到本地数据库
        # user_message = Message(
        #     chat_id=conversation_id,
        #     role="user",
        #     content=request.query,
        #     meta_data={"inputs": request.inputs, "user": request.user}
        # )
        # db.add(user_message)
        # db.commit()
        # db.refresh(user_message)
        
        # 准备发送到Dify的请求
        dify_request = {
            "query": request.query,
            "user": current_user.username,
            "inputs": request.inputs,
            "response_mode": request.response_mode,
            "auto_generate_name": True
        }
        
        # 如果有conversation_id，添加到请求中
        if conversation_id:
            dify_request["conversation_id"] = conversation_id
            
        # 如果有文件，添加到请求中
        if request.files:
            dify_request["files"] = [file.dict() for file in request.files]
        
        # 根据响应模式处理
        if request.response_mode == "streaming":
            return StreamingResponse(
                proxy_streaming_response(dify_request, conversation_id, db),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                }
            )
        else:
            # blocking模式
            return await proxy_blocking_response(dify_request, conversation_id, db)
            
    except Exception as e:
        db.rollback()
        logger.error(f"Dify proxy error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise APIExceptions.internal_server_error(f"Failed to proxy chat message: {str(e)}")


async def proxy_streaming_response(
    dify_request: dict,
    conversation_id: str,
    db: Session
) -> AsyncGenerator[str, None]:
    """代理流式响应到Dify API"""
    headers = {
        "Authorization": f"Bearer {settings.DIFY_API_KEY}",
        "Content-Type": "application/json"
    }
    
    url = f"{settings.DIFY_API_URL}/chat-messages"
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream(
                "POST",
                url,
                json=dify_request,
                headers=headers
            ) as response:
                
                if response.status_code != 200:
                    error_text = await response.aread()
                    logger.error(f"Dify API error: {response.status_code} - {error_text}")
                    error_event = {
                        "event": "error",
                        "error": f"Dify API error: {response.status_code}"
                    }
                    yield f"data: {json.dumps(error_event)}\n\n"
                    return
                
                full_answer = ""
                ai_message_saved = False
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        try:
                            event_data = json.loads(line[6:])
                            
                            # 转发事件到前端
                            yield f"data: {json.dumps(event_data)}\n\n"
                            
                            # 收集完整答案用于保存
                            if event_data.get("event") == "message":
                                full_answer = event_data.get("answer", "")
                            elif event_data.get("event") == "message_delta":
                                full_answer += event_data.get("delta", "")
                            elif event_data.get("event") == "message_end" and not ai_message_saved:
                                # 保存AI回复到本地数据库
                                if full_answer:
                                    ai_message = Message(
                                        chat_id=conversation_id,
                                        role="assistant",
                                        content=full_answer,
                                        meta_data=event_data.get("metadata", {})
                                    )
                                    db.add(ai_message)
                                    db.commit()
                                    ai_message_saved = True
                                    
                        except json.JSONDecodeError as e:
                            logger.error(f"JSON decode error: {e}")
                            continue
                        except Exception as e:
                            logger.error(f"Error processing stream event: {e}")
                            continue
                            
    except httpx.TimeoutException:
        error_event = {
            "event": "error",
            "error": "Request timeout"
        }
        yield f"data: {json.dumps(error_event)}\n\n"
    except Exception as e:
        logger.error(f"Streaming proxy error: {str(e)}")
        error_event = {
            "event": "error",
            "error": str(e)
        }
        yield f"data: {json.dumps(error_event)}\n\n"


async def proxy_blocking_response(
    dify_request: dict,
    conversation_id: str,
    db: Session
) -> dict:
    """代理阻塞式响应到Dify API"""
    headers = {
        "Authorization": f"Bearer {settings.DIFY_API_KEY}",
        "Content-Type": "application/json"
    }
    
    url = f"{settings.DIFY_API_URL}/chat-messages"
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                url,
                json=dify_request,
                headers=headers
            )
            
            if response.status_code != 200:
                error_text = response.text
                logger.error(f"Dify API error: {response.status_code} - {error_text}")
                raise APIExceptions.internal_server_error(f"Dify API error: {response.status_code}")
            
            result = response.json()
            
            # 保存AI回复到本地数据库
            # if result.get("answer"):
            #     ai_message = Message(
            #         chat_id=conversation_id,
            #         role="assistant",
            #         content=result["answer"],
            #         meta_data=result.get("metadata", {})
            #     )
            #     db.add(ai_message)
            #     db.commit()
            
            return result
            
    except httpx.TimeoutException:
        raise APIExceptions.internal_server_error("Request timeout")
    except Exception as e:
        logger.error(f"Blocking proxy error: {str(e)}")
        raise APIExceptions.internal_server_error(f"Failed to proxy request: {str(e)}")


@router.get("/conversations")
async def list_conversations(
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取当前用户的对话列表"""
    try:
        offset = (page - 1) * page_size
        
        # 查询用户的对话
        conversations_query = db.query(Chat).filter(
            Chat.user_id == current_user.id
        ).order_by(Chat.updated_at.desc())
        
        total = conversations_query.count()
        conversations = conversations_query.offset(offset).limit(page_size).all()
        
        # 构建响应
        conversation_list = []
        for chat in conversations:
            message_count = db.query(Message).filter(Message.chat_id == chat.id).count()
            conversation_list.append({
                "conversation_id": chat.id,
                "title": chat.title,
                "user_id": chat.user_id,
                "message_count": message_count,
                "created_at": chat.created_at.isoformat(),
                "updated_at": chat.updated_at.isoformat()
            })
        
        return {
            "conversations": conversation_list,
            "total": total,
            "page": page,
            "page_size": page_size
        }
        
    except Exception as e:
        logger.error(f"Error listing conversations: {str(e)}")
        raise APIExceptions.internal_server_error(f"Failed to list conversations: {str(e)}")


@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取指定对话的详情和消息历史"""
    try:
        # 检查对话是否属于当前用户
        chat = db.query(Chat).filter(
            Chat.id == conversation_id,
            Chat.user_id == current_user.id
        ).first()
        
        if not chat:
            raise APIExceptions.chat_not_found()
        
        # 获取消息历史
        messages = db.query(Message).filter(
            Message.chat_id == conversation_id
        ).order_by(Message.created_at.asc()).all()
        
        message_list = []
        for msg in messages:
            message_list.append({
                "message_id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "metadata": msg.meta_data,
                "created_at": msg.created_at.isoformat()
            })
        
        return {
            "conversation_id": chat.id,
            "title": chat.title,
            "user_id": chat.user_id,
            "created_at": chat.created_at.isoformat(),
            "updated_at": chat.updated_at.isoformat(),
            "messages": message_list
        }
        
    except Exception as e:
        logger.error(f"Error getting conversation: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise APIExceptions.internal_server_error(f"Failed to get conversation: {str(e)}")


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除指定对话"""
    try:
        # 检查对话是否属于当前用户
        chat = db.query(Chat).filter(
            Chat.id == conversation_id,
            Chat.user_id == current_user.id
        ).first()
        
        if not chat:
            raise APIExceptions.chat_not_found()
        
        # 删除对话（级联删除消息）
        db.delete(chat)
        db.commit()
        
        return {
            "status": "success",
            "message": "Conversation deleted"
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting conversation: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise APIExceptions.internal_server_error(f"Failed to delete conversation: {str(e)}") 