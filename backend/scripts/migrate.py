#!/usr/bin/env python3
"""
数据库迁移管理脚本
提供便捷的数据库迁移操作
"""
import os
import sys
import subprocess
import argparse
from pathlib import Path

# 添加项目路径
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))


def run_command(cmd, description):
    """运行命令并处理结果"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(
            cmd,
            cwd=project_root,
            capture_output=True,
            text=True,
            check=True
        )
        print(f"✅ {description}完成")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description}失败: {e}")
        if e.stderr:
            print(f"错误: {e.stderr}")
        return False


def create_migration(message):
    """创建新的迁移文件"""
    cmd = ["uv", "run", "alembic", "revision", "--autogenerate", "-m", message]
    return run_command(cmd, f"创建迁移: {message}")


def upgrade_database(revision="head"):
    """升级数据库到指定版本"""
    cmd = ["uv", "run", "alembic", "upgrade", revision]
    return run_command(cmd, f"升级数据库到 {revision}")


def downgrade_database(revision):
    """降级数据库到指定版本"""
    cmd = ["uv", "run", "alembic", "downgrade", revision]
    return run_command(cmd, f"降级数据库到 {revision}")


def show_current_version():
    """显示当前数据库版本"""
    cmd = ["uv", "run", "alembic", "current"]
    return run_command(cmd, "查看当前数据库版本")


def show_history():
    """显示迁移历史"""
    cmd = ["uv", "run", "alembic", "history", "--verbose"]
    return run_command(cmd, "查看迁移历史")


def show_heads():
    """显示头部版本"""
    cmd = ["uv", "run", "alembic", "heads"]
    return run_command(cmd, "查看头部版本")


def reset_database():
    """重置数据库（危险操作）"""
    print("⚠️ 这是一个危险操作，将删除所有数据！")
    confirm = input("请输入 'RESET' 确认重置数据库: ")
    if confirm != "RESET":
        print("❌ 操作已取消")
        return False
    
    # 降级到base（删除所有表）
    if not downgrade_database("base"):
        return False
    
    # 重新升级到最新版本
    if not upgrade_database("head"):
        return False
    
    print("✅ 数据库重置完成")
    return True


def validate_migration():
    """验证迁移文件的完整性"""
    cmd = ["uv", "run", "alembic", "check"]
    return run_command(cmd, "验证迁移完整性")


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="数据库迁移管理工具")
    subparsers = parser.add_subparsers(dest="command", help="可用命令")
    
    # 创建迁移
    create_parser = subparsers.add_parser("create", help="创建新迁移")
    create_parser.add_argument("message", help="迁移描述信息")
    
    # 升级数据库
    upgrade_parser = subparsers.add_parser("upgrade", help="升级数据库")
    upgrade_parser.add_argument("revision", nargs="?", default="head", help="目标版本 (默认: head)")
    
    # 降级数据库
    downgrade_parser = subparsers.add_parser("downgrade", help="降级数据库")
    downgrade_parser.add_argument("revision", help="目标版本")
    
    # 查看当前版本
    subparsers.add_parser("current", help="查看当前数据库版本")
    
    # 查看历史
    subparsers.add_parser("history", help="查看迁移历史")
    
    # 查看头部版本
    subparsers.add_parser("heads", help="查看头部版本")
    
    # 重置数据库
    subparsers.add_parser("reset", help="重置数据库（危险操作）")
    
    # 验证迁移
    subparsers.add_parser("validate", help="验证迁移完整性")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    success = False
    
    if args.command == "create":
        success = create_migration(args.message)
    elif args.command == "upgrade":
        success = upgrade_database(args.revision)
    elif args.command == "downgrade":
        success = downgrade_database(args.revision)
    elif args.command == "current":
        success = show_current_version()
    elif args.command == "history":
        success = show_history()
    elif args.command == "heads":
        success = show_heads()
    elif args.command == "reset":
        success = reset_database()
    elif args.command == "validate":
        success = validate_migration()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main() 