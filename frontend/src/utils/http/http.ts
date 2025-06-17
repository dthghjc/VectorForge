import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from "axios";
import { message } from "antd";
import { store } from "../../store";

const http: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 5000
})

//请求拦截器，添加 JWT Token
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const { token } = store.getState().authSlice
    if (token) {
        //Authorization专门用来携带认证信息
        //Bearer表示的是一种认证类型，表示后面携带的是一个令牌
        config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
})

//响应拦截器
http.interceptors.response.use(
    (response: AxiosResponse) => {
        // 对于登录接口，直接返回原始响应数据
        if (response.config.url?.includes('/auth/token')) {
            return response.data;
        }
        
        // 对于其他接口，检查业务状态码
        const res = response.data
        if (res.code && res.code != 200) {
            message.error(res.code + ":" + res.message);
            return Promise.reject(new Error(res.message))
        }
        return response.data
    },
    (error) => {
        // 处理HTTP错误状态码（4xx, 5xx等）
        console.error('HTTP Error:', error);
        
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