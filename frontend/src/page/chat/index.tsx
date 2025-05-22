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
    QuestionCircleOutlined,
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
    useXAgent,
    useXChat,
  } from '@ant-design/x';
  import { Avatar, Button, Flex, type GetProp, Space, Spin, message } from 'antd';
  import { createStyles } from 'antd-style';
  import dayjs from 'dayjs';
  import React, { useEffect, useRef, useState } from 'react';
  
  // 定义消息气泡数据类型
  type BubbleDataType = {
    role: string;
    content: string;
  };
  
  // 默认会话列表
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
  
  // 热门话题数据
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
  
  // 设计指南数据
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
  
  // 发送者提示词数据
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
  
  // 创建样式
  const useStyle = createStyles(({ token, css }) => {
    return {
      // 布局样式
      layout: css`
        width: 100%;
        min-width: 1000px;
        height: 100vh;
        display: flex;
        background: ${token.colorBgContainer};
        font-family: AlibabaPuHuiTi, ${token.fontFamily}, sans-serif;
      `,
      // 侧边栏样式
      sider: css`
        background: ${token.colorBgLayout}80;
        width: 280px;
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: 0 12px;
        box-sizing: border-box;
      `,
      // Logo样式
      logo: css`
        display: flex;
        align-items: center;
        justify-content: start;
        padding: 0 24px;
        box-sizing: border-box;
        gap: 8px;
        margin: 24px 0;
  
        span {
          font-weight: bold;
          color: ${token.colorText};
          font-size: 16px;
        }
      `,
      // 添加按钮样式
      addBtn: css`
        background: #1677ff0f;
        border: 1px solid #1677ff34;
        height: 40px;
      `,
      // 会话列表样式
      conversations: css`
        flex: 1;
        overflow-y: auto;
        margin-top: 12px;
        padding: 0;
  
        .ant-conversations-list {
          padding-inline-start: 0;
        }
      `,
      // 侧边栏底部样式
      siderFooter: css`
        border-top: 1px solid ${token.colorBorderSecondary};
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      `,
      // 聊天区域样式
      chat: css`
        height: 100%;
        width: 100%;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        padding-block: ${token.paddingLG}px;
        gap: 16px;
      `,
      // 聊天提示样式
      chatPrompt: css`
        .ant-prompts-label {
          color: #000000e0 !important;
        }
        .ant-prompts-desc {
          color: #000000a6 !important;
          width: 100%;
        }
        .ant-prompts-icon {
          color: #000000a6 !important;
        }
      `,
      // 聊天列表样式
      chatList: css`
        flex: 1;
        overflow: auto;
      `,
      // 加载消息样式
      loadingMessage: css`
        background-image: linear-gradient(90deg, #ff6b23 0%, #af3cb8 31%, #53b6ff 89%);
        background-size: 100% 2px;
        background-repeat: no-repeat;
        background-position: bottom;
      `,
      // 占位符样式
      placeholder: css`
        padding-top: 32px;
      `,
      // 发送者样式
      sender: css`
        width: 100%;
        max-width: 700px;
        margin: 0 auto;
      `,
      // 语音按钮样式
      speechButton: css`
        font-size: 18px;
        color: ${token.colorText} !important;
      `,
      // 发送者提示样式
      senderPrompt: css`
        width: 100%;
        max-width: 700px;
        margin: 0 auto;
        color: ${token.colorText};
      `,
    };
  });
  
  // 独立聊天组件
  const Independent: React.FC = () => {
    const { styles } = useStyle();
    // 用于中止请求的控制器
    const abortController = useRef<AbortController>(null);
  
    // ==================== 状态管理 ====================
    // 消息历史记录
    const [messageHistory, setMessageHistory] = useState<Record<string, any>>({});
    // 会话列表
    const [conversations, setConversations] = useState(DEFAULT_CONVERSATIONS_ITEMS);
    // 当前会话
    const [curConversation, setCurConversation] = useState(DEFAULT_CONVERSATIONS_ITEMS[0].key);
    // 附件面板是否打开
    const [attachmentsOpen, setAttachmentsOpen] = useState(false);
    // 已附加文件
    const [attachedFiles, setAttachedFiles] = useState<GetProp<typeof Attachments, 'items'>>([]);
    // 输入框值
    const [inputValue, setInputValue] = useState('');
  
    /**
     * 🔔 请替换BASE_URL, PATH, MODEL, API_KEY为你自己的值
     */
  
    // ==================== 运行时 ====================
    // 初始化AI代理
    const [agent] = useXAgent<BubbleDataType>({
      baseURL: 'https://api.x.ant.design/api/llm_siliconflow_deepseekr1',
      model: 'deepseek-ai/DeepSeek-R1',
      dangerouslyApiKey: 'Bearer sk-xxxxxxxxxxxxxxxxxxxx',
    });
    // 加载状态
    const loading = agent.isRequesting();
  
    // 初始化聊天功能
    const { onRequest, messages, setMessages } = useXChat({
      agent,
      // 请求失败时的回调
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
      // 转换消息
      transformMessage: (info) => {
        const { originMessage, chunk } = info || {};
        let currentContent = '';
        let currentThink = '';
        try {
          if (chunk?.data && !chunk?.data.includes('DONE')) {
            const message = JSON.parse(chunk?.data);
            currentThink = message?.choices?.[0]?.delta?.reasoning_content || '';
            currentContent = message?.choices?.[0]?.delta?.content || '';
          }
        } catch (error) {
          console.error(error);
        }
  
        let content = '';
  
        if (!originMessage?.content && currentThink) {
          content = `<think>${currentThink}`;
        } else if (
          originMessage?.content?.includes('<think>') &&
          !originMessage?.content.includes('</think>') &&
          currentContent
        ) {
          content = `${originMessage?.content}</think>${currentContent}`;
        } else {
          content = `${originMessage?.content || ''}${currentThink}${currentContent}`;
        }
        return {
          content: content,
          role: 'assistant',
        };
      },
      // 解析中止控制器
      resolveAbortController: (controller) => {
        abortController.current = controller;
      },
    });
  
    // ==================== 事件处理 ====================
    // 提交消息
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
  
    // ==================== 组件节点 ====================
    // 聊天侧边栏
    const chatSider = (
      <div className={styles.sider}>
        {/* 🌟 Logo */}
        <div className={styles.logo}>
          <img
            src="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*eco6RrQhxbMAAAAAAAAAAAAADgCCAQ/original"
            draggable={false}
            alt="logo"
            width={24}
            height={24}
          />
          <span>Ant Design X</span>
        </div>
  
        {/* 🌟 添加会话 */}
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
          className={styles.addBtn}
          icon={<PlusOutlined />}
        >
          New Conversation
        </Button>
  
        {/* 🌟 会话管理 */}
        <Conversations
          items={conversations}
          className={styles.conversations}
          activeKey={curConversation}
          onActiveChange={async (val) => {
            abortController.current?.abort();
            // 中止执行将触发异步requestFallback，可能导致时序问题
            // 在未来的版本中，将添加sessionId功能来解决这个问题
            setTimeout(() => {
              setCurConversation(val);
              setMessages(messageHistory?.[val] || []);
            }, 100);
          }}
          groupable
          styles={{ item: { padding: '0 8px' } }}
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
                  // 删除操作会修改curConversation并触发onActiveChange，所以需要延迟执行以确保在最后正确覆盖
                  // 这个功能将在未来版本中修复
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
  
        <div className={styles.siderFooter}>
          <Avatar size={24} />
          <Button type="text" icon={<QuestionCircleOutlined />} />
        </div>
      </div>
    );
    // 聊天列表
    const chatList = (
      <div className={styles.chatList}>
        {messages?.length ? (
          /* 🌟 消息列表 */
          <Bubble.List
            items={messages?.map((i) => ({
              ...i.message,
              classNames: {
                content: i.status === 'loading' ? styles.loadingMessage : '',
              },
              typing: i.status === 'loading' ? { step: 5, interval: 20, suffix: <>💗</> } : false,
            }))}
            style={{ height: '100%', paddingInline: 'calc(calc(100% - 700px) /2)' }}
            roles={{
              assistant: {
                placement: 'start',
                footer: (
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
          />
        ) : (
          <Space
            direction="vertical"
            size={16}
            style={{ paddingInline: 'calc(calc(100% - 700px) /2)' }}
            className={styles.placeholder}
          >
            <Welcome
              variant="borderless"
              icon="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*s5sNRo5LjfQAAAAAAAAAAAAADgCCAQ/fmt.webp"
              title="Hello, I'm Ant Design X"
              description="Base on Ant Design, AGI product interface solution, create a better intelligent vision~"
              extra={
                <Space>
                  <Button icon={<ShareAltOutlined />} />
                  <Button icon={<EllipsisOutlined />} />
                </Space>
              }
            />
            <Flex gap={16}>
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
                className={styles.chatPrompt}
              />
  
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
                className={styles.chatPrompt}
              />
            </Flex>
          </Space>
        )}
      </div>
    );
    // 发送者头部
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
    // 聊天发送者
    const chatSender = (
      <>
        {/* 🌟 提示词 */}
        <Prompts
          items={SENDER_PROMPTS}
          onItemClick={(info) => {
            onSubmit(info.data.description as string);
          }}
          styles={{
            item: { padding: '6px 12px' },
          }}
          className={styles.senderPrompt}
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
          className={styles.sender}
          allowSpeech
          actions={(_, info) => {
            const { SendButton, LoadingButton, SpeechButton } = info.components;
            return (
              <Flex gap={4}>
                <SpeechButton className={styles.speechButton} />
                {loading ? <LoadingButton type="default" /> : <SendButton type="primary" />}
              </Flex>
            );
          }}
          placeholder="Ask or input / use skills"
        />
      </>
    );
  
    // 更新消息历史记录
    useEffect(() => {
      // 历史记录模拟
      if (messages?.length) {
        setMessageHistory((prev) => ({
          ...prev,
          [curConversation]: messages,
        }));
      }
    }, [messages]);
  
    // ==================== 渲染 =================
    return (
      <div className={styles.layout}>
        {chatSider}
  
        <div className={styles.chat}>
          {chatList}
          {chatSender}
        </div>
      </div>
    );
  };
  
  export default Independent;