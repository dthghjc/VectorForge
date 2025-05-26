from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import DatabaseError
from app.core.config import settings
from app.models.base import Base
from app.models.user import User, MessageAudit
from app.models.chat import Chat, Message
import logging
import time

# 设置日志
logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL))
logger = logging.getLogger(__name__)

# 创建数据库引擎，使用连接池配置
engine = create_engine(
    settings.database_url,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT,
    echo=settings.DEBUG  # 开发环境显示 SQL 语句
)

# 添加重试逻辑
max_retries = 5
retry_interval = 5

# 创建数据库表
for attempt in range(max_retries):
    try:
        Base.metadata.create_all(bind=engine)
        logger.info(f"Successfully created tables on attempt {attempt + 1}")
        break
    except DatabaseError as e:
        logger.error(f"Failed to connect to database, attempt {attempt + 1}/{max_retries}: {e}")
        if attempt < max_retries - 1:
            time.sleep(retry_interval)
        else:
            raise

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()