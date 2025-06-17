import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { routers } from "./router";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import { useMenu } from "./hooks/useMenu";
import type { RootState } from "./store";

function App() {
  // 从 redux 中获取用户信息
  const { userInfo } = useSelector((state: RootState) => state.authSlice);
  
  // 初始化菜单管理
  useMenu();

  return (
    <>
      <RouterProvider router={createBrowserRouter(routers)}></RouterProvider>
    </>
  );
}

export default App;
 