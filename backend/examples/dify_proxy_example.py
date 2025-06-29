#!/usr/bin/env python3
"""
Dify 代理 API 使用示例

演示如何通过JWT认证使用VectorForge的Dify代理API。
这个示例展示了完整的认证流程和API调用。

运行前请确保：
1. VectorForge 服务已启动
2. 已配置 Dify API Key 在环境变量中
3. 数据库已正确配置
"""

import requests
import json
import time
from typing import Optional

# 配置
API_BASE_URL = "http://localhost:8009"  # VectorForge 服务地址
USERNAME = "test_user"  # 测试用户名
PASSWORD = "test_password"  # 测试密码


class VectorForgeClient:
    """VectorForge Dify 代理客户端"""
    
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.token = None
        self.headers = {"Content-Type": "application/json"}
    
    def login(self, username: str, password: str) -> bool:
        """登录获取JWT Token"""
        url = f"{self.base_url}/api/v1/auth/login"
        
        data = {
            "username": username,
            "password": password
        }
        
        try:
            response = requests.post(url, json=data, headers=self.headers)
            
            if response.status_code == 200:
                result = response.json()
                self.token = result.get("access_token")
                
                # 更新headers包含认证信息
                self.headers["Authorization"] = f"Bearer {self.token}"
                print(f"✅ 登录成功，Token: {self.token[:20]}...")
                return True
            else:
                print(f"❌ 登录失败: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ 登录异常: {e}")
            return False
    
    def register(self, username: str, password: str, email: str) -> bool:
        """注册新用户"""
        url = f"{self.base_url}/api/v1/auth/register"
        
        data = {
            "username": username,
            "password": password,
            "email": email
        }
        
        try:
            response = requests.post(url, json=data, headers={"Content-Type": "application/json"})
            
            if response.status_code == 201:
                print(f"✅ 注册成功")
                return True
            else:
                print(f"❌ 注册失败: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ 注册异常: {e}")
            return False
    
    def send_blocking_message(
        self, 
        query: str, 
        user: str = "demo_user", 
        conversation_id: Optional[str] = None,
        inputs: dict = None
    ) -> dict:
        """发送阻塞式消息"""
        if not self.token:
            raise Exception("请先登录")
        
        url = f"{self.base_url}/api/v1/dify/chat-messages"
        
        data = {
            "query": query,
            "user": user,
            "response_mode": "blocking",
            "inputs": inputs or {},
            "auto_generate_name": True
        }
        
        if conversation_id:
            data["conversation_id"] = conversation_id
        
        response = requests.post(url, json=data, headers=self.headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"API request failed: {response.status_code} - {response.text}")
    
    def send_streaming_message(
        self, 
        query: str, 
        user: str = "demo_user", 
        conversation_id: Optional[str] = None,
        inputs: dict = None,
        callback=None
    ) -> dict:
        """发送流式消息"""
        if not self.token:
            raise Exception("请先登录")
        
        url = f"{self.base_url}/api/v1/dify/chat-messages"
        
        data = {
            "query": query,
            "user": user,
            "response_mode": "streaming",
            "inputs": inputs or {},
            "auto_generate_name": True
        }
        
        if conversation_id:
            data["conversation_id"] = conversation_id
        
        response = requests.post(url, json=data, headers=self.headers, stream=True)
        
        if response.status_code != 200:
            raise Exception(f"API request failed: {response.status_code} - {response.text}")
        
        full_answer = ""
        metadata = None
        conversation_id = None
        
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                if line_str.startswith('data: '):
                    try:
                        event_data = json.loads(line_str[6:])
                        
                        if event_data['event'] == 'message':
                            # 完整消息
                            full_answer = event_data['answer']
                            conversation_id = event_data['conversation_id']
                            if callback:
                                callback('message', event_data)
                        
                        elif event_data['event'] == 'message_delta':
                            # 增量消息
                            delta = event_data['delta']
                            full_answer += delta
                            conversation_id = event_data['conversation_id']
                            if callback:
                                callback('delta', delta)
                        
                        elif event_data['event'] == 'message_end':
                            # 消息结束
                            metadata = event_data['metadata']
                            conversation_id = event_data['conversation_id']
                            if callback:
                                callback('end', event_data)
                        
                        elif event_data['event'] == 'error':
                            # 错误
                            if callback:
                                callback('error', event_data)
                            raise Exception(f"Stream error: {event_data['error']}")
                            
                    except json.JSONDecodeError as e:
                        print(f"JSON decode error: {e}")
                        continue
        
        return {
            "answer": full_answer,
            "conversation_id": conversation_id,
            "metadata": metadata
        }
    
    def get_conversations(self, page: int = 1, page_size: int = 20) -> dict:
        """获取对话列表"""
        if not self.token:
            raise Exception("请先登录")
        
        url = f"{self.base_url}/api/v1/dify/conversations"
        params = {"page": page, "page_size": page_size}
        
        response = requests.get(url, params=params, headers=self.headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"API request failed: {response.status_code} - {response.text}")
    
    def get_conversation(self, conversation_id: str) -> dict:
        """获取对话详情"""
        if not self.token:
            raise Exception("请先登录")
        
        url = f"{self.base_url}/api/v1/dify/conversations/{conversation_id}"
        
        response = requests.get(url, headers=self.headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"API request failed: {response.status_code} - {response.text}")
    
    def delete_conversation(self, conversation_id: str) -> dict:
        """删除对话"""
        if not self.token:
            raise Exception("请先登录")
        
        url = f"{self.base_url}/api/v1/dify/conversations/{conversation_id}"
        
        response = requests.delete(url, headers=self.headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"API request failed: {response.status_code} - {response.text}")


def print_separator(title: str):
    """打印分隔符"""
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60 + "\n")


def demo_authentication():
    """演示认证流程"""
    print_separator("认证流程演示")
    
    client = VectorForgeClient(API_BASE_URL)
    
    # 尝试注册（如果用户不存在）
    print("📝 尝试注册用户...")
    client.register(USERNAME, PASSWORD, f"{USERNAME}@example.com")
    
    # 登录
    print("🔐 登录...")
    success = client.login(USERNAME, PASSWORD)
    
    if success:
        print("✅ 认证成功")
        return client
    else:
        print("❌ 认证失败")
        return None


def demo_blocking_chat(client: VectorForgeClient):
    """演示阻塞式对话"""
    print_separator("阻塞式对话演示")
    
    try:
        # 发送第一条消息
        print("👤 用户: 你好，请简单介绍一下人工智能")
        print("⏳ 等待AI回复...")
        
        result = client.send_blocking_message(
            query="你好，请简单介绍一下人工智能"
        )
        
        print(f"🤖 AI: {result['answer']}")
        print(f"💬 对话ID: {result['conversation_id']}")
        
        if result.get('metadata') and result['metadata'].get('usage'):
            usage = result['metadata']['usage']
            print(f"📊 使用统计: {usage.get('total_tokens', 'N/A')} tokens")
        
        # 继续对话
        print("\n" + "-"*40)
        print("👤 用户: 机器学习和深度学习有什么区别？")
        print("⏳ 等待AI回复...")
        
        result2 = client.send_blocking_message(
            query="机器学习和深度学习有什么区别？",
            conversation_id=result['conversation_id']  # 继续之前的对话
        )
        
        print(f"🤖 AI: {result2['answer']}")
        if result2.get('metadata') and result2['metadata'].get('usage'):
            usage = result2['metadata']['usage']
            print(f"📊 使用统计: {usage.get('total_tokens', 'N/A')} tokens")
        
        return result['conversation_id']
        
    except Exception as e:
        print(f"❌ 错误: {e}")
        return None


def demo_streaming_chat(client: VectorForgeClient):
    """演示流式对话"""
    print_separator("流式对话演示")
    
    def stream_callback(event_type: str, data):
        """流式回调函数"""
        if event_type == 'delta':
            print(data, end='', flush=True)
        elif event_type == 'end':
            if data.get('metadata') and data['metadata'].get('usage'):
                usage = data['metadata']['usage']
                print(f"\n\n📊 使用统计: {usage.get('total_tokens', 'N/A')} tokens")
        elif event_type == 'error':
            print(f"\n❌ 流式错误: {data['error']}")
    
    try:
        print("👤 用户: 请详细解释什么是神经网络，并说明其应用场景")
        print("🤖 AI: ", end='', flush=True)
        
        result = client.send_streaming_message(
            query="请详细解释什么是神经网络，并说明其应用场景",
            callback=stream_callback
        )
        
        print(f"💬 对话ID: {result['conversation_id']}")
        return result['conversation_id']
        
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        return None


def demo_conversation_management(client: VectorForgeClient):
    """演示对话管理"""
    print_separator("对话管理演示")
    
    try:
        # 获取对话列表
        print("📋 获取对话列表...")
        conversations = client.get_conversations()
        
        print(f"📊 总计 {conversations['total']} 个对话")
        
        if conversations['conversations']:
            for conv in conversations['conversations'][:3]:  # 显示前3个
                print(f"  💬 {conv['conversation_id'][:8]}... - {conv['title']} ({conv['message_count']} 条消息)")
            
            # 获取第一个对话的详情
            first_conv_id = conversations['conversations'][0]['conversation_id']
            print(f"\n🔍 获取对话详情: {first_conv_id[:8]}...")
            
            conversation_detail = client.get_conversation(first_conv_id)
            print(f"📝 标题: {conversation_detail['title']}")
            print(f"💬 消息数量: {len(conversation_detail['messages'])}")
            
            # 显示最近的几条消息
            if conversation_detail['messages']:
                print("📜 最近的消息:")
                for msg in conversation_detail['messages'][-2:]:  # 显示最后2条
                    role_emoji = "👤" if msg['role'] == 'user' else "🤖"
                    content_preview = msg['content'][:50] + "..." if len(msg['content']) > 50 else msg['content']
                    print(f"  {role_emoji} {msg['role']}: {content_preview}")
        else:
            print("📭 暂无对话记录")
        
    except Exception as e:
        print(f"❌ 错误: {e}")


def demo_conversation_with_inputs(client: VectorForgeClient):
    """演示带自定义输入的对话"""
    print_separator("自定义输入演示")
    
    try:
        # 带自定义输入参数
        custom_inputs = {
            "topic": "计算机视觉",
            "detail_level": "intermediate",
            "include_examples": True,
            "language": "Chinese"
        }
        
        print("👤 用户: 请根据我的偏好介绍相关技术")
        print(f"📝 自定义输入: {custom_inputs}")
        print("⏳ 等待AI回复...")
        
        result = client.send_blocking_message(
            query="请根据我提供的参数详细介绍相关技术，包括具体应用案例",
            inputs=custom_inputs
        )
        
        print(f"🤖 AI: {result['answer']}")
        print(f"💬 对话ID: {result['conversation_id']}")
        
    except Exception as e:
        print(f"❌ 错误: {e}")


def main():
    """主函数"""
    print("🚀 VectorForge Dify 代理 API 使用示例")
    print(f"🔗 服务地址: {API_BASE_URL}")
    print(f"👤 测试用户: {USERNAME}")
    
    # 检查服务是否可用
    try:
        response = requests.get(f"{API_BASE_URL}/api/v1")
        if response.status_code == 200:
            print("✅ 服务连接正常")
        else:
            print("⚠️  服务连接异常，但继续演示")
    except Exception as e:
        print(f"⚠️  无法连接到服务: {e}")
        print("请确保 VectorForge 服务已启动并且地址正确")
        return
    
    # 认证
    client = demo_authentication()
    if not client:
        print("❌ 无法继续演示，请检查认证配置")
        return
    
    # 运行各种演示
    conversation_id = demo_blocking_chat(client)
    demo_streaming_chat(client)
    demo_conversation_with_inputs(client)
    demo_conversation_management(client)
    
    print_separator("演示完成")
    print("🎉 所有演示已完成！")
    print("\n💡 提示:")
    print("- 请确保已在 .env 文件中配置 DIFY_API_KEY")
    print("- 如果遇到错误，请检查 Dify API 配置和网络连接")
    print("- 查看 backend/docs/DIFY_PROXY_API.md 了解更多用法")
    print("- 所有对话数据已保存在本地数据库中")


if __name__ == "__main__":
    main() 