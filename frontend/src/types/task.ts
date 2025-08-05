/**
 * 任务相关的类型定义
 */

/**
 * 数据状态接口
 * 管理所有从API获取的数据
 */
export interface DataState {
    /** 标注员用户列表 */
    users: any[];
    /** 任务列表 */
    tasks: any[];
    /** 任务统计数据 */
    stats: any | null;
    /** 待审核对话列表 */
    pendingChats: any[];
    /** 所有对话列表 */
    allChats: any[];
}

/**
 * UI状态接口
 * 管理所有UI交互相关的状态
 */
export interface UIState {
    /** 全局加载状态 */
    loading: boolean;
    /** 弹窗显示状态 */
    modals: {
        /** 创建任务弹窗 */
        create: boolean;
        /** 选择对话弹窗 */
        chat: boolean;
        /** 分配任务弹窗 */
        assign: boolean;
    };
    /** 选择相关状态 */
    selection: {
        /** 已选择的对话ID列表 */
        chatIds: string[];
        /** 对话来源类型 */
        chatSourceType: 'pending' | 'all';
        /** 当前选中的任务 */
        task: any | null;
    };
}

/**
 * 数据状态的Action类型
 */
export type DataAction =
    | { type: 'SET_USERS'; payload: any[] }
    | { type: 'SET_TASKS'; payload: any[] }
    | { type: 'SET_STATS'; payload: any }
    | { type: 'SET_PENDING_CHATS'; payload: any[] }
    | { type: 'SET_ALL_CHATS'; payload: any[] }
    | { type: 'RESET_DATA' };

/**
 * UI状态的Action类型
 */
export type UIAction =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'TOGGLE_MODAL'; payload: { modal: keyof UIState['modals']; visible: boolean } }
    | { type: 'SET_SELECTED_CHATS'; payload: string[] }
    | { type: 'SET_CHAT_SOURCE_TYPE'; payload: 'pending' | 'all' }
    | { type: 'SET_SELECTED_TASK'; payload: any | null }
    | { type: 'RESET_SELECTION' }
    | { type: 'RESET_UI' };