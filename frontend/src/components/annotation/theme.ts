import type { ThemeConfig } from 'antd';

export const theme: ThemeConfig = {
  token: {
    // 主色调 - 青绿色
    colorPrimary: '#00BFA5',
    
    // 背景色
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#F8F8F8',
    colorBgBase: '#FFFFFF',
    
    // 文字颜色
    colorText: '#222222',
    colorTextSecondary: '#666666',
    colorTextDisabled: '#A0A0A0',
    
    // 边框颜色
    colorBorder: '#E0E0E0',
    colorBorderSecondary: '#E0E0E0',
    
    // 圆角
    borderRadius: 6,
    
    // 字体
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    fontSizeHeading1: 24,
    fontSizeHeading2: 20,
    fontSizeHeading3: 18,
    fontSizeHeading4: 16,
    fontSizeHeading5: 14,
    
    // 间距
    padding: 16,
    paddingXS: 8,
    paddingSM: 12,
    paddingLG: 24,
    paddingXL: 32,
    
    // 阴影
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    boxShadowSecondary: '0 4px 16px rgba(0, 0, 0, 0.08)',
    
    // 成功、警告、错误色保持默认
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#00BFA5',
  },
  components: {
    Table: {
      headerBg: '#FAFAFA',
      headerColor: '#222222',
      rowHoverBg: '#F5F5F5',
    },
    Modal: {
      titleFontSize: 18,
      contentBg: '#FFFFFF',
    },
    Button: {
      primaryShadow: '0 2px 0 rgba(0, 191, 165, 0.1)',
    },
    Tag: {
      defaultBg: '#F5F5F5',
      defaultColor: '#666666',
    },
    Card: {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    },
    Input: {
      borderRadius: 4,
    },
    Select: {
      borderRadius: 4,
    },
    Collapse: {
      headerBg: '#FAFAFA',
      contentBg: '#FFFFFF',
    }
  },
};