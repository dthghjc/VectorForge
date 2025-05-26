from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.user import User, UserRole, MessageAudit
from app.schemas.user import UserCreate, UserUpdate, UserAdminUpdate
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserCRUD:
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """生成密码哈希"""
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """验证密码"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
        """根据ID获取用户"""
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        """根据用户名获取用户"""
        return db.query(User).filter(User.username == username).first()
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """根据邮箱获取用户"""
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def get_user_by_username_or_email(db: Session, identifier: str) -> Optional[User]:
        """根据用户名或邮箱获取用户"""
        return db.query(User).filter(
            or_(User.username == identifier, User.email == identifier)
        ).first()
    
    @staticmethod
    def create_user(db: Session, user_create: UserCreate) -> User:
        """创建用户"""
        hashed_password = UserCRUD.get_password_hash(user_create.password)
        
        user_data = user_create.dict(exclude={"password"})
        user_data["hashed_password"] = hashed_password
        
        user = User(**user_data)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def update_user(db: Session, user_id: str, user_update: UserUpdate) -> Optional[User]:
        """更新用户信息"""
        user = UserCRUD.get_user_by_id(db, user_id)
        if not user:
            return None
        
        update_data = user_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def admin_update_user(db: Session, user_id: str, user_update: UserAdminUpdate) -> Optional[User]:
        """管理员更新用户信息"""
        user = UserCRUD.get_user_by_id(db, user_id)
        if not user:
            return None
        
        update_data = user_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def get_users(
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        role: Optional[UserRole] = None,
        is_active: Optional[bool] = None
    ) -> List[User]:
        """获取用户列表"""
        query = db.query(User)
        
        if role:
            query = query.filter(User.role == role)
        if is_active is not None:
            query = query.filter(User.is_active == is_active)
        
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def get_reviewers(db: Session) -> List[User]:
        """获取所有审核员"""
        return db.query(User).filter(
            User.role.in_([UserRole.REVIEWER, UserRole.ADMIN])
        ).all()
    
    @staticmethod
    def update_annotation_stats(db: Session, user_id: str, approved: bool = True):
        """更新用户标注统计"""
        user = UserCRUD.get_user_by_id(db, user_id)
        if not user:
            return None
        
        user.total_annotations += 1
        if approved:
            user.approved_annotations += 1
        
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def delete_user(db: Session, user_id: str) -> bool:
        """删除用户"""
        user = UserCRUD.get_user_by_id(db, user_id)
        if not user:
            return False
        
        db.delete(user)
        db.commit()
        return True
    
    @staticmethod
    def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
        """用户认证"""
        user = UserCRUD.get_user_by_username_or_email(db, username)
        if not user:
            return None
        if not UserCRUD.verify_password(password, user.hashed_password):
            return None
        return user


class MessageAuditCRUD:
    
    @staticmethod
    def create_audit(db: Session, message_id: str, reviewer_id: str, status: str, comment: Optional[str] = None) -> MessageAudit:
        """创建审核记录"""
        audit = MessageAudit(
            message_id=message_id,
            reviewer_id=reviewer_id,
            status=status,
            comment=comment
        )
        db.add(audit)
        db.commit()
        db.refresh(audit)
        return audit
    
    @staticmethod
    def get_audits_by_message(db: Session, message_id: str) -> List[MessageAudit]:
        """获取消息的所有审核记录"""
        return db.query(MessageAudit).filter(MessageAudit.message_id == message_id).all()
    
    @staticmethod
    def get_audits_by_reviewer(db: Session, reviewer_id: str, skip: int = 0, limit: int = 100) -> List[MessageAudit]:
        """获取审核员的审核记录"""
        return db.query(MessageAudit).filter(
            MessageAudit.reviewer_id == reviewer_id
        ).offset(skip).limit(limit).all()

# 创建实例
user_crud = UserCRUD()
audit_crud = MessageAuditCRUD() 