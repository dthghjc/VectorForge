import { useXAgent } from '@ant-design/x';
import type { RequestFn } from '@ant-design/x/es/use-x-agent';
import type { SSEOutput } from '@ant-design/x/es/x-stream';
import { store } from '../store';

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
 * 支持JWT认证和流式响应
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
      // 获取JWT Token
      let token = store.getState().authSlice?.token;
      if (!token) {
        token = sessionStorage.getItem('token');
      }

      if (!token) {
        throw new Error('未登录，请先登录');
      }

      // 构建请求体
      const requestBody = {
        query: info.message?.content || '',
        user: store.getState().authSlice?.username || 'unknown',
        response_mode,
        inputs: info.inputs || {},
        conversation_id: info.conversation_id,
        auto_generate_name: true
      };

      // 发送请求
      const response = await fetch(`${baseURL}/chat-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
        signal: abortController.signal
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status} ${response.statusText}`);
      }

      if (response_mode === 'streaming') {
        // 处理流式响应
        await handleStreamingResponse(response, onUpdate, onSuccess, onError);
      } else {
        // 处理阻塞式响应
        const result = await response.json();
        const sseOutput: SSEOutput = {
          event: 'message',
          data: JSON.stringify({
            content: result.answer,
            role: 'assistant',
            conversation_id: result.conversation_id,
            message_id: result.message_id
          })
        };
        onUpdate(sseOutput);
        onSuccess([sseOutput]);
      }

    } catch (error) {
      if (error instanceof Error) {
        onError(error);
      } else {
        onError(new Error('未知错误'));
      }
    }
  };

  // 处理流式响应
  async function handleStreamingResponse(
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

  // 使用useXAgent，传入自定义请求函数
  return useXAgent<BackendMessage, BackendRequestInput, SSEOutput>({
    request: customRequest
  });
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

