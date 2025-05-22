import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./login/authSlice";
import userSlice from "./user/userSlice";
export const store=configureStore({
    reducer:{
        authSlice,
        userSlice,
    }
})