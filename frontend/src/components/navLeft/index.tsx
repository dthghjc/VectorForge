// src/components/navLeft/index.tsx
import { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown } from 'antd';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { clearAuth } from '../../store/login/authSlice';
import icons from './iconList';

const { Sider } = Layout;

/* ---------- 类型 ---------- */
interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  children?: MenuItem[];
}
interface MenuItemFromData {
  key: string;
  label: string;
  icon?: string;
  children?: MenuItemFromData[];
}

/* ---------- 组件 ---------- */
function NavLeft() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const username = sessionStorage.getItem('username') || '未登录';

  /* 折叠 / 悬浮 */
  const [collapsed, setCollapsed] = useState(true);
  const [hoverLogo, setHoverLogo] = useState(false);

  /* 菜单数据 */
  const { menuList } = useSelector((s: any) => s.authSlice);
  const [menuData, setMenuData] = useState<MenuItem[]>([]);
  
  /* 获取当前选中的菜单项 */
  const getSelectedKeys = () => {
    const currentPath = location.pathname;
    // 如果当前路径是根路径（/），且有菜单数据，选择第一个菜单项
    if (currentPath === '/' && menuData.length > 0) {
      return [menuData[0].key];
    }
    // 否则根据当前路径选择对应的菜单项
    return [currentPath];
  };

  /* 根据后端菜单映射图标 */
  useEffect(() => {
    setMenuData(mapMenuItems(menuList));
  }, [menuList]);

  function mapMenuItems(items: MenuItemFromData[]): MenuItem[] {
    return items.map((item) => ({
      key: item.key,
      label: item.label,
      icon: item.icon ? icons[item.icon] : undefined,
      children: item.children ? mapMenuItems(item.children) : undefined,
    }));
  }

  /* 点击菜单跳转 */
  function handleClick({ key }: { key: string }) {
    navigate(key);
  }

  /* 当路径为根路径时，自动跳转到第一个菜单项 */
  useEffect(() => {
    if (location.pathname === '/' && menuData.length > 0) {
      navigate(menuData[0].key, { replace: true });
    }
  }, [location.pathname, menuData, navigate]);

  /* 头像下拉菜单 */
  const avatarMenu = [
    {
      key: 'personal',
      icon: <UserOutlined />,
      label: <span style={{ color: '#666' }}>{username}</span>,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ];
  function onAvatarMenuClick({ key }: { key: string }) {
    if (key === 'logout') {
      dispatch(clearAuth());
      sessionStorage.clear();
      navigate('/login');
    }
    if (key === 'personal') navigate('/personal');
  }

  /* ---------- JSX ---------- */
  return (
    <Sider
      collapsed={collapsed}
      collapsible={false}
      width={200}
      collapsedWidth={80}
      style={{
        transition: 'all 0.4s cubic-bezier(0.25,1,0.5,1)',
        background: '#fff',
        borderRight: '1px solid #e0e0e0',
      }}
    >
      {/* 内部 flex 容器 */}
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 顶部 Logo & 折叠按钮 */}
        <div
          style={{
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: '0 16px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            flexShrink: 0,
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

        {/* 中间菜单 */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Menu
            mode="inline"
            theme="light"
            inlineCollapsed={collapsed}
            items={menuData}
            selectedKeys={getSelectedKeys()}
            onClick={handleClick}
            style={{ 
              height: '100%',
              borderRight: 'none'
            }}
          />
        </div>

        {/* 底部头像区域 */}
        <div
          style={{
            padding: '12px 16px',
            //borderTop: '1px solid #f4f4f4',
            flexShrink: 0,
          }}
        >
          <Dropdown
            menu={{ items: avatarMenu, onClick: onAvatarMenuClick }}
            placement="top"
          >
            <div
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
            
                /* ⭐ 优化：统一使用相同的动画时长和缓动函数 */
                paddingLeft: collapsed ? 0 : 8,
            
                /* ⭐ 位移动画优化 */
                transform: collapsed
                  ? 'translateX(calc(50% - 12px))'
                  : 'translateX(0)',
                transition: `
                  transform 0.4s cubic-bezier(0.25, 1, 0.5, 1),
                  padding-left 0.4s cubic-bezier(0.25, 1, 0.5, 1)
                `,
                gap: 8,
                overflow: 'hidden',
              }}
            >
              <Avatar 
                size="small" 
                icon={<UserOutlined />}
                style={{
                  /* ⭐ 头像也添加平滑过渡 */
                  transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
                  flexShrink: 0,
                }}
              />

              {/* ――― 优化文字动画，更加丝滑 ――― */}
              <span
                style={{
                  display: 'inline-block',
                  whiteSpace: 'nowrap',
                  position: 'relative',

                  /* ① 宽度动画：统一时长，优化延迟 */
                  maxWidth: collapsed ? 0 : 120,
                  
                  /* ② 透明度动画：收起时提前淡出，展开时延迟淡入 */
                  opacity: collapsed ? 0 : 1,

                  /* ③ 颜色过渡 */
                  color: collapsed ? 'transparent' : '#666',

                  /* ④ 统一所有动画参数，创造丝滑效果 */
                  transition: collapsed 
                    ? `
                        opacity 0.15s ease-out,
                        color 0.15s ease-out,
                        max-width 0.35s cubic-bezier(0.25, 1, 0.5, 1) 0.05s
                      `
                    : `
                        max-width 0.4s cubic-bezier(0.25, 1, 0.5, 1),
                        opacity 0.25s ease-in 0.15s,
                        color 0.25s ease-in 0.15s
                      `,
                  
                  /* ⑤ 防止文字溢出和抖动 */
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {username}
              </span>
            </div>
          </Dropdown>
        </div>
      </div>
    </Sider>
  );
}

export default NavLeft;
