"""
高级对话功能模块
包含 AI 对话、知识检索、上下文管理等功能
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel
import time

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.api.v1.auth.router import get_current_user
from app.services.openai_client import OpenAIClient
from app.services.knowledge_retrieval import KnowledgeRetrievalService
from app.services.conversation_service import get_conversation_service

# 初始化服务
openai_client = OpenAIClient()
knowledge_service = KnowledgeRetrievalService()

conversation_router = APIRouter()

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

@conversation_router.post("/ai-chat", response_model=ChatResponse)
async def ai_chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    AI 聊天接口 - 支持知识检索和上下文理解
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
                title="AI 对话"
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
        raise HTTPException(status_code=500, detail=f"AI 对话处理失败: {str(e)}")

@conversation_router.get("/cache/stats")
async def get_cache_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取缓存统计信息
    """
    try:
        conversation_service = get_conversation_service(db)
        
        stats = {
            "total_conversations": 0,
            "user_conversations": 0,
            "cache_usage": "N/A"
        }
        
        # 获取用户对话数
        user_chats = conversation_service.get_user_chats(
            user_id=current_user.id,
            skip=0,
            limit=1000
        )
        stats["user_conversations"] = len(user_chats)
        
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取缓存统计失败: {str(e)}")

@conversation_router.post("/cache/clear")
async def clear_cache(
    chat_id: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    清除对话缓存
    """
    try:
        # TODO: 实现缓存清除逻辑
        return {"message": "缓存清除功能开发中", "chat_id": chat_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"清除缓存失败: {str(e)}") 