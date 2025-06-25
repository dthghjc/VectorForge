import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { routers } from "./router";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState,Suspense } from "react";
import { getUserMenu } from "./api/auth";
import { setMenuList } from "./store/login/authSlice";
import { Spin } from "antd";
import { generateRoutes } from "./utils/generatesRoutes";



function App() {
  const { token } = useSelector((state: any) => state.authSlice);
  const dispatch = useDispatch();
  const [userRoutes,setRoutes] = useState<any>(null);//动态创建的路由表
  useEffect(()=>{
    async function loadData(){
      if (!token) {
        setRoutes(routers); // 把基础路由写入 state
        return;             // ← 直接结束 loadData，后面的代码不再执行
      }
      // ↓ 只有 token 存在时才会执行这里的代码
      try {
        // 现在menu接口直接返回数组，不需要解构data
        const menuData = await getUserMenu();
        if (menuData && menuData.length){
          dispatch(setMenuList(menuData));
          const routesGet = generateRoutes(menuData as any);
          const myRoutes = [...routers];
          myRoutes[0].children = routesGet;
          myRoutes[0].children[0].index = true;
          setRoutes(myRoutes);
        }else{
          console.log('routers',routers)
          setRoutes(routers);
        }
      } catch (error) {
        console.error("获取菜单失败:", error);
      }
    }
    loadData()
  },[token])


  if (userRoutes){
    return (
      <Suspense fallback={<Spin />}>
        <RouterProvider router={createBrowserRouter(userRoutes)} />
      </Suspense>
    );
  }else{
    return <Spin></Spin>
  }
}

export default App;