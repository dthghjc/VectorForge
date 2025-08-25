/**
 * TaskChat 数据管理 Hook
 * 专门处理 Task → TaskChat → Chat + Messages 数据流
 */

import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import type { 
  Task, 
  TaskChatListItem, 
  TaskChatDetail,
  ChatAnnotationSubmit 
} from '../types/annotation';
import {
  getTasks,
  getTaskDetail,
  getTaskChats,
  getTaskChatDetail,
  annotateChat,
  type TaskChatsPaginatedResponse
} from '../api/annotation';

// ============= 数据状态类型 =============

interface TaskChatDataState {
  // 任务相关
  tasks: Task[];
  currentTask: Task | null;
  tasksLoading: boolean;
  
  // TaskChat 相关
  taskChats: TaskChatListItem[];
  currentTaskChat: TaskChatDetail | null;
  taskChatsLoading: boolean;
  
  // 分页相关
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  
  // 标注相关
  annotating: boolean;
}

// ============= Hook 实现 =============

export const useTaskChatData = () => {
  const [state, setState] = useState<TaskChatDataState>({
    tasks: [],
    currentTask: null,
    tasksLoading: false,
    taskChats: [],
    currentTaskChat: null,
    taskChatsLoading: false,
    pagination: {
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
    },
    annotating: false,
  });

  // ============= 任务操作 =============

  /**
   * 获取任务列表
   */
  const fetchTasks = useCallback(async (params = {}) => {
    setState(prev => ({ ...prev, tasksLoading: true }));
    try {
      const tasks = await getTasks(params);
      setState(prev => ({ ...prev, tasks, tasksLoading: false }));
      return tasks;
    } catch (error) {
      console.error('❌ 获取任务失败:', error);
      message.error('获取任务失败');
      setState(prev => ({ ...prev, tasksLoading: false }));
      throw error;
    }
  }, []);

  /**
   * 选择当前任务
   */
  const selectTask = useCallback(async (taskId: string) => {
    setState(prev => ({ ...prev, tasksLoading: true }));
    try {
      const task = await getTaskDetail(taskId);
      setState(prev => ({ 
        ...prev, 
        currentTask: task, 
        tasksLoading: false,
        // 清空之前的 TaskChat 数据
        taskChats: [],
        currentTaskChat: null 
      }));
      return task;
    } catch (error) {
      console.error('获取任务详情失败:', error);
      message.error('获取任务详情失败');
      setState(prev => ({ ...prev, tasksLoading: false }));
      throw error;
    }
  }, []);

  // ============= TaskChat 操作 =============

  /**
   * 获取任务下的对话列表（支持分页）
   */
  const fetchTaskChats = useCallback(async (
    taskId: string, 
    params: { 
      annotation_status?: 'pending' | 'completed' | 'skipped'; 
      page?: number; 
      page_size?: number; 
    } = {}
  ) => {
    setState(prev => ({ ...prev, taskChatsLoading: true }));
    try {
      const { page = 1, page_size = 10, ...otherParams } = params;
      const response = await getTaskChats(taskId, { page, page_size, ...otherParams });
      
      setState(prev => ({ 
        ...prev, 
        taskChats: response.items,
        pagination: {
          page: response.page,
          pageSize: response.page_size,
          total: response.total,
          totalPages: response.total_pages,
        },
        taskChatsLoading: false 
      }));
      
      return response;
    } catch (error) {
      console.error('获取任务对话失败:', error);
      message.error('获取任务对话失败');
      setState(prev => ({ ...prev, taskChatsLoading: false }));
      throw error;
    }
  }, []);

  /**
   * 分页处理
   */
  const changePage = useCallback(async (taskId: string, page: number, pageSize?: number) => {
    if (!taskId) return;
    
    const params = {
      page,
      page_size: pageSize || state.pagination.pageSize,
    };
    
    await fetchTaskChats(taskId, params);
  }, [fetchTaskChats, state.pagination.pageSize]);

  /**
   * 选择当前 TaskChat 进行标注
   */
  const selectTaskChat = useCallback(async (taskId: string, taskChatId: string) => {
    setState(prev => ({ ...prev, taskChatsLoading: true }));
    try {
      const taskChatDetail = await getTaskChatDetail(taskId, taskChatId);
      setState(prev => ({ 
        ...prev, 
        currentTaskChat: taskChatDetail, 
        taskChatsLoading: false 
      }));
      return taskChatDetail;
    } catch (error) {
      console.error('获取对话详情失败:', error);
      message.error('获取对话详情失败');
      setState(prev => ({ ...prev, taskChatsLoading: false }));
      throw error;
    }
  }, []);

  /**
   * 提交 Chat 级别标注
   */
  const submitChatAnnotation = useCallback(async (
    taskId: string,
    taskChatId: string,
    annotationData: ChatAnnotationSubmit
  ) => {
    setState(prev => ({ ...prev, annotating: true }));
    try {
      const updatedTaskChat = await annotateChat(taskId, taskChatId, annotationData);
      
      // 更新本地状态
      setState(prev => ({
        ...prev,
        annotating: false,
        // 更新 TaskChat 列表中的状态
        taskChats: prev.taskChats.map(tc => 
          tc.id === taskChatId 
            ? { 
                ...tc, 
                annotation_status: 'completed',
                annotation_result: annotationData.annotation_result,
                annotation_comment: annotationData.annotation_comment,
                annotation_data: annotationData.annotation_data,
                annotated_at: new Date().toISOString()
              }
            : tc
        ),
        // 如果当前正在标注这个对话，同步更新
        currentTaskChat: prev.currentTaskChat?.id === taskChatId
          ? { 
              ...prev.currentTaskChat, 
              annotation_status: 'completed',
              annotation_result: annotationData.annotation_result,
              annotation_comment: annotationData.annotation_comment,
              annotation_data: annotationData.annotation_data,
              annotated_at: new Date().toISOString()
            }
          : prev.currentTaskChat
      }));

      message.success('标注保存成功');
      return updatedTaskChat;
    } catch (error) {
      console.error('保存标注失败:', error);
      message.error('保存标注失败');
      setState(prev => ({ ...prev, annotating: false }));
      throw error;
    }
  }, []);

  // ============= 工具方法 =============

  /**
   * 获取下一个待标注的 TaskChat
   */
  const getNextTaskChat = useCallback((currentTaskChatId: string) => {
    const currentIndex = state.taskChats.findIndex(tc => tc.id === currentTaskChatId);
    if (currentIndex >= 0 && currentIndex < state.taskChats.length - 1) {
      return state.taskChats[currentIndex + 1];
    }
    return null;
  }, [state.taskChats]);

  /**
   * 获取上一个 TaskChat
   */
  const getPreviousTaskChat = useCallback((currentTaskChatId: string) => {
    const currentIndex = state.taskChats.findIndex(tc => tc.id === currentTaskChatId);
    if (currentIndex > 0) {
      return state.taskChats[currentIndex - 1];
    }
    return null;
  }, [state.taskChats]);

  /**
   * 切换到下一个 TaskChat
   */
  const goToNextTaskChat = useCallback(async () => {
    if (!state.currentTaskChat || !state.currentTask) return null;
    
    const nextTaskChat = getNextTaskChat(state.currentTaskChat.id);
    if (nextTaskChat) {
      return await selectTaskChat(state.currentTask.id, nextTaskChat.id);
    }
    return null;
  }, [state.currentTaskChat, state.currentTask, getNextTaskChat, selectTaskChat]);

  /**
   * 切换到上一个 TaskChat
   */
  const goToPreviousTaskChat = useCallback(async () => {
    if (!state.currentTaskChat || !state.currentTask) return null;
    
    const previousTaskChat = getPreviousTaskChat(state.currentTaskChat.id);
    if (previousTaskChat) {
      return await selectTaskChat(state.currentTask.id, previousTaskChat.id);
    }
    return null;
  }, [state.currentTaskChat, state.currentTask, getPreviousTaskChat, selectTaskChat]);

  /**
   * 清空当前选择
   */
  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentTask: null,
      currentTaskChat: null,
      taskChats: []
    }));
  }, []);

  // ============= 计算属性 =============

  const hasNext = state.currentTaskChat 
    ? getNextTaskChat(state.currentTaskChat.id) !== null 
    : false;

  const hasPrevious = state.currentTaskChat 
    ? getPreviousTaskChat(state.currentTaskChat.id) !== null 
    : false;

  const pendingCount = (state.taskChats || []).filter(tc => tc.annotation_status === 'pending').length;
  const completedCount = (state.taskChats || []).filter(tc => tc.annotation_status === 'completed').length;

  // ============= 返回接口 =============

  return {
    // 状态数据
    ...state,
    
    // 计算属性
    hasNext,
    hasPrevious,
    pendingCount,
    completedCount,
    
    // 操作方法
    fetchTasks,
    selectTask,
    fetchTaskChats,
    selectTaskChat,
    submitChatAnnotation,
    goToNextTaskChat,
    goToPreviousTaskChat,
    clearSelection,
    changePage,
    
    // 工具方法
    getNextTaskChat,
    getPreviousTaskChat,
  };
};
