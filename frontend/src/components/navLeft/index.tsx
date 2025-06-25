import { useState, useEffect } from 'react';
import { Menu, Layout } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import icons from './iconList';
import { useSelector } from 'react-redux';
import { getUserMenu } from '../../api/auth';
import { setMenuList } from '../../store/login/authSlice';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const { Sider } = Layout;
interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  children?: MenuItem[];
}
interface MenuItemFromData{
    key:string;
    label:string;
    icon?:string;
    children?:MenuItemFromData[]
}

function NavLeft() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(true);
  const [hoverLogo, setHoverLogo] = useState(false);

  const menuList = useSelector((state:any)=>state.authSlice);
  const [menuData, setMenuData] = useState<MenuItem[]>([]);

  useEffect(()=>{
    configMenu();
  },[menuList]);

  async function configMenu(){
    const response = await getUserMenu();
    const mappedMenuItems:MenuItem[]=mapMenuItems(response);
    setMenuData(mappedMenuItems);
  }
  
  function mapMenuItems(items:MenuItemFromData[]):any{
    return items.map((item:MenuItemFromData)=>({
        key:item.key,
        label:item.label,
        icon:item.icon ? icons[item.icon] : undefined,
        children:item.children?mapMenuItems(item.children):null
    }))
  }

  function handleClick({key}:{key:string}){
    navigate(key)
  }

  return (
    <Sider
      collapsed={collapsed}
      collapsible={false}
      width={256}
      collapsedWidth={80}
      style={{
        transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
        background: '#fff',
        borderRight: '1px solid #e0e0e0',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: '0 16px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={() => setHoverLogo(true)}
        onMouseLeave={() => setHoverLogo(false)}
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          hoverLogo ? (
            <MenuUnfoldOutlined />
          ) : (
            <span style={{ fontSize: 20 }}>🤓</span>
          )
        ) : (
          <>
            <span style={{ fontSize: 20 }}>🤓</span>
            <MenuFoldOutlined />
          </>
        )}
      </div>

      <Menu
        defaultSelectedKeys={['1']}
        mode="inline"
        theme="light"
        inlineCollapsed={collapsed}
        items={menuData}
        onClick={handleClick}
      />
    </Sider>
  );
}

export default NavLeft;
