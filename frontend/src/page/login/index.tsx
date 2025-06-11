import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Checkbox, message } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authService, authUtils, type LoginRequest } from '../../api/auth';
import './index.scss';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (values: LoginRequest) => {
    setLoading(true);
    try {
      // 调用登录API
      const response = await authService.login(values);
      
      // 保存Token
      authUtils.saveToken(response.access_token);
      
      // 获取用户信息并保存
      try {
        const userInfo = await authService.getCurrentUser();
        authUtils.saveUserInfo(userInfo);
      } catch (error) {
        console.warn('获取用户信息失败，但登录成功:', error);
      }
      
      message.success('登录成功！');
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = '登录失败，请检查用户名和密码';
      
      if (error?.detail) {
        errorMessage = error.detail;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="logo">
            <div className="logo-icon">
              🤓
            </div>
            <span className="logo-text">VectorForge</span>
          </div>
          <Title level={3} className="login-title">
            登录到您的账户
          </Title>
          <Text type="secondary" className="login-subtitle">
            AI 对话与向量数据管理平台
          </Text>
        </div>

        <Card className="login-card">
          <Form
            form={form}
            name="login"
            onFinish={handleLogin}
            autoComplete="off"
            layout="vertical"
            size="large"
            className="login-form"
          >
            <Form.Item
              name="username"
              label="用户名或邮箱"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' }
              ]}
            >
              <Input
                prefix={<UserOutlined className="input-prefix-icon" />}
                placeholder="输入用户名"
                className="login-input"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6位字符' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="input-prefix-icon" />}
                placeholder="输入密码"
                className="login-input"
                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              />
            </Form.Item>

            <Form.Item className="login-options">
              <div className="form-options">
                <Checkbox 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)}
                >
                  记住我
                </Checkbox>
                <Link to="/forgot-password" className="forgot-link">
                  忘记密码？
                </Link>
              </div>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="login-button"
                block
                size="large"
              >
                {loading ? '登录中...' : '登录'}
              </Button>
            </Form.Item>
          </Form>

          <div className="login-footer">
            <div className="signup-prompt">
              <Text type="secondary">
                还没有账户？{' '}
                <Link to="/register" className="signup-link">
                  立即注册
                </Link>
              </Text>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
