import {
  ApiOutlined,
  LineChartOutlined,
  BulbOutlined,
  BarChartOutlined,
  AuditOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { type GetProp } from 'antd';
import { Prompts } from '@ant-design/x';

/* 输入框上方的快捷提示词按钮数据 */
export const SENDER_PROMPTS: GetProp<typeof Prompts, 'items'> = [
  {
    key: '1',
    label: '技术分析',
    description: '请作为物流技术专家，准备分析前沿物流技术应用与影响。等待用户提出具体问题或技术名称。',
    icon: <ApiOutlined style={{ color: '#FFD700' }}/>,
  },
  {
    key: '2',
    label: '物流趋势',
    description: '请作为行业研究员，准备洞察物流发展趋势及未来挑战。等待用户告知关注的趋势方向。',
    icon: <LineChartOutlined style={{ color: '#1890FF' }}/>,
  },
  {
    key: '3',
    label: '优化建议',
    description: '请作为供应链优化顾问，准备提供提升运营效率与流程管理的策略。等待用户描述面临的具体问题或场景。',
    icon: <BulbOutlined style={{ color: '#722ED1' }}/>,
  },
  {
    key: '4',
    label: '成本分析',
    description: '请作为物流财务分析师，准备深入分析成本构成并提出降低费用措施。等待用户提供相关成本数据或疑问。',
    icon: <BarChartOutlined style={{ color: '#FF4D4F' }}/>,
  },
  {
    key: '5',
    label: '法规合规',
    description: '请作为物流法规专家，准备解答相关法律法规或合规性问题。等待用户提供具体法规名称或场景。',
    icon: <AuditOutlined style={{ color: '#964B00' }}/>,
  },
  {
    key: '6',
    label: '绿色物流',
    description: '请作为绿色物流专家，准备讨论可持续发展实践及环保策略。等待用户提出具体问题或关注领域。',
    icon: <GlobalOutlined style={{ color: '#52C41A' }}/>,
  },
]; 