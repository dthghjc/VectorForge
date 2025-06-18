import type { RouteObject } from "react-router-dom"
import Home from "../page/home/index";
import Login from "../page/login/index";
import Chat from "../page/chat/index";
import NotFound from "../page/404/index";
import RequireAuth from "../utils/RequireAuth";

export const routers: RouteObject[] = [
    {
        path: "/",
        element: <RequireAuth allowed={true} redirectTo="/login"><Home /></RequireAuth>
    },
    {
        path: "/home",
        element: <RequireAuth allowed={true} redirectTo="/login"><Home /></RequireAuth>
    },
    {
        path: "/chat",
        element: <RequireAuth allowed={true} redirectTo="/login"><Chat /></RequireAuth>
    },
    {
        path: "/login",
        element: <RequireAuth allowed={false} redirectTo="/"><Login /></RequireAuth>
    },
    {
        path: "*",
        element: <NotFound />
    }
]