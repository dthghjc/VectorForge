from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class DifyMessage(BaseModel):
    """Dify 消息格式"""
    role: str = Field(..., description="消息角色: user, assistant, system")
    content: str = Field(..., description="消息内容")
    metadata: Optional[Dict[str, Any]] = Field(None, description="消息元数据")

class DifyConversationCreate(BaseModel):
    """Dify 对话创建请求"""
    conversation_id: str = Field(..., description="对话ID")
    user_id: Optional[str] = Field(None, description="用户ID，可选")
    title: Optional[str] = Field(None, description="对话标题")
    messages: List[DifyMessage] = Field(..., description="消息列表")

class DifyConversationResponse(BaseModel):
    """Dify 对话响应"""
    conversation_id: str
    title: str
    message_count: int
    created_at: datetime
    status: str = "success"

class DifyMessageCreate(BaseModel):
    """Dify 单条消息创建"""
    conversation_id: str = Field(..., description="对话ID")
    role: str = Field(..., description="消息角色")
    content: str = Field(..., description="消息内容")
    user_id: Optional[str] = Field(None, description="用户ID")
    metadata: Optional[Dict[str, Any]] = Field(None, description="消息元数据")

class DifyMessageResponse(BaseModel):
    """Dify 消息响应"""
    message_id: str
    conversation_id: str
    role: str
    content: str
    created_at: datetime
    status: str = "success"

class DifyConversationList(BaseModel):
    """Dify 对话列表响应"""
    conversations: List[Dict[str, Any]]
    total: int
    page: int
    page_size: int

class DifyErrorResponse(BaseModel):
    """Dify 错误响应"""
    error: str
    message: str
    code: Optional[str] = None 