/**
 * 任务管理数据Hook
 * 管理所有数据获取和状态更新
 */
import { useReducer, useCallback } from 'react';
import { message } from 'antd';
import { 
    getAllUsers,
    getTasks,
    createTask,
    assignTask,
    deleteTask,
    getTaskStats,
    getPendingChats,
    type TaskCreate,
} from '../api';
import { getChats } from '../api/chat';

// 导入数据状态类型和reducer
interface DataState {
    users: any[];
    tasks: any[];
    stats: any;
    pendingChats: any[];
    allChats: any[];
}

const initialDataState: DataState = {
    users: [],
    tasks: [],
    stats: null,
    pendingChats: [],
    allChats: [],
};

type DataAction =
    | { type: 'SET_USERS'; payload: any[] }
    | { type: 'SET_TASKS'; payload: any[] }
    | { type: 'SET_STATS'; payload: any }
    | { type: 'SET_PENDING_CHATS'; payload: any[] }
    | { type: 'SET_ALL_CHATS'; payload: any[] }
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
     * 获取任务列表
     */
    const fetchTasks = useCallback(async () => {
        try {
            const taskList = await getTasks();
            dataDispatch({ type: 'SET_TASKS', payload: taskList });
        } catch (error) {
            console.error("获取任务失败:", error);
            message.error("获取任务失败");
        }
    }, []);

    /**
     * 获取任务统计数据
     */
    const fetchStats = useCallback(async () => {
        try {
            const taskStats = await getTaskStats();
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

    return {
        // 状态
        dataState,
        // 数据获取函数
        fetchUsers,
        fetchTasks,
        fetchStats,
        fetchPendingChats,
        fetchAllChats,
        // 状态更新函数
        dataDispatch,
    };
};