import { useXAgent } from '@ant-design/x';
import type { RequestFn } from '@ant-design/x/es/use-x-agent';
import type { SSEOutput } from '@ant-design/x/es/x-stream';
import http from '../utils/http/http';
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
 * 自定义后端Agent，适配VectorForge的Dify代理API
 * 复用现有的HTTP拦截器和错误处理机制
 */
export function useBackendAgent(config: BackendAgentConfig = {}) {
  const {
    baseURL = '/api/v1/dify',
    response_mode = 'streaming'
  } = config;

  // 自定义请求函数，适配VectorForge后端API
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
        user: 'frontend_user', // 用户信息由后端从JWT token中获取
        response_mode,
        inputs: info.inputs || {},
        conversation_id: info.conversation_id,
        auto_generate_name: true
      };

      if (response_mode === 'streaming') {
        // 流式响应：使用原生fetch + 复用axios的基础配置
        await handleStreamingRequest(
          requestBody, 
          baseURL, 
          abortController,
          onUpdate, 
          onSuccess, 
          onError
        );
      } else {
        // 阻塞式响应：使用现有的axios实例
        await handleBlockingRequest(
          requestBody,
          baseURL,
          abortController,
          onUpdate,
          onSuccess,
          onError
        );
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
 * 处理流式请求
 * 使用fetch实现SSE，手动添加认证头
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
    // 获取axios实例的基础配置
    const axiosConfig = http.defaults;
    const fullURL = `${axiosConfig.baseURL}${baseURL}/chat-messages`;
    
    // 手动构建headers，模拟axios的认证逻辑
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 手动添加Authorization头，复用认证逻辑
    const state = (window as any).__STORE__?.getState?.() || {};
    let token = state.authSlice?.token || sessionStorage.getItem('token');
    
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
        throw new Error('登录已过期，请重新登录');
      }
      throw new Error(`请求失败: ${response.status} ${response.statusText}`);
    }

    // 处理SSE流
    await processSSEStream(response, onUpdate, onSuccess, onError);

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
 * 处理阻塞式请求
 * 直接使用axios实例，自动享受所有拦截器功能
 */
async function handleBlockingRequest(
  requestBody: any,
  baseURL: string,
  abortController: AbortController,
  onUpdate: (chunk: SSEOutput) => void,
  onSuccess: (chunks: SSEOutput[]) => void,
  onError: (error: Error) => void
) {
  try {
    const response = await http.post(`${baseURL}/chat-messages`, requestBody, {
      signal: abortController.signal
    });

    // response已经被axios拦截器处理过，直接访问数据
    const responseData = response as any;

    // 转换为SSE格式
    const sseOutput: SSEOutput = {
      event: 'message',
      data: JSON.stringify({
        content: responseData.answer || responseData.data?.answer || responseData.content,
        role: 'assistant',
        conversation_id: responseData.conversation_id || responseData.data?.conversation_id,
        message_id: responseData.message_id || responseData.data?.message_id
      })
    };

    onUpdate(sseOutput);
    onSuccess([sseOutput]);

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
 * 处理SSE数据流
 */
async function processSSEStream(
  response: Response,
  onUpdate: (chunk: SSEOutput) => void,
  onSuccess: (chunks: SSEOutput[]) => void,
  onError: (error: Error) => void
) {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  const chunks: SSEOutput[] = [];

  if (!reader) {
    onError(new Error('无法读取响应流'));
    return;
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
            
            // 转换为SSE格式
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
  } catch (error) {
    onError(error instanceof Error ? error : new Error('读取流数据失败'));
  } finally {
    reader.releaseLock();
  }
}

/**
 * 专用的流式后端Agent
 */
export function useStreamingBackendAgent() {
  return useBackendAgent({ response_mode: 'streaming' });
}

/**
 * 专用的阻塞式后端Agent
 */
export function useBlockingBackendAgent() {
  return useBackendAgent({ response_mode: 'blocking' });
}

