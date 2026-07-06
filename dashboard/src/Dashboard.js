import React, { useEffect, useState } from 'react';
import { Layout, Card, Row, Col, Statistic, List, Tag, Input, Spin, message, Button } from 'antd';
import { getDashboard, askGemini } from './api';
import { ExclamationCircleOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;
const { Search } = Input;

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getDashboard();
      setData(res.data);
    } catch (e) {
      message.error('Failed to fetch dashboard data');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGeminiQuery = async (value) => {
    if (!value) return;
    setChatLoading(true);
    try {
      const res = await askGemini(value);
      setChatResponse(res.data.answer);
    } catch (e) {
      message.error('Gemini API error');
    }
    setChatLoading(false);
  };

  if (loading || !data) {
    return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />;
  }

  const getStatusIcon = (status) => {
    if (status === 'GREEN') return <CheckCircleOutlined style={{ color: '#34a853' }} />;
    if (status === 'YELLOW') return <WarningOutlined style={{ color: '#fbbc04' }} />;
    return <ExclamationCircleOutlined style={{ color: '#ea4335' }} />;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#1a73e8', color: 'white', display: 'flex', alignItems: 'center', padding: '0 20px' }}>
        <h2 style={{ color: 'white', margin: 0 }}>🏥 MedAI Guardian - Command Center</h2>
        <Button style={{ marginLeft: 'auto' }} onClick={() => { localStorage.removeItem('access_token'); window.location.reload(); }}>Logout</Button>
      </Header>
      <Content style={{ padding: 24, background: '#f5f7fa' }}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}><Card><Statistic title="Total PHCs" value={data.total_phcs} /></Card></Col>
          <Col span={6}><Card><Statistic title="🟢 Green" value={data.green_phcs} /></Card></Col>
          <Col span={6}><Card><Statistic title="🟡 Yellow" value={data.yellow_phcs} /></Card></Col>
          <Col span={6}><Card><Statistic title="🔴 Red" value={data.red_phcs} /></Card></Col>
        </Row>

        <Row gutter={16}>
          <Col span={14}>
            <Card title="⚠️ Active Alerts">
              <List
                dataSource={data.alerts}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={getStatusIcon(item.status)}
                      title={<span><strong>{item.phc_name}</strong> - Score: {item.health_score}</span>}
                      description={`Critical: ${item.critical_medicines.join(', ') || 'None'}`}
                    />
                    <Tag color={item.status === 'RED' ? 'red' : item.status === 'YELLOW' ? 'gold' : 'green'}>
                      {item.status}
                    </Tag>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          <Col span={10}>
            <Card title="🧠 AI Assistant (Gemini)">
              <Search placeholder="Ask about stock..." onSearch={handleGeminiQuery} loading={chatLoading} enterButton />
              <div style={{ marginTop: 16, background: '#f8f9fa', padding: 16, borderRadius: 10, minHeight: 100 }}>
                {chatResponse || "Ask me anything about the health centers."}
              </div>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}

export default Dashboard;