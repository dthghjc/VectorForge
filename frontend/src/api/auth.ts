import axios from 'axios';

// API基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const authAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
authAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
authAPI.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token过期，清除本地存储并跳转到登录页
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_info');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// 类型定义 - 根据后端实际API调整
export interface LoginRequest {
  username: string; // 后端支持用户名或邮箱
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

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

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  id: string;
  username: string;
  email?: string;
  role: string;
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

// API方法
export const authService = {
  // 登录 - 使用form data格式匹配OAuth2PasswordRequestForm
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const formData = new FormData();
    formData.append('username', data.username);
    formData.append('password', data.password);
    
    const response = await axios.post(`${API_BASE_URL}/v1/auth/token`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  // 注册
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    return await authAPI.post('/v1/auth/register', data);
  },

  // 获取当前用户信息
  getCurrentUser: async (): Promise<UserInfo> => {
    return await authAPI.post('/v1/auth/test_token');
  },

  // 测试token有效性
  testToken: async (): Promise<UserInfo> => {
    return await authAPI.post('/v1/auth/test_token');
  },
};

// 工具函数
export const authUtils = {
  // 保存Token
  saveToken: (token: string) => {
    localStorage.setItem('access_token', token);
  },

  // 清除Token
  clearToken: () => {
    localStorage.removeItem('access_token');
  },

  // 获取Token
  getToken: (): string | null => {
    return localStorage.getItem('access_token');
  },

  // 检查是否已登录
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access_token');
  },

  // 保存用户信息
  saveUserInfo: (user: UserInfo) => {
    localStorage.setItem('user_info', JSON.stringify(user));
  },

  // 获取用户信息
  getUserInfo: (): UserInfo | null => {
    const userInfo = localStorage.getItem('user_info');
    return userInfo ? JSON.parse(userInfo) : null;
  },

  // 清除用户信息
  clearUserInfo: () => {
    localStorage.removeItem('user_info');
  },

  // 清除所有认证信息
  clearAll: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
  },
};

export default authService;
