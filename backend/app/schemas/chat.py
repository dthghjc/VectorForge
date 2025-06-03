from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class MessageBase(BaseModel):
    content: str = ""
    role: str = ""
    meta_data: Optional[dict] = None

class MessageCreate(MessageBase):
    chat_id: str
    
class MessageResponse(MessageBase):
    id: str
    chat_id: str
    audit_status: str = Field(default="pending", description="审核状态")
    is_flagged: str = Field(default="0", description="是否被标记")
    created_at: datetime
    updated_at: datetime

    class Config:
        # 允许 Pydantic 从 ORM 对象（如 SQLAlchemy 的 Message）的属性直接构建实例。
        from_attributes = True

class MessageUpdate(BaseModel):
    """消息更新（审核相关）"""
    audit_status: Optional[str] = Field(None, pattern="^(pending|approved|rejected)$")
    is_flagged: Optional[str] = Field(None, pattern="^[01]$")

class ChatBase(BaseModel):
    title: Optional[str] = None

class ChatCreate(ChatBase):
    id: Optional[str] = None

class ChatUpdate(BaseModel):
    """对话更新"""
    title: Optional[str] = None
    description: Optional[str] = None

class ChatResponse(ChatBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []
    
    class Config:
        # 允许 Pydantic 从 ORM 对象（如 SQLAlchemy 的 Chat）的属性直接构建实例。
        from_attributes = True

# === 审核相关 ===
class MessageAuditCreate(BaseModel):
    message_id: str
    status: str = Field(..., pattern="^(pending|approved|rejected)$")
    comment: Optional[str] = None

class MessageAuditResponse(BaseModel):
    id: str
    message_id: str
    reviewer_id: str
    status: str
    comment: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
    
    