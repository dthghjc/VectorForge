"""
Dify 对话消息 API 测试
"""
import pytest
import json
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import create_root_app
from app.core.config import settings

# 创建测试客户端
app = create_root_app()
client = TestClient(app)

# 测试用的API Key
TEST_API_KEY = "test-api-key-123"

@pytest.fixture
def mock_api_key_validation():
    """模拟API Key验证"""
    with patch('app.core.security.verify_api_key_access') as mock_verify:
        mock_verify.return_value = True
        yield mock_verify

@pytest.fixture
def mock_openai_client():
    """模拟OpenAI客户端"""
    with patch('app.dify_api.v1.conversations.openai_client') as mock_client:
        # 设置模拟的OpenAI客户端
        mock_client.client = None  # 模拟未配置状态
        yield mock_client

class TestDifyChatAPI:
    """Dify 对话消息 API 测试类"""
    
    def test_blocking_mode_success(self, mock_api_key_validation, mock_openai_client):
        """测试阻塞模式成功响应"""
        request_data = {
            "query": "你好，请介绍一下人工智能",
            "user": "test_user_123",
            "response_mode": "blocking",
            "conversation_id": "test_conv_123"
        }
        
        response = client.post(
            "/dify_api/v1/chat-messages",
            json=request_data,
            headers={"Authorization": f"Bearer {TEST_API_KEY}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # 验证响应结构
        assert data["event"] == "message"
        assert "task_id" in data
        assert "message_id" in data
        assert data["conversation_id"] == "test_conv_123"
        assert data["mode"] == "chat"
        assert "answer" in data
        assert "metadata" in data
        assert "created_at" in data
        
        # 验证元数据结构
        metadata = data["metadata"]
        assert "usage" in metadata
        assert "retriever_resources" in metadata
        
        usage = metadata["usage"]
        assert "prompt_tokens" in usage
        assert "completion_tokens" in usage
        assert "total_tokens" in usage
        assert "total_price" in usage
        assert "currency" in usage
    
    def test_streaming_mode_success(self, mock_api_key_validation, mock_openai_client):
        """测试流式模式成功响应"""
        request_data = {
            "query": "请解释机器学习的基本概念",
            "user": "test_user_456",
            "response_mode": "streaming",
            "conversation_id": "test_conv_456"
        }
        
        response = client.post(
            "/dify_api/v1/chat-messages",
            json=request_data,
            headers={"Authorization": f"Bearer {TEST_API_KEY}"}
        )
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/event-stream; charset=utf-8"
        
        # 解析流式响应
        content = response.content.decode()
        lines = content.split('\n')
        
        events = []
        for line in lines:
            if line.startswith('data: '):
                try:
                    event_data = json.loads(line[6:])
                    events.append(event_data)
                except json.JSONDecodeError:
                    continue
        
        # 验证至少收到了消息事件和结束事件
        assert len(events) >= 2
        
        # 验证事件类型
        event_types = {event["event"] for event in events}
        assert "message" in event_types or "message_delta" in event_types
        assert "message_end" in event_types
        
        # 验证所有事件都有必要字段
        for event in events:
            assert "event" in event
            if event["event"] in ["message", "message_delta", "message_end"]:
                assert "conversation_id" in event
                assert "message_id" in event
                assert "created_at" in event
    
    def test_new_conversation_auto_creation(self, mock_api_key_validation, mock_openai_client):
        """测试新对话自动创建"""
        request_data = {
            "query": "你好",
            "user": "test_user_789",
            "response_mode": "blocking"
            # 注意：不提供 conversation_id，应该自动创建
        }
        
        response = client.post(
            "/dify_api/v1/chat-messages",
            json=request_data,
            headers={"Authorization": f"Bearer {TEST_API_KEY}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # 验证自动生成了conversation_id
        assert "conversation_id" in data
        assert data["conversation_id"] is not None
        assert len(data["conversation_id"]) > 0
    
    def test_invalid_api_key(self):
        """测试无效API Key"""
        with patch('app.core.security.verify_api_key_access') as mock_verify:
            mock_verify.side_effect = Exception("Invalid API key")
            
            request_data = {
                "query": "测试消息",
                "user": "test_user",
                "response_mode": "blocking"
            }
            
            response = client.post(
                "/dify_api/v1/chat-messages",
                json=request_data,
                headers={"Authorization": "Bearer invalid-key"}
            )
            
            assert response.status_code == 500  # 应该返回服务器错误
    
    def test_missing_required_fields(self, mock_api_key_validation):
        """测试缺少必填字段"""
        # 缺少query字段
        request_data = {
            "user": "test_user",
            "response_mode": "blocking"
        }
        
        response = client.post(
            "/dify_api/v1/chat-messages",
            json=request_data,
            headers={"Authorization": f"Bearer {TEST_API_KEY}"}
        )
        
        assert response.status_code == 422  # 验证错误
    
    def test_invalid_response_mode(self, mock_api_key_validation):
        """测试无效的响应模式"""
        request_data = {
            "query": "测试消息",
            "user": "test_user",
            "response_mode": "invalid_mode"
        }
        
        response = client.post(
            "/dify_api/v1/chat-messages",
            json=request_data,
            headers={"Authorization": f"Bearer {TEST_API_KEY}"}
        )
        
        assert response.status_code == 422  # 验证错误
    
    def test_with_inputs_and_files(self, mock_api_key_validation, mock_openai_client):
        """测试包含inputs和files的请求"""
        request_data = {
            "query": "处理这个文档",
            "user": "test_user",
            "response_mode": "blocking",
            "inputs": {
                "document_type": "pdf",
                "language": "zh-CN"
            },
            "files": [
                {
                    "type": "document",
                    "transfer_method": "remote_url",
                    "url": "https://example.com/document.pdf"
                }
            ],
            "auto_generate_name": False
        }
        
        response = client.post(
            "/dify_api/v1/chat-messages",
            json=request_data,
            headers={"Authorization": f"Bearer {TEST_API_KEY}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "answer" in data

    @patch('app.dify_api.v1.conversations.openai_client')
    def test_with_real_openai_client(self, mock_openai_client, mock_api_key_validation):
        """测试配置了真实OpenAI客户端的情况"""
        # 模拟真实的OpenAI响应
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "这是AI的回复"
        mock_client.chat.completions.create.return_value = mock_response
        
        mock_openai_client.client = mock_client
        
        request_data = {
            "query": "你好",
            "user": "test_user",
            "response_mode": "blocking"
        }
        
        response = client.post(
            "/dify_api/v1/chat-messages",
            json=request_data,
            headers={"Authorization": f"Bearer {TEST_API_KEY}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["answer"] == "这是AI的回复"
        
        # 验证OpenAI客户端被调用
        mock_client.chat.completions.create.assert_called_once()

if __name__ == "__main__":
    # 可以直接运行这个文件进行测试
    pytest.main([__file__, "-v"]) 