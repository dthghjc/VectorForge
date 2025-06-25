from app.models.base import Base, TimestampMixin
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy import ForeignKey
import uuid
import enum

class UserRole(enum.Enum):
    """用户角色枚举"""
    USER = "user"           # 普通用户
    ANNOTATION = "annotation"   # 数据标记员
    ADMIN = "admin"         # 管理员

class User(Base, TimestampMixin):
    __tablename__ = 'users'
    
    # === 核心字段 ===
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(320), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    
    # === 状态管理 ===
    is_active = Column(Boolean, default=True, nullable=False, comment="是否激活")
    is_email_verified = Column(Boolean, default=False, nullable=False, comment="邮箱是否验证")
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False, comment="用户角色")
    
    # === 审核相关（核心业务） ===
    total_annotations = Column(Integer, default=0, nullable=False, comment="总标注数")
    approved_annotations = Column(Integer, default=0, nullable=False, comment="通过标注数")
    
    # === 扩展字段（可选） ===
    avatar_url = Column(String(500), nullable=True, comment="头像URL")
    last_login_at = Column(DateTime, nullable=True, comment="最后登录时间")
    preferences = Column(JSON, nullable=True, comment="用户偏好设置")
    
    # === 关系映射 ===
    chats = relationship("Chat", back_populates="user", cascade="all, delete-orphan")
    # 审核记录关系（作为审核员）
    audit_records = relationship("MessageAudit", back_populates="annotator", cascade="all, delete-orphan")
    
    def __repr__(self):
        """返回用户的字符串表示
        
        Returns:
            str: 包含用户ID、用户名和角色的格式化字符串
        """
        return f"<User(id={self.id}, username={self.username}, role={self.role.value})>"
    
    @property
    def is_superuser(self) -> bool:
        """兼容性属性：是否为管理员"""
        return self.role == UserRole.ADMIN
    
    @property
    def can_annotate(self) -> bool:
        """是否有数据标注权限"""
        return self.role in [UserRole.ANNOTATION, UserRole.ADMIN]
    
    @property
    def approval_rate(self) -> float:
        """标注通过率"""
        if self.total_annotations == 0:
            return 0.0
        return round(self.approved_annotations / self.total_annotations * 100, 2)


# === 审核记录表 ===
class MessageAudit(Base, TimestampMixin):
    """消息审核记录"""
    __tablename__ = 'message_audits'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    message_id = Column(String(36), ForeignKey('messages.id'), nullable=False)
    annotator_id = Column(String(36), ForeignKey('users.id'), nullable=False)
    
    # 审核结果
    status = Column(String(20), nullable=False, comment="pending/approved/rejected")
    comment = Column(Text, nullable=True, comment="审核意见")
    
    # 关系映射
    annotator = relationship("User", back_populates="audit_records")
    message = relationship("Message", back_populates="audits")