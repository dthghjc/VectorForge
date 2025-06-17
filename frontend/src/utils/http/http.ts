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
        const res = response.data
        if (res.code != 200) {
            message.error(res.code + ":" + res.message);
            return Promise.reject(new Error(res.message))
        }
        return response.data
    },
    (error) => {
        // 处理HTTP错误状态码（4xx, 5xx等）
        console.error('HTTP Error:', error);
        
        // 直接返回错误，让调用方处理具体的错误信息
        return Promise.reject(error);
    }
)

export default http