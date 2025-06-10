from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class DifyMessageCreate(BaseModel):
    """Dify 单条消息创建"""
    user_id: Optional[str] = Field(None, description="用户ID，由Dify传入")
    role: str = Field(..., description="消息角色")
    content: str = Field(..., description="消息内容")
    metadata: Optional[Dict[str, Any]] = Field(None, description="消息元数据")

class DifyMessageResponse(BaseModel):
    """Dify 消息响应"""
    message_id: str
    conversation_id: str
    role: str
    content: str