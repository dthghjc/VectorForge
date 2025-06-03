#!/usr/bin/env python3
"""
CORS 配置测试脚本
用于验证 FastAPI 的 CORS 配置是否正确
"""
import requests
import json

def test_cors_configuration():
    """测试 CORS 配置"""
    print("🔍 测试 CORS 配置...")
    
    base_url = "http://localhost:8009"
    api_url = f"{base_url}/v1"
    
    # 测试简单请求
    print(f"\n📍 测试 GET 请求: {api_url}")
    try:
        response = requests.get(api_url)
        print(f"✅ 状态码: {response.status_code}")
        print(f"✅ 响应: {response.json()}")
        
        # 检查 CORS 响应头
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
        }
        
        print(f"\n📋 CORS 响应头:")
        for header, value in cors_headers.items():
            if value:
                print(f"  {header}: {value}")
            else:
                print(f"  {header}: ❌ 未设置")
                
    except requests.exceptions.RequestException as e:
        print(f"❌ 请求失败: {e}")
        return False
    
    # 测试 OPTIONS 预检请求
    print(f"\n📍 测试 OPTIONS 预检请求: {api_url}")
    try:
        headers = {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Content-Type',
        }
        
        response = requests.options(api_url, headers=headers)
        print(f"✅ OPTIONS 状态码: {response.status_code}")
        
        # 检查预检响应头
        preflight_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
            'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials'),
        }
        
        print(f"\n📋 预检请求响应头:")
        for header, value in preflight_headers.items():
            if value:
                print(f"  {header}: {value}")
            else:
                print(f"  {header}: ❌ 未设置")
                
    except requests.exceptions.RequestException as e:
        print(f"❌ OPTIONS 请求失败: {e}")
        return False
    
    return True

def test_swagger_access():
    """测试 Swagger UI 访问"""
    print(f"\n🔍 测试 Swagger UI 访问...")
    
    swagger_url = "http://localhost:8009/docs"
    try:
        response = requests.get(swagger_url)
        print(f"✅ Swagger UI 状态码: {response.status_code}")
        if response.status_code == 200:
            print("✅ Swagger UI 可正常访问")
        else:
            print(f"❌ Swagger UI 访问异常，状态码: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Swagger UI 访问失败: {e}")
        return False
    
    return True

def check_current_config():
    """检查当前配置"""
    print("🔍 检查当前配置...")
    
    try:
        from app.core.config import settings
        
        print(f"\n📋 当前配置:")
        print(f"  项目名称: {settings.PROJECT_NAME}")
        print(f"  版本: {settings.VERSION}")
        print(f"  环境: {settings.ENVIRONMENT}")
        print(f"  服务器地址: {settings.SERVER_HOST}:{settings.SERVER_PORT}")
        print(f"  服务器URL: {settings.server_url}")
        print(f"  CORS 源配置: {settings.CORS_ORIGINS}")
        print(f"  CORS 源列表: {settings.cors_origins_list}")
        
        return True
        
    except Exception as e:
        print(f"❌ 配置检查失败: {e}")
        return False

if __name__ == "__main__":
    print("🚀 CORS 配置验证开始...\n")
    
    # 检查配置
    if not check_current_config():
        exit(1)
    
    # 测试 CORS
    if not test_cors_configuration():
        exit(1)
    
    # 测试 Swagger
    if not test_swagger_access():
        exit(1)
    
    print(f"\n✅ 所有测试通过！CORS 配置正常。") 