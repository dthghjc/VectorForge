import { Layout, Avatar, Dropdown } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';

const { Header } = Layout;

function HeaderBar() {
  const username = sessionStorage.getItem("username");

  const menuItems = [
    {
      key: 'user',
      icon: <UserOutlined />,
      label: <span style={{ color: '#999' }}>{username || '未登录'}</span>, // 灰色用户名
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        sessionStorage.clear();
        window.location.href = '/login';
      },
    },
  ];

  return (
    <Header
      style={{
        height: 48,
        lineHeight: '48px',
        background: '#fff',
        padding: '0 16px',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        flexShrink: 0,
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <Dropdown menu={{ items: menuItems }} placement="bottomRight">
        <div
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Avatar size="small" icon={<UserOutlined />} />
        </div>
      </Dropdown>
    </Header>
  );
}

export default HeaderBar;
