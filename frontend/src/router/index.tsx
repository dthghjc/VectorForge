import type { RouteObject } from "react-router-dom"
import Home from "../page/home/index";
import Login from "../page/login/index";
import NotFound from "../page/404/index";
import RequireAuth from "../utils/RequireAuth";

export const routers: RouteObject[] = [
    {
        path: "/",
        element: <RequireAuth allowed={true} redirectTo="/login"><Home /></RequireAuth>
    },
    {
        path: "/login",
        element: <RequireAuth allowed={false} redirectTo="/"><Login /></RequireAuth>
    },
    {
        path: "*",
        element: <NotFound />
    },
]