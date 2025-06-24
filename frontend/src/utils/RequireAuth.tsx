import { useSelector } from "react-redux";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";


interface Iprops {
    allowed: boolean;
    redirectTo: string;
    children: React.ReactNode;
}


function RequireAuth({ allowed, redirectTo, children }: Iprops) {
    // 从 Redux store 获取 token
    const { token } = useSelector((state: any) => state.authSlice);
    const isLogin = token ? true : false;
    const navigate = useNavigate();

    useEffect(() => {
        // allowed表示当前路由是否需要登录   isLogin表示用户是否登录
        if (allowed !== isLogin) {
            navigate(redirectTo);
        }
    }, [allowed, isLogin, redirectTo]);

    return allowed === isLogin ? <>{children}</> : null;
}

export default RequireAuth;