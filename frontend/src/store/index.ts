import { configureStore } from '@reduxjs/toolkit';
import authSlice from './login/authSlice';


export const store = configureStore({
  reducer: {
    authSlice
  },
});
