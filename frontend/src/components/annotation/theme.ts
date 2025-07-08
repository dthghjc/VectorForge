import type { ThemeConfig } from 'antd';

/**
 * 标注系统主题配置
 * 基于 Ant Design 的主题定制，采用青绿色为主色调
 * 提供统一的视觉风格和用户体验
 */
export const theme: ThemeConfig = {
  // 全局设计令牌配置
  token: {
    // ====== 主色调配置 ======
    /** 主品牌色 - 青绿色，用于按钮、链接等主要交互元素 */
    colorPrimary: '#00BFA5',
    
    // ====== 背景色配置 ======
    /** 容器背景色 - 纯白色，用于卡片、模态框等容器 */
    colorBgContainer: '#FFFFFF',
    /** 布局背景色 - 浅灰色，用于页面整体背景 */
    colorBgLayout: '#F8F8F8',
    /** 基础背景色 - 纯白色 */
    colorBgBase: '#FFFFFF',
    
    // ====== 文字颜色配置 ======
    /** 主要文字颜色 - 深灰色，确保良好的可读性 */
    colorText: '#222222',
    /** 次要文字颜色 - 中等灰色，用于辅助信息 */
    colorTextSecondary: '#666666',
    /** 禁用状态文字颜色 - 浅灰色 */
    colorTextDisabled: '#A0A0A0',
    
    // ====== 边框颜色配置 ======
    /** 主边框颜色 - 浅灰色，用于分割线和组件边框 */
    colorBorder: '#E0E0E0',
    /** 次要边框颜色 - 与主边框颜色一致 */
    colorBorderSecondary: '#E0E0E0',
    
    // ====== 圆角配置 ======
    /** 统一圆角大小 - 6px，提供现代化的视觉效果 */
    borderRadius: 6,
    
    // ====== 字体配置 ======
    /** 字体族 - 系统字体优先，确保跨平台一致性 */
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    /** 基础字体大小 */
    fontSize: 14,
    /** 一级标题字体大小 */
    fontSizeHeading1: 24,
    /** 二级标题字体大小 */
    fontSizeHeading2: 20,
    /** 三级标题字体大小 */
    fontSizeHeading3: 18,
    /** 四级标题字体大小 */
    fontSizeHeading4: 16,
    /** 五级标题字体大小 */
    fontSizeHeading5: 14,
    
    // ====== 间距配置 ======
    /** 标准内边距 */
    padding: 16,
    /** 超小内边距 */
    paddingXS: 8,
    /** 小内边距 */
    paddingSM: 12,
    /** 大内边距 */
    paddingLG: 24,
    /** 超大内边距 */
    paddingXL: 32,
    
    // ====== 阴影配置 ======
    /** 主要阴影效果 - 轻微阴影，增加层次感 */
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    /** 次要阴影效果 - 较深阴影，用于重要元素 */
    boxShadowSecondary: '0 4px 16px rgba(0, 0, 0, 0.08)',
    
    // ====== 状态颜色配置 ======
    /** 成功状态颜色 - 保持 Ant Design 默认值 */
    colorSuccess: '#52c41a',
    /** 警告状态颜色 - 保持 Ant Design 默认值 */
    colorWarning: '#faad14',
    /** 错误状态颜色 - 保持 Ant Design 默认值 */
    colorError: '#ff4d4f',
    /** 信息状态颜色 - 使用主品牌色 */
    colorInfo: '#00BFA5',
  },
  
  // 组件级别的样式定制
  components: {
    // ====== 表格组件定制 ======
    Table: {
      /** 表头背景色 - 浅灰色，区分表头和表体 */
      headerBg: '#FAFAFA',
      /** 表头文字颜色 */
      headerColor: '#222222',
      /** 行悬停背景色 - 提供交互反馈 */
      rowHoverBg: '#F5F5F5',
    },
    
    // ====== 模态框组件定制 ======
    Modal: {
      /** 标题字体大小 - 稍大于基础字体 */
      titleFontSize: 18,
      /** 内容背景色 */
      contentBg: '#FFFFFF',
    },
    
    // ====== 按钮组件定制 ======
    Button: {
      /** 主要按钮阴影效果 - 使用主品牌色的半透明阴影 */
      primaryShadow: '0 2px 0 rgba(0, 191, 165, 0.1)',
    },
    
    // ====== 标签组件定制 ======
    Tag: {
      /** 默认标签背景色 */
      defaultBg: '#F5F5F5',
      /** 默认标签文字颜色 */
      defaultColor: '#666666',
    },
    
    // ====== 卡片组件定制 ======
    Card: {
      /** 卡片阴影效果 - 轻微阴影增加层次感 */
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    },
    
    // ====== 输入框组件定制 ======
    Input: {
      /** 输入框圆角 - 较小的圆角值 */
      borderRadius: 4,
    },
    
    // ====== 选择器组件定制 ======
    Select: {
      /** 选择器圆角 - 与输入框保持一致 */
      borderRadius: 4,
    },
    
    // ====== 折叠面板组件定制 ======
    Collapse: {
      /** 面板头部背景色 */
      headerBg: '#FAFAFA',
      /** 面板内容背景色 */
      contentBg: '#FFFFFF',
    }
  },
};