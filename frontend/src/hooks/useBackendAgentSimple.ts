import { useXAgent } from '@ant-design/x';
import type { RequestFn } from '@ant-design/x/es/use-x-agent';
import type { SSEOutput } from '@ant-design/x/es/x-stream';
import { post } from '../utils/http/request';
import { getErrorMessage } from '../utils/errorHandler';

interface BackendMessage {
  role: string;
  content: string;
}

interface BackendRequestInput {
  messages?: BackendMessage[];
  message?: BackendMessage;
  conversation_id?: string;
  inputs?: Record<string, any>;
  response_mode?: 'streaming' | 'blocking';
}

interface BackendAgentConfig {
  baseURL?: string;
  response_mode?: 'streaming' | 'blocking';
}

/**
 * 简化版后端Agent
 * 完全基于现有的HTTP工具和拦截器
 */
export function useBackendAgentSimple(config: BackendAgentConfig = {}) {
  const {
    baseURL = '/api/v1/dify',
    response_mode = 'streaming'
  } = config;

  const customRequest: RequestFn<BackendMessage, BackendRequestInput, SSEOutput> = async (
    info: BackendRequestInput,
    { onUpdate, onSuccess, onError, onStream }: {
      onUpdate: (chunk: SSEOutput) => void;
      onSuccess: (chunks: SSEOutput[]) => void;
      onError: (error: Error) => void;
      onStream?: (abortController: AbortController) => void;
    }
  ) => {
    const abortController = new AbortController();
    onStream?.(abortController);

    try {
      // 构建请求体
      const requestBody = {
        query: info.message?.content || '',
        user: 'frontend_user',
        response_mode,
        inputs: info.inputs || {},
        conversation_id: info.conversation_id,
        auto_generate_name: true
      };

      if (response_mode === 'streaming') {
        // 流式响应：使用fetch + 手动认证
        await handleStreamingRequest(requestBody, baseURL, abortController, onUpdate, onSuccess, onError);
      } else {
        // 阻塞式响应：使用现有的post方法
        const response = await post(`${baseURL}/chat-messages`, requestBody);
        
        // response 已经被 axios 拦截器处理过，根据 ApiResponse 类型获取数据
        const responseData = response.data || response;
        
        // 转换为SSE格式
        const sseOutput: SSEOutput = {
          event: 'message',
          data: JSON.stringify({
            content: responseData.answer || responseData.content || '暂无回复',
            role: 'assistant',
            conversation_id: responseData.conversation_id,
            message_id: responseData.message_id
          })
        };

        onUpdate(sseOutput);
        onSuccess([sseOutput]);
      }

    } catch (error) {
      const errorMessage = getErrorMessage(error);
      onError(new Error(errorMessage));
    }
  };

  return useXAgent<BackendMessage, BackendRequestInput, SSEOutput>({
    request: customRequest
  });
}

/**
 * 处理流式请求 - 简化版
 */
async function handleStreamingRequest(
  requestBody: any,
  baseURL: string,
  abortController: AbortController,
  onUpdate: (chunk: SSEOutput) => void,
  onSuccess: (chunks: SSEOutput[]) => void,
  onError: (error: Error) => void
) {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
    const fullURL = `${API_BASE_URL}${baseURL}/chat-messages`;
    
    // 手动添加认证头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 获取token
    const token = sessionStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(fullURL, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: abortController.signal
    });

    if (!response.ok) {
      if (response.status === 401) {
        // 触发登出逻辑
        sessionStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('登录已过期，请重新登录');
      }
      throw new Error(`请求失败: ${response.status}`);
    }

    // 处理SSE流
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    const chunks: SSEOutput[] = [];

    if (!reader) {
      throw new Error('无法读取响应流');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onSuccess(chunks);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6));
              
              const sseOutput: SSEOutput = {
                event: eventData.event,
                data: JSON.stringify(eventData)
              };

              chunks.push(sseOutput);
              onUpdate(sseOutput);

            } catch (parseError) {
              console.warn('解析SSE数据失败:', parseError);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      onError(new Error('请求已取消'));
    } else {
      const errorMessage = getErrorMessage(error);
      onError(new Error(errorMessage));
    }
  }
}

/**
 * 专用的阻塞式后端Agent（推荐）
 */
export function useBlockingBackendAgent() {
  return useBackendAgentSimple({ response_mode: 'blocking' });
}

/**
 * 专用的流式后端Agent
 */
export function useStreamingBackendAgent() {
  return useBackendAgentSimple({ response_mode: 'streaming' });
} 