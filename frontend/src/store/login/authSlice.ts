import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export const authSlice=createSlice({
    name:"auth",
    initialState:{
        token:sessionStorage.getItem("token")||null,
        username:sessionStorage.getItem("username")||null,
        menuList:[] as any[]
    },
    reducers:{
        setToken:(state,action:PayloadAction<string>)=>{
            state.token=action.payload
            sessionStorage.setItem("token", action.payload)
        },
        setUsername:(state,action:PayloadAction<string>)=>{
            state.username=action.payload
            sessionStorage.setItem("username", action.payload)
        },
        setMenuList:(state,action:PayloadAction<any[]>)=>{
            state.menuList=action.payload
        },
        clearAuth:(state)=>{
            state.token=null
            state.username=null
            state.menuList=[]
            sessionStorage.removeItem("token")
            sessionStorage.removeItem("username")
        }
    }
})

export const {setToken,setUsername,setMenuList,clearAuth}=authSlice.actions
export default authSlice.reducer