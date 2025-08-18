/**
 * 任务管理UI状态Hook
 * 管理所有UI交互状态
 */
import { useReducer, useCallback } from 'react';

// UI状态接口
interface UIState {
    loading: boolean;
    pendingChatsLoading: boolean;  // 专门的待审核对话加载状态
    modals: {
        create: boolean;
        chat: boolean;
        assign: boolean;
    };
    selection: {
        chatIds: string[];
        chatSourceType: 'pending' | 'all';
        task: any | null;
    };
}

const initialUIState: UIState = {
    loading: false,
    pendingChatsLoading: false,
    modals: {
        create: false,
        chat: false,
        assign: false,
    },
    selection: {
        chatIds: [],
        chatSourceType: 'pending',
        task: null,
    },
};

type UIAction =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_PENDING_CHATS_LOADING'; payload: boolean }
    | { type: 'TOGGLE_MODAL'; payload: { modal: keyof UIState['modals']; visible: boolean } }
    | { type: 'SET_SELECTED_CHATS'; payload: string[] }
    | { type: 'SET_CHAT_SOURCE_TYPE'; payload: 'pending' | 'all' }
    | { type: 'SET_SELECTED_TASK'; payload: any | null }
    | { type: 'RESET_SELECTION' }
    | { type: 'RESET_UI' };

const uiReducer = (state: UIState, action: UIAction): UIState => {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_PENDING_CHATS_LOADING':
            return { ...state, pendingChatsLoading: action.payload };
        case 'TOGGLE_MODAL':
            return {
                ...state,
                modals: {
                    ...state.modals,
                    [action.payload.modal]: action.payload.visible,
                },
            };
        case 'SET_SELECTED_CHATS':
            return {
                ...state,
                selection: {
                    ...state.selection,
                    chatIds: action.payload,
                },
            };
        case 'SET_CHAT_SOURCE_TYPE':
            return {
                ...state,
                selection: {
                    ...state.selection,
                    chatSourceType: action.payload,
                },
            };
        case 'SET_SELECTED_TASK':
            return {
                ...state,
                selection: {
                    ...state.selection,
                    task: action.payload,
                },
            };
        case 'RESET_SELECTION':
            return {
                ...state,
                selection: {
                    chatIds: [],
                    chatSourceType: 'pending',
                    task: null,
                },
            };
        case 'RESET_UI':
            return initialUIState;
        default:
            return state;
    }
};

/**
 * 任务UI状态管理Hook
 * 提供UI状态管理功能
 */
export const useTaskUI = () => {
    const [uiState, uiDispatch] = useReducer(uiReducer, initialUIState);

    /**
     * 设置加载状态
     */
    const setLoading = useCallback((loading: boolean) => {
        uiDispatch({ type: 'SET_LOADING', payload: loading });
    }, []);

    /**
     * 设置待审核对话加载状态
     */
    const setPendingChatsLoading = useCallback((loading: boolean) => {
        uiDispatch({ type: 'SET_PENDING_CHATS_LOADING', payload: loading });
    }, []);

    /**
     * 切换弹窗显示状态
     */
    const toggleModal = useCallback((modal: keyof UIState['modals'], visible: boolean) => {
        uiDispatch({ type: 'TOGGLE_MODAL', payload: { modal, visible } });
    }, []);

    /**
     * 设置选中的对话ID列表
     */
    const setSelectedChats = useCallback((chatIds: string[]) => {
        uiDispatch({ type: 'SET_SELECTED_CHATS', payload: chatIds });
    }, []);

    /**
     * 设置对话来源类型
     */
    const setChatSourceType = useCallback((sourceType: 'pending' | 'all') => {
        uiDispatch({ type: 'SET_CHAT_SOURCE_TYPE', payload: sourceType });
    }, []);

    /**
     * 设置选中的任务
     */
    const setSelectedTask = useCallback((task: any) => {
        uiDispatch({ type: 'SET_SELECTED_TASK', payload: task });
    }, []);

    /**
     * 重置选择状态
     */
    const resetSelection = useCallback(() => {
        uiDispatch({ type: 'RESET_SELECTION' });
    }, []);

    /**
     * 重置所有UI状态
     */
    const resetUI = useCallback(() => {
        uiDispatch({ type: 'RESET_UI' });
    }, []);

    return {
        // 状态
        uiState,
        // UI状态管理函数
        setLoading,
        setPendingChatsLoading,
        toggleModal,
        setSelectedChats,
        setChatSourceType,
        setSelectedTask,
        resetSelection,
        resetUI,
        // 状态更新函数
        uiDispatch,
    };
};