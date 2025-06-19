from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Dict, Any, List
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
    email: Optional[EmailStr] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    avatar_url: Optional[str] = Field(None, max_length=500, description="用户头像URL地址")
    preferences: Optional[Dict[str, Any]] = Field(None, description="用户偏好设置，如界面主题、通知设置等")

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

    @field_validator('username')
    @classmethod
    def validate_username(cls, v):
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('用户名只能包含字母、数字、下划线和连字符')
        return v

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

# === 菜单相关 ===
class MenuItemResponse(BaseModel):
    """菜单项响应模型"""
    key: str
    label: str
    icon: Optional[str] = None
    children: Optional[List['MenuItemResponse']] = None

    class Config:
        from_attributes = True

# 支持递归类型
MenuItemResponse.model_rebuild()
    
