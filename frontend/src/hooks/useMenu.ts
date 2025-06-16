import { useSelector } from 'react-redux';
import type { RootState } from '../store';

// { key: '1', icon: <MessageOutlined />, label: 'Chat' },
// { key: '2', icon: <DesktopOutlined />, label: '工作台' },
// { key: '3', icon: <ContainerOutlined />, label: '内容管理' },
// {
//   key: 'sub1',
//   label: '一级菜单',
//   icon: <MailOutlined />,
//   children: [
//     { key: '5', label: '子项一' },
//     { key: '6', label: '子项二' },
//   ],
// },
// {
//   key: 'sub2',
//   label: '设置',
//   icon: <AppstoreOutlined />,
//   children: [
//     { key: '9', label: '系统设置' },
//     {
//       key: 'sub3',
//       label: '更多',
//       children: [
//         { key: '11', label: '选项 A' },
//         { key: '12', label: '选项 B' },
//       ],
//     },
//   ],
// },


const userMenuList = [
    {
        "key": '1',
        "label": 'Chat',
        "icon": "MessageOutlined",
    },
    {
        "key": '2',
        "label": '工作台',
        "icon": "DesktopOutlined",
    },
    
];

const reviewerMenuList = [
    {
        "key": 'home',
        "label": '首页',
        "icon": "HomeOutlined",
    },
];

const adminMenuList = [
    {
        "key": 'home',
        "label": '首页',
        "icon": "HomeOutlined",
    },
];

export const useMenu = () => {
    const userInfo = useSelector((state: RootState) => state.authSlice.userInfo);
    const menuList = userInfo?.role === 'user' ? userMenuList : 
                    userInfo?.role === 'reviewer' ? reviewerMenuList : 
                    adminMenuList;
    return { menuList };
};