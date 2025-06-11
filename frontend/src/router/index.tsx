import { createBrowserRouter } from "react-router-dom"
import type { RouteObject } from "react-router-dom"
import React, { Suspense } from "react"
import { Spin } from "antd"

const Home=React.lazy(()=>import("../page/home/index"));
const Login=React.lazy(()=>import("../page/login/index"));
const Chat=React.lazy(()=>import("../page/chat/index"));
const NotFound=React.lazy(()=>import("../page/404/index"));

// 加载组件
const LoadingComponent = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh' 
  }}>
    <Spin size="large" />
  </div>
);

// Suspense包装器
const withSuspense = (Component: React.LazyExoticComponent<React.ComponentType<any>>) => (
  <Suspense fallback={<LoadingComponent />}>
    <Component />
  </Suspense>
);

export const routers:RouteObject[]=[
    {
        path: "/",
        element: withSuspense(Home)
    },
    {
        path: "/chat",
        element: withSuspense(Chat)
    },
    {
        path: "/login",
        element: withSuspense(Login)
    },
    {
        path: "*",
        element: withSuspense(NotFound)
    }    
]