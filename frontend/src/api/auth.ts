import http from '../utils/http/http';

// 登录请求参数类型
export interface LoginData {
    username: string;
    password: string;
}

// 后端实际返回的Token格式
export interface TokenResponse {
    access_token: string;
    token_type: string;
    role: 'user' | 'reviewer' | 'admin';
}

// 简化版的用户信息类型（用于登录时）
export interface SimpleUserInfo {
    username: string;
    role: 'user' | 'reviewer' | 'admin';
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
    
    return http.post<any, TokenResponse>('/api/v1/auth/token', formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
}

// 注册接口
export interface RegisterData {
    username: string;
    email: string;
    password: string;
}

export async function register(data: RegisterData): Promise<UserInfo> {
    return http.post<any, UserInfo>('/api/v1/auth/register', data);
}

// 菜单项类型
export interface MenuItem {
    key: string;
    label: string;
    icon?: string;
    children?: MenuItem[];
}

// 获取用户菜单API函数
export async function getUserMenu(): Promise<MenuItem[]> {
    return http.get<any, MenuItem[]>('/api/v1/auth/menu');
}