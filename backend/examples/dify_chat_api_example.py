#!/usr/bin/env python3
"""
Dify 对话消息 API 使用示例

这个脚本演示了如何使用 VectorForge 的 Dify 兼容对话 API。
支持流式和阻塞式两种模式。

运行前请确保：
1. VectorForge 服务已启动
2. 已配置正确的 API Key
3. 如需真实AI回复，请配置 OpenAI API
"""

import requests
import json
import time
import uuid
from typing import Optional

# 配置
API_BASE_URL = "http://localhost:8009"  # VectorForge 服务地址
API_KEY = "your-api-key-here"  # 替换为你的 API Key
USER_ID = "demo_user_001"  # 用户标识


class DifyAPIClient:
    """Dify API 客户端封装"""
    
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
    
    def send_blocking_message(
        self, 
        query: str, 
        user: str, 
        conversation_id: Optional[str] = None,
        inputs: dict = None
    ) -> dict:
        """发送阻塞式消息"""
        url = f"{self.base_url}/dify_api/v1/chat-messages"
        
        data = {
            "query": query,
            "user": user,
            "response_mode": "blocking",
            "inputs": inputs or {},
            "auto_generate_name": True
        }
        
        if conversation_id:
            data["conversation_id"] = conversation_id
        
        response = requests.post(url, headers=self.headers, json=data)
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"API request failed: {response.status_code} - {response.text}")
    
    def send_streaming_message(
        self, 
        query: str, 
        user: str, 
        conversation_id: Optional[str] = None,
        inputs: dict = None,
        callback=None
    ) -> dict:
        """发送流式消息"""
        url = f"{self.base_url}/dify_api/v1/chat-messages"
        
        data = {
            "query": query,
            "user": user,
            "response_mode": "streaming",
            "inputs": inputs or {},
            "auto_generate_name": True
        }
        
        if conversation_id:
            data["conversation_id"] = conversation_id
        
        response = requests.post(url, headers=self.headers, json=data, stream=True)
        
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


def print_separator(title: str):
    """打印分隔符"""
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60 + "\n")


def demo_blocking_mode():
    """演示阻塞模式"""
    print_separator("阻塞模式演示")
    
    client = DifyAPIClient(API_BASE_URL, API_KEY)
    
    try:
        # 发送第一条消息
        print("👤 用户: 你好，请简单介绍一下人工智能")
        print("⏳ 等待AI回复...")
        
        result = client.send_blocking_message(
            query="你好，请简单介绍一下人工智能",
            user=USER_ID
        )
        
        print(f"🤖 AI: {result['answer']}")
        print(f"💬 对话ID: {result['conversation_id']}")
        print(f"📊 使用统计: {result['metadata']['usage']['total_tokens']} tokens")
        
        # 继续对话
        print("\n" + "-"*40)
        print("👤 用户: 机器学习和深度学习有什么区别？")
        print("⏳ 等待AI回复...")
        
        result2 = client.send_blocking_message(
            query="机器学习和深度学习有什么区别？",
            user=USER_ID,
            conversation_id=result['conversation_id']  # 继续之前的对话
        )
        
        print(f"🤖 AI: {result2['answer']}")
        print(f"📊 使用统计: {result2['metadata']['usage']['total_tokens']} tokens")
        
    except Exception as e:
        print(f"❌ 错误: {e}")


def demo_streaming_mode():
    """演示流式模式"""
    print_separator("流式模式演示")
    
    client = DifyAPIClient(API_BASE_URL, API_KEY)
    
    def stream_callback(event_type: str, data):
        """流式回调函数"""
        if event_type == 'delta':
            print(data, end='', flush=True)
        elif event_type == 'end':
            print(f"\n\n📊 使用统计: {data['metadata']['usage']['total_tokens']} tokens")
        elif event_type == 'error':
            print(f"\n❌ 流式错误: {data['error']}")
    
    try:
        print("👤 用户: 请详细解释什么是神经网络，并说明其应用场景")
        print("🤖 AI: ", end='', flush=True)
        
        result = client.send_streaming_message(
            query="请详细解释什么是神经网络，并说明其应用场景",
            user=USER_ID,
            callback=stream_callback
        )
        
        print(f"💬 对话ID: {result['conversation_id']}")
        
    except Exception as e:
        print(f"\n❌ 错误: {e}")


def demo_with_inputs():
    """演示带自定义输入的请求"""
    print_separator("自定义输入演示")
    
    client = DifyAPIClient(API_BASE_URL, API_KEY)
    
    try:
        # 带自定义输入参数
        custom_inputs = {
            "topic": "计算机视觉",
            "detail_level": "intermediate",
            "include_examples": True
        }
        
        print("👤 用户: 请根据我的偏好介绍相关技术")
        print(f"📝 自定义输入: {custom_inputs}")
        print("⏳ 等待AI回复...")
        
        result = client.send_blocking_message(
            query="请根据我提供的参数介绍相关技术",
            user=USER_ID,
            inputs=custom_inputs
        )
        
        print(f"🤖 AI: {result['answer']}")
        print(f"💬 对话ID: {result['conversation_id']}")
        
    except Exception as e:
        print(f"❌ 错误: {e}")


def demo_conversation_continuation():
    """演示对话连续性"""
    print_separator("对话连续性演示")
    
    client = DifyAPIClient(API_BASE_URL, API_KEY)
    conversation_id = None
    
    questions = [
        "什么是机器学习？",
        "监督学习和无监督学习的区别是什么？",
        "请举个监督学习的具体例子",
        "这个例子中用到了什么算法？"
    ]
    
    try:
        for i, question in enumerate(questions, 1):
            print(f"\n第 {i} 轮对话:")
            print(f"👤 用户: {question}")
            print("🤖 AI: ", end='', flush=True)
            
            # 使用流式模式显示回复
            result = client.send_streaming_message(
                query=question,
                user=USER_ID,
                conversation_id=conversation_id,
                callback=lambda t, d: print(d, end='', flush=True) if t == 'delta' else None
            )
            
            conversation_id = result['conversation_id']
            print(f"\n💬 对话ID: {conversation_id}")
            
            time.sleep(1)  # 短暂暂停，模拟真实对话
            
    except Exception as e:
        print(f"\n❌ 错误: {e}")


def main():
    """主函数"""
    print("🚀 VectorForge Dify API 使用示例")
    print(f"🔗 服务地址: {API_BASE_URL}")
    print(f"👤 用户ID: {USER_ID}")
    print(f"🔑 API Key: {API_KEY[:10]}...")
    
    # 检查服务是否可用
    try:
        response = requests.get(f"{API_BASE_URL}/dify_api/v1")
        if response.status_code == 200:
            print("✅ 服务连接正常")
        else:
            print("⚠️  服务连接异常，但继续演示")
    except Exception as e:
        print(f"⚠️  无法连接到服务: {e}")
        print("请确保 VectorForge 服务已启动并且地址正确")
        return
    
    # 运行各种演示
    demo_blocking_mode()
    demo_streaming_mode()
    demo_with_inputs()
    demo_conversation_continuation()
    
    print_separator("演示完成")
    print("🎉 所有演示已完成！")
    print("\n💡 提示:")
    print("- 如果看到模拟回复，请配置 OpenAI API 获得真实AI回复")
    print("- 可以修改脚本中的配置来测试不同的场景")
    print("- 查看 backend/docs/DIFY_CHAT_API.md 了解更多用法")


if __name__ == "__main__":
    main() 