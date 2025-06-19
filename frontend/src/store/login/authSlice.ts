import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SimpleUserInfo } from "../../api/auth";

// 状态类型定义
interface AuthState {
    token: string | null;
    username: string | null;
    userRole: string | null;
    menuList: any[];
    isAuthenticated: boolean;
}

// 从sessionStorage获取初始状态的辅助函数
const getInitialStateFromStorage = (): AuthState => {
    const token = sessionStorage.getItem("token");
    const username = sessionStorage.getItem("username");
    const userRole = sessionStorage.getItem("userRole");
    
    return {
        token: token || null,
        username: username || null,
        userRole: userRole || null,
        menuList: [],
        isAuthenticated: !!token,
    };
};

// 初始状态
const initialState: AuthState = getInitialStateFromStorage();

// 创建认证相关的 slice
export const authSlice = createSlice({
    name: "auth",
    initialState,
    // 定义 reducers
    reducers: {
        // 新增：强制从sessionStorage恢复状态
        restoreFromStorage: (state) => {
            const storedState = getInitialStateFromStorage();
            Object.assign(state, storedState);
        },
        setToken: (state, action: PayloadAction<string>) => {
            state.token = action.payload;
            state.isAuthenticated = true;
            sessionStorage.setItem("token", action.payload);
        },
        clearToken: (state) => {
            state.token = null;
            state.isAuthenticated = false;
            sessionStorage.removeItem("token");
        },
        setUserInfo: (state, action: PayloadAction<SimpleUserInfo>) => {
            state.username = action.payload.username;
            state.userRole = action.payload.role;
            sessionStorage.setItem("username", action.payload.username);
            sessionStorage.setItem("userRole", action.payload.role);
        },
        clearUserInfo: (state) => {
            state.username = null;
            state.userRole = null;
            sessionStorage.removeItem("username");
            sessionStorage.removeItem("userRole");
        },
        setMenuList: (state, action: PayloadAction<any[]>) => {
            state.menuList = action.payload;
        },
        clearAuth: (state) => {
            state.token = null;
            state.username = null;
            state.userRole = null;
            state.menuList = [];
            state.isAuthenticated = false;
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("username");
            sessionStorage.removeItem("userRole");
        },
    },
});

export const { 
    restoreFromStorage, 
    setToken, 
    clearToken, 
    setUserInfo, 
    clearUserInfo, 
    setMenuList, 
    clearAuth 
} = authSlice.actions;

export default authSlice.reducer;
