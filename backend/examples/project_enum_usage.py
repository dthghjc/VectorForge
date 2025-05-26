# 我们项目中的枚举使用示例

import enum
from enum import Enum

# ========== 1. 用户角色枚举 ==========
class UserRole(enum.Enum):
    """用户角色枚举"""
    USER = "user"           # 普通用户
    REVIEWER = "reviewer"   # 审核员
    ADMIN = "admin"         # 管理员

# ========== 2. 实际业务逻辑 ==========
def check_can_review(user_role: UserRole) -> bool:
    """检查用户是否有审核权限"""
    return user_role in [UserRole.REVIEWER, UserRole.ADMIN]

def check_can_manage_users(user_role: UserRole) -> bool:
    """检查用户是否可以管理其他用户"""
    return user_role == UserRole.ADMIN

# ========== 3. API 路由中的使用 ==========
from fastapi import HTTPException

def promote_user(current_user_role: UserRole, target_role: UserRole):
    """提升用户角色"""
    # 只有管理员可以提升用户角色
    if current_user_role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="权限不足")
    
    # 不能提升为管理员（除非是超级管理员操作）
    if target_role == UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="无法提升为管理员")
    
    return {"message": f"用户角色已提升为 {target_role.value}"}

# ========== 4. 数据库查询中的使用 ==========
from sqlalchemy.orm import Session
from app.models.user_simplified import User

def get_reviewers(db: Session):
    """获取所有审核员"""
    return db.query(User).filter(
        User.role.in_([UserRole.REVIEWER, UserRole.ADMIN])
    ).all()

def get_users_by_role(db: Session, role: UserRole):
    """根据角色获取用户"""
    return db.query(User).filter(User.role == role).all()

# ========== 5. 前端交互 ==========
def get_role_options():
    """获取角色选项（用于前端下拉框）"""
    return [
        {"value": role.value, "label": get_role_label(role)}
        for role in UserRole
    ]

def get_role_label(role: UserRole) -> str:
    """获取角色的中文标签"""
    labels = {
        UserRole.USER: "普通用户",
        UserRole.REVIEWER: "审核员",
        UserRole.ADMIN: "管理员"
    }
    return labels.get(role, "未知角色")

# ========== 6. 权限装饰器 ==========
from functools import wraps

def require_role(required_role: UserRole):
    """权限装饰器"""
    def decorator(func):
        @wraps(func)
        def wrapper(current_user, *args, **kwargs):
            if not check_permission(current_user.role, required_role):
                raise HTTPException(status_code=403, detail="权限不足")
            return func(current_user, *args, **kwargs)
        return wrapper
    return decorator

def check_permission(user_role: UserRole, required_role: UserRole) -> bool:
    """检查权限等级"""
    role_levels = {
        UserRole.USER: 1,
        UserRole.REVIEWER: 2,
        UserRole.ADMIN: 3
    }
    return role_levels.get(user_role, 0) >= role_levels.get(required_role, 0)

# 使用装饰器
@require_role(UserRole.REVIEWER)
def audit_message(current_user, message_id: str):
    """审核消息（需要审核员权限）"""
    pass

@require_role(UserRole.ADMIN)
def delete_user(current_user, user_id: str):
    """删除用户（需要管理员权限）"""
    pass

# ========== 7. 扩展其他枚举 ==========
class MessageStatus(enum.Enum):
    """消息状态"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class AuditAction(enum.Enum):
    """审核操作"""
    APPROVE = "approve"
    REJECT = "reject"
    REQUEST_CHANGES = "request_changes"

# ========== 8. 使用示例 ==========
if __name__ == "__main__":
    # 创建用户角色
    admin_role = UserRole.ADMIN
    reviewer_role = UserRole.REVIEWER
    
    # 检查权限
    print(f"管理员可以审核: {check_can_review(admin_role)}")
    print(f"审核员可以管理用户: {check_can_manage_users(reviewer_role)}")
    
    # 获取角色选项
    options = get_role_options()
    print(f"角色选项: {options}")
    
    # 角色比较
    print(f"管理员 > 审核员: {check_permission(admin_role, reviewer_role)}")
    print(f"审核员 > 管理员: {check_permission(reviewer_role, admin_role)}") 