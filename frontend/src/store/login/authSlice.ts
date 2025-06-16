import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SimpleUserInfo } from "../../api/auth";

// 状态类型定义
interface AuthState {
    token: string | null;
    userInfo: SimpleUserInfo | null;
    isAuthenticated: boolean;
}

// 从sessionStorage恢复用户信息
const getUserInfoFromStorage = (): SimpleUserInfo | null => {
    try {
        const username = sessionStorage.getItem("username");
        const role = sessionStorage.getItem("userRole");
        if (username && role) {
            return {
                username,
                role: role as 'user' | 'reviewer' | 'admin'
            };
        }
        return null;
    } catch {
        return null;
    }
};

// 初始状态
const initialState: AuthState = {
    token: sessionStorage.getItem("token") || null,
    userInfo: getUserInfoFromStorage(),
    isAuthenticated: !!sessionStorage.getItem("token"),
};

export const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setToken: (state, action: PayloadAction<string>) => {
            state.token = action.payload;
            state.isAuthenticated = true;
            sessionStorage.setItem("token", action.payload);
        },
        setUserInfo: (state, action: PayloadAction<SimpleUserInfo>) => {
            state.userInfo = action.payload;
            sessionStorage.setItem("username", action.payload.username);
            sessionStorage.setItem("userRole", action.payload.role);
        },
        clearAuth: (state) => {
            state.token = null;
            state.userInfo = null;
            state.isAuthenticated = false;
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("username");
            sessionStorage.removeItem("userRole");
        }
    }
});

export const { setToken, setUserInfo, clearAuth } = authSlice.actions;
export default authSlice.reducer;