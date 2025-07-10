#!/usr/bin/env python3
"""
数据库初始化脚本
用于新设备或重新开始的开发环境
"""
import os
import sys
import subprocess
import logging
from pathlib import Path

# 添加项目路径
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from app.core.config import settings
from app.db.session import engine
from sqlalchemy import text
import mysql.connector
from mysql.connector import Error

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def check_database_connection():
    """检查数据库连接"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            logger.info("✅ 数据库连接成功")
            return True
    except Exception as e:
        logger.error(f"❌ 数据库连接失败: {e}")
        return False


def check_database_exists():
    """检查数据库是否存在，如果不存在则创建"""
    try:
        # 连接到MySQL服务器（不指定数据库）
        connection = mysql.connector.connect(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD
        )
        
        cursor = connection.cursor()
        
        # 检查数据库是否存在
        cursor.execute(f"SHOW DATABASES LIKE '{settings.DB_NAME}'")
        result = cursor.fetchone()
        
        if not result:
            # 创建数据库
            cursor.execute(f"CREATE DATABASE {settings.DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            logger.info(f"✅ 创建数据库: {settings.DB_NAME}")
        else:
            logger.info(f"✅ 数据库已存在: {settings.DB_NAME}")
        
        cursor.close()
        connection.close()
        return True
        
    except Error as e:
        logger.error(f"❌ 数据库操作失败: {e}")
        return False


def check_alembic_version():
    """检查Alembic版本状态"""
    try:
        result = subprocess.run(
            ["uv", "run", "alembic", "current"],
            cwd=project_root,
            capture_output=True,
            text=True,
            check=True
        )
        
        if "c1f5213960dd" in result.stdout:
            logger.info("✅ 数据库已经是最新版本")
            return True
        elif not result.stdout.strip() or "INFO" in result.stdout:
            logger.info("📝 数据库需要初始化")
            return False
        else:
            logger.warning(f"⚠️ 数据库版本状态: {result.stdout}")
            return False
            
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ 检查Alembic版本失败: {e}")
        return False


def run_migrations():
    """运行数据库迁移"""
    try:
        logger.info("🔄 开始运行数据库迁移...")
        result = subprocess.run(
            ["uv", "run", "alembic", "upgrade", "head"],
            cwd=project_root,
            capture_output=True,
            text=True,
            check=True
        )
        
        logger.info("✅ 数据库迁移完成")
        logger.debug(f"迁移输出: {result.stdout}")
        return True
        
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ 数据库迁移失败: {e}")
        logger.error(f"错误输出: {e.stderr}")
        return False


def create_default_admin():
    """创建默认管理员账户（如果不存在）"""
    try:
        from app.crud.user import user_crud
        from app.db.session import SessionLocal
        from app.schemas.user import UserCreate
        from app.core.security import get_password_hash
        
        db = SessionLocal()
        
        # 检查是否已有管理员
        admin = user_crud.get_first_admin(db)
        if admin:
            logger.info(f"✅ 管理员账户已存在: {admin.username}")
            db.close()
            return True
        
        # 创建默认管理员
        admin_data = UserCreate(
            username="admin",
            email="admin@vectorforge.local", 
            password="admin123456"  # 开发环境默认密码
        )
        
        admin_user = user_crud.create_user(db, admin_data, role="admin")
        logger.info(f"✅ 创建默认管理员账户: {admin_user.username}")
        logger.warning("⚠️ 默认密码: admin123456，请及时修改！")
        
        db.close()
        return True
        
    except Exception as e:
        logger.error(f"❌ 创建管理员账户失败: {e}")
        return False


def main():
    """主要的初始化流程"""
    logger.info("🚀 开始数据库初始化...")
    
    # 1. 检查环境变量
    if not settings.DB_PASSWORD:
        logger.error("❌ 请在.env文件中配置DB_PASSWORD")
        return False
    
    logger.info(f"📊 数据库配置: {settings.DB_USER}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}")
    
    # 2. 检查并创建数据库
    if not check_database_exists():
        return False
    
    # 3. 检查数据库连接
    if not check_database_connection():
        logger.error("❌ 请检查数据库配置和服务状态")
        return False
    
    # 4. 检查迁移状态
    needs_migration = not check_alembic_version()
    
    # 5. 运行迁移（如果需要）
    if needs_migration:
        if not run_migrations():
            return False
    
    # 6. 创建默认管理员
    if not create_default_admin():
        logger.warning("⚠️ 创建管理员账户失败，可以稍后手动创建")
    
    logger.info("🎉 数据库初始化完成！")
    logger.info("📖 后续步骤:")
    logger.info("   1. uv run uvicorn app.main:app --reload")
    logger.info("   2. 访问 http://localhost:8009/docs 查看API文档")
    
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 