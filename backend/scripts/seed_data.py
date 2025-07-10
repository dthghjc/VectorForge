#!/usr/bin/env python3
"""
种子数据脚本
为开发环境创建测试数据
"""
import sys
from pathlib import Path

# 添加项目路径
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from app.db.session import SessionLocal
from app.crud.user import user_crud
from app.schemas.user import UserCreate
from app.models.user import UserRole
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def create_test_users():
    """创建测试用户"""
    db = SessionLocal()
    
    try:
        # 测试用户数据
        test_users = [
            {
                "username": "testuser1",
                "email": "testuser1@example.com",
                "password": "testpass123",
                "role": UserRole.USER
            },
            {
                "username": "testuser2", 
                "email": "testuser2@example.com",
                "password": "testpass123",
                "role": UserRole.USER
            },
            {
                "username": "annotator1",
                "email": "annotator1@example.com", 
                "password": "testpass123",
                "role": UserRole.ANNOTATION
            },
            {
                "username": "annotator2",
                "email": "annotator2@example.com",
                "password": "testpass123", 
                "role": UserRole.ANNOTATION
            }
        ]
        
        created_count = 0
        
        for user_data in test_users:
            # 检查用户是否已存在
            existing_user = user_crud.get_user_by_username(db, user_data["username"])
            if existing_user:
                logger.info(f"👤 用户已存在: {user_data['username']}")
                continue
            
            # 创建用户
            user_create = UserCreate(
                username=user_data["username"],
                email=user_data["email"],
                password=user_data["password"]
            )
            
            user = user_crud.create_user(db, user_create, role=user_data["role"])
            logger.info(f"✅ 创建测试用户: {user.username} ({user.role.value})")
            created_count += 1
        
        logger.info(f"🎉 共创建 {created_count} 个测试用户")
        
    except Exception as e:
        logger.error(f"❌ 创建测试用户失败: {e}")
        db.rollback()
        return False
    finally:
        db.close()
    
    return True


def create_sample_chats():
    """创建示例对话（可选）"""
    db = SessionLocal()
    
    try:
        # 获取第一个普通用户
        user = db.query(
            user_crud.User
        ).filter(
            user_crud.User.role == UserRole.USER
        ).first()
        
        if not user:
            logger.warning("⚠️ 没有找到普通用户，跳过创建示例对话")
            return True
        
        from app.crud.chat import chat_crud
        from app.schemas.chat import ChatCreate, MessageCreate
        
        # 创建示例对话
        chat_create = ChatCreate(title="示例对话：AI助手介绍")
        chat = chat_crud.create_chat(db, chat_create, user.id)
        
        # 添加示例消息
        messages = [
            {"role": "user", "content": "你好，你是什么？"},
            {"role": "assistant", "content": "您好！我是VectorForge平台的AI助手，专门用于对话标注和审核。我可以帮助您处理各种AI对话相关的任务。"},
            {"role": "user", "content": "你能做什么？"},
            {"role": "assistant", "content": "我主要可以帮助您：\n1. 进行对话内容的审核和标注\n2. 协助处理向量数据管理\n3. 提供AI对话的质量评估\n4. 支持多模态数据的处理和分析"}
        ]
        
        from app.crud.chat import message_crud
        
        for msg_data in messages:
            message_create = MessageCreate(
                role=msg_data["role"],
                content=msg_data["content"],
                chat_id=chat.id
            )
            message_crud.create_message(db, message_create, user.id)
        
        logger.info(f"✅ 创建示例对话: {chat.title}")
        
    except Exception as e:
        logger.error(f"❌ 创建示例对话失败: {e}")
        db.rollback()
        return False
    finally:
        db.close()
    
    return True


def main():
    """主函数"""
    logger.info("🌱 开始创建种子数据...")
    
    # 1. 创建测试用户
    if not create_test_users():
        logger.error("❌ 创建测试用户失败")
        return False
    
    # 2. 创建示例对话
    if not create_sample_chats():
        logger.error("❌ 创建示例对话失败")
        return False
    
    logger.info("🎉 种子数据创建完成！")
    logger.info("📖 测试账户信息:")
    logger.info("   - 普通用户: testuser1/testuser2, 密码: testpass123")
    logger.info("   - 标注员: annotator1/annotator2, 密码: testpass123")
    logger.info("   - 管理员: admin, 密码: admin123456")
    
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 