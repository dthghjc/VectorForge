import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { routers } from "./router";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { getUserMenu } from "./api/auth";
import { setMenuList } from "./store/login/authSlice";
import { Spin } from "antd";


function App() {
  const { token } = useSelector((state: any) => state.authSlice);
  const dispatch = useDispatch();
  const [routes,setRoutes] = useState<any[]>([]);
  
  useEffect(()=>{
    async function loadData(){
      try {
        // 现在menu接口直接返回数组，不需要解构data
        const menuData = await getUserMenu();
        if (menuData && menuData.length){
          console.log("menu-data:",menuData);
          dispatch(setMenuList(menuData));
          // 生成动态路由

        }
      } catch (error) {
        console.error("获取菜单失败:", error);
      }
    }
    
    // 只有当token存在时才获取菜单
    if (token) {
      loadData()
    }
  },[token])


  if (routers){
    return (
    <RouterProvider router={createBrowserRouter(routers)} />
    );
  }else{
    return <Spin></Spin>
  }

}

export default App;