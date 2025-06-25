from fastapi import HTTPException, status
from typing import Dict, Optional, Any

class APIExceptions:
    """
    API异常类，使用标准HTTP状态码
    """
    
    # ================ 认证相关异常 (401 Unauthorized) ================
    @staticmethod
    def credentials_exception():
        """无法验证凭证"""
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    @staticmethod
    def token_expired():
        """Token已过期"""
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    @staticmethod
    def token_invalid():
        """Token无效"""
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    @staticmethod
    def inactive_user():
        """用户未激活"""
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user",
            headers={"WWW-Authenticate": "Bearer"},
        )

    @staticmethod
    def incorrect_password():
        """密码错误"""
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    @staticmethod
    def api_key_invalid():
        """API Key 无效"""
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    # ================ 权限相关异常 (403 Forbidden) ================
    @staticmethod
    def permission_denied(detail: str = "Permission denied"):
        """权限不足"""
        return HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )

    @staticmethod
    def annotator_required():
        """需要数据标记员权限"""
        return HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Annotator permission required"
        )

    @staticmethod
    def admin_required():
        """需要管理员权限"""
        return HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin permission required"
        )

    # ================ 资源不存在异常 (404 Not Found) ================
    @staticmethod
    def user_not_found():
        """用户不存在"""
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    @staticmethod
    def chat_not_found():
        """聊天记录不存在"""
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found"
        )

    @staticmethod
    def message_not_found():
        """消息不存在"""
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )

    @staticmethod
    def resource_not_found(resource_name: str):
        """通用资源不存在"""
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource_name} not found"
        )

    # ================ 冲突异常 (409 Conflict) ================
    @staticmethod
    def username_exists():
        """用户名已存在"""
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists"
        )

    @staticmethod
    def email_exists():
        """邮箱已被注册"""
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    
    @staticmethod
    def chat_id_exists():
        """Chat ID已存在"""
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Chat ID already exists"
        )

    @staticmethod
    def resource_exists(resource_name: str):
        """通用资源已存在"""
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{resource_name} already exists"
        )

    # ================ 请求错误异常 (400 Bad Request) ================
    @staticmethod
    def invalid_email_format():
        """邮箱格式无效"""
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format"
        )
    
    @staticmethod
    def invalid_role():
        """角色无效"""
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role"
        )

    @staticmethod
    def validation_error(detail: str):
        """验证错误"""
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )

    # ================ 速率限制异常 (429 Too Many Requests) ================
    @staticmethod
    def rate_limit_exceeded():
        """请求频率超出限制"""
        return HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded, please try again later"
        )

    # ================ 服务器错误异常 (5xx) ================
    @staticmethod
    def internal_server_error(detail: str = "Internal server error"):
        """内部服务器错误"""
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail
        )

    @staticmethod
    def service_unavailable():
        """服务不可用"""
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service temporarily unavailable, please try again later"
        )

    # ================ 通用异常创建方法 ================
    @staticmethod
    def create_exception(
        status_code: int, 
        detail: str, 
        headers: Optional[Dict[str, str]] = None
    ) -> HTTPException:
        """创建自定义异常"""
        return HTTPException(
            status_code=status_code,
            detail=detail,
            headers=headers
        ) 