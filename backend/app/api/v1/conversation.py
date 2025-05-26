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
from app.db.conversation_manager import ConversationManager

# 初始化服务
openai_client = OpenAIClient()
knowledge_service = KnowledgeRetrievalService()
conversation_manager = ConversationManager()

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    conversation_id: str = None

class ChatResponse(BaseModel):
    response: str
    conversation_id: str

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    聊天接口
    """
    try:
        # 生成对话ID（如果没有提供）
        conversation_id = request.conversation_id or f"conv_{current_user.id}_{int(time.time())}"
        
        # 添加用户消息到历史
        conversation_manager.add_message(
            conversation_id=conversation_id,
            role="user",
            content=request.message
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
        history_messages = conversation_manager.get_context_messages(conversation_id)
        
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
        
        # 添加助手回复到历史
        conversation_manager.add_message(
            conversation_id=conversation_id,
            role="assistant",
            content=response
        )
        
        return ChatResponse(
            response=response,
            conversation_id=conversation_id
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"聊天处理失败: {str(e)}")

@router.get("/conversations")
async def get_conversations(
    current_user: User = Depends(get_current_user)
):
    """
    获取用户的对话列表
    """
    try:
        conversations = conversation_manager.get_all_conversations()
        
        # 过滤当前用户的对话（简化版本）
        user_conversations = {}
        for conv_id, messages in conversations.items():
            if f"conv_{current_user.id}_" in conv_id:
                user_conversations[conv_id] = conversation_manager.get_conversation_summary(conv_id)
        
        return {"conversations": user_conversations}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取对话列表失败: {str(e)}")

@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    获取特定对话的详细信息
    """
    try:
        # 简单的权限检查
        if not conversation_id.startswith(f"conv_{current_user.id}_"):
            raise HTTPException(status_code=403, detail="无权访问此对话")
        
        messages = conversation_manager.get_conversation(conversation_id)
        
        return {
            "conversation_id": conversation_id,
            "messages": messages
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取对话失败: {str(e)}")

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    删除对话
    """
    try:
        # 简单的权限检查
        if not conversation_id.startswith(f"conv_{current_user.id}_"):
            raise HTTPException(status_code=403, detail="无权删除此对话")
        
        conversation_manager.clear_conversation(conversation_id)
        
        return {"message": "对话已删除"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除对话失败: {str(e)}")