import { createBrowserRouter } from "react-router-dom"
import type { RouteObject } from "react-router-dom"
import React from "react"

const Home=React.lazy(()=>import("../page/home/index"));
const Login=React.lazy(()=>import("../page/login/index"));
const Chat=React.lazy(()=>import("../page/chat/index"));
const NotFound=React.lazy(()=>import("../page/404/index"));



export const routers:RouteObject[]=[
    {
        path: "/",
        element: <Home/ >
    },
    {
        path: "/chat",
        element: <Chat/ >
    },
    {
        path: "/login",
        element: <Login/>
    },
    {
        path: "*",
        element: <NotFound/>
    }    
]