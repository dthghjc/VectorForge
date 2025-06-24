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
      const {data} = await getUserMenu();
      
      if (data.length){
        dispatch(setMenuList(data));
        // 生成动态路由

      }

    }
    loadData()
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