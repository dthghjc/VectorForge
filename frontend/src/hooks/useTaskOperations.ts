/**
 * 任务操作Hook
 * 管理任务的CRUD操作
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
 * 提供任务操作功能
 */
export const useTaskOperations = () => {
    
    /**
     * 创建任务
     */
    const handleCreateTask = useCallback(async (
        taskData: TaskCreate,
        onSuccess?: () => void
    ) => {
        try {
            await createTask(taskData);
            message.success('任务创建成功');
            onSuccess?.();
        } catch (error) {
            console.error("创建任务失败:", error);
            message.error("创建任务失败");
            throw error;
        }
    }, []);

    /**
     * 分配任务
     */
    const handleAssignTask = useCallback(async (
        taskId: string,
        assignData: { assigned_to_id: string },
        onSuccess?: () => void
    ) => {
        try {
            await assignTask(taskId, assignData);
            message.success('任务分配成功');
            onSuccess?.();
        } catch (error) {
            console.error("分配任务失败:", error);
            message.error("分配任务失败");
            throw error;
        }
    }, []);

    /**
     * 删除任务
     */
    const handleDeleteTask = useCallback(async (
        taskId: string,
        onSuccess?: () => void
    ) => {
        try {
            await deleteTask(taskId);
            message.success('任务删除成功');
            onSuccess?.();
        } catch (error) {
            console.error("删除任务失败:", error);
            message.error("删除任务失败");
            throw error;
        }
    }, []);

    return {
        handleCreateTask,
        handleAssignTask,
        handleDeleteTask,
    };
};