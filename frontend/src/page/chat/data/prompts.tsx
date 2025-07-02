import {
  CommentOutlined,
  HeartOutlined,
  PaperClipOutlined,
  SmileOutlined,
} from '@ant-design/icons';

/* 右侧占位页里的两个 Prompts 面板（"Hot Topics"）的静态数据 */
export const HOT_TOPICS = {
  key: '1',
  label: 'Hot Topics',
  children: [
    {
      key: '1-1',
      description: '未来五年中国物流行业在供应链数字化、智能化和绿色化方面的主要发展趋势和挑战是什么？',
      icon: <span style={{ color: '#f93a4a', fontWeight: 700 }}>1</span>,
    },
    {
      key: '1-2',
      description: '针对“双碳”目标，物流行业在碳排放标准和绿色运输补贴方面的政策要求是什么？',
      icon: <span style={{ color: '#ff6565', fontWeight: 700 }}>2</span>,
    },
    {
      key: '1-3',
      description: '在生鲜冷链物流领域，如何通过优化运输和仓储来降低损耗、提升时效？',
      icon: <span style={{ color: '#ff8f1f', fontWeight: 700 }}>3</span>,
    },
    {
      key: '1-4',
      description: 'AI、物联网、大数据和区块链技术在物流领域有哪些最新应用进展？',
      icon: <span style={{ color: '#00000040', fontWeight: 700 }}>4</span>,
    },
    {
      key: '1-5',
      description: '如何利用数据分析识别和评估运输风险（如延误、货损），并提供规避策略？',
      icon: <span style={{ color: '#00000040', fontWeight: 700 }}>5</span>,
    },
  ],
};

/* 右侧占位页里的两个 Prompts 面板（"Design Guide"）的静态数据 */
export const DESIGN_GUIDE = {
  key: '2',
  label: 'Design Guide',
  children: [
    {
      key: '2-1',
      icon: <HeartOutlined />,
      label: 'Intention',
      description: 'AI understands user needs and provides solutions.',
    },
    {
      key: '2-2',
      icon: <SmileOutlined />,
      label: 'Role',
      description: "AI's public persona and image",
    },
    {
      key: '2-3',
      icon: <CommentOutlined />,
      label: 'Chat',
      description: 'How AI Can Express Itself in a Way Users Understand',
    },
    {
      key: '2-4',
      icon: <PaperClipOutlined />,
      label: 'Interface',
      description: 'AI balances "chat" & "do" behaviors.',
    },
  ],
}; 