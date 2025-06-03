#!/usr/bin/env python3
"""
配置测试脚本
验证环境变量读取是否正常工作
"""
import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

def test_config_loading():
    """测试配置加载"""
    print("🔧 测试 VectorForge 配置加载...")
    
    # 设置一些测试环境变量
    test_env_vars = {
        "PROJECT_NAME": "TestVectorForge",
        "SECRET_KEY": "test-secret-key-for-development-only-32-chars",
        "DB_PASSWORD": "test-password",
        "ENVIRONMENT": "development",
        "SERVER_PORT": "8080",
        "OPENAI_TEMPERATURE": "0.8",
        "CORS_ORIGINS": "http://localhost:3000,http://localhost:5173,http://localhost:8080",
        "ALLOWED_FILE_TYPES": "txt,pdf,docx,json,csv"
    }
    
    # 设置环境变量
    for key, value in test_env_vars.items():
        os.environ[key] = value
        print(f"  设置环境变量: {key}={value}")
    
    print("\n📋 加载配置...")
    
    try:
        # 导入配置
        from app.core.config import settings
        
        print("✅ 配置加载成功！")
        print(f"\n📊 配置值验证:")
        print(f"  项目名称: {settings.PROJECT_NAME}")
        print(f"  环境: {settings.ENVIRONMENT}")
        print(f"  服务器端口: {settings.SERVER_PORT} (类型: {type(settings.SERVER_PORT)})")
        print(f"  OpenAI 温度: {settings.OPENAI_TEMPERATURE} (类型: {type(settings.OPENAI_TEMPERATURE)})")
        print(f"  CORS 源: {settings.CORS_ORIGINS} (类型: {type(settings.CORS_ORIGINS)})")
        print(f"  允许文件类型: {settings.ALLOWED_FILE_TYPES}")
        print(f"  允许文件类型列表: {settings.allowed_file_types_list}")
        print(f"  数据库 URL: {settings.database_url}")
        print(f"  服务器 URL: {settings.server_url}")
        
        print(f"\n🔐 安全配置:")
        print(f"  JWT密钥长度: {len(settings.SECRET_KEY)}")
        print(f"  JWT算法: {settings.ALGORITHM}")
        print(f"  Token过期时间: {settings.ACCESS_TOKEN_EXPIRE_MINUTES} 分钟")
        
        print(f"\n🗄️ 数据库配置:")
        print(f"  数据库类型: {settings.DATABASE_TYPE}")
        print(f"  数据库主机: {settings.DB_HOST}")
        print(f"  数据库端口: {settings.DB_PORT}")
        print(f"  数据库用户: {settings.DB_USER}")
        print(f"  连接池大小: {settings.DB_POOL_SIZE}")
        
        print(f"\n🤖 AI 配置:")
        print(f"  OpenAI 模型: {settings.OPENAI_MODEL}")
        print(f"  最大 tokens: {settings.OPENAI_MAX_TOKENS}")
        print(f"  嵌入模型: {settings.OPENAI_EMBEDDING_MODEL}")
        print(f"  嵌入维度: {settings.EMBEDDING_DIMENSION}")
        
        print(f"\n📝 业务配置:")
        print(f"  最大内容长度: {settings.MAX_CONTENT_LENGTH}")
        print(f"  最大聊天历史: {settings.MAX_CHAT_HISTORY}")
        print(f"  自动审核阈值: {settings.AUTO_AUDIT_THRESHOLD}")
        print(f"  需要人工审核: {settings.REQUIRE_MANUAL_REVIEW}")
        
        return True
        
    except Exception as e:
        print(f"❌ 配置加载失败: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        # 清理测试环境变量
        for key in test_env_vars.keys():
            if key in os.environ:
                del os.environ[key]

def test_env_file_loading():
    """测试 .env 文件加载"""
    print("\n📄 测试 .env 文件加载...")
    
    # 创建测试 .env 文件
    env_content = """
# 测试 .env 文件
PROJECT_NAME=EnvFileVectorForge
SECRET_KEY=env-file-secret-key-for-testing-32-chars
DB_PASSWORD=env-file-password
ENVIRONMENT=testing
SERVER_PORT=9000
OPENAI_TEMPERATURE=0.9
CORS_ORIGINS=http://localhost:4000,http://localhost:6000
"""
    
    with open(".env.test", "w") as f:
        f.write(env_content)
    
    # 临时修改配置类以使用测试 .env 文件
    try:
        # 重新导入以测试 .env 文件
        import importlib
        import app.core.config
        
        # 修改环境文件路径
        original_env_file = app.core.config.Settings.model_config["env_file"]
        app.core.config.Settings.model_config["env_file"] = ".env.test"
        
        # 重新加载模块
        importlib.reload(app.core.config)
        
        settings = app.core.config.settings
        
        print("✅ .env 文件加载成功！")
        print(f"  项目名称: {settings.PROJECT_NAME}")
        print(f"  环境: {settings.ENVIRONMENT}")
        print(f"  服务器端口: {settings.SERVER_PORT}")
        
        # 恢复原始配置
        app.core.config.Settings.model_config["env_file"] = original_env_file
        
        return True
        
    except Exception as e:
        print(f"❌ .env 文件加载失败: {e}")
        return False
    
    finally:
        # 清理测试文件
        if os.path.exists(".env.test"):
            os.remove(".env.test")

if __name__ == "__main__":
    print("🚀 VectorForge 配置系统测试")
    print("=" * 50)
    
    success1 = test_config_loading()
    success2 = test_env_file_loading()
    
    print("\n" + "=" * 50)
    if success1 and success2:
        print("🎉 所有测试通过！配置系统工作正常。")
        sys.exit(0)
    else:
        print("❌ 部分测试失败，请检查配置。")
        sys.exit(1) 