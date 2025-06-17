import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SimpleUserInfo } from "../../api/auth";

// 状态类型定义
interface AuthState {
    token: string | null;
    username: string | null;
    userRole: string | null;
    menuList: any[];
}

// 初始状态
const initialState: AuthState = {
    token: sessionStorage.getItem("token") || null,
    username: sessionStorage.getItem("username") || null,
    userRole: sessionStorage.getItem("userRole") || null,
    menuList: [],
};

// 创建认证相关的 slice
export const authSlice = createSlice({
    name: "auth",
    initialState,
    // 定义 reducers
    reducers: {
        setToken: (state, action: PayloadAction<string>) => {
            state.token = action.payload;
            sessionStorage.setItem("token", action.payload);
        },
        clearToken: (state) => {
            state.token = null;
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
    },
});

export const { setToken, clearToken, setUserInfo, clearUserInfo, setMenuList } = authSlice.actions;
export default authSlice.reducer;
