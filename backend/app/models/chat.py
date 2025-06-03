from app.models.base import Base, TimestampMixin
from sqlalchemy import Column, String, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import LONGTEXT, JSON
import uuid

class Chat(Base, TimestampMixin):
    __tablename__ = 'chats'
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False)
    # Relationships
    user = relationship("User", back_populates="chats")
    messages = relationship(
        "Message",
        back_populates="chat",
        cascade="all, delete-orphan",
        order_by="Message.created_at.asc()"
    )

class Message(Base, TimestampMixin):
    __tablename__ = 'messages'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    role = Column(String(255), nullable=False, comment="消息角色: user/assistant/system")
    content = Column(LONGTEXT, nullable=False)
    chat_id = Column(String(36), ForeignKey("chats.id"), nullable=False)  # 外键约束
    meta_data = Column(JSON, nullable=True)
    
    # === 审核相关字段 ===
    audit_status = Column(String(20), default="pending", nullable=False, comment="审核状态: pending/approved/rejected")
    is_flagged = Column(String(1), default="0", nullable=False, comment="是否被标记: 0-否, 1-是")
    
    # Relationships
    chat = relationship("Chat", back_populates="messages")
    # 审核记录关系
    audits = relationship("MessageAudit", back_populates="message", cascade="all, delete-orphan")
    
    @property
    def is_approved(self) -> bool:
        """消息是否已通过审核"""
        return self.audit_status == "approved"
    
    @property
    def needs_review(self) -> bool:
        """消息是否需要审核"""
        return self.audit_status == "pending"