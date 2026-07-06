import React, { useState } from 'react';
import { Button, Input, Layout, Typography, message } from 'antd';
import Dashboard from './Dashboard';
import { login } from './api';
import 'antd/dist/reset.css';

const { Content } = Layout;
const { Title } = Typography;

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('access_token'));
  const [email, setEmail] = useState('demo@medai.com');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await login(email, password);
      localStorage.setItem('access_token', res.data.access_token);
      setIsLoggedIn(true);
      message.success('Logged in successfully');
    } catch (error) {
      message.error('Login failed. Make sure backend is running.');
    }
    setLoading(false);
  };

  if (!isLoggedIn) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
        <div style={{ padding: 40, background: 'white', borderRadius: 20, boxShadow: '0 10px 40px rgba(0,0,0,0.1)', width: 400 }}>
          <Title level={2} style={{ textAlign: 'center' }}>🏥 MedAI Admin</Title>
          <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ marginBottom: 10 }} />
          <Input.Password placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ marginBottom: 20 }} />
          <Button type="primary" block loading={loading} onClick={handleLogin}>Login</Button>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}

export default App;