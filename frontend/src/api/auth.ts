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
    
export function login(data:LoginData): Promise<LoginResponse> {
    // 后端使用OAuth2PasswordRequestForm，需要使用FormData格式
    const formData = new FormData();
    formData.append('username', data.username);
    formData.append('password', data.password);
    
    return post("/api/v1/auth/token", formData) as unknown as Promise<LoginResponse>
}

export function getUserMenu(){
    return get("/api/v1/auth/menu")
}