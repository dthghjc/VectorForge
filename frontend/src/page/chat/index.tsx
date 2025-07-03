import {
  CloudUploadOutlined,
  CopyOutlined,
  DeleteOutlined,
  DislikeOutlined,
  EditOutlined,
  EllipsisOutlined,
  LikeOutlined,
  PaperClipOutlined,
  PlusOutlined,
  ReloadOutlined,
  ShareAltOutlined,
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
import { useStreamingBackendAgent } from '../../hooks/useBackendAgentSimple';
import { DEFAULT_CONVERSATIONS_ITEMS } from './data/conversations';
import { HOT_TOPICS, DESIGN_GUIDE } from './data/prompts';
import { SENDER_PROMPTS } from './data/senderPrompts';
import { getChats, getChat } from '../../api/chat';

import cflpLogo from '../../assets/cflplogo.png';

// 根据时间判断分组
const getTimeGroup = (dateStr: string): string => {
  const messageDate = dayjs(dateStr);
  const today = dayjs().startOf('day');
  const yesterday = today.subtract(1, 'day');
  
  if (messageDate.isAfter(today)) {
    return 'Today';
  } else if (messageDate.isAfter(yesterday)) {
    return 'Yesterday';
  } else {
    return 'Earlier';
  }
};

const Independent: React.FC = () => {
  const [messageId, setMessageId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);

  
  const abortController = useRef<AbortController>(null);

  // ==================== State ====================
  // 保存各回话的历史消息
  const [messageHistory, setMessageHistory] = useState<Record<string, any>>({});

  // 会话列表（左栏）
  const [conversations, setConversations] = useState(DEFAULT_CONVERSATIONS_ITEMS);
  // 加载状态
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [currentChatLoading, setCCurrentChatLoading] = useState(false);
  // 记录已更新过名称的chat，避免重复更新
  const [updatedChatNames, setUpdatedChatNames] = useState<Set<string>>(new Set());

  // 当前激活会话 key，决定右侧显示哪段聊天记录
  const [curConversation, setCurConversation] = useState('');
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
  /*
   * messages: 一个数组，包含了当前所有聊天消息的数据。
   *           发送消息、接收到 AI 回复、或者消息状态更新时，这个 messages 数组的内容都会随之改变。
   * setMessages：一个 React 状态更新函数，与 messages 状态变量配对。用于安全地更新 messages 数组。
   *              当调用 setMessages 时，React 会检测到状态变化，并重新渲染使用 messages 的组件（比如 Bubble.List），从而更新 UI。
   * onRequest：一个函数，用于触发一次聊天请求（通常是向 AI 后端发送用户输入）。
   *            当用户在输入框中按下回车或点击发送按钮时，你会调用 onRequest 并传入用户的消息内容。useXChat 内部会负责处理这个请求的整个生命周期：
   */
  const { onRequest, messages, setMessages } = useXChat({
    // 绑定自定义的后端 Agent，用于与 VectorForge API 通信
    agent,
    // 请求失败时的降级处理函数
    // 当接口报错或被用户主动取消时，返回友好的错误提示
    requestFallback: (_, { error }) => {
      // 检查是否为用户主动取消请求
      if (error.name === 'AbortError') {
        return {
          content: 'Request is aborted',
          role: 'assistant',
        };
      }
      // 其他错误情况返回通用错误提示
      return {
        content: 'Request failed, please try again!',
        role: 'assistant',
      };
    },
    
    // 流式响应消息转换函数
    // 用于处理从后端接收到的 SSE 数据流，将分块数据拼接成完整消息
    transformMessage: (info) => {
      const { originMessage, chunk } = info || {};  // 解构 info 对象，获取原始消息和当前数据块
      let currentContent = '';  // 初始化当前数据块解析出的内容
      
      try {
        // 检查数据块是否有效且不包含结束标记 'DONE'
        if (chunk?.data && !chunk?.data.includes('DONE')) {
          // 解析 JSON 格式的事件数据
          const eventData = JSON.parse(chunk?.data);
          
          // 根据事件类型提取相应的内容
          // 根据dify的规则，优先处理 'message' 事件，并从 'answer' 字段获取内容
          if (eventData.event === 'message' && typeof eventData.answer === 'string') {
            currentContent = eventData.answer;
          } else if (eventData.event === 'message_delta' && eventData.delta) {
            // 1. message_delta 事件：通常用于逐字或逐句的增量更新
            // 增量消息事件：提取 delta 字段作为当前内容
            currentContent = eventData.delta;
          } else if (eventData.event === 'workflow_finished' && eventData.data?.outputs?.answer) {
            // 2. workflow_finished 事件：表示某个内部工作流完成，并提供了最终答案
            // 工作流完成事件：提取最终答案
            currentContent = eventData.data.outputs.answer;
            if (eventData.message_id) { setMessageId(eventData.message_id); }
            if (eventData.conversation_id) { 
              setConversationId(eventData.conversation_id);
              // 如果是临时chat且获得了真实的conversation_id，更新chat名称
              updateChatName(eventData.conversation_id);
            }
            if (eventData.task_id) { setTaskId(eventData.task_id); } 
          } else if (eventData.content) {
            // 3. 通用 content 字段：如果以上都不匹配，直接取 content 字段
            // 通用内容事件：直接提取 content 字段
            currentContent = eventData.content;
          }
        }
      } catch (error) {
        // 解析失败时记录错误日志
        console.error('解析消息失败:', error);
      }

      // 将新内容拼接到原有消息内容后面，构建完整消息
      const content = `${originMessage?.content || ''}${currentContent}`;
      
      // 返回标准格式的助手消息
      return {
        content: content,
        role: 'assistant',
      };
    },
    
    // AbortController 暴露函数
    // 将内部控制器实例赋值给外部的 useRef 对象
    // controller 就是 useXChat 内部创建并用于管理其网络请求的 AbortController 实例
    resolveAbortController: (controller) => {
      // 将传入的 controller 赋值给外部声明的 abortController.current
      // 在取消按钮的 onClick 事件中调用 abortController.current.abort() 来中断当前正在进行的网络请求。
      abortController.current = controller;
    },
  });

  // 从后端加载对话列表
  const loadConversations = async () => {
    try {
      setConversationsLoading(true);
      const chats = await getChats({ limit: 100 });
      
      const formattedConversations = chats.map(chat => ({
        key: chat.id,
        label: chat.title || `Conversation ${chat.id.slice(0, 8)}`,
        group: getTimeGroup(chat.created_at),
      }));
      
      setConversations(formattedConversations);
      
      // 如果有对话，默认选中第一个
      if (formattedConversations.length > 0 && !curConversation) {
        const firstChat = formattedConversations[0];
        setCurConversation(firstChat.key);
        // 加载第一个对话的消息
        await loadChatMessages(firstChat.key);
      }
    } catch (error) {
      console.error('加载对话列表失败:', error);
      message.error('加载对话列表失败');
    } finally {
      setConversationsLoading(false);
    }
  };

  // 从后端加载指定对话的消息
  const loadChatMessages = async (chatId: string) => {
    try {
      setCCurrentChatLoading(true);
      const chatData = await getChat(chatId);
      
      // 转换消息格式以适配 XChat
      const formattedMessages = chatData.messages.map((msg, index) => ({
        id: msg.id,
        message: {
          role: msg.role,
          content: msg.content,
        },
        status: 'local' as const,
      }));
      
      // 更新消息历史和当前消息
      setMessageHistory(prev => ({
        ...prev,
        [chatId]: formattedMessages,
      }));
      
      setMessages(formattedMessages);
      setConversationId(chatId);
    } catch (error) {
      console.error('加载对话消息失败:', error);
      message.error('加载对话消息失败');
    } finally {
      setCCurrentChatLoading(false);
    }
  };

  // 页面初始化时加载对话列表
  useEffect(() => {
    loadConversations();
  }, []);

  // 判断是否是临时chat（时间戳格式的key）
  const isTempChat = (chatKey: string): boolean => {
    return /^\d{13}$/.test(chatKey); // 13位时间戳
  };

  // 更新chat名称（仅对临时chat且未更新过的进行更新）
  const updateChatName = async (realChatId: string) => {
    // 如果当前conversation不是临时chat，或者已经更新过，则跳过
    if (!isTempChat(curConversation) || updatedChatNames.has(curConversation)) {
      return;
    }

    try {
      // 从后端获取chat详情来获取真实标题
      const chatData = await getChat(realChatId);
      
      // 更新conversations列表中对应项的key和label
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.key === curConversation 
            ? { 
                ...conv, 
                key: realChatId,
                label: chatData.title || `Conversation ${realChatId.slice(0, 8)}` 
              }
            : conv
        )
      );
      
      // 更新消息历史：将临时key的消息历史迁移到真实chatId
      setMessageHistory(prevHistory => {
        const newHistory = { ...prevHistory };
        if (newHistory[curConversation]) {
          newHistory[realChatId] = newHistory[curConversation];
          delete newHistory[curConversation];
        }
        return newHistory;
      });
      
      // 更新消息历史：将临时key的消息历史迁移到真实chatId
      setMessageHistory(prevHistory => {
        const newHistory = { ...prevHistory };
        if (newHistory[curConversation]) {
          newHistory[realChatId] = newHistory[curConversation];
          delete newHistory[curConversation];
        }
        return newHistory;
      });
      
      // 更新消息历史：将临时key的消息历史迁移到真实chatId
      setMessageHistory(prevHistory => {
        const newHistory = { ...prevHistory };
        if (newHistory[curConversation]) {
          newHistory[realChatId] = newHistory[curConversation];
          delete newHistory[curConversation];
        }
        return newHistory;
      });
      
      // 更新消息历史：将临时key的消息历史迁移到真实chatId
      setMessageHistory(prevHistory => {
        const newHistory = { ...prevHistory };
        if (newHistory[curConversation]) {
          newHistory[realChatId] = newHistory[curConversation];
          delete newHistory[curConversation];
        }
        return newHistory;
      });
      
      // 更新当前conversation的key
      setCurConversation(realChatId);
      
      // 记录已更新，避免重复更新
      setUpdatedChatNames(prev => new Set(prev).add(curConversation));
      
    } catch (error) {
      console.error('更新chat名称失败:', error);
    }
  };

  // 创建新对话的函数
  const createNewConversation = () => {
    // 前端创建临时对话，使用时间戳作为临时key
    const now = dayjs().valueOf().toString();
    const newConversationItem = {
      key: now,
      label: `New Conversation ${conversations.length + 1}`,
      group: 'Today',
    };
    
    // 添加到对话列表并切换到新对话
    setConversations([newConversationItem, ...conversations]);
    setCurConversation(now);
    setMessages([]);
    setConversationId(null); // 重置为null，等待后端创建
  };

  // ==================== Event ====================
  // 发送消息事件
  const onSubmit = (val: string) => {
    if (!val) return;  // 如果输入值为空，则不发送

    if (loading) {  // 如果当前正在请求中，提示等待
      message.error('Request is in progress, please wait for the request to complete.');
      return;
    }

    onRequest({  // 调用 onRequest 函数，传入一个对象，包含两个属性：stream 和 message
      stream: true,
      message: { role: 'user', content: val },
      conversation_id: conversationId,
    });
  };

  // ==================== Nodes ====================
  // 左侧栏
  const chatSider = (
    <div className="chat-sider">
      {/* 🌟 Logo */}
      <div className="chat-logo">
        <img
          src={ cflpLogo }
          draggable={false}
          alt="logo"
          width={24}
          height={24}
        />
        <span>Vector Forge</span>
      </div>

      {/* 🌟 添加会话,向 conversations prepend 一个条目并切到新会话 */}
      <Button
        onClick={createNewConversation}
        type="link"
        className="chat-add-btn"
        icon={<PlusOutlined />}
      >
        New Conversation
      </Button>

      {/* 🌟 会话管理 */}
      {conversationsLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <Spin size="default" />
        </div>
      ) : (
        <Conversations
          items={conversations}
          className="chat-conversations"
          activeKey={curConversation}
          onActiveChange={async (val) => {
          // 1. 中止当前可能正在进行的请求
          abortController.current?.abort();
          
          // 2. 设置当前会话并加载消息
          setCurConversation(val);
          
          // 3. 从缓存或后端加载消息
          if (messageHistory[val]) {
            // 如果有缓存，直接使用
            setMessages(messageHistory[val]);
            setConversationId(val);
          } else {
            // 如果没有缓存，从后端加载
            await loadChatMessages(val);
          }
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
      )}
    </div>
  );
  // 中部聊天记录
  const chatList = (
    <div className="chat-list">
      {currentChatLoading ? (
        /* 🌟 消息加载中 */
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Spin size="large" />
        </div>
      ) : messages?.length ? (
        /* 🌟 消息列表 */
        <Bubble.List
          items={messages?.map((i, index) => ({
            ...i.message,  //展开 message 对象
            key: i.id ?? index.toString(),  // 设置消息的唯一标识,如果 id 不存在，则使用 index 作为唯一标识
            classNames: {
              content: i.status === 'loading' ? 'loading-message' : '',  // 如果消息状态为 loading，则添加 loading-message 类名
            },
            typing: i.status === 'loading' ? { step: 5, interval: 20, suffix: <>{/*💗*/}</> } : false,  // 如果消息状态为 loading，则添加 typing(打字机效果) 属性
          }))}
          // 定义了不同角色（assistant 和 user）的消息显示方式。
          roles={{
            assistant: {
              placement: 'start',  // 助手消息显示在聊天气泡的左侧（或开始位置）
              messageRender: renderMarkdown,  // 设置消息的渲染方式为 renderMarkdown
              // 在助手消息下方显示一个页脚，包含四个 Button 组件：重载、复制、点赞和点踩
              footer: (
                <div style={{ display: 'flex' }}>
                  <Button type="text" size="small" icon={<ReloadOutlined />} />
                  <Button type="text" size="small" icon={<CopyOutlined />} />
                  <Button type="text" size="small" icon={<LikeOutlined />} />
                  <Button type="text" size="small" icon={<DislikeOutlined />} />
                </div>
              ),
              loadingRender: () => <Spin size="small" />,  // 当消息状态为 loading 时，显示一个小的加载动画
            },
            user: { placement: 'end' },  // 用户消息显示在聊天气泡的右侧（或结束位置）
          }}
          autoScroll  // 在新消息添加时，自动将滚动条滚到底部，确保用户总是看到最新的对话内容。
          style={{ height: '100%', paddingInline: 'calc(calc(100% - 700px) /2)' }}  // 当前屏幕宽度减去 700px 后除以 2，也就是 左右各留一半的空白，使消息列表居中显示在 max-width: 700px 的区域内。
        />
      ) : (
        /* 🌟 占位页 */
        <Space
          direction="vertical"
          size={16}
          style={{ paddingInline: 'calc(calc(100% - 700px) /2)' }}
          className="chat-placeholder"
        >
          <Welcome
            variant="borderless"
            icon="https://cflp-top.bj.bcebos.com/zwdy-logo-top.png"
            // title="Hello, I'm Vector Forge"
            // description="Base on Ant Design, AGI product interface solution, create a better intelligent vision~"
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
                //onSubmit(info.data.description as string);
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
        wrap={true}
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