/**
 * 任务操作Hook
 * 管理任务的CRUD操作，集成乐观更新
 */
import { useCallback } from 'react';
import { message } from 'antd';
import { 
    createTask,
    assignTask,
    deleteTask,
    type TaskCreate,
} from '../api';

/**
 * 任务操作管理Hook
 * 提供任务操作功能，支持乐观更新
 * @param optimisticUpdates 乐观更新函数集合
 */
export const useTaskOperations = (optimisticUpdates?: {
    addTaskOptimistically: (task: any) => void;
    removeTaskOptimistically: (taskId: string) => void;
    updateTaskOptimistically: (taskId: string, updates: any) => void;
    rollbackTaskCreation: (tempId: string) => void;
    rollbackTaskDeletion: (task: any) => void;
}) => {
    
    /**
     * 创建任务（支持乐观更新）
     */
    const handleCreateTask = useCallback(async (
        taskData: TaskCreate,
        onSuccess?: () => void
    ) => {
        // 生成临时任务数据用于乐观更新
        const tempId = `temp-${Date.now()}`;
        const optimisticTask = {
            id: tempId,
            title: taskData.title,
            description: taskData.description || '',
            status: 'created',
            priority: taskData.priority || 'normal',
            total_chats: taskData.chat_ids.length,
            completed_chats: 0,
            completion_rate: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_overdue: false,
            auto_assign: taskData.auto_assign || false,
            max_annotations_per_chat: taskData.max_annotations_per_chat || 1,
            // 其他字段根据需要补充
        };

        // 1. 先进行乐观更新
        if (optimisticUpdates) {
            optimisticUpdates.addTaskOptimistically(optimisticTask);
        }

        try {
            // 2. 调用 API 创建任务
            const realTask = await createTask(taskData);
            
            // 3. 成功：移除临时任务，添加真实任务
            if (optimisticUpdates) {
                optimisticUpdates.removeTaskOptimistically(tempId);
                optimisticUpdates.addTaskOptimistically(realTask);
            }
            
            message.success('任务创建成功');
            onSuccess?.();
        } catch (error) {
            // 4. 失败：回滚乐观更新
            if (optimisticUpdates) {
                optimisticUpdates.rollbackTaskCreation(tempId);
            }
            
            console.error("创建任务失败:", error);
            message.error("创建任务失败");
            throw error;
        }
    }, [optimisticUpdates]);

    /**
     * 分配任务（支持乐观更新）
     */
    const handleAssignTask = useCallback(async (
        taskId: string,
        assignData: { assigned_to_id: string },
        onSuccess?: () => void
    ) => {
        // 1. 先进行乐观更新
        let originalTask = null;
        if (optimisticUpdates) {
            // 保存原始状态用于回滚
            // 注意：这里需要从当前状态中获取任务，实际实现中需要传入当前任务数据
            const updates = {
                assigned_to_id: assignData.assigned_to_id,
                status: 'assigned',
                updated_at: new Date().toISOString()
            };
            optimisticUpdates.updateTaskOptimistically(taskId, updates);
        }

        try {
            // 2. 调用 API 分配任务
            const updatedTask = await assignTask(taskId, assignData);
            
            // 3. 成功：用服务器返回的真实数据更新
            if (optimisticUpdates && updatedTask) {
                optimisticUpdates.updateTaskOptimistically(taskId, updatedTask);
            }
            
            message.success('任务分配成功');
            onSuccess?.();
        } catch (error) {
            // 4. 失败：回滚乐观更新
            if (optimisticUpdates && originalTask) {
                optimisticUpdates.updateTaskOptimistically(taskId, originalTask);
            }
            
            console.error("分配任务失败:", error);
            message.error("分配任务失败");
            throw error;
        }
    }, [optimisticUpdates]);

    /**
     * 删除任务（支持乐观更新）
     */
    const handleDeleteTask = useCallback(async (
        taskId: string,
        taskData?: any, // 传入要删除的任务数据，用于回滚
        onSuccess?: () => void
    ) => {
        console.log('[DEBUG] 开始删除任务:', taskId, taskData);
        
        // 1. 先进行乐观更新（立即从列表中移除）
        if (optimisticUpdates) {
            console.log('[DEBUG] 执行乐观删除');
            optimisticUpdates.removeTaskOptimistically(taskId);
        }

        try {
            // 2. 调用 API 删除任务
            console.log('[DEBUG] 调用删除 API');
            await deleteTask(taskId);
            
            console.log('[DEBUG] 删除 API 成功');
            message.success('任务删除成功');
            onSuccess?.();
        } catch (error) {
            console.log('[DEBUG] 删除 API 失败，开始回滚:', error);
            
            // 3. 失败：回滚乐观更新（重新添加到列表）
            if (optimisticUpdates && taskData) {
                console.log('[DEBUG] 执行回滚操作');
                optimisticUpdates.rollbackTaskDeletion(taskData);
            }
            
            console.error("删除任务失败:", error);
            message.error("删除任务失败");
            throw error;
        }
    }, [optimisticUpdates]);

    return {
        handleCreateTask,
        handleAssignTask,
        handleDeleteTask,
    };
};