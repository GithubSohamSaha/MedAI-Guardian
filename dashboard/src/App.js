import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Button, Input, Typography, message, Card } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import Dashboard from './Dashboard';
import { login, register, forgotPassword } from './api';
import 'antd/dist/reset.css';

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
    }
    setLoading(false);
  };

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
}

export default App;