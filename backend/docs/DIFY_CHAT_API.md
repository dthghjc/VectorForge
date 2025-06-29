# Dify 对话消息 API 使用指南

## 概述

VectorForge 提供了完全兼容 Dify API 规范的对话消息接口，支持流式(streaming)和阻塞式(blocking)两种响应模式。这个API作为中转层，可以让前端应用直接调用，而无需直接访问 Dify 服务。

## API 端点

### 发送对话消息
**POST** `/dify_api/v1/chat-messages`

这是主要的对话消息接口，完全兼容 Dify API 规范。

#### 认证
使用 `Authorization` 头部进行 API Key 认证：
```
Authorization: Bearer your-api-key-here
```

#### 请求体
```json
{
  "query": "你好，我想了解人工智能",
  "user": "user_123",
  "inputs": {},
  "response_mode": "streaming",
  "conversation_id": "conv_abc123",
  "files": [],
  "auto_generate_name": true
}
```

**参数说明：**
- `query` (string, 必填): 用户输入的问题或消息
- `user` (string, 必填): 用户标识，应用内唯一
- `inputs` (object, 可选): App 定义的变量值，默认为空对象
- `response_mode` (string, 可选): 响应模式，支持 "streaming" 或 "blocking"，默认 "streaming"
- `conversation_id` (string, 可选): 会话ID，用于继续之前的对话，不提供则自动生成
- `files` (array, 可选): 文件列表，当模型支持 Vision 能力时使用
- `auto_generate_name` (boolean, 可选): 是否自动生成会话标题，默认 true

## 响应格式

### 流式响应 (streaming)
当 `response_mode` 为 "streaming" 时，返回 Server-Sent Events (SSE) 流：

```
Content-Type: text/event-stream

data: {"event": "message_delta", "conversation_id": "conv_123", "message_id": "msg_456", "created_at": 1704067200, "delta": "你好"}

data: {"event": "message_delta", "conversation_id": "conv_123", "message_id": "msg_456", "created_at": 1704067200, "delta": "！我是"}

data: {"event": "message_delta", "conversation_id": "conv_123", "message_id": "msg_456", "created_at": 1704067200, "delta": "AI助手"}

data: {"event": "message_end", "conversation_id": "conv_123", "message_id": "msg_456", "created_at": 1704067200, "metadata": {...}}
```

**事件类型：**
- `message`: 完整消息事件（用于非流式内容）
- `message_delta`: 消息增量事件（流式内容的每个片段）
- `message_end`: 消息结束事件（包含完整的元数据）
- `error`: 错误事件

### 阻塞式响应 (blocking)
当 `response_mode` 为 "blocking" 时，返回完整的 JSON 响应：

```json
{
  "event": "message",
  "task_id": "3c90c3cc-0d44-4b50-8888-8dd25736052a",
  "id": "3c90c3cc-0d44-4b50-8888-8dd25736052a",
  "message_id": "3c90c3cc-0d44-4b50-8888-8dd25736052a",
  "conversation_id": "3c90c3cc-0d44-4b50-8888-8dd25736052a",
  "mode": "chat",
  "answer": "你好！我是AI助手，很高兴为您介绍人工智能...",
  "metadata": {
    "usage": {
      "prompt_tokens": 15,
      "prompt_unit_price": "0.0001",
      "prompt_price_unit": "USD",
      "prompt_price": "0.0015",
      "completion_tokens": 150,
      "completion_unit_price": "0.0002",
      "completion_price_unit": "USD",
      "completion_price": "0.03",
      "total_tokens": 165,
      "total_price": "0.0315",
      "currency": "USD",
      "latency": 800.0
    },
    "retriever_resources": []
  },
  "created_at": 1704067200
}
```

## 使用示例

### JavaScript/TypeScript 示例

#### 流式调用
```javascript
async function sendStreamingMessage(query, conversationId = null) {
  const response = await fetch('/dify_api/v1/chat-messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer your-api-key-here'
    },
    body: JSON.stringify({
      query: query,
      user: 'user_123',
      response_mode: 'streaming',
      conversation_id: conversationId
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        
        switch (data.event) {
          case 'message_delta':
            // 处理增量内容
            console.log('Delta:', data.delta);
            break;
          case 'message_end':
            // 消息结束，处理元数据
            console.log('Message completed:', data.metadata);
            break;
          case 'error':
            console.error('Error:', data.error);
            break;
        }
      }
    }
  }
}
```

#### 阻塞式调用
```javascript
async function sendBlockingMessage(query, conversationId = null) {
  const response = await fetch('/dify_api/v1/chat-messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer your-api-key-here'
    },
    body: JSON.stringify({
      query: query,
      user: 'user_123',
      response_mode: 'blocking',
      conversation_id: conversationId
    })
  });

  const data = await response.json();
  console.log('Complete answer:', data.answer);
  console.log('Usage:', data.metadata.usage);
  
  return data;
}
```

### Python 示例

#### 流式调用
```python
import requests
import json

def send_streaming_message(query, conversation_id=None):
    url = "http://localhost:8009/dify_api/v1/chat-messages"
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer your-api-key-here"
    }
    data = {
        "query": query,
        "user": "user_123",
        "response_mode": "streaming",
        "conversation_id": conversation_id
    }
    
    response = requests.post(url, headers=headers, json=data, stream=True)
    
    for line in response.iter_lines():
        if line:
            line_str = line.decode('utf-8')
            if line_str.startswith('data: '):
                event_data = json.loads(line_str[6:])
                
                if event_data['event'] == 'message_delta':
                    print(event_data['delta'], end='', flush=True)
                elif event_data['event'] == 'message_end':
                    print(f"\n\nUsage: {event_data['metadata']['usage']}")
                elif event_data['event'] == 'error':
                    print(f"Error: {event_data['error']}")
```

#### 阻塞式调用
```python
def send_blocking_message(query, conversation_id=None):
    url = "http://localhost:8009/dify_api/v1/chat-messages"
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer your-api-key-here"
    }
    data = {
        "query": query,
        "user": "user_123",
        "response_mode": "blocking",
        "conversation_id": conversation_id
    }
    
    response = requests.post(url, headers=headers, json=data)
    result = response.json()
    
    print(f"Answer: {result['answer']}")
    print(f"Usage: {result['metadata']['usage']}")
    
    return result
```

### cURL 示例

#### 流式请求
```bash
curl -X POST "http://localhost:8009/dify_api/v1/chat-messages" \
  -H "Authorization: Bearer your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "解释一下机器学习的基本概念",
    "user": "user_123",
    "response_mode": "streaming"
  }' \
  --no-buffer
```

#### 阻塞式请求
```bash
curl -X POST "http://localhost:8009/dify_api/v1/chat-messages" \
  -H "Authorization: Bearer your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "解释一下机器学习的基本概念",
    "user": "user_123",
    "response_mode": "blocking"
  }'
```

## 错误处理

API 会返回标准的 HTTP 状态码：

- **200**: 请求成功
- **400**: 请求参数错误
- **401**: 认证失败（API Key 无效）
- **404**: 资源不存在
- **500**: 服务器内部错误

错误响应格式：
```json
{
  "detail": "错误描述信息"
}
```

对于流式响应中的错误：
```
data: {"event": "error", "error": "错误描述信息"}
```

## 配置要求

### 环境变量
在 `.env` 文件中配置以下变量：

```env
# Dify API Keys (多个key用逗号分隔)
DIFY_API_KEYS=your-api-key-1,your-api-key-2

# OpenAI 配置 (用于实际的AI响应)
OPENAI_API_KEY=your-openai-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7
```

### 注意事项

1. **API Key 安全**: 请妥善保管 API Key，不要在客户端代码中暴露
2. **会话管理**: 如果不提供 `conversation_id`，系统会自动创建新会话
3. **用户标识**: `user` 参数用于区分不同用户，建议使用唯一标识
4. **响应模式**: 推荐使用流式模式获得更好的用户体验
5. **错误重试**: 建议实现适当的错误重试机制
6. **Token 限制**: 注意 OpenAI API 的 token 限制，可通过 `OPENAI_MAX_TOKENS` 配置

## 与前端集成

这个 API 设计为可以直接被前端应用调用，无需额外的代理层。前端可以：

1. 直接调用 `/dify_api/v1/chat-messages` 端点
2. 使用流式模式实现打字机效果
3. 通过 `conversation_id` 维护对话上下文
4. 处理各种事件类型实现丰富的用户界面

这个中转式API既保持了与 Dify 的兼容性，又提供了灵活的集成选项。 