import {
  AppstoreAddOutlined,
  FileSearchOutlined,
  ProductOutlined,
  ScheduleOutlined,
} from '@ant-design/icons';
import { type GetProp } from 'antd';
import { Prompts } from '@ant-design/x';

/* 输入框上方的快捷提示词按钮数据 */
export const SENDER_PROMPTS: GetProp<typeof Prompts, 'items'> = [
  {
    key: '1',
    description: 'Upgrades',
    icon: <ScheduleOutlined />,
  },
  {
    key: '2',
    description: 'Components',
    icon: <ProductOutlined />,
  },
  {
    key: '3',
    description: 'RICH Guide',
    icon: <FileSearchOutlined />,
  },
  {
    key: '4',
    description: 'Installation Introduction',
    icon: <AppstoreAddOutlined />,
  },
]; 