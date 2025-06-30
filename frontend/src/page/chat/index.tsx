import {
  AppstoreAddOutlined,
  CloudUploadOutlined,
  CommentOutlined,
  CopyOutlined,
  DeleteOutlined,
  DislikeOutlined,
  EditOutlined,
  EllipsisOutlined,
  FileSearchOutlined,
  HeartOutlined,
  LikeOutlined,
  PaperClipOutlined,
  PlusOutlined,
  ProductOutlined,
  ReloadOutlined,
  ScheduleOutlined,
  ShareAltOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import {
  Attachments,
  Bubble,
  Conversations,
  Prompts,
  Sender,
  Welcome,
  useXChat,
} from '@ant-design/x';
import { Button, Flex, type GetProp, Space, Spin, message } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import './index.scss';
import { renderMarkdown } from '../../utils/renderMarkdown';
import { useStreamingBackendAgent } from '../../hooks/useBackendAgent';

type BubbleDataType = {
  role: string;
  content: string;
};

/* 左侧"最近会话"列表的初始数据 */
const DEFAULT_CONVERSATIONS_ITEMS = [
  {
    key: 'default-0',
    label: 'What is Ant Design X?',
    group: 'Today',
  },
  {
    key: 'default-1',
    label: 'How to quickly install and import components?',
    group: 'Today',
  },
  {
    key: 'default-2',
    label: 'New AGI Hybrid Interface',
    group: 'Yesterday',
  },
];

/* 右侧占位页里的两个 Prompts 面板（"Hot Topics"）的静态数据 */
const HOT_TOPICS = {
  key: '1',
  label: 'Hot Topics',
  children: [
    {
      key: '1-1',
      description: 'What has Ant Design X upgraded?',
      icon: <span style={{ color: '#f93a4a', fontWeight: 700 }}>1</span>,
    },
    {
      key: '1-2',
      description: 'New AGI Hybrid Interface',
      icon: <span style={{ color: '#ff6565', fontWeight: 700 }}>2</span>,
    },
    {
      key: '1-3',
      description: 'What components are in Ant Design X?',
      icon: <span style={{ color: '#ff8f1f', fontWeight: 700 }}>3</span>,
    },
    {
      key: '1-4',
      description: 'Come and discover the new design paradigm of the AI era.',
      icon: <span style={{ color: '#00000040', fontWeight: 700 }}>4</span>,
    },
    {
      key: '1-5',
      description: 'How to quickly install and import components?',
      icon: <span style={{ color: '#00000040', fontWeight: 700 }}>5</span>,
    },
  ],
};

/* 右侧占位页里的两个 Prompts 面板（"Design Guide"）的静态数据 */
const DESIGN_GUIDE = {
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

/* 输入框上方的快捷提示词按钮数据 */
const SENDER_PROMPTS: GetProp<typeof Prompts, 'items'> = [
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

const Independent: React.FC = () => {
  const abortController = useRef<AbortController>(null);

  // ==================== State ====================
  // 保存各回话的历史消息
  const [messageHistory, setMessageHistory] = useState<Record<string, any>>({});

  // 会话列表（左栏）
  const [conversations, setConversations] = useState(DEFAULT_CONVERSATIONS_ITEMS);

  // 当前激活会话 key，决定右侧显示哪段聊天记录
  const [curConversation, setCurConversation] = useState(DEFAULT_CONVERSATIONS_ITEMS[0].key);
  // 附件上传弹层开关 + 已选文件。由 Sender.Header 控制
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<GetProp<typeof Attachments, 'items'>>([]);
  // 	文本框输入，	绑定 <Sender>
  const [inputValue, setInputValue] = useState('');

  // ==================== Runtime ====================
  // 使用自定义的后端Agent，连接VectorForge API
  const [agent] = useStreamingBackendAgent();

  // 用于全局按钮状态
  const loading = agent.isRequesting();

  // 创建 XChat 实例，用于处理聊天逻辑
  // 绑定 agent，处理请求、消息流、消息转换等
  const { onRequest, messages, setMessages } = useXChat({
    agent,
    // 接口报错或被 abort 时替代回复
    requestFallback: (_, { error }) => {
      if (error.name === 'AbortError') {
        return {
          content: 'Request is aborted',
          role: 'assistant',
        };
      }
      return {
        content: 'Request failed, please try again!',
        role: 'assistant',
      };
    },
    // 流式响应分块时如何拼接内容
    transformMessage: (info) => {
      const { originMessage, chunk } = info || {};
      let currentContent = '';
      
      try {
        if (chunk?.data && !chunk?.data.includes('DONE')) {
          const eventData = JSON.parse(chunk?.data);
          
          // 处理不同类型的事件
          if (eventData.event === 'message_delta' && eventData.delta) {
            currentContent = eventData.delta;
          } else if (eventData.event === 'workflow_finished' && eventData.data?.outputs?.answer) {
            currentContent = eventData.data.outputs.answer;
          } else if (eventData.content) {
            currentContent = eventData.content;
          }
        }
      } catch (error) {
        console.error('解析消息失败:', error);
      }

      // 拼接内容
      const content = `${originMessage?.content || ''}${currentContent}`;
      
      return {
        content: content,
        role: 'assistant',
      };
    },
    // 把内部 AbortController 暴露给外部（点击"取消"用）。
    resolveAbortController: (controller) => {
      abortController.current = controller;
    },
  });

  // ==================== Event ====================
  const onSubmit = (val: string) => {
    if (!val) return;

    if (loading) {
      message.error('Request is in progress, please wait for the request to complete.');
      return;
    }

    onRequest({
      stream: true,
      message: { role: 'user', content: val },
    });
  };

  // ==================== Nodes ====================
  // 左侧栏
  const chatSider = (
    <div className="chat-sider">
      {/* 🌟 Logo */}
      <div className="chat-logo">
        <img
          src="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*eco6RrQhxbMAAAAAAAAAAAAADgCCAQ/original"
          draggable={false}
          alt="logo"
          width={24}
          height={24}
        />
        <span>Vector Forge</span>
      </div>

      {/* 🌟 添加会话,向 conversations prepend 一个条目并切到新会话 */}
      <Button
        onClick={() => {
          const now = dayjs().valueOf().toString();
          setConversations([
            {
              key: now,
              label: `New Conversation ${conversations.length + 1}`,
              group: 'Today',
            },
            ...conversations,
          ]);
          setCurConversation(now);
          setMessages([]);
        }}
        type="link"
        className="chat-add-btn"
        icon={<PlusOutlined />}
      >
        New Conversation
      </Button>

      {/* 🌟 会话管理 */}
      <Conversations
        items={conversations}
        className="chat-conversations"
        activeKey={curConversation}
        onActiveChange={async (val) => {
          abortController.current?.abort();
          // 取消请求时，会触发异步的 requestFallback，可能导致时间问题。
          // 未来版本将添加 sessionId 能力来解决这个问题。
          setTimeout(() => {
            setCurConversation(val);
            setMessages(messageHistory?.[val] || []);
          }, 100);
        }}
        groupable
        styles={{ item: { padding: '0 8px' } }}
        // 每条会话右键菜单（Rename / Delete）
        menu={(conversation) => ({
          items: [
            {
              label: 'Rename',
              key: 'rename',
              icon: <EditOutlined />,
            },
            {
              label: 'Delete',
              key: 'delete',
              icon: <DeleteOutlined />,
              danger: true,
              onClick: () => {
                const newList = conversations.filter((item) => item.key !== conversation.key);
                const newKey = newList?.[0]?.key;
                setConversations(newList);
                // 删除操作会修改 curConversation 并触发 onActiveChange，所以需要延迟执行以确保在最后正确覆盖。
                // 这个功能将在未来版本中修复。
                setTimeout(() => {
                  if (conversation.key === curConversation) {
                    setCurConversation(newKey);
                    setMessages(messageHistory?.[newKey] || []);
                  }
                }, 200);
              },
            },
          ],
        })}
      />
    </div>
  );
  // 中部聊天记录
  const chatList = (
    <div className="chat-list">
      {messages?.length ? (
        /* 🌟 消息列表 */
        <Bubble.List
          items={messages?.map((i, index) => ({
            ...i.message,
            key: i.id ?? index.toString(),  // 设置消息的唯一标识
            content:
              i.message.role === 'assistant'
                ? (
                    <div
                      className="markdown-body"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(i.message.content),
                      }}
                    />
                  )
                : i.message.content,
            classNames: {
              content: i.status === 'loading' ? 'loading-message' : '',
            },
            typing: i.status === 'loading' ? { step: 5, interval: 20, suffix: <>💗</> } : false, // 设置消息的加载状态
          }))}
          roles={{
            assistant: {
              placement: 'start',  // 设置消息的放置位置
              footer: (  // 设置消息的底部内容
                <div style={{ display: 'flex' }}>
                  <Button type="text" size="small" icon={<ReloadOutlined />} />
                  <Button type="text" size="small" icon={<CopyOutlined />} />
                  <Button type="text" size="small" icon={<LikeOutlined />} />
                  <Button type="text" size="small" icon={<DislikeOutlined />} />
                </div>
              ),
              loadingRender: () => <Spin size="small" />,
            },
            user: { placement: 'end' },
          }}
          autoScroll  // 在新消息添加时，自动将滚动条滚到底部，确保用户总是看到最新的对话内容。
          style={{ height: '100%', paddingInline: 'calc(calc(100% - 700px) /2)' }}  // 当前屏幕宽度减去 700px 后除以 2，也就是 左右各留一半的空白，使消息列表居中显示在 max-width: 700px 的区域内。
        />
      ) : (
        <Space
          direction="vertical"
          size={16}
          style={{ paddingInline: 'calc(calc(100% - 700px) /2)' }}
          className="chat-placeholder"
        >
          <Welcome
            variant="borderless"
            icon="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*s5sNRo5LjfQAAAAAAAAAAAAADgCCAQ/fmt.webp"
            title="Hello, I'm Vector Forge"
            description="Base on Ant Design, AGI product interface solution, create a better intelligent vision~"
            extra={
              <Space>
                <Button icon={<ShareAltOutlined />} />
                <Button icon={<EllipsisOutlined />} />
              </Space>
            }
          />
          <Flex gap={16}>
            {/* 右侧占位页里的两个 Prompts 面板（"Hot Topics"） */}
            <Prompts
              items={[HOT_TOPICS]}
              styles={{
                list: { height: '100%' },
                item: {
                  flex: 1,
                  backgroundImage: 'linear-gradient(123deg, #e5f4ff 0%, #efe7ff 100%)',
                  borderRadius: 12,
                  border: 'none',
                },
                subItem: { padding: 0, background: 'transparent' },
              }}
              onItemClick={(info) => {
                onSubmit(info.data.description as string);
              }}
              className="chat-prompt"
            />

            {/* 右侧占位页里的两个 Prompts 面板（"Design Guide"） */}
            <Prompts
              items={[DESIGN_GUIDE]}
              styles={{
                item: {
                  flex: 1,
                  backgroundImage: 'linear-gradient(123deg, #e5f4ff 0%, #efe7ff 100%)',
                  borderRadius: 12,
                  border: 'none',
                },
                subItem: { background: '#ffffffa6' },
              }}
              onItemClick={(info) => {
                onSubmit(info.data.description as string);
              }}
              className="chat-prompt"
            />
          </Flex>
        </Space>
      )}
    </div>
  );
  {/* 附件上传 */}
  const senderHeader = (
    <Sender.Header
      title="Upload File"
      open={attachmentsOpen}
      onOpenChange={setAttachmentsOpen}
      styles={{ content: { padding: 0 } }}
    >
      <Attachments
        beforeUpload={() => false}
        items={attachedFiles}
        onChange={(info) => setAttachedFiles(info.fileList)}
        placeholder={(type) =>
          type === 'drop'
            ? { title: 'Drop file here' }
            : {
                icon: <CloudUploadOutlined />,
                title: 'Upload files',
                description: 'Click or drag files to this area to upload',
              }
        }
      />
    </Sender.Header>
  );
  {/* 输入框 */}
  const chatSender = (
    <>
      {/* 🌟 4个快捷提示词 */}
      <Prompts
        items={SENDER_PROMPTS}
        onItemClick={(info) => {
          onSubmit(info.data.description as string);
        }}
        styles={{
          item: { padding: '6px 12px' },
        }}
        className="sender-prompt"
      />
      {/* 🌟 输入框 */}
      <Sender
        value={inputValue}
        header={senderHeader}
        onSubmit={() => {
          onSubmit(inputValue);
          setInputValue('');
        }}
        onChange={setInputValue}
        onCancel={() => {
          abortController.current?.abort();
        }}
        prefix={
          <Button
            type="text"
            icon={<PaperClipOutlined style={{ fontSize: 18 }} />}
            onClick={() => setAttachmentsOpen(!attachmentsOpen)}
          />
        }
        loading={loading}
        className="chat-sender"
        allowSpeech
        actions={(_, info) => {
          const { SendButton, LoadingButton, SpeechButton } = info.components;
          return (
            <Flex gap={4}>
              <SpeechButton className="speech-button" />
              {loading ? <LoadingButton type="default" /> : <SendButton type="primary" />}
            </Flex>
          );
        }}
        placeholder="Ask or input / use skills"
      />
    </>
  );

  useEffect(() => {
    // history mock
    if (messages?.length) {
      setMessageHistory((prev) => ({
        ...prev,
        [curConversation]: messages,
      }));
    }
  }, [messages]);

  // ==================== Render =================
  return (
    <div className="chat-layout">
      {chatSider}

      <div className="chat-container">
        {chatList}
        {chatSender}
      </div>
    </div>
  );
};

export default Independent;