import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from "axios";
import { message } from "antd";
import { store } from "../../store";

const http: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 5000
})

// 不需要token的API白名单
const NO_AUTH_URLS = [
    '/api/v1/auth/token',     // 登录
    '/api/v1/auth/register',  // 注册
];

// 检查URL是否需要认证
const needsAuth = (url: string): boolean => {
    return !NO_AUTH_URLS.some(noAuthUrl => url.includes(noAuthUrl));
};

//请求拦截器，添加 JWT Token
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const url = config.url || '';
    
    // 对于不需要认证的API，直接跳过token处理
    if (!needsAuth(url)) {
        return config;
    }
    
    // 只对需要认证的API处理token
    // 优先从Redux store获取token，如果没有则从sessionStorage获取
    let token = store.getState().authSlice.token;
    
    // 如果Redux中没有token，尝试从sessionStorage获取
    if (!token) {
        token = sessionStorage.getItem('token');
        // 如果从sessionStorage获取到token，更新Redux状态
        if (token) {
            store.dispatch({ type: 'authSlice/setToken', payload: token });
        }
    }
    
    if (token) {
        //Authorization专门用来携带认证信息
        //Bearer表示的是一种认证类型，表示后面携带的是一个令牌
        config.headers['Authorization'] = `Bearer ${token}`;
    } else {
    }
    return config
}, (error) => {
    return Promise.reject(error);
})

//响应拦截器
http.interceptors.response.use(
    (response: AxiosResponse) => {
        const url = response.config.url || '';
        
        // 对于登录接口，直接返回原始响应数据
        if (url.includes('/auth/token')) {
            return response.data;
        }
        
        // 对于menu接口，直接返回数组数据
        if (url.includes('/auth/menu')) {
            return response.data;
        }
        
        // 对于其他接口，检查业务状态码
        const res = response.data;
        
        // 只有当响应确实是包装格式（有code字段）时才检查code
        if (res && typeof res === 'object' && 'code' in res) {
            if (res.code && res.code !== 200) {
                message.error(res.code + ":" + res.message);
                return Promise.reject(new Error(res.message));
            }
            // 返回data字段的内容
            return res.data || res;
        }
        
        // 对于其他格式，直接返回原始数据
        return response.data;
    },
    (error) => {
        // 处理HTTP错误状态码（4xx, 5xx等）
        console.error('HTTP Error:', error);
        
        // 特殊处理401未授权错误
        if (error.response?.status === 401) {
            console.error('401未授权错误，清除登录状态');
            // 清除token和用户信息
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('username');
            store.dispatch({ type: 'authSlice/clearAuth' });
            
            // 如果不是登录页面，跳转到登录页
            if (!window.location.pathname.includes('/login')) {
                message.error('登录已过期，请重新登录');
                window.location.href = '/login';
            }
        }
        
        // 详细日志记录，便于调试
        if (error.response) {
            // 服务器返回了错误状态码
            console.error('Error Status:', error.response.status);
            console.error('Error Data:', error.response.data);
            console.error('Error Headers:', error.response.headers);
        } else if (error.request) {
            // 请求已发送但没有收到响应
            console.error('No Response Received:', error.request);
        } else {
            // 其他错误
            console.error('Request Setup Error:', error.message);
        }
        
        // 保持错误对象的完整性，让上层错误处理器处理
        return Promise.reject(error);
    }
)

export default http