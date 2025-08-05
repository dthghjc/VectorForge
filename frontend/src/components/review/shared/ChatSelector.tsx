/**
 * 对话选择组件
 * 用于在创建任务时选择相关对话
 */
import React from 'react';
import { Button, Select } from 'antd';

const { Option } = Select;

interface ChatSelectorProps {
    /** 对话来源类型 */
    chatSourceType: 'pending' | 'all';
    /** 已选择的对话数量 */
    selectedCount: number;
    /** 设置对话来源类型回调 */
    onSourceTypeChange: (type: 'pending' | 'all') => void;
    /** 选择对话回调 */
    onSelectChats: () => void;
}

/**
 * 对话选择器组件
 * 包含来源类型选择和对话选择按钮
 */
const ChatSelector: React.FC<ChatSelectorProps> = React.memo(({
    chatSourceType,
    selectedCount,
    onSourceTypeChange,
    onSelectChats
}) => {
    return (
        <div style={{ marginBottom: '8px' }}>
            {/* 对话来源类型选择 */}
            <Select
                value={chatSourceType}
                onChange={onSourceTypeChange}
                style={{ width: '200px', marginRight: '8px' }}
            >
                <Option value="pending">仅待审核对话</Option>
                <Option value="all">所有对话</Option>
            </Select>
            
            {/* 选择对话按钮，显示已选择数量 */}
            <Button onClick={onSelectChats}>
                选择对话 ({selectedCount} 已选择)
            </Button>
        </div>
    );
});

// 设置显示名称，便于调试
ChatSelector.displayName = 'ChatSelector';

export default ChatSelector;