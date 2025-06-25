import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Layout, Dropdown, Avatar } from 'antd';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearAuth } from '../../store/login/authSlice';

const {Header} = Layout;

function HeaderBar() {
  const username = sessionStorage.getItem("username");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const onClick: MenuProps['onClick'] = ({ key }) => {
    if (key === '1') {
        //navigate('/personal');
    }else if (key === '2'){
        dispatch(clearAuth());
        sessionStorage.clear();
        navigate('/login');
    }
  };

  const items: MenuProps['items'] = [
    {
      key: '1',
      label: <span style={{ color: '#999' }}>{username || '未登录'}</span>, // 灰色用户名
      icon: <UserOutlined style={{ color: '#999' }} />,
    },
    {
      key: '2',
      label: '退出登录',
      icon: <LogoutOutlined />,
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
        }}
        >
        <Dropdown menu={{ items: items, onClick }} placement="bottomRight">
            <div
            style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
            }}
            >
            <Avatar size="small" icon={<UserOutlined />} />
            </div>
        </Dropdown>
        </Header>
    );
}

export default HeaderBar;
