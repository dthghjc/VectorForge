import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { routers } from "./router";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
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
      try {
        // 现在menu接口直接返回数组，不需要解构data
        const menuData = await getUserMenu();
        if (menuData && menuData.length){
          const routesGet = generateRoutes(menuData as any);
          const myRoutes = [...routers];
          myRoutes[0].children = routesGet;
          myRoutes[0].children[0].index = true;
          setRoutes(myRoutes);

          dispatch(setMenuList(menuData));
        
        }else{
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
    <RouterProvider router={createBrowserRouter(userRoutes)} />
    );
  }else{
    return <Spin></Spin>
  }
}

export default App;