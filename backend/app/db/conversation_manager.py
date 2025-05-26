import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from app.core.config import settings
from typing import List, Dict, Any, Optional
from datetime import datetime

class ConversationManager:
    """对话管理器，用于管理对话历史和上下文"""
    
    def __init__(self):
        """初始化对话管理器"""
        self.max_context_length = settings.MAX_CONTENT_LENGTH
        self.max_chat_history = settings.MAX_CHAT_HISTORY
        self.conversations: Dict[str, List[Dict[str, Any]]] = {}
    
    def add_message(self, conversation_id: str, role: str, content: str, metadata: Dict[str, Any] = None) -> None:
        """
        添加消息到对话历史
        
        Args:
            conversation_id: 对话ID
            role: 角色 (user/assistant/system)
            content: 消息内容
            metadata: 元数据
        """
        if conversation_id not in self.conversations:
            self.conversations[conversation_id] = []
        
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata or {}
        }
        
        self.conversations[conversation_id].append(message)
        
        # 限制历史记录长度
        if len(self.conversations[conversation_id]) > self.max_chat_history:
            self.conversations[conversation_id] = self.conversations[conversation_id][-self.max_chat_history:]
    
    def get_conversation(self, conversation_id: str) -> List[Dict[str, Any]]:
        """获取对话历史"""
        return self.conversations.get(conversation_id, [])
    
    def get_context_messages(self, conversation_id: str, max_tokens: int = None) -> List[Dict[str, str]]:
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
        """清空指定对话"""
        if conversation_id in self.conversations:
            del self.conversations[conversation_id]
    
    def get_all_conversations(self) -> Dict[str, List[Dict[str, Any]]]:
        """获取所有对话"""
        return self.conversations.copy()
    
    def get_conversation_summary(self, conversation_id: str) -> Dict[str, Any]:
        """获取对话摘要信息"""
        messages = self.get_conversation(conversation_id)
        if not messages:
            return {
                "conversation_id": conversation_id,
                "message_count": 0,
                "created_at": None,
                "last_updated": None
            }
        
        return {
            "conversation_id": conversation_id,
            "message_count": len(messages),
            "created_at": messages[0]["timestamp"],
            "last_updated": messages[-1]["timestamp"]
        }

if __name__ == "__main__":
    # 示例使用
    conversation_manager = ConversationManager()

    # 更新对话历史
    conversation_manager.add_message(conversation_id="conversation_1", role="user", content="What is AI?")
    conversation_manager.add_message(conversation_id="conversation_1", role="assistant", content="AI is the simulation of human intelligence in machines.")
    conversation_manager.add_message(conversation_id="conversation_1", role="user", content="What are the applications of AI?")
    conversation_manager.add_message(conversation_id="conversation_1", role="assistant", content="AI is used in healthcare, finance, and more.")

    # 获取对话历史
    history = conversation_manager.get_conversation(conversation_id="conversation_1")
    print(history)
