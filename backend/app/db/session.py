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

# 添加重试逻辑用于数据库连接测试
max_retries = 5
retry_interval = 5

# 测试数据库连接（不自动创建表）
for attempt in range(max_retries):
    try:
        # 只测试连接，不创建表
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        logger.info(f"Successfully connected to database on attempt {attempt + 1}")
        break
    except DatabaseError as e:
        logger.error(f"Failed to connect to database, attempt {attempt + 1}/{max_retries}: {e}")
        if attempt < max_retries - 1:
            time.sleep(retry_interval)
        else:
            logger.error("Database connection failed after all retries")
            logger.error("Please ensure:")
            logger.error("1. Database service is running")
            logger.error("2. Database configuration in .env is correct")
            logger.error("3. Run 'uv run python scripts/init_db.py' to initialize database")
            # 不再抛出异常，让应用继续启动，但会在使用时报错
            break

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_initialized():
    """检查数据库是否已初始化（包含必要的表）"""
    try:
        with engine.connect() as conn:
            # 检查是否存在用户表（作为数据库已初始化的标志）
            result = conn.execute(
                "SELECT COUNT(*) FROM information_schema.tables "
                "WHERE table_schema = %s AND table_name = 'users'",
                (settings.DB_NAME,)
            )
            count = result.scalar()
            return count > 0
    except Exception as e:
        logger.error(f"Error checking database initialization: {e}")
        return False


def get_database_status():
    """获取数据库状态信息"""
    status = {
        "connected": False,
        "initialized": False,
        "tables_exist": False,
        "message": ""
    }
    
    try:
        # 测试连接
        with engine.connect() as conn:
            conn.execute("SELECT 1")
            status["connected"] = True
            
            # 检查表是否存在
            result = conn.execute(
                "SELECT table_name FROM information_schema.tables "
                "WHERE table_schema = %s AND table_name IN ('users', 'chats', 'messages')",
                (settings.DB_NAME,)
            )
            tables = [row[0] for row in result]
            
            if len(tables) >= 3:
                status["tables_exist"] = True
                status["initialized"] = True
                status["message"] = "Database is properly initialized"
            elif len(tables) > 0:
                status["message"] = f"Partial database setup - found tables: {', '.join(tables)}"
            else:
                status["message"] = "Database connected but no tables found. Run init_db.py to initialize."
                
    except Exception as e:
        status["message"] = f"Database connection failed: {str(e)}"
    
    return status