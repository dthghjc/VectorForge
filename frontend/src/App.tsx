import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { routers as routes } from "./router";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { useMenu } from "./hooks/useMenu";
import { generateRoutes } from "./utils/generatesRoutes";
import type { RootState } from "./store";
import { restoreFromStorage } from "./store/login/authSlice";

function App() {
  const { token, userRole, username, isAuthenticated } = useSelector((state: RootState) => state.authSlice);
  const { menuList } = useMenu();
  const [router, setRouter] = useState(createBrowserRouter(routes));
  const dispatch = useDispatch();

  // 应用启动时强制恢复状态
  useEffect(() => {
    console.log('🚀 App 组件启动，开始恢复状态...');
    
    // 强制从sessionStorage恢复状态
    dispatch(restoreFromStorage());
    
    console.log('✅ 状态恢复完成');
  }, [dispatch]); // 只在组件挂载时执行一次
  
  // 监听状态变化并更新路由
  useEffect(() => {
    console.log('📊 当前状态:', {
      token: token ? '存在' : '不存在',
      userRole,
      username,
      isAuthenticated,
      menuListLength: menuList.length
    });

    if (isAuthenticated && menuList.length > 0) {
      console.log('🔧 生成动态路由...');
      const dynamicRoutes = generateRoutes(menuList);
      const myRoutes = [...routes];
      myRoutes[0].children = dynamicRoutes;
      myRoutes[0].children[0].index = true;
      const newRouter = createBrowserRouter(myRoutes);
      setRouter(newRouter);
    } else {
      console.log('🔧 使用默认路由...');
      const newRouter = createBrowserRouter(routes);
      setRouter(newRouter);
    }
  }, [token, userRole, username, isAuthenticated, menuList]);

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;