/**
 * 任务管理数据Hook
 * 管理所有数据获取和状态更新
 */
import { useReducer, useCallback } from 'react';
import { message } from 'antd';
import { 
    getAllUsers,
    getTasks,
    getTaskStats,
    getPendingChats,
} from '../api';
import { getChats } from '../api/chat';

// 导入数据状态类型和reducer
interface DataState {
    users: any[];
    tasks: any[];
    stats: any;
    pendingChats: any[];
    allChats: any[];
    // 新增分页状态
    pagination: {
        current: number;
        pageSize: number;
        total: number;
    };
}

const initialDataState: DataState = {
    users: [],
    tasks: [],
    stats: null,
    pendingChats: [],
    allChats: [],
    // 初始化分页状态
    pagination: {
        current: 1,
        pageSize: 10,
        total: 0,
    },
};

type DataAction =
    | { type: 'SET_USERS'; payload: any[] }
    | { type: 'SET_TASKS'; payload: any[] }
    | { type: 'SET_STATS'; payload: any }
    | { type: 'SET_PENDING_CHATS'; payload: any[] }
    | { type: 'SET_ALL_CHATS'; payload: any[] }
    | { type: 'SET_PAGINATION'; payload: { current: number; pageSize: number; total: number } }
    | { type: 'UPDATE_PAGINATION'; payload: Partial<{ current: number; pageSize: number; total: number }> }
    | { type: 'SET_TASKS_AND_PAGINATION'; payload: { tasks: any[]; pagination: { current: number; pageSize: number; total: number } } }
    | { type: 'RESET_DATA' };

const dataReducer = (state: DataState, action: DataAction): DataState => {
    switch (action.type) {
        case 'SET_USERS':
            return { ...state, users: action.payload };
        case 'SET_TASKS':
            return { ...state, tasks: action.payload };
        case 'SET_STATS':
            return { ...state, stats: action.payload };
        case 'SET_PENDING_CHATS':
            return { ...state, pendingChats: action.payload };
        case 'SET_ALL_CHATS':
            return { ...state, allChats: action.payload };
        case 'SET_PAGINATION':
            return { ...state, pagination: action.payload };
        case 'UPDATE_PAGINATION':
            return { ...state, pagination: { ...state.pagination, ...action.payload } };
        case 'SET_TASKS_AND_PAGINATION':
            return { 
                ...state, 
                tasks: action.payload.tasks,
                pagination: { ...state.pagination, ...action.payload.pagination }
            };
        case 'RESET_DATA':
            return initialDataState;
        default:
            return state;
    }
};

/**
 * 任务数据管理Hook
 * 提供数据获取和状态管理功能
 */
export const useTaskData = () => {
    const [dataState, dataDispatch] = useReducer(dataReducer, initialDataState);

    /**
     * 获取标注员用户列表
     */
    const fetchUsers = useCallback(async () => {
        try {
            const annotationUsers = await getAllUsers({
                skip: 0,
                limit: 100,
                role: "annotation",
                is_active: true
            });
            dataDispatch({ type: 'SET_USERS', payload: annotationUsers });
        } catch (error) {
            console.error("获取用户失败:", error);
            message.error("获取用户失败");
        }
    }, []);

    /**
     * 内部核心获取任务函数
     * 统一任务获取逻辑，避免重复代码
     * @param page 页码（从1开始）
     * @param size 每页数量
     */
    const fetchTaskDataInternal = useCallback(async (page: number, size: number) => {
        try {
            // 计算skip参数（后端从0开始）
            const skip = (page - 1) * size;
            
            const taskList = await getTasks({
                skip,
                limit: size
            });
            
            // 计算总数（暂时使用返回的数量作为总数的估计）
            // TODO: 后端需要返回真实的总数
            const total = taskList.length === size ? 
                page * size + 1 : 
                (page - 1) * size + taskList.length;
            
            // 使用新的合并action，减少重渲染次数
            dataDispatch({
                type: 'SET_TASKS_AND_PAGINATION',
                payload: {
                    tasks: taskList,
                    pagination: { current: page, pageSize: size, total }
                }
            });
        } catch (error) {
            console.error("获取任务失败:", error);
            message.error("获取任务失败");
        }
    }, []); // 无依赖，因为 page 和 size 是参数

    /**
     * 获取任务列表（用于初始化和手动刷新）
     * @param current 当前页码（从1开始）
     * @param pageSize 每页数量
     */
    const fetchTasks = useCallback(async (current?: number, pageSize?: number) => {
        // 如果没有传入参数，使用当前分页状态的默认值
        const page = current || initialDataState.pagination.current;
        const size = pageSize || initialDataState.pagination.pageSize;
        
        await fetchTaskDataInternal(page, size);
    }, [fetchTaskDataInternal]);

    /**
     * 获取任务统计数据
     */
    const fetchStats = useCallback(async () => {
        try {
            // 1. 发起请求，等待数据返回。
            const taskStats = await getTaskStats();
            // 2. 将数据更新到状态中。
            dataDispatch({ type: 'SET_STATS', payload: taskStats });
        } catch (error) {
            console.error("获取统计失败:", error);
        }
    }, []);

    /**
     * 获取待审核对话列表
     */
    const fetchPendingChats = useCallback(async () => {
        try {
            const chats = await getPendingChats({ limit: 100 });
            dataDispatch({ type: 'SET_PENDING_CHATS', payload: chats });
        } catch (error) {
            console.error("获取待审核对话失败:", error);
            message.error("获取待审核对话失败");
        }
    }, []);

    /**
     * 获取所有对话列表
     */
    const fetchAllChats = useCallback(async () => {
        try {
            const chats = await getChats({ limit: 200 });
            dataDispatch({ type: 'SET_ALL_CHATS', payload: chats });
        } catch (error) {
            console.error("获取对话列表失败:", error);
            message.error("获取对话列表失败");
        }
    }, []);

    /**
     * 处理分页变化
     * @param page 页码
     * @param pageSize 每页大小
     */
    const handlePageChange = useCallback(async (page: number, pageSize?: number) => {
        // 使用当前分页状态的 pageSize 作为默认值
        const size = pageSize || dataState.pagination.pageSize;
        await fetchTaskDataInternal(page, size);
    }, [fetchTaskDataInternal, dataState.pagination.pageSize]);

    /**
     * 更新分页设置
     * @param pagination 分页参数
     */
    const updatePagination = useCallback((pagination: Partial<{ current: number; pageSize: number; total: number }>) => {
        dataDispatch({ type: 'UPDATE_PAGINATION', payload: pagination });
    }, []);

    /**
     * 乐观更新：添加新任务到本地状态
     * @param newTask 新创建的任务数据
     */
    const addTaskOptimistically = useCallback((newTask: any) => {
        // 添加到任务列表顶部（最新的任务在前面）
        const updatedTasks = [newTask, ...dataState.tasks];
        dataDispatch({ type: 'SET_TASKS', payload: updatedTasks });
        
        // 更新统计数据
        if (dataState.stats) {
            const updatedStats = {
                ...dataState.stats,
                total_tasks: (dataState.stats.total_tasks || 0) + 1
            };
            dataDispatch({ type: 'SET_STATS', payload: updatedStats });
        }
    }, [dataState.tasks, dataState.stats]);

    /**
     * 乐观更新：从本地状态移除任务
     * @param taskId 要删除的任务ID
     */
    const removeTaskOptimistically = useCallback((taskId: string) => {
        const updatedTasks = dataState.tasks.filter(task => task.id !== taskId);
        dataDispatch({ type: 'SET_TASKS', payload: updatedTasks });
        
        // 更新统计数据
        if (dataState.stats) {
            const updatedStats = {
                ...dataState.stats,
                total_tasks: Math.max((dataState.stats.total_tasks || 0) - 1, 0)
            };
            dataDispatch({ type: 'SET_STATS', payload: updatedStats });
        }
    }, [dataState.tasks, dataState.stats]);

    /**
     * 乐观更新：更新本地任务状态
     * @param taskId 任务ID
     * @param updates 更新的字段
     */
    const updateTaskOptimistically = useCallback((taskId: string, updates: Partial<any>) => {
        const updatedTasks = dataState.tasks.map(task => 
            task.id === taskId ? { ...task, ...updates } : task
        );
        dataDispatch({ type: 'SET_TASKS', payload: updatedTasks });
    }, [dataState.tasks]);

    /**
     * 回滚乐观更新：移除临时任务
     * @param tempId 临时任务ID
     */
    const rollbackTaskCreation = useCallback((tempId: string) => {
        removeTaskOptimistically(tempId);
    }, [removeTaskOptimistically]);

    /**
     * 回滚乐观更新：恢复被删除的任务
     * @param task 被删除的任务数据
     */
    const rollbackTaskDeletion = useCallback((task: any) => {
        // 检查任务是否已经存在于列表中
        const taskExists = dataState.tasks.some(t => t.id === task.id);
        
        if (!taskExists) {
            // 直接添加任务到列表，不修改统计数据（因为实际删除失败，数据库中任务还在）
            const updatedTasks = [task, ...dataState.tasks];
            dataDispatch({ type: 'SET_TASKS', payload: updatedTasks });
        }
        // 注意：不更新统计数据，因为任务实际上没有被删除
    }, [dataState.tasks]);

    /**
     * 统一的初始化函数
     * 使用 Promise.allSettled 允许部分API失败，显示成功加载的数据
     * 避免一个API失败导致整个页面空白的问题
     */
    const fetchInitialData = useCallback(async () => {
        // 使用 Promise.allSettled 允许部分失败
        const results = await Promise.allSettled([
            fetchUsers(),           // 获取用户列表
            fetchStats(),           // 获取统计数据
            fetchTaskDataInternal(  // 获取第一页任务数据
                initialDataState.pagination.current,
                initialDataState.pagination.pageSize
            )
        ]);

        // 分析结果并提供简洁的错误反馈
        const [usersResult, statsResult, tasksResult] = results;
        const failures = [];

        if (usersResult.status === 'rejected') {
            console.error('用户列表加载失败:', usersResult.reason);
            failures.push('用户列表');
        }

        if (statsResult.status === 'rejected') {
            console.error('统计数据加载失败:', statsResult.reason);
            failures.push('统计数据');
        }

        if (tasksResult.status === 'rejected') {
            console.error('任务列表加载失败:', tasksResult.reason);
            failures.push('任务列表');
        }

        // 简洁的用户反馈
        if (failures.length > 0 && failures.length < results.length) {
            // 只在部分失败时提示，让用户知道可以刷新页面
            message.warning(`${failures.join('、')} 加载失败，请刷新页面重试`);
        } else if (failures.length === results.length) {
            // 所有都失败时提示网络问题
            message.error("服务器连接失败，请刷新页面重试");
        }
    }, [fetchUsers, fetchStats, fetchTaskDataInternal]);

    return {
        // 状态
        dataState,
        // 数据获取函数
        fetchUsers,
        fetchTasks,
        fetchStats,
        fetchPendingChats,
        fetchAllChats,
        fetchInitialData, // 统一初始化函数
        // 分页控制函数
        handlePageChange,
        updatePagination,
        // 乐观更新函数
        addTaskOptimistically,
        removeTaskOptimistically,
        updateTaskOptimistically,
        rollbackTaskCreation,
        rollbackTaskDeletion,
        // 状态更新函数
        dataDispatch,
    };
};