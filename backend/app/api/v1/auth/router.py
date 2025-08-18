from datetime import timedelta
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from requests.exceptions import RequestException
import re

from app.core import security
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserResponse, UserRegister, UserLogin, UserAdminUpdate, MenuItemResponse
from app.crud.user import user_crud
from app.core.exceptions import APIExceptions
from app.models.user import UserRole

router = APIRouter()  # 创建一个名为 "router" 的 API 路由器
# 定义 JWT 认证的 token 端点（/token），客户端通过此端点获取 token。
"""
JWT 是在用户登录时（例如通过 /token 端点）动态生成的，而不是为每个用户预先分配一个固定的 JWT。
每次用户成功认证（提供正确的用户名和密码），服务器会生成一个新的 JWT，包含该用户的身份信息（例如 sub 字段）和过期时间（exp）
"""
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token") 

"""
Depends 是 FastAPI 提供的一个依赖注入工具，允许函数在调用时自动解析和提供参数，而无需手动传入。
"""
async def get_current_user(
    db: Session = Depends(get_db),  # 声明并注入依赖项
    token: str = Depends(oauth2_scheme)
) -> User:
    """
    通过解析 JWT token 获取当前登录用户，验证其身份。
    如果 token 无效或用户不存在，将抛出 HTTP 401 Unauthorized 异常。
    
    在 FastAPI 中，raise 抛出的 HTTPException 会被框架捕获并转换为 HTTP 响应，
    不会中断整个程序（服务器继续运行）。
    """
    
    # 解码 JWT token，并验证其有效性。如果 token 无效或用户不存在，将抛出异常。
    try:
        # jwt.decode: 解码 JWT 令牌。
        # token: 从请求中提取的令牌。
        # Config.SECRET_KEY: 用于签名验证的密钥。
        # algorithms=[Config.ALGORITHM]: 使用的加密算法（如 "HS256"）。
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        # 从解码后的 payload 中提取 sub 字段（通常表示用户名或用户 ID）
        username: str = payload.get("sub")
        # 如果 payload 中没有 sub 字段，则抛出异常
        if username is None:
            raise APIExceptions.token_invalid()
    except JWTError:
        # 如果令牌无效（例如签名错误、过期等），捕获异常并抛出异常。
        raise APIExceptions.token_invalid()
    
    # 使用新的CRUD方法
    user = user_crud.get_user_by_username(db, username)
    if user is None:
        raise APIExceptions.user_not_found()
    
    # 用户处于非活动状态
    if not user.is_active:
        raise APIExceptions.inactive_user()
    
    # 返回经过验证的 User 对象，供后续接口使用。
    return user

# 验证邮箱格式的函数
def is_valid_email(email: str) -> bool:
    """
    验证邮箱格式是否有效
    简单的正则表达式验证：包含@符号和点号，并且@在点号之前
    """
    if not email or email.strip() == "":
        return False
    pattern = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    return bool(re.match(pattern, email))

# 用户注册接口
@router.post("/register", response_model=UserResponse, operation_id="register_user")
async def register(*, db: Session = Depends(get_db), user_in: UserRegister) -> Any:
    """
    用户注册接口
    - username: 必填，用户名
    - password: 必填，密码
    - email: 必填，邮箱
    """
    try:
        # 检查用户名是否存在
        if user_crud.get_user_by_username(db, user_in.username):
            raise APIExceptions.username_exists()
        
        # 检查邮箱是否存在
        if user_in.email and user_crud.get_user_by_email(db, user_in.email):
            raise APIExceptions.email_exists()
        
        # 创建用户数据
        user_create = UserCreate(
            username=user_in.username,
            email=user_in.email,
            password=user_in.password
        )
        
        # 使用CRUD创建用户
        user = user_crud.create_user(db, user_create)
        return user
    except RequestException as e:
        # 处理网络或服务器错误
        raise APIExceptions.service_unavailable() from e

# 获取 JWT 访问令牌
@router.post("/token", response_model=Token, operation_id="get_access_token")
async def login_access_token(
    db: Session = Depends(get_db),  # 注入数据库会话，通过 get_db 获取。
    form_data: OAuth2PasswordRequestForm = Depends()  # 注入表单数据，使用 FastAPI 的 OAuth2PasswordRequestForm，从请求中提取用户名和密码。
) -> Any:
    """
    用户登录接口，获取 JWT 访问令牌
    """
    # 使用CRUD进行用户认证
    user = user_crud.authenticate_user(db, form_data.username, form_data.password)
    
    if not user:
        raise APIExceptions.incorrect_password()
    
    if not user.is_active:
        raise APIExceptions.inactive_user()
    
    # 更新最后登录时间
    from datetime import datetime
    user.last_login_at = datetime.now()
    db.commit()
    
    # 生成访问 token - 使用 timedelta 创建过期时间间隔
    # Config.ACCESS_TOKEN_EXPIRE_MINUTES: 从配置中读取令牌有效期（例如 30 分钟）
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    access_token = security.create_access_token(
        data={"sub": user.username}, 
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/test_token", response_model=UserResponse, operation_id="test_access_token")
async def test_token(current_user: User = Depends(get_current_user)):
    """
    测试访问 token 是否有效
    """
    return current_user

# === 新增权限检查装饰器 ===
def require_role(required_role: str):
    """权限检查装饰器"""
    def decorator(current_user: User = Depends(get_current_user)):
        if required_role == "annotator" and not current_user.can_annotate:
            raise HTTPException(status_code=403, detail="需要数据标记员权限")
        elif required_role == "admin" and not current_user.is_superuser:
            raise HTTPException(status_code=403, detail="需要管理员权限")
        return current_user
    return decorator

# 权限检查依赖
def get_current_annotator(current_user: User = Depends(get_current_user)) -> User:
    """获取当前数据标记员用户"""
    if not current_user.can_annotate:
        raise APIExceptions.annotator_required()
    return current_user

def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """获取当前管理员用户"""
    if not current_user.is_superuser:
        raise APIExceptions.admin_required()
    return current_user

# === 管理员用户管理接口 ===
@router.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    获取所有用户列表（管理员权限）
    """
    
    
    # 转换role参数
    user_role = None
    if role:
        try:
            user_role = UserRole(role)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid role")
    
    users = user_crud.get_users(
        db=db, 
        skip=skip, 
        limit=limit, 
        role=user_role, 
        is_active=is_active
    )
    return users

@router.put("/admin/users/{user_id}", response_model=UserResponse)
async def admin_update_user(
    user_id: str,
    user_update: UserAdminUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    管理员修改用户信息（包括角色）
    """
    # 检查目标用户是否存在
    target_user = user_crud.get_user_by_id(db, user_id)
    if not target_user:
        raise APIExceptions.user_not_found()
    
    # 不能修改自己的角色
    if target_user.id == current_user.id and user_update.role is not None:
        raise HTTPException(status_code=400, detail="不能修改自己的角色")
    
    # 使用管理员更新方法
    updated_user = user_crud.admin_update_user(db, user_id, user_update)
    if not updated_user:
        raise APIExceptions.user_not_found()
    
    return updated_user

@router.get("/menu", response_model=List[MenuItemResponse])
async def get_menu(current_user: User = Depends(get_current_user)) -> List[MenuItemResponse]:
    """
    根据用户角色获取菜单列表
    """
    # 普通用户菜单
    user_menu = [
        MenuItemResponse(key='/chat', label='对话助手', icon='MessageOutlined'),
        MenuItemResponse(key='/vectorTools', label='向量工具', icon='DesktopOutlined'),
    ]
    
    # 数据标记员菜单
    annotation_menu = [
        MenuItemResponse(key='/chat', label='对话助手', icon='MessageOutlined'),
        MenuItemResponse(key='/vectorTools', label='向量工具', icon='DesktopOutlined'),
        MenuItemResponse(key='/annotation', label='数据标注', icon='ContainerOutlined'),
    ]
    
    # 管理员菜单
    admin_menu = [
        MenuItemResponse(key='/chat', label='对话助手', icon='MessageOutlined'),
        MenuItemResponse(key='/vectorTools', label='向量工具', icon='DesktopOutlined'),
        # MenuItemResponse(key='/annotation', label='数据标注', icon='ContainerOutlined'),
        MenuItemResponse(key='/review', label='数据标注审核', icon='ProfileOutlined'),
        MenuItemResponse(key='/userManagement', label='用户管理', icon='IdcardOutlined'),
        MenuItemResponse(
            key='/sub1',
            label='一级菜单',
            icon='MailOutlined',
            children=[
                MenuItemResponse(key='/sub1/sub11', label='子项一'),
                MenuItemResponse(key='/sub1/sub12', label='子项二'),
            ]
        ),
        MenuItemResponse(
            key='/sub2',
            label='设置',
            icon='AppstoreOutlined',
            children=[
                MenuItemResponse(
                    key='/sub2/sub21',
                    label='更多',
                    children=[
                        MenuItemResponse(key='/sub2/sub21/sub211', label='选项 A'),
                        MenuItemResponse(key='/sub2/sub21/sub212', label='选项 B'),
                    ]
                ),
            ]
        ),
    ]
    
    # 根据用户角色返回相应的菜单
    if current_user.role == UserRole.ADMIN:
        return admin_menu
    elif current_user.can_annotate:  # 数据标记员
        return annotation_menu
    else:  # 普通用户
        return user_menu