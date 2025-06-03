from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from datetime import datetime

from app.models.chat import Chat, Message
from app.schemas.chat import ChatCreate, ChatUpdate, MessageCreate

class ChatCRUD:
    """对话 CRUD 操作"""
    
    @staticmethod
    def create_chat(db: Session, chat_create: ChatCreate, user_id: str) -> Chat:
        """创建新对话"""
        chat = Chat(
            title=chat_create.title,
            user_id=user_id,
            description=chat_create.description
        )
        db.add(chat)
        db.commit()
        db.refresh(chat)
        return chat
    
    @staticmethod
    def get_chat_by_id(db: Session, chat_id: str) -> Optional[Chat]:
        """根据ID获取对话"""
        return db.query(Chat).filter(Chat.id == chat_id).first()
    
    @staticmethod
    def get_user_chats(
        db: Session, 
        user_id: str, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Chat]:
        """获取用户的对话列表"""
        return db.query(Chat).filter(
            Chat.user_id == user_id
        ).order_by(desc(Chat.updated_at)).offset(skip).limit(limit).all()
    
    @staticmethod
    def update_chat(db: Session, chat_id: str, chat_update: ChatUpdate) -> Optional[Chat]:
        """更新对话信息"""
        chat = ChatCRUD.get_chat_by_id(db, chat_id)
        if not chat:
            return None
        
        update_data = chat_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(chat, field, value)
        
        chat.updated_at = datetime.now()
        db.commit()
        db.refresh(chat)
        return chat
    
    @staticmethod
    def delete_chat(db: Session, chat_id: str) -> bool:
        """删除对话"""
        chat = ChatCRUD.get_chat_by_id(db, chat_id)
        if not chat:
            return False
        
        # 删除相关消息
        db.query(Message).filter(Message.chat_id == chat_id).delete()
        
        # 删除对话
        db.delete(chat)
        db.commit()
        return True
    
    @staticmethod
    def get_chat_with_messages(db: Session, chat_id: str) -> Optional[Chat]:
        """获取对话及其消息"""
        return db.query(Chat).filter(Chat.id == chat_id).first()


class MessageCRUD:
    """消息 CRUD 操作"""
    
    @staticmethod
    def create_message(db: Session, message_create: MessageCreate) -> Message:
        """创建新消息"""
        message = Message(**message_create.model_dump())
        db.add(message)
        db.commit()
        db.refresh(message)
        
        # 更新对话的最后更新时间
        chat = db.query(Chat).filter(Chat.id == message.chat_id).first()
        if chat:
            chat.updated_at = datetime.now()
            db.commit()
        
        return message
    
    @staticmethod
    def get_message_by_id(db: Session, message_id: str) -> Optional[Message]:
        """根据ID获取消息"""
        return db.query(Message).filter(Message.id == message_id).first()
    
    @staticmethod
    def get_chat_messages(
        db: Session, 
        chat_id: str, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Message]:
        """获取对话的消息列表"""
        return db.query(Message).filter(
            Message.chat_id == chat_id
        ).order_by(Message.created_at).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_pending_review_messages(
        db: Session, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Message]:
        """获取待审核的消息"""
        return db.query(Message).filter(
            Message.audit_status == "pending"
        ).order_by(Message.created_at).offset(skip).limit(limit).all()
    
    @staticmethod
    def update_message_audit_status(
        db: Session, 
        message_id: str, 
        status: str, 
        is_flagged: bool = False
    ) -> Optional[Message]:
        """更新消息审核状态"""
        message = MessageCRUD.get_message_by_id(db, message_id)
        if not message:
            return None
        
        message.audit_status = status
        message.is_flagged = is_flagged
        message.updated_at = datetime.now()
        
        db.commit()
        db.refresh(message)
        return message
    
    @staticmethod
    def delete_message(db: Session, message_id: str) -> bool:
        """删除消息"""
        message = MessageCRUD.get_message_by_id(db, message_id)
        if not message:
            return False
        
        db.delete(message)
        db.commit()
        return True
    
    @staticmethod
    def get_user_messages(
        db: Session, 
        user_id: str, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Message]:
        """获取用户的所有消息"""
        return db.query(Message).join(Chat).filter(
            Chat.user_id == user_id
        ).order_by(desc(Message.created_at)).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_flagged_messages(
        db: Session, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Message]:
        """获取被标记的消息"""
        return db.query(Message).filter(
            Message.is_flagged == True
        ).order_by(desc(Message.created_at)).offset(skip).limit(limit).all()


# 创建实例
chat_crud = ChatCRUD()
message_crud = MessageCRUD() 