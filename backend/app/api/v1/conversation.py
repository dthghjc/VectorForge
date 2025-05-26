from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel
import time

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.api.v1.sql.auth import get_current_user
from app.services.openai_client import OpenAIClient
from app.services.knowledge_retrieval import KnowledgeRetrievalService
from app.services.conversation_service import get_conversation_service

# 初始化服务
openai_client = OpenAIClient()
knowledge_service = KnowledgeRetrievalService()

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    chat_id: str = None

class ChatResponse(BaseModel):
    response: str
    chat_id: str
    message_id: str

class ChatCreateRequest(BaseModel):
    title: str = None
    description: str = None

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    聊天接口 - 使用新的服务架构
    """
    try:
        conversation_service = get_conversation_service(db)
        
        # 获取或创建对话
        if request.chat_id:
            chat = conversation_service.get_chat_by_id(request.chat_id)
            if not chat or chat.user_id != current_user.id:
                raise HTTPException(status_code=404, detail="对话不存在或无权访问")
        else:
            # 创建新对话
            chat = conversation_service.create_chat(
                user_id=current_user.id,
                title="新对话"
            )
        
        # 添加用户消息
        user_message = conversation_service.add_message(
            chat_id=chat.id,
            role="user",
            content=request.message,
            user_id=current_user.id
        )
        
        # 检索相关知识
        knowledge_results = await knowledge_service.search_knowledge(
            query=request.message,
            top_k=5
        )
        
        # 构建上下文
        context = ""
        if knowledge_results:
            context = "\n".join([result.get("content", "") for result in knowledge_results])
        
        # 获取对话历史
        history_messages = conversation_service.get_context_for_llm(chat.id)
        
        # 构建完整的消息列表
        messages = [
            {"role": "system", "content": f"你是一个专业的问答助手。基于以下知识回答用户问题：\n{context}"}
        ]
        messages.extend(history_messages)
        messages.append({"role": "user", "content": request.message})
        
        # 生成回复
        response = await openai_client.generate_response(
            messages=messages,
            max_tokens=settings.OPENAI_MAX_TOKENS,
            temperature=settings.OPENAI_TEMPERATURE
        )
        
        # 添加助手回复
        assistant_message = conversation_service.add_message(
            chat_id=chat.id,
            role="assistant",
            content=response
        )
        
        return ChatResponse(
            response=response,
            chat_id=chat.id,
            message_id=assistant_message.id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"聊天处理失败: {str(e)}")

@router.post("/chats", response_model=Dict[str, Any])
async def create_chat(
    request: ChatCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    创建新对话
    """
    try:
        conversation_service = get_conversation_service(db)
        
        chat = conversation_service.create_chat(
            user_id=current_user.id,
            title=request.title or "新对话",
            description=request.description
        )
        
        return {
            "chat_id": chat.id,
            "title": chat.title,
            "description": chat.description,
            "created_at": chat.created_at.isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建对话失败: {str(e)}")

@router.get("/chats")
async def get_user_chats(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取用户的对话列表
    """
    try:
        conversation_service = get_conversation_service(db)
        
        chats = conversation_service.get_user_chats(
            user_id=current_user.id,
            skip=skip,
            limit=limit
        )
        
        chat_list = []
        for chat in chats:
            chat_summary = conversation_service.get_conversation_summary(chat.id)
            chat_list.append({
                "chat_id": chat.id,
                "title": chat.title,
                "description": chat.description,
                "created_at": chat.created_at.isoformat(),
                "updated_at": chat.updated_at.isoformat(),
                "message_count": chat_summary.get("message_count", 0)
            })
        
        return {"chats": chat_list}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取对话列表失败: {str(e)}")

@router.get("/chats/{chat_id}")
async def get_chat_detail(
    chat_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取特定对话的详细信息
    """
    try:
        conversation_service = get_conversation_service(db)
        
        # 验证对话所有权
        chat = conversation_service.get_chat_by_id(chat_id)
        if not chat or chat.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="对话不存在或无权访问")
        
        # 获取消息
        messages = conversation_service.get_chat_messages(chat_id)
        
        return {
            "chat_id": chat.id,
            "title": chat.title,
            "description": chat.description,
            "created_at": chat.created_at.isoformat(),
            "updated_at": chat.updated_at.isoformat(),
            "messages": messages
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取对话失败: {str(e)}")

@router.delete("/chats/{chat_id}")
async def delete_chat(
    chat_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    删除对话
    """
    try:
        conversation_service = get_conversation_service(db)
        
        # 验证对话所有权
        chat = conversation_service.get_chat_by_id(chat_id)
        if not chat or chat.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="对话不存在或无权访问")
        
        success = conversation_service.delete_chat(chat_id)
        
        if success:
            return {"message": "对话已删除"}
        else:
            raise HTTPException(status_code=500, detail="删除对话失败")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除对话失败: {str(e)}")

@router.get("/cache/stats")
async def get_cache_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取缓存统计信息（管理员功能）
    """
    try:
        if not current_user.can_review():
            raise HTTPException(status_code=403, detail="权限不足")
        
        conversation_service = get_conversation_service(db)
        stats = conversation_service.get_cache_stats()
        
        return {"cache_stats": stats}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取缓存统计失败: {str(e)}")

@router.post("/cache/clear")
async def clear_cache(
    chat_id: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    清除缓存（管理员功能）
    """
    try:
        if not current_user.can_review():
            raise HTTPException(status_code=403, detail="权限不足")
        
        conversation_service = get_conversation_service(db)
        conversation_service.clear_cache(chat_id)
        
        message = f"已清除{'指定对话' if chat_id else '所有'}缓存"
        return {"message": message}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"清除缓存失败: {str(e)}")