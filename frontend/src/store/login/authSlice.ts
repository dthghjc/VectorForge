import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// 用户信息类型
interface UserInfo {
    id: string;
    username: string;
    email?: string;
    role: 'user' | 'reviewer' | 'admin';
    is_active: boolean;
    avatar_url?: string;
}

// 状态类型定义
interface AuthState {
    token: string | null;
    userInfo: UserInfo | null;
    isAuthenticated: boolean;
}

// 从sessionStorage恢复用户信息
const getUserInfoFromStorage = (): UserInfo | null => {
    try {
        const userInfo = sessionStorage.getItem("userInfo");
        return userInfo ? JSON.parse(userInfo) : null;
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
        setUserInfo: (state, action: PayloadAction<UserInfo>) => {
            state.userInfo = action.payload;
            sessionStorage.setItem("userInfo", JSON.stringify(action.payload));
        },
        clearAuth: (state) => {
            state.token = null;
            state.userInfo = null;
            state.isAuthenticated = false;
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("username");
            sessionStorage.removeItem("userRole");
            sessionStorage.removeItem("userInfo");
        }
    }
});

export const { setToken, setUserInfo, clearAuth } = authSlice.actions;
export default authSlice.reducer;