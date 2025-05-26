"""
对话服务
集成缓存层和数据库层，提供完整的对话管理功能
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import logging

from app.crud.chat import chat_crud, message_crud
from app.db.conversation_cache import conversation_cache
from app.schemas.chat import ChatCreate, MessageCreate
from app.models.chat import Chat, Message

logger = logging.getLogger(__name__)

class ConversationService:
    """对话服务，集成缓存和数据库操作"""
    
    def __init__(self, db: Session):
        self.db = db
        self.cache = conversation_cache
    
    def create_chat(self, user_id: str, title: str = None, description: str = None) -> Chat:
        """创建新对话"""
        chat_create = ChatCreate(
            title=title or "新对话",
            description=description
        )
        
        # 在数据库中创建对话
        chat = chat_crud.create_chat(self.db, chat_create, user_id)
        
        # 初始化缓存
        self.cache.load_conversation(chat.id, [])
        
        logger.info(f"Created new chat {chat.id} for user {user_id}")
        return chat
    
    def add_message(
        self, 
        chat_id: str, 
        role: str, 
        content: str, 
        user_id: str = None,
        metadata: Dict[str, Any] = None
    ) -> Message:
        """添加消息到对话"""
        
        # 创建消息数据
        message_create = MessageCreate(
            chat_id=chat_id,
            role=role,
            content=content,
            user_id=user_id,
            metadata=metadata or {}
        )
        
        # 保存到数据库
        message = message_crud.create_message(self.db, message_create)
        
        # 更新缓存
        self.cache.add_message(
            conversation_id=chat_id,
            role=role,
            content=content,
            metadata={
                "message_id": message.id,
                "created_at": message.created_at.isoformat(),
                **(metadata or {})
            }
        )
        
        logger.debug(f"Added message {message.id} to chat {chat_id}")
        return message
    
    def get_chat_messages(
        self, 
        chat_id: str, 
        use_cache: bool = True,
        skip: int = 0,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """获取对话消息"""
        
        # 优先使用缓存
        if use_cache and self.cache.has_conversation(chat_id):
            cached_messages = self.cache.get_conversation(chat_id)
            if cached_messages:
                return cached_messages
        
        # 从数据库获取
        db_messages = message_crud.get_chat_messages(self.db, chat_id, skip, limit)
        
        # 转换为缓存格式
        cache_messages = []
        for msg in db_messages:
            cache_message = {
                "role": msg.role,
                "content": msg.content,
                "timestamp": msg.created_at.isoformat(),
                "metadata": {
                    "message_id": msg.id,
                    "audit_status": msg.audit_status,
                    "is_flagged": msg.is_flagged,
                    **(msg.metadata or {})
                }
            }
            cache_messages.append(cache_message)
        
        # 更新缓存
        if cache_messages:
            self.cache.load_conversation(chat_id, cache_messages)
        
        return cache_messages
    
    def get_context_for_llm(
        self, 
        chat_id: str, 
        max_tokens: int = None
    ) -> List[Dict[str, str]]:
        """获取适合 LLM 的上下文消息"""
        
        # 确保对话在缓存中
        if not self.cache.has_conversation(chat_id):
            self.get_chat_messages(chat_id, use_cache=False)
        
        return self.cache.get_context_messages(chat_id, max_tokens)
    
    def get_user_chats(
        self, 
        user_id: str, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Chat]:
        """获取用户的对话列表"""
        return chat_crud.get_user_chats(self.db, user_id, skip, limit)
    
    def get_chat_by_id(self, chat_id: str) -> Optional[Chat]:
        """根据ID获取对话"""
        return chat_crud.get_chat_by_id(self.db, chat_id)
    
    def delete_chat(self, chat_id: str) -> bool:
        """删除对话"""
        # 从数据库删除
        success = chat_crud.delete_chat(self.db, chat_id)
        
        # 从缓存删除
        if success:
            self.cache.clear_conversation(chat_id)
            logger.info(f"Deleted chat {chat_id}")
        
        return success
    
    def update_message_audit_status(
        self, 
        message_id: str, 
        status: str, 
        is_flagged: bool = False
    ) -> Optional[Message]:
        """更新消息审核状态"""
        message = message_crud.update_message_audit_status(
            self.db, message_id, status, is_flagged
        )
        
        if message:
            # 清除相关对话的缓存，强制重新加载
            self.cache.clear_conversation(message.chat_id)
            logger.info(f"Updated audit status for message {message_id}: {status}")
        
        return message
    
    def get_pending_review_messages(
        self, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Message]:
        """获取待审核的消息"""
        return message_crud.get_pending_review_messages(self.db, skip, limit)
    
    def get_flagged_messages(
        self, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Message]:
        """获取被标记的消息"""
        return message_crud.get_flagged_messages(self.db, skip, limit)
    
    def get_conversation_summary(self, chat_id: str) -> Dict[str, Any]:
        """获取对话摘要"""
        # 先尝试从缓存获取
        cache_summary = self.cache.get_conversation_summary(chat_id)
        if cache_summary.get("cached"):
            return cache_summary
        
        # 从数据库获取
        chat = self.get_chat_by_id(chat_id)
        if not chat:
            return {
                "conversation_id": chat_id,
                "title": None,
                "message_count": 0,
                "created_at": None,
                "last_updated": None,
                "cached": False
            }
        
        # 获取消息数量
        messages = message_crud.get_chat_messages(self.db, chat_id, limit=1)
        
        return {
            "conversation_id": chat_id,
            "title": chat.title,
            "description": chat.description,
            "message_count": len(messages) if messages else 0,
            "created_at": chat.created_at.isoformat(),
            "last_updated": chat.updated_at.isoformat(),
            "cached": False
        }
    
    def clear_cache(self, chat_id: str = None) -> None:
        """清除缓存"""
        if chat_id:
            self.cache.clear_conversation(chat_id)
        else:
            self.cache.clear_all()
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """获取缓存统计"""
        return self.cache.get_cache_stats()
    
    def preload_user_conversations(self, user_id: str, limit: int = 10) -> int:
        """预加载用户的活跃对话到缓存"""
        chats = self.get_user_chats(user_id, limit=limit)
        loaded_count = 0
        
        for chat in chats:
            if not self.cache.has_conversation(chat.id):
                self.get_chat_messages(chat.id, use_cache=False)
                loaded_count += 1
        
        logger.info(f"Preloaded {loaded_count} conversations for user {user_id}")
        return loaded_count


def get_conversation_service(db: Session) -> ConversationService:
    """获取对话服务实例"""
    return ConversationService(db) 