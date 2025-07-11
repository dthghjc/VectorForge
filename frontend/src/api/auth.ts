import { post, get } from "../utils/http/request";

interface LoginData{
    username:string,
    password:string
}

// 登录接口返回类型（后端直接返回，不包装在ApiResponse中）
interface LoginResponse {
    access_token: string;
    token_type: string;
}

// 菜单项类型
interface MenuItemResponse {
    key: string;
    label: string;
    icon?: string;
    children?: MenuItemResponse[];
}

// 简化的用户信息类型（只包含id和username）
interface UserBasic {
    id: string;
    username: string;
}

// 获取用户列表的查询参数
interface GetUsersParams {
    skip?: number;
    limit?: number;
    role?: string;
    is_active?: boolean;
}
    
export function login(data:LoginData): Promise<LoginResponse> {
    // 后端使用OAuth2PasswordRequestForm，需要使用FormData格式
    const formData = new FormData();
    formData.append('username', data.username);
    formData.append('password', data.password);
    
    return post("/api/v1/auth/token", formData) as unknown as Promise<LoginResponse>
}

export function getUserMenu(): Promise<MenuItemResponse[]> {
    return get("/api/v1/auth/menu") as unknown as Promise<MenuItemResponse[]>
}

export function getAllUsers(params?: GetUsersParams): Promise<UserBasic[]> {
    const queryParams = new URLSearchParams();
    
    if (params?.skip !== undefined) {
        queryParams.append('skip', params.skip.toString());
    }
    if (params?.limit !== undefined) {
        queryParams.append('limit', params.limit.toString());
    }
    if (params?.role) {
        queryParams.append('role', params.role);
    }
    if (params?.is_active !== undefined) {
        queryParams.append('is_active', params.is_active.toString());
    }
    
    const queryString = queryParams.toString();
    const url = queryString ? `/api/v1/auth/admin/users?${queryString}` : '/api/v1/auth/admin/users';
    
    return get(url).then((response: any) => {
        // 检查响应结构，后端可能直接返回数组或包装在data中
        const usersData = Array.isArray(response) ? response : (response.data || []);
        
        if (!Array.isArray(usersData)) {
            console.error('Unexpected response format:', response);
            return [];
        }
        
        return usersData.map((user: any) => ({
            id: user.id,
            username: user.username
        }));
    }) as unknown as Promise<UserBasic[]>;
}

// 导出类型供其他地方使用
export type { UserBasic, GetUsersParams };

