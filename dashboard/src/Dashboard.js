import React, { useEffect, useState } from 'react';
import { Layout, Card, Row, Col, Statistic, Table, Tag, Input, Spin, message, Button, Progress, Badge, Space, Typography, List, Avatar } from 'antd';
import { 
  MedicineBoxOutlined, 
  AlertOutlined, 
  UserOutlined,
  SearchOutlined,
  MenuOutlined,
  DashboardOutlined,
  BarChartOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { getDashboard, askGemini, getForecast } from './api';
import 'antd/dist/reset.css';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;

function Dashboard({ onLogout }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [currentView, setCurrentView] = useState('dashboard');
  const [forecastData, setForecastData] = useState([]);
  const [forecastLoading, setForecastLoading] = useState(false);

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

  const fetchForecast = async () => {
    setForecastLoading(true);
    try {
      const res = await getForecast();
      setForecastData(res.data || []);
    } catch (e) {
      // Silent fail
    }
    setForecastLoading(false);
  };

  useEffect(() => { 
    fetchData(); 
    fetchForecast();
  }, []);

  const handleGeminiQuery = async (value) => {
    if (!value) return;
    setChatLoading(true);
    try {
      const res = await askGemini(value);
      setChatResponse(res.data.answer);
    } catch (e) {
      message.error('Gemini API error');
      setChatResponse('I encountered an error. Please try again.');
    }
    setChatLoading(false);
  };

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Loading dashboard..." />
      </div>
    );
  }

  const tableData = data.alerts?.map((alert, index) => ({
    key: index,
    phc_name: alert.phc_name,
    district: alert.district || 'Unknown',
    health_score: alert.health_score,
    status: alert.status,
    critical_medicines: alert.critical_medicines || [],
    critical_count: alert.critical_count || 0,
  })) || [];

  const filteredData = tableData.filter(item =>
    item.phc_name.toLowerCase().includes(searchText.toLowerCase()) ||
    item.district.toLowerCase().includes(searchText.toLowerCase())
  );

  const totalPHCs = data.total_phcs || 0;
  const criticalMedicines = data.critical_medicines || 0;
  const activeAlerts = data.active_alerts || 0;
  const redCount = data.red_phcs || 0;
  const yellowCount = data.yellow_phcs || 0;
  const greenCount = data.green_phcs || 0;

  const getStatusIcon = (status) => {
    if (status === 'GREEN') return <CheckCircleOutlined style={{ color: '#34a853' }} />;
    if (status === 'YELLOW') return <WarningOutlined style={{ color: '#fbbc04' }} />;
    return <CloseCircleOutlined style={{ color: '#ea4335' }} />;
  };

  const getStatusTag = (status) => {
    const color = status === 'GREEN' ? 'success' : status === 'YELLOW' ? 'warning' : 'error';
    return <Tag color={color}>{status}</Tag>;
  };

  const columns = [
    {
      title: 'PHC',
      dataIndex: 'phc_name',
      key: 'phc_name',
      render: (text, record) => (
        <Space>
          {getStatusIcon(record.status)}
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'District',
      dataIndex: 'district',
      key: 'district',
    },
    {
      title: 'Health Score',
      dataIndex: 'health_score',
      key: 'health_score',
      render: (score) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Progress 
            percent={score} 
            size="small" 
            status={score < 40 ? 'exception' : score < 70 ? 'normal' : 'success'}
            showInfo={false}
            style={{ width: 60 }}
          />
          <Text strong style={{ color: score < 40 ? '#ea4335' : score < 70 ? '#fbbc04' : '#34a853' }}>
            {score}
          </Text>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag,
    },
    {
      title: 'Critical Medicines',
      dataIndex: 'critical_medicines',
      key: 'critical_medicines',
      render: (medicines) => {
        if (!medicines || medicines.length === 0) {
          return <Text type="success">✅ All stocked</Text>;
        }
        return (
          <Space size={4} wrap>
            {medicines.slice(0, 3).map((med, i) => (
              <Tag key={i} color="red" style={{ margin: 2 }}>{med}</Tag>
            ))}
            {medicines.length > 3 && <Tag>+{medicines.length - 3} more</Tag>}
          </Space>
        );
      },
    },
  ];

  const navItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: 'phcs', icon: <MedicineBoxOutlined />, label: 'PHCs' },          // <-- Fixed
    { key: 'stock', icon: <MedicineBoxOutlined />, label: 'Stock' },
    { key: 'alerts', icon: <BellOutlined />, label: 'Alerts' },
    { key: 'analytics', icon: <BarChartOutlined />, label: 'Analytics' },
    { key: 'settings', icon: <SettingOutlined />, label: 'Settings' },
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} lg={6}>
                <Card style={{ borderRadius: 12 }}>
                  <Statistic 
                    title="PHCs Monitored" 
                    value={totalPHCs} 
                    prefix={<MedicineBoxOutlined style={{ color: '#1a73e8' }} />}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Space size={8}>
                      <Badge color="#34a853" text={<Text type="secondary">{greenCount} Green</Text>} />
                      <Badge color="#fbbc04" text={<Text type="secondary">{yellowCount} Yellow</Text>} />
                      <Badge color="#ea4335" text={<Text type="secondary">{redCount} Red</Text>} />
                    </Space>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card style={{ borderRadius: 12 }}>
                  <Statistic 
                    title="Critical Medicines" 
                    value={criticalMedicines} 
                    prefix={<MedicineBoxOutlined style={{ color: '#ea4335' }} />}
                    valueStyle={{ color: criticalMedicines > 0 ? '#ea4335' : '#34a853' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card style={{ borderRadius: 12 }}>
                  <Statistic 
                    title="Active Alerts" 
                    value={activeAlerts} 
                    prefix={<AlertOutlined style={{ color: activeAlerts > 0 ? '#fbbc04' : '#34a853' }} />}
                    valueStyle={{ color: activeAlerts > 0 ? '#fbbc04' : '#34a853' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card style={{ borderRadius: 12 }}>
                  <Statistic 
                    title="14-Day Patient Avg" 
                    value={42} 
                    prefix={<UserOutlined style={{ color: '#1a73e8' }} />}
                    suffix={<Text type="secondary">patients/day</Text>}
                  />
                </Card>
              </Col>
            </Row>

            <Card 
              title={
                <Space>
                  <span>📋 PHC Risk Register</span>
                  <Tag color="blue">{tableData.length} PHCs</Tag>
                </Space>
              }
              style={{ marginBottom: 24, borderRadius: 12 }}
              extra={
                <Search 
                  placeholder="Search PHC..." 
                  style={{ width: 200 }} 
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onSearch={(value) => setSearchText(value)}
                />
              }
            >
              <Table 
                columns={columns} 
                dataSource={filteredData} 
                pagination={{ pageSize: 5 }}
                rowClassName={(record) => {
                  if (record.status === 'RED') return 'phc-red';
                  if (record.status === 'YELLOW') return 'phc-yellow';
                  return 'phc-green';
                }}
              />
            </Card>

            <Card 
              title={
                <Space>
                  <span>🤖 AI Assistant</span>
                  <Tag color="purple">Gemini</Tag>
                </Space>
              }
              style={{ borderRadius: 12 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Text type="secondary" style={{ marginBottom: 8 }}>
                  Ask about stock, beds, or PHC risk
                </Text>
                <Search 
                  placeholder="Which PHC has the lowest stock?" 
                  onSearch={handleGeminiQuery} 
                  loading={chatLoading} 
                  enterButton={<SearchOutlined />}
                  size="large"
                />
                <div style={{ 
                  marginTop: 16, 
                  background: '#f8f9fa', 
                  padding: 20, 
                  borderRadius: 12, 
                  minHeight: 80,
                  border: '1px solid #f0f0f0'
                }}>
                  {chatResponse ? (
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {chatResponse}
                    </div>
                  ) : (
                    <Text type="secondary">💡 Ask me anything about the health centers.</Text>
                  )}
                </div>
              </div>
            </Card>
          </>
        );

      case 'phcs':
        return (
          <Card title="🏥 All PHCs" style={{ borderRadius: 12 }}>
            <List
              dataSource={tableData}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<MedicineBoxOutlined />} style={{ backgroundColor: item.status === 'RED' ? '#ea4335' : item.status === 'YELLOW' ? '#fbbc04' : '#34a853' }} />}
                    title={<Text strong>{item.phc_name}</Text>}
                    description={`District: ${item.district} | Health Score: ${item.health_score}`}
                  />
                  <div>
                    {getStatusTag(item.status)}
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      {item.critical_medicines.length > 0 ? `${item.critical_medicines.length} critical` : '✅ All stocked'}
                    </Text>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        );

      case 'stock':
        return (
          <Card title="📦 Stock Overview" style={{ borderRadius: 12 }}>
            {forecastLoading ? (
              <Spin />
            ) : forecastData.length > 0 ? (
              <List
                dataSource={forecastData}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={<Text strong>{item.medicine_name}</Text>}
                      description={`Stock: ${item.current_stock} units | Days remaining: ${item.days_remaining}`}
                    />
                    <Tag color={item.is_critical ? 'red' : 'green'}>
                      {item.is_critical ? '⚠️ Critical' : '✅ OK'}
                    </Tag>
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">No stock data available.</Text>
            )}
          </Card>
        );

      case 'alerts':
        return (
          <Card title="🔔 All Alerts" style={{ borderRadius: 12 }}>
            <List
              dataSource={tableData}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={getStatusIcon(item.status)}
                    title={<Text strong>{item.phc_name}</Text>}
                    description={`Health Score: ${item.health_score} | ${item.critical_medicines.length} critical medicines`}
                  />
                  <div>
                    {getStatusTag(item.status)}
                    {item.critical_medicines.length > 0 && (
                      <Tag color="red" style={{ marginLeft: 8 }}>
                        {item.critical_medicines.join(', ')}
                      </Tag>
                    )}
                  </div>
                </List.Item>
              )}
            />
          </Card>
        );

      case 'analytics':
        return (
          <Card title="📊 Analytics Dashboard" style={{ borderRadius: 12 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Card>
                  <Statistic title="Total PHCs" value={totalPHCs} />
                </Card>
              </Col>
              <Col span={12}>
                <Card>
                  <Statistic title="Critical Medicines" value={criticalMedicines} />
                </Card>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Card>
                  <Statistic title="Active Alerts" value={activeAlerts} />
                </Card>
              </Col>
              <Col span={12}>
                <Card>
                  <Statistic title="Patient Avg (14 days)" value={42} suffix="/day" />
                </Card>
              </Col>
            </Row>
          </Card>
        );

      case 'settings':
        return (
          <Card title="⚙️ Settings" style={{ borderRadius: 12 }}>
            <div style={{ padding: 20 }}>
              <Text type="secondary">Settings page coming soon.</Text>
              <div style={{ marginTop: 16 }}>
                <Button type="primary">Save Settings</Button>
              </div>
            </div>
          </Card>
        );

      default:
        return <Text>View not found</Text>;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        style={{ background: '#001529' }}
        theme="dark"
      >
        <div style={{ padding: '16px', color: 'white', textAlign: 'center' }}>
          {!collapsed ? (
            <Title level={3} style={{ color: 'white', margin: 0 }}>🏥 MedAI</Title>
          ) : (
            <Title level={3} style={{ color: 'white', margin: 0, fontSize: 20 }}>🏥</Title>
          )}
        </div>
        <div style={{ padding: '0 16px' }}>
          {navItems.map((item) => (
            <Button 
              key={item.key}
              type="text" 
              icon={item.icon} 
              style={{ 
                color: currentView === item.key ? 'white' : 'rgba(255,255,255,0.65)',
                width: '100%', 
                textAlign: 'left',
                background: currentView === item.key ? 'rgba(255,255,255,0.15)' : 'transparent',
                marginBottom: 4
              }}
              onClick={() => setCurrentView(item.key)}
            >
              {!collapsed && item.label}
            </Button>
          ))}
          <div style={{ marginTop: 40 }}>
            <Button 
              type="text" 
              icon={<LogoutOutlined />} 
              style={{ color: 'rgba(255,255,255,0.65)', width: '100%', textAlign: 'left' }}
              onClick={onLogout}
            >
              {!collapsed && 'Logout'}
            </Button>
          </div>
        </div>
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <MenuOutlined style={{ fontSize: 20, marginRight: 16, cursor: 'pointer' }} onClick={() => setCollapsed(!collapsed)} />
            <Title level={4} style={{ margin: 0 }}>
              {navItems.find(item => item.key === currentView)?.label || 'Dashboard'}
            </Title>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={activeAlerts} offset={[10, 0]}>
              <BellOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
            </Badge>
            <Text type="secondary">Admin</Text>
            <Button type="text" icon={<LogoutOutlined />} onClick={onLogout} />
          </div>
        </Header>

        <Content style={{ padding: 24, background: '#f5f7fa' }}>
          {renderContent()}
        </Content>
      </Layout>

      <style>{`
        .phc-red { background-color: #fce8e6 !important; }
        .phc-yellow { background-color: #fef7e0 !important; }
        .phc-green { background-color: #e6f4ea !important; }
        .phc-red:hover { background-color: #fdd9d6 !important; }
        .phc-yellow:hover { background-color: #fef0c0 !important; }
        .phc-green:hover { background-color: #d0f0d8 !important; }
      `}</style>
    </Layout>
  );
}

export default Dashboard;