# Dify API 使用指南

## 概述

VectorForge 提供了专门为 Dify 设计的 API 接口，用于上传和管理对话历史。这些 API 使用 API Key 认证方式，无需 JWT Token。

## 认证方式

### API Key 认证

在请求头中添加 `X-API-Key`：

```bash
curl -H "X-API-Key: vf-your-api-key-here" \
     -H "Content-Type: application/json" \
     http://localhost:8000/v1/dify/conversations
```

### 配置 API Key

在 `.env` 文件中配置：

```env
DIFY_API_KEYS=vf-your-api-key-1,vf-your-api-key-2,vf-another-key
```

## API 端点

### 1. 创建对话并批量上传消息

**POST** `/v1/dify/conversations`

用于一次性上传完整的对话历史。

#### 请求体

```json
{
  "conversation_id": "conv_123456",
  "user_id": "user_789",
  "title": "关于AI的讨论",
  "messages": [
    {
      "role": "user",
      "content": "什么是人工智能？",
      "metadata": {
        "timestamp": "2024-01-01T10:00:00Z",
        "source": "dify"
      }
    },
    {
      "role": "assistant", 
      "content": "人工智能是计算机科学的一个分支...",
      "metadata": {
        "model": "gpt-4",
        "tokens": 150
      }
    }
  ]
}
```

#### 响应

```json
{
  "conversation_id": "conv_123456",
  "title": "关于AI的讨论",
  "message_count": 2,
  "created_at": "2024-01-01T10:00:00Z",
  "status": "success"
}
```

### 2. 向对话添加单条消息

**POST** `/v1/dify/conversations/{conversation_id}/messages`

向已存在的对话添加新消息。

#### 请求体

```json
{
  "conversation_id": "conv_123456",
  "role": "user",
  "content": "请详细解释一下机器学习",
  "user_id": "user_789",
  "metadata": {
    "timestamp": "2024-01-01T10:05:00Z"
  }
}
```

#### 响应

```json
{
  "message_id": "msg_abc123",
  "conversation_id": "conv_123456",
  "role": "user",
  "content": "请详细解释一下机器学习",
  "created_at": "2024-01-01T10:05:00Z",
  "status": "success"
}
```

### 3. 获取对话列表

**GET** `/v1/dify/conversations`

#### 查询参数

- `page`: 页码（默认: 1）
- `page_size`: 每页数量（默认: 20）
- `user_id`: 用户ID过滤（可选）

#### 响应

```json
{
  "conversations": [
    {
      "conversation_id": "conv_123456",
      "title": "关于AI的讨论",
      "user_id": "user_789",
      "message_count": 5,
      "created_at": "2024-01-01T10:00:00Z",
      "updated_at": "2024-01-01T10:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20
}
```

### 4. 获取对话详情

**GET** `/v1/dify/conversations/{conversation_id}`

#### 响应

```json
{
  "conversation_id": "conv_123456",
  "title": "关于AI的讨论",
  "user_id": "user_789",
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T10:30:00Z",
  "messages": [
    {
      "message_id": "msg_001",
      "role": "user",
      "content": "什么是人工智能？",
      "metadata": {
        "timestamp": "2024-01-01T10:00:00Z"
      },
      "created_at": "2024-01-01T10:00:00Z"
    },
    {
      "message_id": "msg_002",
      "role": "assistant",
      "content": "人工智能是计算机科学的一个分支...",
      "metadata": {
        "model": "gpt-4"
      },
      "created_at": "2024-01-01T10:01:00Z"
    }
  ]
}
```

### 5. 删除对话

**DELETE** `/v1/dify/conversations/{conversation_id}`

#### 响应

```json
{
  "status": "success",
  "message": "Conversation deleted"
}
```

## 错误处理

### 错误响应格式

```json
{
  "detail": "Invalid API key"
}
```

### 常见错误码

- **401 Unauthorized**: API Key 无效或缺失
- **404 Not Found**: 对话或消息不存在
- **409 Conflict**: 对话ID已存在
- **400 Bad Request**: 请求参数错误

## 使用示例

### Python 示例

```python
import requests

API_KEY = "vf-your-api-key-here"
BASE_URL = "http://localhost:8000/v1/dify"

headers = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

# 创建对话
conversation_data = {
    "conversation_id": "conv_example_001",
    "title": "测试对话",
    "messages": [
        {
            "role": "user",
            "content": "你好",
            "metadata": {"source": "dify"}
        },
        {
            "role": "assistant",
            "content": "你好！有什么可以帮助你的吗？",
            "metadata": {"model": "gpt-4"}
        }
    ]
}

response = requests.post(
    f"{BASE_URL}/conversations",
    json=conversation_data,
    headers=headers
)

print(response.json())
```

### cURL 示例

```bash
# 创建对话
curl -X POST "http://localhost:8000/v1/dify/conversations" \
  -H "X-API-Key: vf-your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "conv_curl_001",
    "title": "cURL 测试",
    "messages": [
      {
        "role": "user",
        "content": "测试消息",
        "metadata": {"source": "curl"}
      }
    ]
  }'

# 获取对话列表
curl -X GET "http://localhost:8000/v1/dify/conversations?page=1&page_size=10" \
  -H "X-API-Key: vf-your-api-key-here"

# 添加消息
curl -X POST "http://localhost:8000/v1/dify/conversations/conv_curl_001/messages" \
  -H "X-API-Key: vf-your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "conv_curl_001",
    "role": "assistant",
    "content": "这是一条新消息",
    "metadata": {"model": "gpt-4"}
  }'
```

## 注意事项

1. **API Key 安全**: 请妥善保管 API Key，不要在客户端代码中暴露
2. **对话ID唯一性**: 每个对话ID必须唯一，重复创建会返回409错误
3. **消息角色**: 支持的角色包括 `user`、`assistant`、`system`
4. **批量操作**: 建议使用批量创建接口一次性上传完整对话，性能更好
5. **元数据**: metadata 字段可以存储任意JSON数据，用于扩展信息

## 集成到 Dify

在 Dify 中配置 Webhook 或使用自定义工具调用这些 API，实现对话历史的自动同步。

```python
# Dify 工具示例
def sync_conversation_to_vectorforge(conversation_id, messages):
    """同步对话到 VectorForge"""
    api_key = "vf-your-api-key"
    url = "http://vectorforge-api:8000/v1/dify/conversations"
    
    payload = {
        "conversation_id": conversation_id,
        "title": f"Dify Conversation {conversation_id}",
        "messages": messages
    }
    
    headers = {
        "X-API-Key": api_key,
        "Content-Type": "application/json"
    }
    
    response = requests.post(url, json=payload, headers=headers)
    return response.json()
``` 