import React, { useState } from 'react';
import { Alert, Button, Form, Input, Typography, message } from 'antd';
import { LockOutlined, LoginOutlined, MailOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import Dashboard from './Dashboard';
import { login } from './api';
import 'antd/dist/reset.css';
import './styles.css';

const { Text, Title } = Typography;

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('access_token'));
  const [loading, setLoading] = useState(false);

  const handleLogin = async ({ email, password }) => {
    setLoading(true);
    try {
      const res = await login(email, password);
      localStorage.setItem('access_token', res.access_token);
      localStorage.setItem('medai_user', JSON.stringify(res.user || {}));
      setIsLoggedIn(true);
      message.success('Signed in');
    } catch {
      message.error('Sign in failed. Check that the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('medai_user');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return (
      <main className="auth-page">
        <section className="auth-shell">
          <div className="auth-brand">
            <div className="brand-mark">
              <SafetyCertificateOutlined />
            </div>
            <div>
              <Text className="eyebrow">District health operations</Text>
              <Title level={1}>MedAI Guardian</Title>
            </div>
          </div>

          <div className="auth-copy">
            <Title level={2}>Command center sign in</Title>
            <Text>
              Secure access for PHC monitoring, stock forecasting, patient surge response,
              bed visibility, and operational alerts.
            </Text>
          </div>

          <Form
            className="auth-form"
            layout="vertical"
            initialValues={{ email: 'demo@medai.com', password: 'demo123' }}
            onFinish={handleLogin}
          >
            <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Email is required' }]}>
              <Input prefix={<MailOutlined />} size="large" autoComplete="email" />
            </Form.Item>
            <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Password is required' }]}>
              <Input.Password prefix={<LockOutlined />} size="large" autoComplete="current-password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" icon={<LoginOutlined />} size="large" loading={loading} block>
              Sign in
            </Button>
          </Form>

          <Alert className="demo-alert" type="info" showIcon message="Demo access" description="Use demo@medai.com with password demo123." />
        </section>
      </main>
    );
  }

  return <Dashboard onLogout={handleLogout} />;
}

export default App;
