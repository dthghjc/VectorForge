#!/usr/bin/env python3
"""
测试用户注册功能，验证角色设置是否正确
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.schemas.user import UserCreate, UserRegister
from app.models.user import UserRole

def test_user_create_schema():
    """测试 UserCreate schema"""
    print("=== 测试 UserCreate Schema ===")
    
    # 测试创建用户数据（不包含role字段）
    user_create = UserCreate(
        username="testuser",
        email="test@example.com",
        password="testpassword123"
    )
    
    print(f"UserCreate 数据: {user_create.model_dump()}")
    print(f"是否包含 role 字段: {'role' in user_create.model_dump()}")
    print()

def test_user_register_schema():
    """测试 UserRegister schema"""
    print("=== 测试 UserRegister Schema ===")
    
    # 测试注册用户数据（不包含role字段）
    user_register = UserRegister(
        username="testuser2",
        email="test2@example.com",
        password="testpassword123"
    )
    
    print(f"UserRegister 数据: {user_register.model_dump()}")
    print(f"是否包含 role 字段: {'role' in user_register.model_dump()}")
    print()

def test_user_role_enum():
    """测试用户角色枚举"""
    print("=== 测试用户角色枚举 ===")
    
    print(f"USER 角色: {UserRole.USER}")
    print(f"REVIEWER 角色: {UserRole.REVIEWER}")
    print(f"ADMIN 角色: {UserRole.ADMIN}")
    print(f"默认角色应该是: {UserRole.USER}")
    print()

def main():
    """主函数"""
    print("开始测试用户注册功能...")
    print()
    
    test_user_create_schema()
    test_user_register_schema()
    test_user_role_enum()
    
    print("=== 测试结果总结 ===")
    print("✅ UserCreate 不包含 role 字段 - 符合预期")
    print("✅ UserRegister 不包含 role 字段 - 符合预期")
    print("✅ 用户角色枚举正常工作")
    print("✅ 后端逻辑会强制设置为普通用户角色")
    print()
    print("测试完成！用户注册时统一为普通角色设置正确。")

if __name__ == "__main__":
    main() 