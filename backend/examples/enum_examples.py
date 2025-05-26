import enum
from enum import Enum

# ========== 1. 传统写法（不推荐） ==========
# 使用字符串常量
USER_ROLE_USER = "user"
USER_ROLE_REVIEWER = "reviewer"
USER_ROLE_ADMIN = "admin"

# 问题：容易拼写错误，没有类型检查
def check_permission_old(role):
    if role == "user":  # 可能写错成 "usr"
        return False
    elif role == "reviewer":
        return True
    return False

# ========== 2. Enum 基础写法 ==========
class UserRole(enum.Enum):
    """用户角色枚举"""
    USER = "user"
    REVIEWER = "reviewer"
    ADMIN = "admin"

# 使用方式
def check_permission_new(role: UserRole):
    if role == UserRole.USER:
        return False
    elif role == UserRole.REVIEWER:
        return True
    return False

# ========== 3. 不同的 Enum 写法 ==========

# 方式1：继承 enum.Enum
class Status1(enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

# 方式2：继承 Enum（需要 from enum import Enum）
class Status2(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

# 方式3：字符串枚举（用于 Pydantic）
class UserRole2(str, Enum):
    """继承 str 和 Enum，方便序列化"""
    USER = "user"
    REVIEWER = "reviewer"
    ADMIN = "admin"

# 方式4：整数枚举
class Priority(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3

# 方式5：自动值
class Color(Enum):
    RED = enum.auto()
    GREEN = enum.auto()
    BLUE = enum.auto()

# ========== 4. 使用示例 ==========
def demo_usage():
    # 创建枚举值
    role = UserRole.USER
    print(f"角色: {role}")           # UserRole.USER
    print(f"角色值: {role.value}")    # "user"
    print(f"角色名: {role.name}")     # "USER"
    
    # 比较
    print(role == UserRole.USER)     # True
    print(role.value == "user")      # True
    
    # 遍历所有枚举值
    print("所有角色:")
    for role in UserRole:
        print(f"  {role.name} = {role.value}")
    
    # 从字符串创建枚举
    role_from_str = UserRole("user")
    print(f"从字符串创建: {role_from_str}")
    
    # 获取所有值
    all_roles = [role.value for role in UserRole]
    print(f"所有角色值: {all_roles}")

# ========== 5. 在 SQLAlchemy 中使用 ==========
from sqlalchemy import Column, Enum as SQLEnum

# 在数据库模型中使用
class User:
    # 方式1：直接使用 Python Enum
    role = Column(SQLEnum(UserRole), default=UserRole.USER)
    
    # 方式2：指定数据库中的值
    status = Column(SQLEnum(UserRole, values_callable=lambda x: [e.value for e in x]))

# ========== 6. 在 Pydantic 中使用 ==========
from pydantic import BaseModel

class UserSchema(BaseModel):
    username: str
    role: UserRole2  # 使用 str, Enum 混合继承
    
    class Config:
        # 允许使用枚举值进行序列化
        use_enum_values = True

# ========== 7. 高级用法 ==========
class HttpStatus(Enum):
    """HTTP 状态码枚举"""
    OK = (200, "OK")
    NOT_FOUND = (404, "Not Found")
    SERVER_ERROR = (500, "Internal Server Error")
    
    def __init__(self, code, message):
        self.code = code
        self.message = message

# 使用
status = HttpStatus.OK
print(f"状态码: {status.code}, 消息: {status.message}")

if __name__ == "__main__":
    demo_usage() 