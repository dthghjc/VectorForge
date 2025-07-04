import { configureStore } from '@reduxjs/toolkit';
import authSlice from './login/authSlice';

export const store = configureStore({
  reducer: {
    authSlice
  },
});

// 定义 RootState 和 AppDispatch 类型
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
