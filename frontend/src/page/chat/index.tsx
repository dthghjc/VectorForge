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

/**
 * 一个更简单的轮询函数，专门用于获取Chat详情
 * @param chatId - 要获取的对话ID
 * @returns 返回成功获取的对话数据
 * @throws 如果超过最大次数仍失败，则抛出最后一个错误
 */
const simplePollForChat = async (chatId: string) => {
  const maxRetries = 5;    // 最多尝试5次
  const interval = 1000;  // 每次间隔1000毫秒

  for (let i = 0; i < maxRetries; i++) {
    try {
      // 尝试获取数据，如果成功，会直接在这里返回，循环结束
      return await getChat(chatId);
    } catch (error) {
      console.warn(`第 ${i + 1} 次尝试获取对话详情失败...`);
      
      // 如果已经是最后一次尝试，就直接把错误抛出去，不再等待
      if (i === maxRetries - 1) {
        throw error;
      }
      
      // 等待指定间隔时间，然后进入下一次循环尝试
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  // 如果因为某些原因循环结束了还没返回，也抛个错
  throw new Error('轮询意外结束');
};

const Independent: React.FC = () => {
  /*
  messageId, conversationId, taskId: 用于存储从后端流式响应中收到的ID信息。
  */
  const [messageId, setMessageId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);

  /*
  abortController: 用于管理网络请求的控制器。
  useRef: 持久化的引用
  作用: 当用户点击取消按钮时，调用 abortController.current.abort() 来中断当前正在进行的网络请求。
  */
  const abortController = useRef<AbortController>(null);

  /*
  客户端缓存。
  键 (Key): 对话的ID (curConversation)。
  值 (Value): 该对话的所有消息数组 (messages)。
  作用: 当用户切换对话时，组件会先检查 messageHistory 中是否已经有这个对话的消息记录。
  如果有，就直接从这里加载，避免了不必要的网络请求，大大提升了切换速度和用户体验。
  这个缓存在 useEffect 中被持续更新。
  */
  const [messageHistory, setMessageHistory] = useState<Record<string, any>>({});

  // 左侧对话列表的数据源
  const [conversations, setConversations] = useState(DEFAULT_CONVERSATIONS_ITEMS);
  // 左侧列表的加载状态
  const [conversationsLoading, setConversationsLoading] = useState(true);
  // 右侧当前对话的加载状态
  const [currentChatLoading, setCCurrentChatLoading] = useState(false);
  
  // 一个 Set 集合，用来记录哪些临时对话的名称已经被更新过，以防止重复请求和更新。
  const [updatedChatNames, setUpdatedChatNames] = useState<Set<string>>(new Set());

  // 当前激活会话 key，决定右侧显示哪段聊天记录
  const [curConversation, setCurConversation] = useState('');

  // 控制附件上传弹窗的开关和已上传的文件列表。
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<GetProp<typeof Attachments, 'items'>>([]);

  // 绑定到输入框 Sender 的当前输入值。
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
  
      // 步骤 1 & 2: 从后端获取并转换对话数据
      const chats = await getChats({ limit: 100 });
      const formattedConversations = chats.map(chat => ({
        key: chat.id,
        label: chat.title || `Conversation ${chat.id.slice(0, 8)}`,
        group: getTimeGroup(chat.created_at),
      }));
  
      // 关键逻辑：检查 sessionStorage，以避免刷新后重复创建
      const savedTempChatJSON = sessionStorage.getItem('tempChat');
  
      if (savedTempChatJSON) {
        // --- 如果存在已记录的临时Chat，则恢复它 ---
        const tempChat = JSON.parse(savedTempChatJSON);
        
        // 更新对话列表（恢复的临时Chat + 历史列表）
        setConversations([tempChat, ...formattedConversations]);
        
        // 激活这个已恢复的临时对话
        setCurConversation(tempChat.key);
        setMessages([]);
        setConversationId("");
  
      } else {
        // --- 如果不存在记录，则按步骤3和4创建全新的临时Chat ---
        
        // 步骤 3: 新建一个临时chat
        const now = dayjs().valueOf().toString();
        const newConversationItem = {
          key: now,
          label: `New Conversation`,
          group: 'Today',
        };
        
        // 步骤 4: 更新对话列表（新创建的临时Chat + 历史列表）
        setConversations([newConversationItem, ...formattedConversations]);
        
        // 激活新创建的临时对话
        setCurConversation(now);
        setMessages([]);
        setConversationId("");
        
        // 同时，将这个新创建的临时Chat存入sessionStorage
        sessionStorage.setItem('tempChat', JSON.stringify(newConversationItem));
      }
  
    } catch (error) {
      console.error('加载对话列表失败:', error);
      message.error('加载对话列表失败');
      // 可以在这里也加上创建新对话的降级处理
    } finally {
      setConversationsLoading(false);
    }
  };

  // 从后端加载指定对话的消息
  const loadChatMessages = async (chatId: string) => {
    try {
      setCCurrentChatLoading(true);
      // 从后端获取指定对话的消息
      const chatData = await getChat(chatId);
      // 将后端返回的消息数据转换为组件需要的格式适配 XChat
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
        ...prev,  // 保留之前的所有对话消息
        [chatId]: formattedMessages,  // 将当前对话的消息添加到 messageHistory 中
      }));
      
      // 更新当前对话的消息列表和对话ID
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

  // 更新chat名称（仅对临时chat且未更新过的进行更新），临时对话“转正”。
  const updateChatName = async (realChatId: string) => {
    // 如果当前conversation不是临时chat，或者已经更新过，则跳过
    if (!isTempChat(curConversation) || updatedChatNames.has(curConversation)) {
      console.log('updateChatName: 当前conversation不是临时chat，或者已经更新过，跳过');
      return;
    }

    try {
      // 从后端获取chat详情来获取真实标题
      const chatData = await simplePollForChat(realChatId);
      // 成功获取数据后，一次性更新所有UI状态
      const realLabel = chatData.title || `Conversation ${realChatId.slice(0, 8)}`;
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
      
      // 更新当前对话的key
      setCurConversation(realChatId);
      
      // 记录已更新，避免重复更新（临时chat的key）
      setUpdatedChatNames(prev => new Set(prev).add(curConversation));

      // 清理sessionStorage，完成临时对话的生命周期
      sessionStorage.removeItem('tempChat');
      
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
      label: `New Conversation`,
      group: 'Today',
    };
    
    // 添加到对话列表并切换到新对话
    setConversations([newConversationItem, ...conversations]);
    setCurConversation(now);
    setMessages([]);
    setConversationId(""); // 重置为null，等待后端创建
  };

  // ==================== Event ====================
  // 发送消息事件
  const onSubmit = (val: string) => {
    if (!val) return;  // 如果输入值为空，则不发送

    if (loading) {  // 如果当前正在请求中，提示等待
      message.error('Request is in progress, please wait for the request to complete.');
      return;
    }
    console.log('发送消息时，conversationId 的值为:', conversationId); 
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