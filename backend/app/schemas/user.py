from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    """用户角色枚举"""
    USER = "user"
    REVIEWER = "reviewer"
    ADMIN = "admin"

# === 基础模型 ===
class UserBase(BaseModel):
    username: str = Field(..., min_length=4, max_length=64)
    nickname: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)
    invite_code: Optional[str] = None
    role: UserRole = UserRole.USER

class UserUpdate(BaseModel):
    nickname: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    avatar_url: Optional[str] = Field(None, max_length=500)
    preferences: Optional[Dict[str, Any]] = None

class UserAdminUpdate(UserUpdate):
    """管理员可修改的字段"""
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

# === 响应模型 ===
class UserResponse(UserBase):
    id: str
    role: UserRole
    is_active: bool
    is_email_verified: bool
    total_annotations: int
    approved_annotations: int
    approval_rate: float
    avatar_url: Optional[str]
    last_login_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserBrief(BaseModel):
    """用户简要信息"""
    id: str
    username: str
    nickname: Optional[str]
    role: UserRole
    avatar_url: Optional[str]
    approval_rate: float

    class Config:
        from_attributes = True

# === 认证相关 ===
class UserLogin(BaseModel):
    username: str = Field(..., description="用户名或邮箱")
    password: str = Field(..., description="密码")

class UserRegister(BaseModel):
    username: str = Field(..., min_length=4, max_length=64)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    invite_code: str = Field(..., description="邀请码")
    nickname: Optional[str] = Field(None, max_length=100)

    @validator('username')
    def validate_username(cls, v):
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('用户名只能包含字母、数字、下划线和连字符')
        return v

# === 审核相关 ===
class MessageAuditCreate(BaseModel):
    message_id: str
    status: str = Field(..., regex="^(pending|approved|rejected)$")
    comment: Optional[str] = None

class MessageAuditResponse(BaseModel):
    id: str
    message_id: str
    reviewer_id: str
    status: str
    comment: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# === 兼容性保持 ===
# 保持与原有代码的兼容性
class UserInDBBase(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class User(UserInDBBase):
    pass

class UserInDB(UserInDBBase):
    hashed_password: str
    
