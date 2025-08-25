/**
 * 标注系统 API 接口封装
 * 遵循 Task → TaskChat → Chat + Messages 数据流
 */

import { get, post } from '../utils/http/request';
import type {
  Task,
  TaskChatListItem,
  TaskChatDetail,
  ChatAnnotationSubmit,

  TaskChat
} from '../types/annotation';

// ============= 任务相关 API =============

/**
 * 获取任务列表
 */
export interface GetTasksParams {
  status?: string;
  priority?: string;
  assigned_to_id?: string;
  created_by_id?: string;
  overdue_only?: boolean;
  skip?: number;
  limit?: number;
}

export const getTasks = (params: GetTasksParams = {}): Promise<Task[]> => {
  return get('/api/v1/tasks/', params).then(res => {
    // 如果 res 本身就是数组，直接返回
    if (Array.isArray(res)) {
      return res;
    }
    // 否则返回 res.data
    return res.data;
  });
};

/**
 * 获取任务详情
 */
export const getTaskDetail = (taskId: string): Promise<Task> => {
  return get(`/api/v1/tasks/${taskId}`).then(res => {
    if (Array.isArray(res)) {
      return res;
    }
    return res.data || res;
  });
};

// ============= TaskChat 相关 API =============

/**
 * 获取任务下的对话列表
 */
export interface GetTaskChatsParams {
  annotation_status?: 'pending' | 'completed' | 'skipped';
  page?: number;
  page_size?: number;
}

/**
 * 分页响应结果
 */
export interface TaskChatsPaginatedResponse {
  items: TaskChatListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export const getTaskChats = (
  taskId: string, 
  params: GetTaskChatsParams = {}
): Promise<TaskChatsPaginatedResponse> => {
  return get(`/api/v1/tasks/${taskId}/chats`, params).then(res => {
    // 新的分页API返回对象结构
    if ((res as any).items) {
      return res as unknown as TaskChatsPaginatedResponse;
    }
    // 兼容旧的数组格式
    if (Array.isArray(res)) {
      return {
        items: res,
        total: res.length,
        page: 1,
        page_size: res.length,
        total_pages: 1
      };
    }
    // 返回 res.data
    return res.data;
  });
};

/**
 * 获取 TaskChat 详情（用于标注工作区）
 * 注意：这个接口需要后端新增，返回完整的 TaskChatDetail 数据
 */
export const getTaskChatDetail = (
  taskId: string, 
  taskChatId: string
): Promise<TaskChatDetail> => {
  return get(`/api/v1/tasks/${taskId}/chats/${taskChatId}/detail`).then(res => {
    if (Array.isArray(res)) {
      return res;
    }
    return res.data || res;
  });
};

/**
 * 标注对话（Chat 级别）
 */
export const annotateChat = (
  taskId: string,
  taskChatId: string,
  annotationData: ChatAnnotationSubmit
): Promise<TaskChat> => {
  return post(`/api/v1/tasks/${taskId}/chats/${taskChatId}/annotate`, annotationData).then(res => res.data);
};



// ============= 批量操作 API =============

/**
 * 批量标注对话
 */
export const batchAnnotateChats = (
  taskId: string,
  annotations: Array<{
    task_chat_id: string;
    annotation_data: ChatAnnotationSubmit;
  }>
): Promise<TaskChat[]> => {
  return post(`/api/v1/tasks/${taskId}/chats/batch-annotate`, { annotations }).then(res => res.data);
};



// ============= 统计和搜索 API =============

/**
 * 获取标注员的任务统计
 */
export interface AnnotatorStats {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  total_chats: number;
  completed_chats: number;
  approval_rate: number;
}

export const getAnnotatorStats = (annotatorId?: string): Promise<AnnotatorStats> => {
  const params = annotatorId ? { annotator_id: annotatorId } : {};
  return get('/api/v1/tasks/stats/annotator', params).then(res => res.data);
};

/**
 * 搜索待标注的对话
 */
export interface SearchPendingChatsParams {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: 'created_at' | 'pending_count' | 'last_message_at';
  sort_order?: 'asc' | 'desc';
}

export interface PendingChat {
  id: string;
  title: string;
  pending_message_count: number;
  last_message_at: string;
  created_at: string;
  user_id: string;
}

export interface PaginatedPendingChats {
  total: number;
  items: PendingChat[];
}

export const searchPendingChats = (
  params: SearchPendingChatsParams = {}
): Promise<PaginatedPendingChats> => {
  return get('/api/v1/tasks/chats/pending', params).then(res => res.data);
};
