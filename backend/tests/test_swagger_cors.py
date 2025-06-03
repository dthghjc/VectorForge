#!/usr/bin/env python3
"""
Swagger UI CORS 问题诊断脚本
模拟 Swagger UI 的真实请求来诊断 CORS 问题
"""
import requests
import json

def test_swagger_specific_cors():
    """测试 Swagger UI 特定的 CORS 请求"""
    print("🔍 测试 Swagger UI 特定的 CORS 请求...")
    
    base_url = "http://localhost:8009"
    api_url = f"{base_url}/v1"
    
    # Swagger UI 通常会发送这样的请求
    swagger_origins = [
        f"http://localhost:8009",  # 同源请求
        f"http://127.0.0.1:8009",  # IPv4 本地地址
        "null",  # 有时候 Swagger UI 会发送 null origin
    ]
    
    for origin in swagger_origins:
        print(f"\n📍 测试 Origin: {origin}")
        
        # 测试 OPTIONS 预检请求
        try:
            headers = {
                'Origin': origin,
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'accept, content-type',
                'User-Agent': 'Mozilla/5.0 (compatible; Swagger-UI)',
            }
            
            response = requests.options(api_url, headers=headers)
            print(f"  OPTIONS 状态码: {response.status_code}")
            
            # 检查关键的 CORS 头
            allow_origin = response.headers.get('Access-Control-Allow-Origin')
            allow_credentials = response.headers.get('Access-Control-Allow-Credentials')
            allow_methods = response.headers.get('Access-Control-Allow-Methods')
            allow_headers = response.headers.get('Access-Control-Allow-Headers')
            
            print(f"  Allow-Origin: {allow_origin}")
            print(f"  Allow-Credentials: {allow_credentials}")
            print(f"  Allow-Methods: {allow_methods}")
            print(f"  Allow-Headers: {allow_headers}")
            
            if allow_origin and allow_origin in [origin, "*"]:
                print("  ✅ Origin 检查通过")
            else:
                print(f"  ❌ Origin 检查失败: 期望 {origin} 或 *, 得到 {allow_origin}")
                
        except Exception as e:
            print(f"  ❌ OPTIONS 请求失败: {e}")
            
        # 测试实际的 GET 请求
        try:
            headers = {
                'Origin': origin,
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (compatible; Swagger-UI)',
            }
            
            response = requests.get(api_url, headers=headers)
            print(f"  GET 状态码: {response.status_code}")
            
            # 检查响应中的 CORS 头
            response_allow_origin = response.headers.get('Access-Control-Allow-Origin')
            if response_allow_origin:
                print(f"  GET 响应 Allow-Origin: {response_allow_origin}")
            else:
                print("  ❌ GET 响应缺少 Allow-Origin 头")
                
        except Exception as e:
            print(f"  ❌ GET 请求失败: {e}")

def test_wildcard_cors():
    """测试通配符 CORS 配置"""
    print("\n🔍 测试通配符 CORS 配置...")
    
    api_url = "http://localhost:8009/v1"
    
    # 测试各种可能的 Origin
    test_origins = [
        "http://localhost:8009",
        "http://127.0.0.1:8009", 
        "http://localhost:3000",
        "http://example.com",
        "https://swagger.io",
        "null"
    ]
    
    for origin in test_origins:
        try:
            headers = {
                'Origin': origin,
                'Access-Control-Request-Method': 'GET',
            }
            
            response = requests.options(api_url, headers=headers)
            allow_origin = response.headers.get('Access-Control-Allow-Origin')
            
            print(f"Origin: {origin:25} -> Allow-Origin: {allow_origin}")
            
        except Exception as e:
            print(f"Origin: {origin:25} -> 错误: {e}")

def test_current_cors_middleware():
    """测试当前的 CORS 中间件配置"""
    print("\n🔍 测试当前 CORS 中间件配置...")
    
    try:
        from app.core.config import settings
        from app.main import app
        
        print(f"CORS 源配置: {settings.CORS_ORIGINS}")
        print(f"CORS 源列表: {settings.cors_origins_list}")
        
        # 检查 FastAPI 应用的中间件
        middlewares = []
        for middleware in app.middleware_stack:
            if hasattr(middleware, 'cls'):
                middlewares.append(middleware.cls.__name__)
        
        print(f"应用中间件: {middlewares}")
        
        # 检查 CORS 中间件是否正确添加
        cors_found = any('CORS' in m for m in middlewares)
        print(f"CORS 中间件已添加: {cors_found}")
        
    except Exception as e:
        print(f"❌ 中间件检查失败: {e}")

def check_browser_console_errors():
    """提供浏览器控制台检查指导"""
    print("\n🔍 浏览器控制台检查指导...")
    print("""
请在浏览器中打开 http://localhost:8009/docs，然后：

1. 打开浏览器开发者工具 (F12)
2. 切换到 "网络" (Network) 标签页
3. 尝试调用 API (点击 Try it out -> Execute)
4. 查看失败的请求，检查：
   - 请求的完整 URL
   - 请求头中的 Origin
   - 响应头中的 Access-Control-Allow-Origin
   - 控制台中的具体错误消息

5. 切换到 "控制台" (Console) 标签页，查看具体的 CORS 错误信息

常见的 CORS 错误类型：
- "has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header"
- "has been blocked by CORS policy: The request client is not a secure context"
- "has been blocked by CORS policy: Request header field xxx is not allowed"
""")

if __name__ == "__main__":
    print("🚀 Swagger UI CORS 问题诊断开始...\n")
    
    # 测试中间件配置
    test_current_cors_middleware()
    
    # 测试 Swagger UI 特定请求
    test_swagger_specific_cors()
    
    # 测试通配符配置
    test_wildcard_cors()
    
    # 提供浏览器检查指导
    check_browser_console_errors()
    
    print(f"\n✅ 诊断完成！请结合浏览器控制台信息进行进一步排查。") 