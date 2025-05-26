import os
import secrets
from typing import Optional, List, Literal
from pydantic import Field, field_validator, AnyHttpUrl
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# 加载 .env 文件
load_dotenv()

class Settings(BaseSettings):
    """
    VectorForge 应用配置类
    使用 Pydantic Settings 进行配置管理，支持环境变量和 .env 文件
    """
    
    # ========== 项目基础配置 ==========
    PROJECT_NAME: str = Field(default="VectorForge", description="项目名称")
    VERSION: str = Field(default="0.1.0", description="项目版本")
    DESCRIPTION: str = Field(default="LLM对话标注审核与向量数据管理平台", description="项目描述")
    
    # 环境配置
    ENVIRONMENT: Literal["development", "testing", "production"] = Field(
        default="development", 
        description="运行环境"
    )
    DEBUG: bool = Field(default=False, description="调试模式")
    
    # ========== FastAPI 服务配置 ==========
    # API 配置
    API_V1_STR: str = Field(default="/v1", description="API v1 前缀")
    OPENAPI_VERSION: str = Field(default="3.1.0", description="OpenAPI 版本")
    
    # 服务器配置
    SERVER_HOST: str = Field(default="0.0.0.0", description="服务器主机")
    SERVER_PORT: int = Field(default=8000, ge=1, le=65535, description="服务器端口")
    
    # 外部访问地址（可选，用于生成文档等）
    SERVER_EXTERNAL_URL: Optional[AnyHttpUrl] = Field(default=None, description="外部访问地址")
    
    @property
    def server_url(self) -> str:
        """获取服务器完整地址"""
        if self.SERVER_EXTERNAL_URL:
            return str(self.SERVER_EXTERNAL_URL)
        return f"http://{self.SERVER_HOST}:{self.SERVER_PORT}"
    
    # ========== 安全配置 ==========
    # JWT 配置
    SECRET_KEY: str = Field(description="JWT 密钥，必须设置")
    ALGORITHM: str = Field(default="HS256", description="JWT 算法")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=1440,  # 24小时
        ge=1, 
        description="访问令牌过期时间（分钟）"
    )
    
    # 邀请码配置
    INVITE_CODES: str = Field(default="", description="邀请码列表，逗号分隔")
    
    @property
    def invite_codes_list(self) -> List[str]:
        """获取邀请码列表"""
        if not self.INVITE_CODES:
            return []
        return [code.strip() for code in self.INVITE_CODES.split(",") if code.strip()]
    
    @field_validator('SECRET_KEY')
    @classmethod
    def validate_secret_key(cls, v):
        """验证密钥长度"""
        if not v:
            # 开发环境生成临时密钥
            if os.getenv("ENVIRONMENT", "development") == "development":
                return secrets.token_urlsafe(32)
            raise ValueError("SECRET_KEY 必须设置")
        if len(v) < 32:
            raise ValueError("SECRET_KEY 长度至少为32个字符")
        return v
    
    # ========== 数据库配置 ==========
    # 数据库类型
    DATABASE_TYPE: Literal["mysql", "postgresql", "sqlite"] = Field(
        default="postgresql",  # 推荐使用 PostgreSQL
        description="数据库类型"
    )
    
    # 数据库连接参数
    DB_HOST: str = Field(default="localhost", description="数据库主机")
    DB_PORT: int = Field(default=5432, ge=1, le=65535, description="数据库端口")
    DB_USER: str = Field(default="vectorforge", description="数据库用户名")
    DB_PASSWORD: str = Field(description="数据库密码")
    DB_NAME: str = Field(default="vectorforge", description="数据库名称")
    
    # 连接池配置
    DB_POOL_SIZE: int = Field(default=5, ge=1, description="连接池大小")
    DB_MAX_OVERFLOW: int = Field(default=10, ge=0, description="连接池最大溢出")
    DB_POOL_TIMEOUT: int = Field(default=30, ge=1, description="连接池超时时间")
    
    # 可选：直接指定数据库 URL
    DATABASE_URL: Optional[str] = Field(default=None, description="完整数据库连接URL")
    
    @property
    def database_url(self) -> str:
        """获取数据库连接 URL"""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        
        # 根据数据库类型构建连接字符串
        if self.DATABASE_TYPE == "mysql":
            return f"mysql+mysqlconnector://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        elif self.DATABASE_TYPE == "postgresql":
            return f"postgresql+psycopg2://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        elif self.DATABASE_TYPE == "sqlite":
            return f"sqlite:///./{self.DB_NAME}.db"
        else:
            raise ValueError(f"不支持的数据库类型: {self.DATABASE_TYPE}")
    
    @field_validator('DB_PORT')
    @classmethod
    def validate_db_port(cls, v, info):
        """根据数据库类型设置默认端口"""
        if hasattr(info, 'data') and info.data:
            db_type = info.data.get('DATABASE_TYPE', 'postgresql')
            if db_type == 'mysql' and v == 5432:  # 如果是默认值但数据库类型是 MySQL
                return 3306
            elif db_type == 'postgresql' and v == 3306:  # 如果是默认值但数据库类型是 PostgreSQL
                return 5432
        return v
    
    # ========== OpenAI 配置 ==========
    OPENAI_API_KEY: Optional[str] = Field(default=None, description="OpenAI API 密钥")
    OPENAI_BASE_URL: Optional[AnyHttpUrl] = Field(default=None, description="OpenAI API 基础URL")
    OPENAI_MODEL: str = Field(default="gpt-4o-mini", description="默认 GPT 模型")
    OPENAI_MAX_TOKENS: int = Field(default=1000, ge=1, description="最大 token 数")
    OPENAI_TEMPERATURE: float = Field(default=0.7, ge=0.0, le=2.0, description="温度参数")
    
    # Embedding 配置
    OPENAI_EMBEDDING_MODEL: str = Field(default="text-embedding-3-large", description="嵌入模型")
    EMBEDDING_DIMENSION: int = Field(default=3072, ge=1, description="嵌入维度")
    
    # ========== Milvus 配置 ==========
    MILVUS_URI: Optional[str] = Field(default=None, description="Milvus 服务地址")
    MILVUS_TOKEN: Optional[str] = Field(default=None, description="Milvus 访问令牌")
    MILVUS_DB_NAME: str = Field(default="vectorforge", description="Milvus 数据库名")
    MILVUS_COLLECTION_PREFIX: str = Field(default="vf_", description="集合名前缀")
    MILVUS_SEARCH_TOP_K: int = Field(default=10, ge=1, description="搜索返回数量")
    
    # ========== 业务配置 ==========
    # 内容限制
    MAX_CONTENT_LENGTH: int = Field(default=8192, ge=1, description="最大内容长度")
    MAX_CHAT_HISTORY: int = Field(default=100, ge=1, description="最大聊天历史数")
    
    # 文件上传配置
    MAX_FILE_SIZE: int = Field(default=10 * 1024 * 1024, description="最大文件大小（字节）")
    ALLOWED_FILE_TYPES: List[str] = Field(
        default=["txt", "pdf", "docx", "json"], 
        description="允许的文件类型"
    )
    
    # 审核配置
    AUTO_AUDIT_THRESHOLD: float = Field(default=0.8, ge=0.0, le=1.0, description="自动审核阈值")
    REQUIRE_MANUAL_REVIEW: bool = Field(default=True, description="是否需要人工审核")
    
    # ========== 日志配置 ==========
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = Field(
        default="INFO", 
        description="日志级别"
    )
    LOG_FILE: Optional[str] = Field(default=None, description="日志文件路径")
    LOG_FORMAT: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        description="日志格式"
    )
    
    # ========== Redis 配置（可选） ==========
    REDIS_URL: Optional[str] = Field(default=None, description="Redis 连接URL")
    REDIS_HOST: str = Field(default="localhost", description="Redis 主机")
    REDIS_PORT: int = Field(default=6379, ge=1, le=65535, description="Redis 端口")
    REDIS_DB: int = Field(default=0, ge=0, description="Redis 数据库编号")
    REDIS_PASSWORD: Optional[str] = Field(default=None, description="Redis 密码")
    
    @property
    def redis_url(self) -> str:
        """获取 Redis 连接 URL"""
        if self.REDIS_URL:
            return self.REDIS_URL
        
        auth_part = f":{self.REDIS_PASSWORD}@" if self.REDIS_PASSWORD else ""
        return f"redis://{auth_part}{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
    
    # ========== 开发配置 ==========
    # 自动重载（仅开发环境）
    RELOAD: bool = Field(default=False, description="自动重载")
    
    # CORS 配置
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:5173"], 
        description="允许的跨域源"
    )
    
    @field_validator('CORS_ORIGINS', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        """解析 CORS 源列表"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v
    
    # ========== MinIO 配置 ==========
    MINIO_ENDPOINT: Optional[str] = Field(default=None, description="MinIO 服务地址")
    MINIO_ACCESS_KEY: Optional[str] = Field(default=None, description="MinIO 访问密钥")
    MINIO_SECRET_KEY: Optional[str] = Field(default=None, description="MinIO 秘密密钥")
    MINIO_BUCKET_NAME: str = Field(default="vectorforge", description="MinIO 存储桶名称")
    MINIO_SECURE: bool = Field(default=False, description="是否使用 HTTPS")
    
    # ========== 模型配置 ==========
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore"
    }
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        # 根据环境自动设置相关配置
        if self.ENVIRONMENT == "development":
            self.DEBUG = True
            self.RELOAD = True
            self.LOG_LEVEL = "DEBUG"
        elif self.ENVIRONMENT == "production":
            self._validate_production_config()
    
    def _validate_production_config(self):
        """生产环境配置验证"""
        if self.DEBUG:
            raise ValueError("生产环境不能开启调试模式")
        
        if not self.SECRET_KEY or len(self.SECRET_KEY) < 32:
            raise ValueError("生产环境必须设置足够长的 SECRET_KEY")
        
        if not self.DB_PASSWORD:
            raise ValueError("生产环境必须设置数据库密码")
        
        if self.DATABASE_TYPE == "sqlite":
            raise ValueError("生产环境不建议使用 SQLite")

# 创建全局配置实例
settings = Settings()