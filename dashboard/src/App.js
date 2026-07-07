import React, { useState } from 'react';
<<<<<<< HEAD
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Button, Input, Typography, message, Card } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
=======
import { Alert, Button, Form, Input, Typography, message } from 'antd';
import { LockOutlined, LoginOutlined, MailOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
>>>>>>> 8e2315b (MedAI Feature Updation Commit)
import Dashboard from './Dashboard';
import { login, register, forgotPassword } from './api';
import 'antd/dist/reset.css';
import './styles.css';

<<<<<<< HEAD
const { Text } = Typography;

// ---------- Login Page ----------
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
        message.success('Welcome back!');
        onLogin();
      } else {
        message.error('No access token received');
      }
    } catch (error) {
      message.error(error.message || 'Login failed');
=======
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
    } catch (error) {
      message.error('Sign in failed. Check that the backend is running.');
    } finally {
      setLoading(false);
>>>>>>> 8e2315b (MedAI Feature Updation Commit)
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('medai_user');
    setIsLoggedIn(false);
  };

<<<<<<< HEAD
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400, padding: '24px', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <Typography.Title level={2} style={{ textAlign: 'center', color: '#1a73e8' }}>🏥 MedAI Admin</Typography.Title>
        <form onSubmit={handleSubmit}>
          <Input 
            prefix={<UserOutlined />} 
            placeholder="Email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            size="large" 
            style={{ marginBottom: 16 }} 
          />
          <Input.Password 
            prefix={<LockOutlined />} 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            size="large" 
            style={{ marginBottom: 16 }} 
          />
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
            Login
          </Button>
        </form>
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Text>
            <a href="/register">Register</a> &nbsp;|&nbsp; <a href="/forgot-password">Forgot Password?</a>
          </Text>
        </div>
      </Card>
    </div>
  );
}

// ---------- Register Page ----------
function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(username, email, password);
      message.success('Account created! Please login.');
      navigate('/');
    } catch (error) {
      message.error(error.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400, padding: '24px', borderRadius: 16 }}>
        <Typography.Title level={2} style={{ textAlign: 'center', color: '#1a73e8' }}>Create Account</Typography.Title>
        <form onSubmit={handleSubmit}>
          <Input 
            prefix={<UserOutlined />} 
            placeholder="Username" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            size="large" 
            style={{ marginBottom: 16 }} 
          />
          <Input 
            prefix={<MailOutlined />} 
            placeholder="Email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            size="large" 
            style={{ marginBottom: 16 }} 
          />
          <Input.Password 
            prefix={<LockOutlined />} 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            size="large" 
            style={{ marginBottom: 16 }} 
          />
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
            Register
          </Button>
        </form>
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Text>Already have an account? <a href="/">Login</a></Text>
        </div>
      </Card>
    </div>
  );
}

// ---------- Forgot Password Page ----------
function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      message.success('Reset link sent to your email.');
      navigate('/');
    } catch (error) {
      message.error(error.message || 'Request failed');
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400, padding: '24px', borderRadius: 16 }}>
        <Typography.Title level={2} style={{ textAlign: 'center', color: '#1a73e8' }}>Reset Password</Typography.Title>
        <form onSubmit={handleSubmit}>
          <Input 
            prefix={<MailOutlined />} 
            placeholder="Email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            size="large" 
            style={{ marginBottom: 16 }} 
          />
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
            Send Reset Link
          </Button>
        </form>
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Text>Remember your password? <a href="/">Login</a></Text>
        </div>
      </Card>
    </div>
  );
}

// ---------- Main App ----------
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('access_token'));

  if (isLoggedIn) {
    return <Dashboard onLogout={() => { 
      localStorage.removeItem('access_token'); 
      setIsLoggedIn(false); 
    }} />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/" element={<LoginPage onLogin={() => setIsLoggedIn(true)} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
=======
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
            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, message: 'Email is required' }]}
            >
              <Input prefix={<MailOutlined />} size="large" autoComplete="email" />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'Password is required' }]}
            >
              <Input.Password prefix={<LockOutlined />} size="large" autoComplete="current-password" />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              icon={<LoginOutlined />}
              size="large"
              loading={loading}
              block
            >
              Sign in
            </Button>
          </Form>

          <Alert
            className="demo-alert"
            type="info"
            showIcon
            message="Demo access"
            description="Use demo@medai.com with password demo123."
          />
        </section>
      </main>
    );
  }

  return <Dashboard onLogout={handleLogout} />;
>>>>>>> 8e2315b (MedAI Feature Updation Commit)
}

export default App;
