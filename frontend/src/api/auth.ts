import axios from 'axios';
import { store } from '../store';
import { clearAuth } from '../store/login/authSlice';

// API基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8009';

// 创建axios实例
const authAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// 请求拦截器 - 自动添加认证头
authAPI.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.authSlice.token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理认证失败
authAPI.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.log('Authentication failed, clearing auth state...');
      store.dispatch(clearAuth());
      
      // 如果不在登录页，跳转到登录页
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// 登录请求参数类型
export interface LoginData {
    username: string;
    password: string;
}

// 后端实际返回的Token格式
export interface TokenResponse {
    access_token: string;
    token_type: string;
}

// 用户信息类型（匹配后端UserResponse）
export interface UserInfo {
    id: string;
    username: string;
    email?: string;
    role: 'user' | 'reviewer' | 'admin';
    is_active: boolean;
    is_email_verified: boolean;
    total_annotations: number;
    approved_annotations: number;
    approval_rate: number;
    avatar_url?: string;
    last_login_at?: string;
    created_at: string;
    updated_at: string;
}

// 登录API函数 - 使用FormData匹配OAuth2PasswordRequestForm
export async function login(data: LoginData): Promise<TokenResponse> {
    const formData = new FormData();
    formData.append('username', data.username);
    formData.append('password', data.password);
    
    const response = await authAPI.post('/api/v1/auth/token', formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    
    return response.data;
}

// 获取当前用户信息
export async function getCurrentUser(token: string): Promise<UserInfo> {
    const response = await authAPI.post('/api/v1/auth/test_token', {}, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    
    return response.data;
}

// 注册接口
export interface RegisterData {
    username: string;
    email: string;
    password: string;
}

export async function register(data: RegisterData): Promise<UserInfo> {
    const response = await authAPI.post('/api/v1/auth/register', data);
    return response.data;
}