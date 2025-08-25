from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.user import User, UserRole, MessageAudit
from app.schemas.user import UserCreate, UserUpdate, UserAdminUpdate
from passlib.context import CryptContext

# 创建密码加密上下文，使用 bcrypt 算法进行密码哈希
# schemes=["bcrypt"]: 指定使用 bcrypt 算法
# deprecated="auto": 自动处理已废弃的哈希方案
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
        
        user_data = user_create.model_dump(exclude={"password"})
        user_data["hashed_password"] = hashed_password
        # 强制设置为普通用户角色，注册时不允许自定义角色
        user_data["role"] = UserRole.USER
        
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
        
        update_data = user_update.model_dump(exclude_unset=True)
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
        
        update_data = user_update.model_dump(exclude_unset=True)
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
    def get_annotators(db: Session) -> List[User]:
        """获取所有数据标记员"""
        return db.query(User).filter(
            or_(User.role == UserRole.ANNOTATION, User.role == UserRole.ADMIN)
        ).all()
    
    @staticmethod
    def get_first_admin(db: Session) -> Optional[User]:
        """获取第一个管理员用户"""
        return db.query(User).filter(User.role == UserRole.ADMIN).first()
    
    @staticmethod
    def create_dify_user(db: Session, user_id: str) -> User:
        """创建来自Dify的用户（自动生成用户信息）"""
        user = User(
            id=user_id,
            username=f"dify_user_{user_id}",
            email=f"dify_{user_id}@system.local",
            hashed_password="",  # Dify用户不需要密码
            role=UserRole.USER,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
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
    def create_audit(db: Session, message_id: str, annotator_id: str, status: str, comment: Optional[str] = None, annotation_data: Optional[dict] = None) -> MessageAudit:
        """创建审核记录（支持 annotation_data JSON 字段）"""
        audit = MessageAudit(
            message_id=message_id,
            annotator_id=annotator_id,
            status=status,
            comment=comment,
            annotation_data=annotation_data
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
    def get_audits_by_annotator(db: Session, annotator_id: str, skip: int = 0, limit: int = 100) -> List[MessageAudit]:
        """获取标记员的审核记录"""
        return db.query(MessageAudit).filter(
            MessageAudit.annotator_id == annotator_id
        ).offset(skip).limit(limit).all()

# 创建实例
user_crud = UserCRUD()
audit_crud = MessageAuditCRUD() 