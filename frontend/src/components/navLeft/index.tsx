import { Menu } from 'antd';
import { useState, useEffect } from 'react';
import logo from "../../assets/logo.png"
import icons from './iconList';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import "./index.scss"

interface MenuItem {
    key: string;
    label: string;
    icon?: React.ReactNode;
    children?: MenuItem[]
}

function NavLeft() {
    const navigate = useNavigate();
    const menuList = useSelector((state: RootState) => state.authSlice.menuList);
    const [menuData, setMenuData] = useState<MenuItem[]>([]);
    const location = useLocation();

    useEffect(() => {
        configMenu()
    }, [menuList]);

    function configMenu() {
        // 处理菜单数据，将icon字符串转换为实际的React组件
        const processedMenu = menuList.map((item: any) => ({
            ...item,
            icon: item.icon ? icons[item.icon] : undefined,
            children: item.children?.map((child: any) => ({
                ...child,
                icon: child.icon ? icons[child.icon] : undefined
            }))
        }));
        
        setMenuData(processedMenu);
    }

    const handleMenuClick = (e: any) => {
        // 处理菜单点击事件
        console.log('菜单点击:', e.key);
        // 可以根据key来导航到对应页面
        // navigate(`/${e.key}`);
    };

    return (
        <div className="nav-left">
            <div className="logo">
                <img src={logo} alt="logo" />
            </div>
            <Menu
                mode="inline"
                selectedKeys={[location.pathname.slice(1) || 'home']}
                items={menuData}
                onClick={handleMenuClick}
            />
        </div>
    );
}

export default NavLeft;
