# Dify 代理 API 使用指南

## 概述

VectorForge 提供了一个 Dify API 代理服务，允许前端通过 JWT 认证调用，后端自动转发请求到 Dify 服务。这种架构确保了：

1. **前端安全**：使用 JWT 认证，不暴露 Dify API Key
2. **后端中转**：API Key 安全存储在后端环境变量中
3. **完整记录**：所有对话记录保存在本地数据库
4. **透明代理**：完全兼容 Dify API 响应格式

## 架构流程

```
前端 (JWT Token) → 后端代理 (API Key) → Dify API
                      ↓
                 本地数据库存储
```

## API 端点

### 1. 发送对话消息
**POST** `/api/v1/dify/chat-messages`

#### 认证方式
使用 JWT Token 进行认证：
```
Authorization: Bearer <jwt_token>
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

#### 响应格式
响应格式与 Dify API 完全一致：

**流式响应 (streaming)**：
```
Content-Type: text/event-stream

data: {"event": "message_delta", "conversation_id": "conv_123", "message_id": "msg_456", "created_at": 1704067200, "delta": "你好"}

data: {"event": "message_end", "conversation_id": "conv_123", "message_id": "msg_456", "created_at": 1704067200, "metadata": {...}}
```

**阻塞式响应 (blocking)**：
```json
{
  "event": "message",
  "task_id": "3c90c3cc-0d44-4b50-8888-8dd25736052a",
  "id": "3c90c3cc-0d44-4b50-8888-8dd25736052a",
  "message_id": "3c90c3cc-0d44-4b50-8888-8dd25736052a",
  "conversation_id": "3c90c3cc-0d44-4b50-8888-8dd25736052a",
  "mode": "chat",
  "answer": "你好！我是AI助手...",
  "metadata": {
    "usage": {...},
    "retriever_resources": [...]
  },
  "created_at": 1704067200
}
```

### 2. 获取对话列表
**GET** `/api/v1/dify/conversations`

#### 查询参数
- `page`: 页码（默认: 1）
- `page_size`: 每页数量（默认: 20）

#### 响应
```json
{
  "conversations": [
    {
      "conversation_id": "conv_123456",
      "title": "关于AI的讨论",
      "user_id": "user_789",
      "message_count": 5,
      "created_at": "2024-01-01T10:00:00",
      "updated_at": "2024-01-01T10:30:00"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20
}
```

### 3. 获取对话详情
**GET** `/api/v1/dify/conversations/{conversation_id}`

#### 响应
```json
{
  "conversation_id": "conv_123456",
  "title": "关于AI的讨论",
  "user_id": "user_789",
  "created_at": "2024-01-01T10:00:00",
  "updated_at": "2024-01-01T10:30:00",
  "messages": [
    {
      "message_id": "msg_001",
      "role": "user",
      "content": "什么是人工智能？",
      "metadata": {...},
      "created_at": "2024-01-01T10:00:00"
    }
  ]
}
```

### 4. 删除对话
**DELETE** `/api/v1/dify/conversations/{conversation_id}`

#### 响应
```json
{
  "status": "success",
  "message": "Conversation deleted"
}
```

## 配置要求

### 环境变量
在 `.env` 文件中配置：

```env
# JWT 配置
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Dify API 配置
DIFY_API_URL=https://api.dify.ai/v1
DIFY_API_KEY=app-your-dify-api-key-here

# 数据库配置
DATABASE_URL=mysql+mysqlconnector://user:password@localhost:3306/vectorforge
```

## 前端集成示例

### JavaScript/TypeScript

#### 获取 JWT Token（先登录）
```javascript
async function login(username, password) {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  const token = data.access_token;
  
  // 保存 token
  localStorage.setItem('jwt_token', token);
  return token;
}
```

#### 流式对话
```javascript
async function sendStreamingMessage(query, conversationId = null) {
  const token = localStorage.getItem('jwt_token');
  
  const response = await fetch('/api/v1/dify/chat-messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
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
            appendToChat(data.delta);
            break;
          case 'message_end':
            // 消息结束
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

#### 阻塞式对话
```javascript
async function sendBlockingMessage(query, conversationId = null) {
  const token = localStorage.getItem('jwt_token');
  
  const response = await fetch('/api/v1/dify/chat-messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      query: query,
      user: 'user_123',
      response_mode: 'blocking',
      conversation_id: conversationId
    })
  });

  const data = await response.json();
  return data;
}
```

#### 获取对话列表
```javascript
async function getConversations(page = 1, pageSize = 20) {
  const token = localStorage.getItem('jwt_token');
  
  const response = await fetch(`/api/v1/dify/conversations?page=${page}&page_size=${pageSize}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
}
```

### React Hook 示例

```typescript
import { useState, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const useDifyChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const sendMessage = useCallback(async (query: string) => {
    setIsLoading(true);
    
    // 添加用户消息
    const userMessage: Message = {
      role: 'user',
      content: query,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch('/api/v1/dify/chat-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query,
          user: 'user_123',
          response_mode: 'streaming',
          conversation_id: conversationId
        })
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiMessage = '';

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              
              if (data.event === 'message_delta') {
                aiMessage += data.delta;
                // 实时更新AI消息
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  
                  if (lastMessage && lastMessage.role === 'assistant') {
                    lastMessage.content = aiMessage;
                  } else {
                    newMessages.push({
                      role: 'assistant',
                      content: aiMessage,
                      timestamp: new Date().toISOString()
                    });
                  }
                  
                  return newMessages;
                });
              } else if (data.event === 'message_end') {
                setConversationId(data.conversation_id);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('发送消息失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  return {
    messages,
    isLoading,
    conversationId,
    sendMessage
  };
};
```

## 错误处理

### 常见错误码
- **401 Unauthorized**: JWT Token 无效或过期
- **403 Forbidden**: 权限不足
- **404 Not Found**: 对话不存在
- **500 Internal Server Error**: 服务器错误或 Dify API 调用失败

### 错误响应格式
```json
{
  "detail": "错误描述信息"
}
```

### 流式响应中的错误
```
data: {"event": "error", "error": "错误描述信息"}
```

## 安全注意事项

1. **JWT Token 管理**：
   - Token 应存储在安全位置（如 httpOnly cookie）
   - 实现 Token 自动刷新机制
   - 处理 Token 过期情况

2. **API Key 安全**：
   - Dify API Key 只存储在后端环境变量中
   - 不要在前端代码中暴露任何 API Key
   - 定期轮换 API Key

3. **请求验证**：
   - 后端验证所有请求参数
   - 限制请求频率和大小
   - 记录所有 API 调用日志

## 优势

1. **安全性**：API Key 不暴露给前端
2. **可控性**：所有请求经过后端验证和记录
3. **一致性**：统一的认证机制
4. **可扩展性**：可以添加缓存、限流等功能
5. **数据完整性**：所有对话数据保存在本地数据库

这个代理架构为前端提供了安全、可靠的 Dify API 访问方式，同时保持了完整的功能兼容性。 