import { Form, Input, Button, Card, Typography, App } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../api/auth';
import './index.scss';
import { useState } from 'react';
import { useDispatch } from "react-redux";
import { setToken, setUsername } from "../../store/login/authSlice";
import { getLoginErrorMessage } from "../../utils/errorHandler";
const { Title, Text } = Typography;
const { useApp } = App;

function Login() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { message } = useApp();

  function handleLogin(){
    form.validateFields().then(async (res) => {
      setLoading(true);
      
      try {
        // 1. 调用登录API获取token
        const response = await login(res);
        const { access_token } = response;
        
        // 2. 存储token到Redux
        dispatch(setToken(access_token));
        
        // 3. 存储用户信息到Redux
        dispatch(setUsername(res.username));

        message.success(`欢迎回来，${res.username}！`);
        navigate("/", { replace: true });
      } catch (err: any) {
        console.log("login-err", err);
        const errorMsg = getLoginErrorMessage(err);
        message.error(errorMsg);
      } finally {
        setLoading(false);
      }
    }).catch((err: any) => {
      setLoading(false);
      console.log("login-err", err);
      message.error('表单验证失败，请检查输入');
    });
  }

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
            autoComplete="off"
            layout="vertical"
            size="large"
            className="login-form"
            onFinish={handleLogin}
          >
            <Form.Item
              name="username"
              label="用户名"
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
}

export default Login;
