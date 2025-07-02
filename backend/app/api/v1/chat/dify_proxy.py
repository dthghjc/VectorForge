"""
Dify API 中转代理模块
前端通过JWT认证调用，后端转发到Dify API

核心功能：
1. 支持 streaming 和 blocking 两种响应模式
2. 统一提取和保存关键信息：
   - conversation_id: 对话唯一标识
   - message_id: 消息唯一标识  
   - task_id: 任务唯一标识
   - 完整的模型回复内容
   - metadata: 包含使用量统计、检索资源等元数据

事件处理策略：
- Streaming模式: 通过 DifyEventHandler 处理 workflow_finished 和 message_end 事件
- Blocking模式: 直接从响应JSON中提取所有信息
- 统一的数据保存格式，便于后续审核和分析
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import httpx
import json
from datetime import datetime
from typing import AsyncGenerator
import uuid

from app.db.session import get_db
from app.models.chat import Chat, Message
from app.models.user import User
from app.models.base import get_current_beijing_time
from app.schemas.dify import (
    ChatMessageRequest,
    ChatCompletionResponse,
    StreamingEvent,
    StopChatResponse
)
from app.api.v1.auth.router import get_current_user
from app.core.config import settings
from app.core.exceptions import APIExceptions
from app.services.title_generation import generate_conversation_title
router = APIRouter()


async def ensure_chat_exists(db: Session, conversation_id: str, user_id: int, user_query: str = None) -> Chat:
    """确保对话存在，如果不存在则创建"""
    chat = db.query(Chat).filter(Chat.id == conversation_id).first()
    if not chat:
        # 只有在创建新对话时才生成标题
        if user_query:
            title = await generate_conversation_title(user_query)
        else:
            title = f"Chat - {conversation_id[:8]}"
            
        chat = Chat(
            id=conversation_id,
            title=title,
            user_id=user_id
        )
        db.add(chat)
        db.flush()

    return chat


class DifyEventHandler:
    """Dify 事件处理器 - 支持 streaming 和 blocking 模式，延迟存储用户消息"""
    
    def __init__(self, user_query: str, user_metadata: dict, current_user_id: int):
        # AI回复相关
        self.full_answer = ""
        self.ai_message_saved = False
        self.workflow_data = {}
        self.message_metadata = {}
        self.conversation_id = ""
        self.ai_message_id = ""  # AI回复的message_id
        self.task_id = ""
        
        # 用户消息相关 - 延迟存储
        self.user_query = user_query
        self.user_metadata = user_metadata
        self.current_user_id = current_user_id
        self.user_message_id = str(uuid.uuid4())  # 程序生成用户消息ID
        self.user_message_created_at = get_current_beijing_time()  # 记录用户消息的真实时间（北京时间）
    
    def process_event(self, event_data: dict) -> bool:
        """
        处理 Dify 事件
        返回 True 表示消息已完整保存
        """
        event_type = event_data.get("event")
        
        if event_type == "workflow_finished":
            # Workflow完成事件 - 提取完整答案
            self.workflow_data = event_data.get("data", {})
            outputs = self.workflow_data.get("outputs", {})
            if outputs.get("answer"):
                self.full_answer = outputs["answer"]
                
        elif event_type == "message_end" and not self.ai_message_saved:
            # 消息结束事件 - 提取所有关键信息和元数据
            self.conversation_id = event_data.get("conversation_id", "")
            self.ai_message_id = event_data.get("message_id", "")
            self.task_id = event_data.get("task_id", "")
            self.message_metadata = event_data.get("metadata", {})
            
            # 如果有完整答案，准备保存
            if self.full_answer:
                return True  # 表示可以保存消息了
                
        # 其他事件类型不处理，直接忽略
        return False
    
    def process_blocking_response(self, response_data: dict) -> bool:
        """
        处理 blocking 模式的响应数据
        返回 True 表示可以保存消息
        """
        # 从 blocking 响应中提取信息
        self.conversation_id = response_data.get("conversation_id", "")
        self.ai_message_id = response_data.get("message_id", "")
        self.task_id = response_data.get("task_id", "")
        self.full_answer = response_data.get("answer", "")
        self.message_metadata = response_data.get("metadata", {})
        
        # 如果有workflow相关数据，也保存
        if "workflow_run_id" in response_data:
            self.workflow_data = {
                "workflow_run_id": response_data.get("workflow_run_id"),
                "status": "succeeded",  # blocking模式通常表示成功
                "outputs": {"answer": self.full_answer}
            }
        

        
        return bool(self.full_answer)  # 有答案就可以保存
    
    async def save_conversation_to_db(self, db: Session) -> bool:
        """
        保存完整对话到数据库（用户消息 + AI回复）
        用户消息使用接收到消息的真实时间，AI回复使用完成回复的时间
        返回 True 表示保存成功
        """
        try:
            # 确保对话存在（只有新对话才会生成标题）
            chat = await ensure_chat_exists(
                db=db,
                conversation_id=self.conversation_id,
                user_id=self.current_user_id,
                user_query=self.user_query
            )
            
            # 保存用户消息 - 使用真实的接收时间
            user_message = Message(
                id=self.user_message_id,
                chat_id=self.conversation_id,
                role="user",
                content=self.user_query,
                meta_data=self.user_metadata,
                created_at=self.user_message_created_at,  # 使用记录的真实时间
                updated_at=self.user_message_created_at   # 创建时更新时间与创建时间相同
            )
            db.add(user_message)
            
            # 保存AI回复 - 使用当前时间（回复完成时间）
            ai_content, ai_metadata = self.get_message_data()
            ai_message = Message(
                id=self.ai_message_id,
                chat_id=self.conversation_id,
                role="assistant",
                content=ai_content,
                meta_data=ai_metadata
                # created_at 和 updated_at 使用默认值（当前时间）
            )
            db.add(ai_message)
            
            # 提交事务
            db.commit()
            self.ai_message_saved = True
            return True
            
        except Exception as e:
            db.rollback()
            return False
    
    def get_message_data(self) -> tuple[str, dict]:
        """获取要保存的消息数据"""
        # 合并所有元数据
        combined_metadata = {
            **self.message_metadata,
            "conversation_id": self.conversation_id,
            "message_id": self.ai_message_id,
            "task_id": self.task_id,
            "workflow_data": self.workflow_data
        }
        return self.full_answer, combined_metadata


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
        # 处理会话ID
        conversation_id = request.conversation_id
        
        # 准备用户消息元数据
        user_message_metadata = {
            "inputs": request.inputs,
            "user": current_user.username,
            "files": [file.dict() for file in request.files] if request.files else [],
            "response_mode": request.response_mode
        }
        
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
                proxy_streaming_response(dify_request, request.query, user_message_metadata, current_user.id, db),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                }
            )
        else:
            # blocking模式
            return await proxy_blocking_response(dify_request, request.query, user_message_metadata, current_user.id, db)
            
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise APIExceptions.internal_server_error(f"Failed to proxy chat message: {str(e)}")


async def proxy_streaming_response(
    dify_request: dict,
    user_query: str,
    user_metadata: dict,
    current_user_id: int,
    db: Session
) -> AsyncGenerator[str, None]:
    """
    代理流式响应到Dify API
    
    处理 Dify Workflow 模式的事件流：
    1. workflow_finished: 包含完整的模型回复 (data.outputs.answer)
    2. message_end: 包含元数据信息 (metadata.usage, metadata.retriever_resources等)
    3. 其他事件: 直接转发给前端
    
    消息保存策略：
    - 延迟保存：等到获得完整AI回复后，一起保存用户消息和AI回复
    - 使用 Dify 返回的 conversation_id 和 AI message_id
    - 用户 message_id 由程序生成
    """
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
                    error_event = {
                        "event": "error",
                        "error": f"Dify API error: {response.status_code}"
                    }
                    yield f"data: {json.dumps(error_event)}\n\n"
                    return
                
                event_handler = DifyEventHandler(user_query, user_metadata, current_user_id)
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        try:
                            event_data = json.loads(line[6:])
                            
                            # 转发事件到前端
                            yield f"data: {json.dumps(event_data)}\n\n"
                            
                            # 处理事件并检查是否可以保存消息
                            should_save = event_handler.process_event(event_data)
                            
                            if should_save and not event_handler.ai_message_saved:
                                # 保存完整对话到数据库（用户消息 + AI回复）
                                await event_handler.save_conversation_to_db(db)
                                    
                        except json.JSONDecodeError as e:
                            continue
                        except Exception as e:
                            continue
                            
    except httpx.TimeoutException:
        error_event = {
            "event": "error",
            "error": "Request timeout"
        }
        yield f"data: {json.dumps(error_event)}\n\n"
    except Exception as e:
        error_event = {
            "event": "error",
            "error": str(e)
        }
        yield f"data: {json.dumps(error_event)}\n\n"


async def proxy_blocking_response(
    dify_request: dict,
    user_query: str,
    user_metadata: dict,
    current_user_id: int,
    db: Session
) -> dict:
    """
    代理阻塞式响应到Dify API
    
    处理 blocking 模式的响应，提取关键信息：
    - conversation_id: 对话ID
    - message_id: 消息ID
    - task_id: 任务ID
    - answer: 完整的模型回复
    - metadata: 元数据（usage, retriever_resources等）
    
    消息保存策略：
    - 延迟保存：等到获得完整AI回复后，一起保存用户消息和AI回复
    """
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
                raise APIExceptions.internal_server_error(f"Dify API error: {response.status_code}")
            
            result = response.json()
            
            # 使用事件处理器处理响应
            event_handler = DifyEventHandler(user_query, user_metadata, current_user_id)
            should_save = event_handler.process_blocking_response(result)
            
            if should_save:
                # 保存完整对话到数据库（用户消息 + AI回复）
                await event_handler.save_conversation_to_db(db)
            
            return result
            
    except httpx.TimeoutException:
        raise APIExceptions.internal_server_error("Request timeout")
    except Exception as e:
        raise APIExceptions.internal_server_error(f"Failed to proxy request: {str(e)}")


@router.post("/chat-messages/{task_id}/stop")
async def stop_chat_message(
    task_id: str,
    current_user: User = Depends(get_current_user)
) -> StopChatResponse:
    """
    停止生成对话消息
    
    用于停止正在进行的流式对话生成，仅支持流式模式。
    前端可以在用户中断对话时调用此接口来停止Dify的输出。
    
    Args:
        task_id: 任务ID，可在流式返回事件中获取
        current_user: 当前认证用户
        
    Returns:
        StopChatResponse: 停止操作结果
        
    Raises:
        APIExceptions.internal_server_error: Dify API密钥未配置或停止请求失败
        APIExceptions.bad_request: 任务ID无效
    """
    if not settings.DIFY_API_KEY:
        raise APIExceptions.internal_server_error("Dify API key not configured")
    
    if not task_id or not task_id.strip():
        raise APIExceptions.bad_request("Task ID is required")
    
    try:
        headers = {
            "Authorization": f"Bearer {settings.DIFY_API_KEY}",
            "Content-Type": "application/json"
        }
        
        url = f"{settings.DIFY_API_URL}/chat-messages/{task_id}/stop"
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers)
            
            if response.status_code != 200:
                error_text = response.text
                
                # 根据状态码提供更详细的错误信息
                if response.status_code == 404:
                    raise APIExceptions.bad_request(f"Task ID '{task_id}' not found or already completed")
                elif response.status_code == 400:
                    raise APIExceptions.bad_request("Invalid task ID format")
                else:
                    raise APIExceptions.internal_server_error(f"Dify stop API error: {response.status_code}")
            
            # 解析Dify的响应
            result = response.json()
            
            # 验证Dify返回的结果格式
            if result.get("result") == "success":
                return StopChatResponse(result="success")
            else:
                return StopChatResponse(result="success")  # 仍然返回成功，因为请求已处理
                
    except httpx.TimeoutException:
        raise APIExceptions.internal_server_error("Stop request timeout")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise APIExceptions.internal_server_error(f"Failed to stop chat message: {str(e)}")
    
    
    