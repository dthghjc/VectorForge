"""
对话缓存管理器
提供内存级别的对话缓存，提高访问性能
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
import json
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

class ConversationCache:
    """对话缓存管理器，用于内存缓存对话数据"""
    
    def __init__(self):
        """初始化缓存管理器"""
        self.max_context_length = settings.MAX_CONTENT_LENGTH
        self.max_chat_history = settings.MAX_CHAT_HISTORY
        
        # 内存缓存
        self._conversations: Dict[str, List[Dict[str, Any]]] = {}
        self._conversation_metadata: Dict[str, Dict[str, Any]] = {}
        
        # 缓存统计
        self._cache_hits = 0
        self._cache_misses = 0
    
    def add_message(
        self, 
        conversation_id: str, 
        role: str, 
        content: str, 
        metadata: Dict[str, Any] = None
    ) -> None:
        """
        添加消息到缓存
        
        Args:
            conversation_id: 对话ID
            role: 角色 (user/assistant/system)
            content: 消息内容
            metadata: 元数据
        """
        if conversation_id not in self._conversations:
            self._conversations[conversation_id] = []
            self._conversation_metadata[conversation_id] = {
                "created_at": datetime.now().isoformat(),
                "message_count": 0
            }
        
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata or {}
        }
        
        self._conversations[conversation_id].append(message)
        
        # 更新元数据
        self._conversation_metadata[conversation_id]["message_count"] += 1
        self._conversation_metadata[conversation_id]["last_updated"] = message["timestamp"]
        
        # 限制历史记录长度
        if len(self._conversations[conversation_id]) > self.max_chat_history:
            removed_count = len(self._conversations[conversation_id]) - self.max_chat_history
            self._conversations[conversation_id] = self._conversations[conversation_id][-self.max_chat_history:]
            logger.debug(f"Trimmed {removed_count} messages from conversation {conversation_id}")
    
    def get_conversation(self, conversation_id: str) -> List[Dict[str, Any]]:
        """获取对话历史"""
        if conversation_id in self._conversations:
            self._cache_hits += 1
            return self._conversations[conversation_id].copy()
        else:
            self._cache_misses += 1
            return []
    
    def get_context_messages(
        self, 
        conversation_id: str, 
        max_tokens: int = None
    ) -> List[Dict[str, str]]:
        """
        获取适合发送给 LLM 的上下文消息
        
        Args:
            conversation_id: 对话ID
            max_tokens: 最大token数限制
        
        Returns:
            格式化的消息列表
        """
        if max_tokens is None:
            max_tokens = self.max_context_length
        
        messages = self.get_conversation(conversation_id)
        
        # 转换为 LLM 格式
        formatted_messages = []
        current_length = 0
        
        # 从最新的消息开始，向前添加直到达到长度限制
        for message in reversed(messages):
            content_length = len(message["content"])
            if current_length + content_length > max_tokens:
                break
            
            formatted_messages.insert(0, {
                "role": message["role"],
                "content": message["content"]
            })
            current_length += content_length
        
        return formatted_messages
    
    def clear_conversation(self, conversation_id: str) -> None:
        """清空指定对话缓存"""
        if conversation_id in self._conversations:
            del self._conversations[conversation_id]
        if conversation_id in self._conversation_metadata:
            del self._conversation_metadata[conversation_id]
    
    def get_all_conversations(self) -> Dict[str, List[Dict[str, Any]]]:
        """获取所有缓存的对话"""
        return self._conversations.copy()
    
    def get_conversation_summary(self, conversation_id: str) -> Dict[str, Any]:
        """获取对话摘要信息"""
        if conversation_id not in self._conversation_metadata:
            return {
                "conversation_id": conversation_id,
                "message_count": 0,
                "created_at": None,
                "last_updated": None,
                "cached": False
            }
        
        metadata = self._conversation_metadata[conversation_id].copy()
        metadata["conversation_id"] = conversation_id
        metadata["cached"] = True
        return metadata
    
    def load_conversation(self, conversation_id: str, messages: List[Dict[str, Any]]) -> None:
        """
        从数据库加载对话到缓存
        
        Args:
            conversation_id: 对话ID
            messages: 消息列表
        """
        self._conversations[conversation_id] = messages.copy()
        
        if messages:
            self._conversation_metadata[conversation_id] = {
                "created_at": messages[0]["timestamp"],
                "last_updated": messages[-1]["timestamp"],
                "message_count": len(messages)
            }
        else:
            self._conversation_metadata[conversation_id] = {
                "created_at": datetime.now().isoformat(),
                "last_updated": datetime.now().isoformat(),
                "message_count": 0
            }
        
        logger.debug(f"Loaded conversation {conversation_id} with {len(messages)} messages")
    
    def has_conversation(self, conversation_id: str) -> bool:
        """检查缓存中是否存在对话"""
        return conversation_id in self._conversations
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """获取缓存统计信息"""
        total_requests = self._cache_hits + self._cache_misses
        hit_rate = self._cache_hits / total_requests if total_requests > 0 else 0
        
        return {
            "cache_hits": self._cache_hits,
            "cache_misses": self._cache_misses,
            "hit_rate": hit_rate,
            "cached_conversations": len(self._conversations),
            "total_messages": sum(len(msgs) for msgs in self._conversations.values())
        }
    
    def clear_all(self) -> None:
        """清空所有缓存"""
        self._conversations.clear()
        self._conversation_metadata.clear()
        logger.info("Cleared all conversation cache")
    
    def evict_old_conversations(self, max_conversations: int = 1000) -> int:
        """
        清理旧的对话缓存
        
        Args:
            max_conversations: 最大缓存对话数
        
        Returns:
            清理的对话数量
        """
        if len(self._conversations) <= max_conversations:
            return 0
        
        # 按最后更新时间排序，保留最新的对话
        sorted_conversations = sorted(
            self._conversation_metadata.items(),
            key=lambda x: x[1].get("last_updated", ""),
            reverse=True
        )
        
        # 保留最新的对话
        to_keep = set(conv_id for conv_id, _ in sorted_conversations[:max_conversations])
        
        # 删除旧的对话
        evicted_count = 0
        for conv_id in list(self._conversations.keys()):
            if conv_id not in to_keep:
                del self._conversations[conv_id]
                del self._conversation_metadata[conv_id]
                evicted_count += 1
        
        logger.info(f"Evicted {evicted_count} old conversations from cache")
        return evicted_count


# 创建全局缓存实例
conversation_cache = ConversationCache() 