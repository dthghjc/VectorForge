# VectorForge 自定义 Backend Agent 使用指南

## 概述

`useBackendAgent` 是为 VectorForge 项目专门设计的自定义 Agent Hook，它基于 Ant Design X 的 `useXAgent`，但完全适配了我们的后端 API 架构，**并复用了现有的完整HTTP拦截器体系**。

## 🎯 **复用现有HTTP工具的优势**

你的项目已经有完整的HTTP拦截器体系（`/utils/http/`），我们的自定义Agent充分利用了这些现有工具：

### ✅ **完整复用现有基础设施**
- **JWT认证**: 复用 `http.ts` 中的请求拦截器逻辑
- **错误处理**: 复用 `errorHandler.ts` 中的统一错误处理
- **响应拦截**: 复用现有的响应拦截器
- **API封装**: 复用 `request.ts` 中的 `post()` 方法

### 📋 **两种实现方案**

#### 1. **简化版 (`useBackendAgentSimple`) - 推荐**
```typescript
import { useStreamingBackendAgent } from '../hooks/useBackendAgentSimple';

// 阻塞式（推荐，更稳定）
const [agent] = useBlockingBackendAgent();

// 流式（SSE支持）  
const [agent] = useStreamingBackendAgent();
```

**特点：**
- ✅ 阻塞式请求完全复用 `post()` 方法和所有拦截器
- ✅ 流式请求使用 `fetch` + 手动认证头
- ✅ 代码简洁，维护性好
- ✅ 错误处理统一使用 `getErrorMessage()`

#### 2. **完整版 (`useBackendAgent`) - 高级**
```typescript
import { useBackendAgent } from '../hooks/useBackendAgent';

const [agent] = useBackendAgent({
  baseURL: '/api/v1/dify',
  response_mode: 'streaming'
});
```

**特点：**
- ✅ 更完整的拦截器集成
- ✅ 支持更多自定义配置
- ⚠️ 代码稍复杂

## 核心特性

- ✅ **JWT 认证**: 自动从现有认证体系获取Token
- ✅ **流式响应**: 支持 Server-Sent Events (SSE) 实时数据流  
- ✅ **阻塞式响应**: 复用现有 axios 配置
- ✅ **错误处理**: 完全复用现有错误处理机制
- ✅ **请求取消**: 支持 AbortController 中断请求
- ✅ **类型安全**: 完整的 TypeScript 类型支持

## API 对比

### ❌ 原始 useXAgent (直连第三方 API)
```typescript
// 直接调用 DeepSeek API，不安全，暴露 API Key
const [agent] = useXAgent<BubbleDataType>({
  baseURL: 'https://api.deepseek.com/chat/completions',
  model: 'deepseek-chat',
  dangerouslyApiKey: import.meta.env.VITE_DEEPSEEK_API_KEY, // ❌ 前端暴露密钥
});
```

### ✅ 自定义 useBackendAgent (安全代理 + 复用现有工具)
```typescript
// 通过 VectorForge 后端代理，复用现有HTTP拦截器
import { useStreamingBackendAgent } from '../hooks/useBackendAgentSimple';

const [agent] = useStreamingBackendAgent(); // ✅ 安全 + 复用基础设施
```

## 架构流程

```mermaid
graph TD
    A[useBackendAgent] --> B{请求模式}
    B -->|阻塞式| C[复用 post() 方法]
    C --> D[axios 请求拦截器]
    D --> E[添加 JWT Token]
    E --> F[发送到后端 API]
    F --> G[axios 响应拦截器]
    G --> H[统一错误处理]
    H --> I[返回处理后数据]
    
    B -->|流式| J[fetch + 手动认证]
    J --> K[添加 JWT Token]
    K --> F
    F --> L[SSE 流式数据]
    L --> M[实时UI更新]
    
    style C fill:#e1f5fe
    style D fill:#e8f5e8
    style G fill:#e8f5e8
    style H fill:#fff3e0
```

## 使用方法

### 1. 基本用法（复用现有HTTP工具）

```typescript
import { useStreamingBackendAgent } from '../hooks/useBackendAgentSimple';
import { useXChat } from '@ant-design/x';

function ChatComponent() {
  // 创建后端 Agent - 自动复用所有HTTP拦截器
  const [agent] = useStreamingBackendAgent();
  
  // 获取请求状态
  const loading = agent.isRequesting();
  
  // 配置 XChat
  const { onRequest, messages, setMessages } = useXChat({
    agent,
    // 复用现有的错误处理机制
    requestFallback: (_, { error }) => {
      if (error.name === 'AbortError') {
        return { content: '请求已取消', role: 'assistant' };
      }
      
      // 这里的错误已经被 getErrorMessage() 处理过
      return {
        content: `请求失败：${error.message}`,
        role: 'assistant',
      };
    },
    transformMessage: (info) => {
      const { originMessage, chunk } = info || {};
      let currentContent = '';
      
      try {
        if (chunk?.data && !chunk?.data.includes('DONE')) {
          const eventData = JSON.parse(chunk?.data);
          
          // 处理 VectorForge 后端的事件格式
          if (eventData.event === 'message_delta' && eventData.delta) {
            currentContent = eventData.delta;
          } else if (eventData.event === 'workflow_finished' && eventData.data?.outputs?.answer) {
            currentContent = eventData.data.outputs.answer;
          }
        }
      } catch (error) {
        console.error('解析消息失败:', error);
      }

      return {
        content: `${originMessage?.content || ''}${currentContent}`,
        role: 'assistant',
      };
    },
  });

  // 发送消息
  const handleSubmit = (message: string) => {
    onRequest({
      stream: true,
      message: { role: 'user', content: message },
    });
  };

  return (
    // UI 组件...
  );
}
```

### 2. 高级配置

```typescript
import { useBackendAgent } from '../hooks/useBackendAgent';

// 自定义配置
const [agent] = useBackendAgent({
  baseURL: '/api/v1/dify',           // 自定义 API 基础路径
  response_mode: 'streaming',        // 'streaming' | 'blocking'
});

// 或使用便捷方法
const [streamingAgent] = useStreamingBackendAgent();  // 流式
const [blockingAgent] = useBlockingBackendAgent();    // 阻塞式（推荐）
```

## 🔧 **现有HTTP工具集成详情**

### 1. **JWT认证集成**
```typescript
// 复用现有的认证逻辑 (utils/http/http.ts)
// ✅ 自动从 Redux Store 获取 token
// ✅ 自动从 sessionStorage 获取 token
// ✅ 自动处理 401 错误和登出
```

### 2. **错误处理集成**
```typescript
// 复用现有的错误处理 (utils/errorHandler.ts)
// ✅ 统一的错误消息格式化
// ✅ HTTP状态码错误处理
// ✅ 网络错误处理
```

### 3. **请求拦截器集成**
```typescript
// 复用现有的请求拦截器
// ✅ 自动添加 Authorization 头
// ✅ 白名单URL处理
// ✅ Token刷新机制
```

### 4. **响应拦截器集成** 
```typescript
// 复用现有的响应拦截器
// ✅ 业务状态码检查
// ✅ 自动解包响应数据
// ✅ 401错误自动处理
```

## 与原版 useXAgent 的差异

| 特性 | 原版 useXAgent | 自定义 useBackendAgent |
|------|---------------|----------------------|
| **安全性** | ❌ 前端暴露 API Key | ✅ 后端安全代理 |
| **认证** | ❌ 无认证机制 | ✅ 复用完整JWT体系 |
| **数据存储** | ❌ 无存储 | ✅ 自动保存到数据库 |
| **错误处理** | ⚠️ 基础错误处理 | ✅ 复用统一错误处理 |
| **可扩展性** | ❌ 固定第三方 API | ✅ 基于现有HTTP工具 |
| **维护性** | ❌ 独立维护 | ✅ 复用现有基础设施 |

## 最佳实践

### 1. 优先使用简化版
```typescript
// ✅ 推荐：使用简化版，完全复用现有工具
import { useStreamingBackendAgent } from '../hooks/useBackendAgentSimple';

// ❌ 避免：不必要的复杂实现
```

### 2. 选择合适的响应模式
```typescript
// ✅ 推荐：阻塞式（更稳定，复用所有拦截器）
const [agent] = useBlockingBackendAgent();

// ⚠️ 流式：功能更丰富，但实现稍复杂
const [agent] = useStreamingBackendAgent();
```

### 3. 复用错误处理
```typescript
// ✅ 统一错误处理，无需重复实现
import { getErrorMessage } from '../utils/errorHandler';

// 错误已经被 getErrorMessage() 标准化处理
```

## 故障排除

### 常见问题

1. **"未登录，请先登录"**
   - ✅ 自动使用现有认证检查逻辑
   - ✅ 自动触发现有登出流程

2. **"请求失败: 401"**
   - ✅ 自动清除token并跳转登录页
   - ✅ 复用现有的401处理逻辑

3. **流式数据解析失败**
   - 检查后端 SSE 格式
   - 确认事件数据结构

### 调试技巧

```typescript
// 复用现有的HTTP调试
// 所有axios请求都会在浏览器Network面板显示
// 错误会被统一的错误处理器捕获和记录
```

## 总结

自定义的 `useBackendAgent` 最大的优势是**完全复用了你现有的HTTP基础设施**：

- 🔧 **零重复工作** - 复用所有现有拦截器和错误处理
- 🔒 **同样安全** - 使用相同的JWT认证机制  
- 🚀 **更易维护** - 基于现有工具，减少维护负担
- 📊 **统一标准** - 遵循项目现有的HTTP处理规范

它不是重新发明轮子，而是**智能复用现有轮子**，让Ant Design X与你的后端API完美集成。 