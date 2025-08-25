/**
 * 标注表单管理 Hook
 * 专门处理标注数据的表单逻辑和验证
 */

import { useState, useCallback, useEffect } from 'react';
import { Form } from 'antd';
import type { 
  TaskChatDetail,
  ChatAnnotationData,
  ChatAnnotationForm,
  MessageAnnotationData,
  MessageAnnotationForm
} from '../types/annotation';

// ============= 表单状态类型 =============

interface AnnotationFormState {
  // Chat 级别表单
  chatForm: ChatAnnotationForm;
  chatFormValid: boolean;
  
  // Message 级别表单映射（messageId -> form）
  messageforms: Record<string, MessageAnnotationForm>;
  
  // 表单状态
  saving: boolean;
  hasChanges: boolean;
}

// ============= 默认值 =============

const getDefaultChatAnnotationData = (): ChatAnnotationData => ({
  intent_category: '',
  completeness: '',
  overall_satisfaction: 3,
  general_notes: '',
});

const getDefaultChatAnnotationForm = (): ChatAnnotationForm => ({
  ...getDefaultChatAnnotationData(),
  annotation_result: 'approved',
  annotation_comment: '',
});

const getDefaultMessageAnnotationData = (): MessageAnnotationData => ({
  relevance: '',
  fluency: '',
  accuracy: '',
  compliance: '',
  tone_and_style: [],
  violation_types: [],
  violation_details: '',
  has_hallucination: false,
  hallucination_details: '',
  improvement_suggestion: '',
  rewrite: '',
  rag_recalls: [],
});

const getDefaultMessageAnnotationForm = (): MessageAnnotationForm => ({
  ...getDefaultMessageAnnotationData(),
});

// ============= Hook 实现 =============

export const useAnnotationForm = (taskChatDetail: TaskChatDetail | null) => {
  const [chatForm] = Form.useForm<ChatAnnotationForm>();
  const [messageFormInstances] = useState<Record<string, any>>({});
  
  const [state, setState] = useState<AnnotationFormState>({
    chatForm: getDefaultChatAnnotationForm(),
    chatFormValid: false,
    messageforms: {},
    saving: false,
    hasChanges: false,
  });

  // ============= 初始化表单数据 =============

  /**
   * 从 TaskChatDetail 初始化表单数据
   */
  const initializeFormsFromData = useCallback((data: TaskChatDetail) => {
    // 初始化 Chat 级别表单
    const chatFormData: ChatAnnotationForm = {
      ...getDefaultChatAnnotationForm(),
      ...data.annotation_data,
      annotation_result: data.annotation_result || 'approved',
      annotation_comment: data.annotation_comment || '',
    };

    // 初始化 Message 级别表单
    const messageforms: Record<string, MessageAnnotationForm> = {};
    data.chat.messages.forEach(message => {
      messageforms[message.id] = {
        ...getDefaultMessageAnnotationForm(),
      };
    });

    setState(prev => ({
      ...prev,
      chatForm: chatFormData,
      messageforms,
      hasChanges: false,
    }));

    // 设置 Ant Design 表单值 (延迟执行确保Form已挂载)
    setTimeout(() => {
      try {
        chatForm.setFieldsValue(chatFormData);
      } catch (error) {
        // Form可能还未挂载，忽略错误
      }
    }, 0);
  }, [chatForm]);

  // 当 taskChatDetail 变化时，重新初始化表单
  useEffect(() => {
    if (taskChatDetail) {
      initializeFormsFromData(taskChatDetail);
    } else {
      // 清空表单
      setState(prev => ({
        ...prev,
        chatForm: getDefaultChatAnnotationForm(),
        messageforms: {},
        hasChanges: false,
      }));
      // 延迟调用resetFields，确保Form组件已经挂载
      setTimeout(() => {
        try {
          chatForm.resetFields();
        } catch (error) {
          // 忽略Form未连接的错误
        }
      }, 0);
    }
  }, [taskChatDetail, initializeFormsFromData, chatForm]);

  // ============= Chat 级别表单操作 =============

  /**
   * 更新 Chat 表单字段
   */
  const updateChatForm = useCallback(<K extends keyof ChatAnnotationForm>(
    field: K,
    value: ChatAnnotationForm[K]
  ) => {
    setState(prev => ({
      ...prev,
      chatForm: { ...prev.chatForm, [field]: value },
      hasChanges: true,
    }));
    
    // 同步到 Ant Design 表单
    try {
      chatForm.setFieldValue(field, value);
    } catch (error) {
      // Form可能还未挂载，忽略错误
    }
  }, [chatForm]);

  /**
   * 批量更新 Chat 表单
   */
  const updateChatFormBatch = useCallback((updates: Partial<ChatAnnotationForm>) => {
    setState(prev => ({
      ...prev,
      chatForm: { ...prev.chatForm, ...updates },
      hasChanges: true,
    }));

    // 同步到 Ant Design 表单
    try {
      chatForm.setFieldsValue(updates);
    } catch (error) {
      // Form可能还未挂载，忽略错误
    }
  }, [chatForm]);

  /**
   * 验证 Chat 表单
   */
  const validateChatForm = useCallback(async (): Promise<boolean> => {
    try {
      await chatForm.validateFields();
      setState(prev => ({ ...prev, chatFormValid: true }));
      return true;
    } catch (error) {
      setState(prev => ({ ...prev, chatFormValid: false }));
      return false;
    }
  }, [chatForm]);

  // ============= Message 级别表单操作 =============

  /**
   * 更新 Message 表单字段
   */
  const updateMessageForm = useCallback(<K extends keyof MessageAnnotationForm>(
    messageId: string,
    field: K,
    value: MessageAnnotationForm[K]
  ) => {
    setState(prev => ({
      ...prev,
      messageforms: {
        ...prev.messageforms,
        [messageId]: {
          ...prev.messageforms[messageId],
          [field]: value,
        },
      },
      hasChanges: true,
    }));

    // 同步到对应的表单实例
    const formInstance = messageFormInstances[messageId];
    if (formInstance) {
      formInstance.setFieldValue(field, value);
    }
  }, [messageFormInstances]);

  /**
   * 批量更新 Message 表单
   */
  const updateMessageFormBatch = useCallback((
    messageId: string,
    updates: Partial<MessageAnnotationForm>
  ) => {
    setState(prev => ({
      ...prev,
      messageforms: {
        ...prev.messageforms,
        [messageId]: {
          ...prev.messageforms[messageId],
          ...updates,
        },
      },
      hasChanges: true,
    }));

    // 同步到对应的表单实例
    const formInstance = messageFormInstances[messageId];
    if (formInstance) {
      formInstance.setFieldsValue(updates);
    }
  }, [messageFormInstances]);

  /**
   * 获取 Message 表单数据
   */
  const getMessageForm = useCallback((messageId: string): MessageAnnotationForm => {
    return state.messageforms[messageId] || getDefaultMessageAnnotationForm();
  }, [state.messageforms]);

  // ============= 表单验证 =============

  /**
   * 验证所有表单
   */
  const validateAllForms = useCallback(async (): Promise<boolean> => {
    // 验证 Chat 表单
    const chatValid = await validateChatForm();

    // 验证所有 Message 表单
    const messageValidations = await Promise.all(
      Object.keys(messageFormInstances).map(async (messageId) => {
        const formInstance = messageFormInstances[messageId];
        try {
          await formInstance?.validateFields();
          return true;
        } catch {
          return false;
        }
      })
    );

    const allMessageValid = messageValidations.every(valid => valid);
    return chatValid && allMessageValid;
  }, [validateChatForm, messageFormInstances]);

  // ============= 数据提取 =============

  /**
   * 提取 Chat 标注数据
   */
  const extractChatAnnotationData = useCallback((): ChatAnnotationData => {
    const { annotation_result, annotation_comment, ...annotationData } = state.chatForm;
    return annotationData;
  }, [state.chatForm]);

  /**
   * 提取 Message 标注数据
   */
  const extractMessageAnnotationData = useCallback((messageId: string): MessageAnnotationData => {
    const messageForm = state.messageforms[messageId];
    if (!messageForm) return getDefaultMessageAnnotationData();

    return messageForm;
  }, [state.messageforms]);

  /**
   * 提取所有表单数据（用于提交）
   */
  const extractAllFormData = useCallback(() => {
    return {
      chatAnnotation: {
        annotation_result: state.chatForm.annotation_result,
        annotation_comment: state.chatForm.annotation_comment,
        annotation_data: extractChatAnnotationData(),
      },
      messageAnnotations: Object.keys(state.messageforms).map(messageId => ({
        messageId,
        annotation_data: extractMessageAnnotationData(messageId),
      })),
    };
  }, [state.chatForm, state.messageforms, extractChatAnnotationData, extractMessageAnnotationData]);

  // ============= 工具方法 =============

  /**
   * 注册 Message 表单实例
   */
  const registerMessageFormInstance = useCallback((messageId: string, formInstance: any) => {
    messageFormInstances[messageId] = formInstance;
  }, [messageFormInstances]);

  /**
   * 重置所有表单
   */
  const resetAllForms = useCallback(() => {
    setState(prev => ({
      ...prev,
      chatForm: getDefaultChatAnnotationForm(),
      messageforms: {},
      hasChanges: false,
      chatFormValid: false,
    }));

    // 延迟调用resetFields，确保Form组件已经挂载
    setTimeout(() => {
      try {
        chatForm.resetFields();
        Object.values(messageFormInstances).forEach(formInstance => {
          formInstance?.resetFields();
        });
      } catch (error) {
        // 忽略Form未连接的错误
      }
    }, 0);
  }, [chatForm, messageFormInstances]);

  /**
   * 标记保存状态
   */
  const setSaving = useCallback((saving: boolean) => {
    setState(prev => ({ ...prev, saving }));
  }, []);

  /**
   * 标记为已保存（清除变更标记）
   */
  const markAsSaved = useCallback(() => {
    setState(prev => ({ ...prev, hasChanges: false }));
  }, []);

  // ============= 返回接口 =============

  return {
    // 表单实例
    chatFormInstance: chatForm,
    
    // 状态数据
    ...state,
    
    // Chat 表单操作
    updateChatForm,
    updateChatFormBatch,
    validateChatForm,
    
    // Message 表单操作
    updateMessageForm,
    updateMessageFormBatch,
    getMessageForm,
    registerMessageFormInstance,
    
    // 验证和数据提取
    validateAllForms,
    extractChatAnnotationData,
    extractMessageAnnotationData,
    extractAllFormData,
    
    // 工具方法
    resetAllForms,
    setSaving,
    markAsSaved,
  };
};
