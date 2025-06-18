import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import type { RootState } from '../store';
import { setMenuList } from '../store/login/authSlice';

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
        "key": '1',
        "label": 'Chat',
        "icon": "MessageOutlined",
    },
    {
        "key": '2',
        "label": '工作台',
        "icon": "DesktopOutlined",
    },
    {
        "key": '3',
        "label": '数据标注',
        "icon": "ContainerOutlined",
    },
];

const adminMenuList = [
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
    {
        "key": '3',
        "label": '内容管理',
        "icon": "ContainerOutlined",
    },
    {
        "key": 'sub1',
        "label": '一级菜单',
        "icon": "MailOutlined",
        "children": [
            {
                "key": '5',
                "label": '子项一',
            },
            {
                "key": '6',
                "label": '子项二',
            },
        ]
    },
    {
        "key": 'sub2',
        "label": '设置',
        "icon": "AppstoreOutlined",
        "children": [
            {
                "key": '9',
                "label": '系统设置',
            },
            {
                "key": 'sub3',
                "label": '更多',
                "children": [
                    {
                        "key": '11',
                        "label": '选项 A',
                    },
                    {
                        "key": '12',
                        "label": '选项 B',
                    },
                ]
            },
        ]
    },
];

export const useMenu = () => {
    const dispatch = useDispatch();
    const { userRole, menuList } = useSelector((state: RootState) => state.authSlice);

    useEffect(() => {
        if (userRole) {
            // 根据用户角色选择对应的菜单
            let currentMenuList;
            switch (userRole) {
                case 'user':
                    currentMenuList = userMenuList;
                    break;
                case 'reviewer':
                    currentMenuList = reviewerMenuList;
                    break;
                case 'admin':
                    currentMenuList = adminMenuList;
                    break;
                default:
                    currentMenuList = userMenuList;
            }
            
            // 更新Redux中的菜单状态
            dispatch(setMenuList(currentMenuList));
        } else {
            // 用户未登录时清空菜单
            dispatch(setMenuList([]));
        }
    }, [userRole, dispatch]);

    return { menuList };
};