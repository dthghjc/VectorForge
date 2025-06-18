import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { routers as routes } from "./router";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { useMenu } from "./hooks/useMenu";
import { generateRoutes } from "./utils/generatesRoutes";
import { setMenuList } from "./store/login/authSlice";
import type { RootState } from "./store";

function App() {
  const { token } = useSelector((state: RootState) => state.authSlice);
  const { menuList } = useMenu();
  const [router, setRouter] = useState(createBrowserRouter(routes));
  const dispatch = useDispatch();
  
  useEffect(() => {
    if (token && menuList.length) {
      dispatch(setMenuList(menuList));
      const dynamicRoutes = generateRoutes(menuList);
      const myRoutes = [...routes];
      myRoutes[0].children = dynamicRoutes;
      myRoutes[0].children[0].index = true;
      const newRouter = createBrowserRouter(myRoutes);
      setRouter(newRouter);
    } else {
      // 无 token 或无菜单时，使用静态路由
      const newRouter = createBrowserRouter(routes);
      setRouter(newRouter);
    }
    console.log("menuList:")
    console.log(menuList);
    console.log("router:")
    console.log(router);
  }, [token]);

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;