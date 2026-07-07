<<<<<<< HEAD
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
=======
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Col,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Layout,
  Menu,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  AlertOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  CloudServerOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  MedicineBoxOutlined,
  PlusOutlined,
  ReloadOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
  TeamOutlined,
  UserAddOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  askGemini,
  createDoctor,
  createMedicine,
  getAlerts,
  getBeds,
  getDashboard,
  getDoctors,
  getForecast,
  getMedicines,
  getPatientForecast,
  getPatientStats,
  recordVisit,
  resolveAlert,
  updateBeds,
  updateStock,
} from './api';

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;
const { TextArea } = Input;

const severityColor = {
  critical: 'red',
  high: 'volcano',
  medium: 'gold',
  low: 'green',
};

const statusColor = {
  RED: 'red',
  YELLOW: 'gold',
  GREEN: 'green',
};

const menuItems = [
  { key: 'overview', icon: <DashboardOutlined />, label: 'Overview' },
  { key: 'stock', icon: <MedicineBoxOutlined />, label: 'Stock Intelligence' },
  { key: 'capacity', icon: <DatabaseOutlined />, label: 'Bed Capacity' },
  { key: 'workforce', icon: <TeamOutlined />, label: 'Workforce' },
  { key: 'patients', icon: <BarChartOutlined />, label: 'Patient Flow' },
  { key: 'alerts', icon: <AlertOutlined />, label: 'Risk Alerts' },
  { key: 'assistant', icon: <RobotOutlined />, label: 'AI Assistant' },
  { key: 'system', icon: <CloudServerOutlined />, label: 'System Status' },
];

const emptyState = {
  summary: null,
  medicines: [],
  forecast: [],
  beds: [],
  doctors: [],
  alerts: [],
  patientStats: null,
  patientForecast: null,
};

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('medai_user') || '{}');
  } catch {
    return {};
  }
}

function resultValue(result, fallback) {
  return result.status === 'fulfilled' ? result.value.data : fallback;
}

function SectionTitle({ eyebrow, title, actions }) {
  return (
    <div className="section-title">
      <div>
        <Text className="eyebrow">{eyebrow}</Text>
        <Title level={2}>{title}</Title>
      </div>
      {actions && <Space wrap>{actions}</Space>}
    </div>
  );
}

function MetricCard({ icon, label, value, suffix, accent, children }) {
  return (
    <div className={`metric-card ${accent || ''}`}>
      <div className="metric-icon">{icon}</div>
      <Statistic title={label} value={value} suffix={suffix} />
      {children}
    </div>
  );
}

function Dashboard({ onLogout }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [state, setState] = useState(emptyState);
>>>>>>> 8e2315b (MedAI Feature Updation Commit)
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatAnswer, setChatAnswer] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [currentView, setCurrentView] = useState('dashboard');
  const [forecastData, setForecastData] = useState([]);
  const [forecastLoading, setForecastLoading] = useState(false);

  const [medicineForm] = Form.useForm();
  const [stockForm] = Form.useForm();
  const [bedForm] = Form.useForm();
  const [visitForm] = Form.useForm();
  const [doctorForm] = Form.useForm();

  const user = getStoredUser();

  const loadData = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const results = await Promise.allSettled([
      getDashboard(),
      getMedicines(),
      getForecast(),
      getBeds(),
      getDoctors(),
      getAlerts(),
      getPatientStats(),
      getPatientForecast(),
    ]);

    setState({
      summary: resultValue(results[0], null),
      medicines: resultValue(results[1], []),
      forecast: resultValue(results[2], []),
      beds: resultValue(results[3], []),
      doctors: resultValue(results[4], []),
      alerts: resultValue(results[5], []),
      patientStats: resultValue(results[6], null),
      patientForecast: resultValue(results[7], null),
    });

    if (results.some((item) => item.status === 'rejected')) {
      message.warning({
        key: 'live-module-warning',
        content: 'Some live modules could not be loaded.',
      });
    }

    setLoading(false);
    setRefreshing(false);
  };

<<<<<<< HEAD
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
=======
  useEffect(() => {
    loadData();
>>>>>>> 8e2315b (MedAI Feature Updation Commit)
  }, []);

  const summary = state.summary;
  const red = summary?.red_phcs || 0;
  const yellow = summary?.yellow_phcs || 0;
  const green = summary?.green_phcs || 0;
  const totalPhcs = summary?.total_phcs || 0;
  const systemScore = totalPhcs ? Math.round(((green + yellow * 0.55) / totalPhcs) * 100) : 0;
  const totalBeds = state.beds.reduce((sum, bed) => sum + bed.total, 0);
  const availableBeds = state.beds.reduce((sum, bed) => sum + bed.available, 0);
  const criticalForecast = state.forecast.filter((item) => item.is_critical);
  const patientTotal = state.patientStats?.total || 0;
  const predictedPatients = state.patientForecast?.predicted_count || 0;

  const patientTrend = useMemo(() => {
    const counts = state.patientStats?.daily_counts || {};
    const values = Object.entries(counts).map(([date, count]) => ({ date, count }));
    const max = Math.max(...values.map((item) => item.count), 1);
    return values.map((item) => ({ ...item, width: `${Math.max(8, (item.count / max) * 100)}%` }));
  }, [state.patientStats]);

  const healthColumns = [
    {
      title: 'PHC',
      dataIndex: 'phc_name',
      key: 'phc_name',
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{value}</Text>
          <Text type="secondary">{record.district}</Text>
        </Space>
      ),
    },
    {
      title: 'Health Score',
      dataIndex: 'health_score',
      key: 'health_score',
      render: (value, record) => (
        <Space>
          <Progress type="circle" percent={value} size={46} strokeColor={record.status === 'RED' ? '#d92d20' : record.status === 'YELLOW' ? '#b7791f' : '#00856f'} />
          <Tag color={statusColor[record.status]}>{record.status}</Tag>
        </Space>
      ),
    },
    {
      title: 'Critical Medicines',
      dataIndex: 'critical_medicines',
      key: 'critical_medicines',
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Text>{record.critical_count} of {record.total_medicines}</Text>
          <Text type="secondary">{value?.join(', ') || 'None'}</Text>
        </Space>
      ),
    },
  ];

  const medicineColumns = [
    { title: 'Medicine', dataIndex: 'name', key: 'name', render: (value, row) => <Text strong>{value || row.medicine_name}</Text> },
    { title: 'Category', dataIndex: 'category', key: 'category', render: (value) => value || 'General' },
    { title: 'Stock', dataIndex: 'current_stock', key: 'current_stock' },
    { title: 'Reorder', dataIndex: 'reorder_level', key: 'reorder_level' },
    {
      title: 'Status',
      key: 'status',
      render: (_, row) => {
        const low = row.current_stock <= row.reorder_level;
        return <Tag color={low ? 'red' : 'green'}>{low ? 'Reorder' : 'Stable'}</Tag>;
      },
    },
  ];

  const forecastColumns = [
    { title: 'Medicine', dataIndex: 'medicine_name', key: 'medicine_name', render: (value) => <Text strong>{value}</Text> },
    { title: 'Current', dataIndex: 'current_stock', key: 'current_stock' },
    { title: 'Daily Use', dataIndex: 'avg_daily_consumption', key: 'avg_daily_consumption', render: (value) => Number(value).toFixed(1) },
    { title: 'Days Left', dataIndex: 'days_remaining', key: 'days_remaining' },
    { title: 'Risk', dataIndex: 'is_critical', key: 'is_critical', render: (value) => <Tag color={value ? 'red' : 'green'}>{value ? 'Critical' : 'Normal'}</Tag> },
  ];

  const alertColumns = [
    { title: 'Alert', dataIndex: 'title', key: 'title', render: (value, row) => <Space direction="vertical" size={0}><Text strong>{value}</Text><Text type="secondary">{row.description}</Text></Space> },
    { title: 'Type', dataIndex: 'alert_type', key: 'alert_type', render: (value) => <Tag>{String(value).replaceAll('_', ' ')}</Tag> },
    { title: 'Severity', dataIndex: 'severity', key: 'severity', render: (value) => <Tag color={severityColor[value]}>{value}</Tag> },
    {
      title: 'Action',
      key: 'action',
      render: (_, row) => (
        <Button icon={<CheckCircleOutlined />} onClick={() => handleResolveAlert(row.id)}>
          Resolve
        </Button>
      ),
    },
  ];

  const handleResolveAlert = async (id) => {
    try {
      await resolveAlert(id);
      message.success('Alert resolved');
      loadData(true);
    } catch {
      message.error('Could not resolve alert');
    }
  };

  const openModal = (name) => {
    setModal(name);
    medicineForm.resetFields();
    stockForm.resetFields();
    bedForm.resetFields();
    visitForm.resetFields();
    doctorForm.resetFields();
  };

  const submitMedicine = async (values) => {
    await createMedicine(values);
    message.success('Medicine added');
    setModal(null);
    loadData(true);
  };

  const submitStock = async (values) => {
    await updateStock(values);
    message.success('Stock updated');
    setModal(null);
    loadData(true);
  };

  const submitBeds = async (values) => {
    await updateBeds(values);
    message.success('Bed census updated');
    setModal(null);
    loadData(true);
  };

  const submitVisit = async (values) => {
    await recordVisit({
      ...values,
      symptoms: values.symptoms ? values.symptoms.split(',').map((item) => item.trim()).filter(Boolean) : [],
    });
    message.success('Visit recorded');
    setModal(null);
    loadData(true);
  };

  const submitDoctor = async (values) => {
    await createDoctor(values);
    message.success('Doctor added');
    setModal(null);
    loadData(true);
  };

  const askAssistant = async () => {
    if (!chatQuestion.trim()) return;
    setChatLoading(true);
    try {
<<<<<<< HEAD
      const res = await askGemini(value);
      setChatResponse(res.data.answer);
    } catch (e) {
      message.error('Gemini API error');
      setChatResponse('I encountered an error. Please try again.');
=======
      const res = await askGemini(chatQuestion.trim());
      setChatAnswer(res.data.answer);
    } catch {
      setChatAnswer('AI response is unavailable. Review stock, bed, and alert panels for live operational signals.');
    } finally {
      setChatLoading(false);
>>>>>>> 8e2315b (MedAI Feature Updation Commit)
    }
  };

<<<<<<< HEAD
  if (loading || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Loading dashboard..." />
=======
  if (loading) {
    return (
      <div className="loading-screen">
        <Spin size="large" />
>>>>>>> 8e2315b (MedAI Feature Updation Commit)
      </div>
    );
  }

<<<<<<< HEAD
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
=======
  return (
    <Layout className="app-shell">
      <Sider width={248} breakpoint="lg" collapsedWidth="0" className="app-sider">
        <div className="side-brand">
          <div className="brand-mark small"><SafetyCertificateOutlined /></div>
          <div>
            <Text className="eyebrow">MedAI Guardian</Text>
            <Text strong>Ops Console</Text>
          </div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[activeSection]}
          items={menuItems}
          onClick={({ key }) => setActiveSection(key)}
        />
        <div className="side-footer">
          <Text className="eyebrow">Signed in</Text>
          <Text strong>{user.username || 'Admin'}</Text>
          <Text type="secondary">{user.role || 'Operations'}</Text>
        </div>
      </Sider>

      <Layout>
        <Header className="topbar">
          <div>
            <Text className="eyebrow">Live district command center</Text>
            <Title level={1}>Primary Health Operations</Title>
          </div>
          <Space wrap>
            <Badge status="processing" text="API live" />
            <Button icon={<ReloadOutlined />} loading={refreshing} onClick={() => loadData(true)} />
            <Button icon={<RobotOutlined />} onClick={() => setAssistantOpen(true)} />
            <Button onClick={onLogout}>Logout</Button>
          </Space>
        </Header>

        <Content className="content">
          {activeSection === 'overview' && (
            <>
              <SectionTitle
                eyebrow="Operations overview"
                title="System readiness"
                actions={[
                  <Button key="visit" icon={<PlusOutlined />} onClick={() => openModal('visit')}>Record visit</Button>,
                  <Button key="medicine" type="primary" icon={<MedicineBoxOutlined />} onClick={() => openModal('medicine')}>Add medicine</Button>,
                ]}
              />

              <Row gutter={[16, 16]} className="metric-grid">
                <Col xs={24} sm={12} xl={6}><MetricCard icon={<SafetyCertificateOutlined />} label="System Score" value={systemScore} suffix="%" accent="teal" /></Col>
                <Col xs={24} sm={12} xl={6}><MetricCard icon={<MedicineBoxOutlined />} label="Critical Stock" value={criticalForecast.length} accent="red" /></Col>
                <Col xs={24} sm={12} xl={6}><MetricCard icon={<DatabaseOutlined />} label="Available Beds" value={availableBeds} suffix={`/ ${totalBeds}`} accent="blue" /></Col>
                <Col xs={24} sm={12} xl={6}><MetricCard icon={<TeamOutlined />} label="7-day Visits" value={patientTotal} suffix={predictedPatients ? ` / ${predictedPatients} forecast` : ''} accent="amber" /></Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} xl={15}>
                  <div className="panel">
                    <div className="panel-head">
                      <Title level={3}>PHC performance</Title>
                      <Tag color={red ? 'red' : yellow ? 'gold' : 'green'}>{red ? 'Intervention' : yellow ? 'Watchlist' : 'Stable'}</Tag>
                    </div>
                    <Table
                      rowKey="phc_id"
                      columns={healthColumns}
                      dataSource={summary?.alerts || []}
                      pagination={false}
                      locale={{ emptyText: <Empty description="No PHC data" /> }}
                    />
                  </div>
                </Col>
                <Col xs={24} xl={9}>
                  <div className="panel">
                    <div className="panel-head">
                      <Title level={3}>Patient trend</Title>
                      <Tag color={state.patientForecast?.risk_level === 'HIGH' ? 'red' : 'blue'}>{state.patientForecast?.risk_level || 'LOW'}</Tag>
                    </div>
                    <div className="trend-list">
                      {patientTrend.length ? patientTrend.map((item) => (
                        <div className="trend-row" key={item.date}>
                          <Text type="secondary">{item.date}</Text>
                          <div className="trend-track"><span style={{ width: item.width }} /></div>
                          <Text>{item.count}</Text>
                        </div>
                      )) : <Empty description="No visits recorded" />}
                    </div>
                  </div>
                </Col>
              </Row>
            </>
          )}

          {activeSection === 'stock' && (
            <>
              <SectionTitle
                eyebrow="Supply chain"
                title="Medicine inventory"
                actions={[
                  <Button key="stock" icon={<ReloadOutlined />} onClick={() => openModal('stock')}>Update stock</Button>,
                  <Button key="medicine" type="primary" icon={<PlusOutlined />} onClick={() => openModal('medicine')}>Add medicine</Button>,
                ]}
              />
              <Row gutter={[16, 16]}>
                <Col xs={24} xl={12}>
                  <div className="panel"><Table rowKey="id" columns={medicineColumns} dataSource={state.medicines} pagination={{ pageSize: 8 }} /></div>
                </Col>
                <Col xs={24} xl={12}>
                  <div className="panel"><Table rowKey="medicine_id" columns={forecastColumns} dataSource={state.forecast} pagination={{ pageSize: 8 }} /></div>
                </Col>
              </Row>
            </>
          )}

          {activeSection === 'capacity' && (
            <>
              <SectionTitle eyebrow="Facility capacity" title="Beds and patient load" actions={[<Button key="bed" type="primary" icon={<DatabaseOutlined />} onClick={() => openModal('beds')}>Update beds</Button>]} />
              <Row gutter={[16, 16]}>
                {state.beds.map((bed) => (
                  <Col xs={24} sm={12} xl={6} key={bed.id || bed.bed_type}>
                    <div className="metric-card">
                      <Text strong>{bed.bed_type}</Text>
                      <Progress percent={bed.total ? Math.round((bed.occupied / bed.total) * 100) : 0} status={bed.available === 0 ? 'exception' : 'active'} />
                      <Text type="secondary">{bed.available} available of {bed.total}</Text>
                    </div>
                  </Col>
                ))}
                {!state.beds.length && <Col span={24}><div className="panel"><Empty description="No bed census data" /></div></Col>}
              </Row>
            </>
          )}

          {activeSection === 'workforce' && (
            <>
              <SectionTitle eyebrow="Clinical workforce" title="Doctors and coverage" actions={[<Button key="doctor" type="primary" icon={<UserAddOutlined />} onClick={() => openModal('doctor')}>Add doctor</Button>]} />
              <div className="panel">
                <Table
                  rowKey="id"
                  dataSource={state.doctors}
                  columns={[
                    { title: 'Doctor', dataIndex: 'name', key: 'name', render: (value) => <Text strong>{value}</Text> },
                    { title: 'Specialization', dataIndex: 'specialization', key: 'specialization', render: (value) => value || 'General' },
                    { title: 'Phone', dataIndex: 'phone', key: 'phone', render: (value) => value || '-' },
                    { title: 'Attendance', dataIndex: 'attendance_rate', key: 'attendance_rate', render: (value) => <Progress percent={Math.round(Number(value || 0) * 100)} size="small" /> },
                  ]}
                />
              </div>
            </>
          )}

          {activeSection === 'patients' && (
            <>
              <SectionTitle
                eyebrow="Patient intelligence"
                title="Footfall, surge risk, and visit capture"
                actions={[<Button key="visit" type="primary" icon={<ExperimentOutlined />} onClick={() => openModal('visit')}>Record visit</Button>]}
              />
              <Row gutter={[16, 16]} className="metric-grid">
                <Col xs={24} sm={12} xl={6}><MetricCard icon={<BarChartOutlined />} label="7-day Visits" value={patientTotal} accent="blue" /></Col>
                <Col xs={24} sm={12} xl={6}><MetricCard icon={<WarningOutlined />} label="Tomorrow Forecast" value={predictedPatients} accent="amber" /></Col>
                <Col xs={24} sm={12} xl={6}><MetricCard icon={<ExperimentOutlined />} label="Peak Window" value={state.patientForecast?.peak_hours || '11:00-14:00'} /></Col>
                <Col xs={24} sm={12} xl={6}><MetricCard icon={<AlertOutlined />} label="Surge Risk" value={state.patientForecast?.risk_level || 'LOW'} accent={state.patientForecast?.risk_level === 'HIGH' ? 'red' : 'teal'} /></Col>
              </Row>
              <Row gutter={[16, 16]}>
                <Col xs={24} xl={14}>
                  <div className="panel">
                    <div className="panel-head">
                      <Title level={3}>Daily visits</Title>
                      <Tag color="blue">Last 7 days</Tag>
                    </div>
                    <div className="trend-list tall">
                      {patientTrend.length ? patientTrend.map((item) => (
                        <div className="trend-row" key={item.date}>
                          <Text type="secondary">{item.date}</Text>
                          <div className="trend-track"><span style={{ width: item.width }} /></div>
                          <Text>{item.count}</Text>
                        </div>
                      )) : <Empty description="No patient visits recorded" />}
                    </div>
                  </div>
                </Col>
                <Col xs={24} xl={10}>
                  <div className="panel">
                    <div className="panel-head">
                      <Title level={3}>Expected actions</Title>
                      <Tag color={state.patientForecast?.risk_level === 'HIGH' ? 'red' : 'green'}>{state.patientForecast?.risk_level || 'LOW'}</Tag>
                    </div>
                    <div className="action-list">
                      <div><CheckCircleOutlined /> Prepare OPD desk for morning registration load.</div>
                      <div><CheckCircleOutlined /> Keep triage nurse available during {state.patientForecast?.peak_hours || '11:00-14:00'}.</div>
                      <div><CheckCircleOutlined /> Review fever and respiratory symptom counts before closing day.</div>
                    </div>
                  </div>
                </Col>
              </Row>
            </>
          )}

          {activeSection === 'alerts' && (
            <>
              <SectionTitle eyebrow="Risk response" title="Alert queue" actions={[<Button key="refresh" icon={<ReloadOutlined />} onClick={() => loadData(true)}>Refresh</Button>]} />
              <div className="panel">
                <Table rowKey="id" columns={alertColumns} dataSource={state.alerts} pagination={{ pageSize: 10 }} />
              </div>
            </>
          )}

          {activeSection === 'assistant' && (
            <>
              <SectionTitle eyebrow="Decision support" title="AI operations assistant" actions={[<Button key="ask" type="primary" icon={<SendOutlined />} loading={chatLoading} onClick={askAssistant}>Ask</Button>]} />
              <div className="assistant-panel">
                <TextArea
                  value={chatQuestion}
                  onChange={(event) => setChatQuestion(event.target.value)}
                  rows={4}
                  placeholder="Which PHCs need intervention today?"
                />
                <div className="assistant-answer">
                  {chatLoading ? <Spin /> : chatAnswer || <Text type="secondary">Ask a live operations question.</Text>}
                </div>
              </div>
            </>
          )}

          {activeSection === 'system' && (
            <>
              <SectionTitle eyebrow="Platform operations" title="System status and module readiness" actions={[<Button key="refresh" icon={<ReloadOutlined />} loading={refreshing} onClick={() => loadData(true)}>Refresh</Button>]} />
              <Row gutter={[16, 16]} className="metric-grid">
                <Col xs={24} sm={12} xl={6}><MetricCard icon={<CloudServerOutlined />} label="Backend API" value="Healthy" accent="teal" /></Col>
                <Col xs={24} sm={12} xl={6}><MetricCard icon={<MedicineBoxOutlined />} label="Inventory Module" value={state.medicines.length ? 'Ready' : 'Empty'} accent="blue" /></Col>
                <Col xs={24} sm={12} xl={6}><MetricCard icon={<DatabaseOutlined />} label="Capacity Module" value={state.beds.length ? 'Ready' : 'Empty'} accent="amber" /></Col>
                <Col xs={24} sm={12} xl={6}><MetricCard icon={<AlertOutlined />} label="Open Alerts" value={state.alerts.length} accent={state.alerts.length ? 'red' : 'teal'} /></Col>
              </Row>
              <div className="panel">
                <div className="panel-head">
                  <Title level={3}>Feature readiness</Title>
                  <Badge status="processing" text="Live local environment" />
                </div>
                <div className="readiness-grid">
                  {[
                    ['Authentication', 'Enabled', true],
                    ['PHC health scoring', 'Enabled', !!summary],
                    ['Stock forecasting', 'Enabled', state.forecast.length >= 0],
                    ['Bed census', 'Enabled', state.beds.length >= 0],
                    ['Patient forecasting', 'Enabled', !!state.patientForecast],
                    ['AI assistant', 'Requires Google API key for hosted Gemini', true],
                  ].map(([name, detail, ok]) => (
                    <div className="readiness-item" key={name}>
                      <span>{ok ? <CheckCircleOutlined /> : <WarningOutlined />}</span>
                      <div>
                        <Text strong>{name}</Text>
                        <Text type="secondary">{detail}</Text>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </Content>
      </Layout>

      <Drawer title="AI assistant" open={assistantOpen} onClose={() => setAssistantOpen(false)} width={420}>
        <Space direction="vertical" size={16} className="full-width">
          <TextArea value={chatQuestion} onChange={(event) => setChatQuestion(event.target.value)} rows={4} />
          <Button type="primary" icon={<SendOutlined />} loading={chatLoading} onClick={askAssistant}>Ask</Button>
          <div className="assistant-answer">{chatLoading ? <Spin /> : chatAnswer || 'No response yet.'}</div>
        </Space>
      </Drawer>

      <Modal title="Add medicine" open={modal === 'medicine'} onCancel={() => setModal(null)} footer={null}>
        <Form form={medicineForm} layout="vertical" onFinish={submitMedicine}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="category" label="Category"><Input /></Form.Item>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="current_stock" label="Current stock" initialValue={100}><InputNumber min={0} className="full-width" /></Form.Item></Col>
            <Col span={12}><Form.Item name="reorder_level" label="Reorder level" initialValue={50}><InputNumber min={0} className="full-width" /></Form.Item></Col>
          </Row>
          <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>Create</Button>
        </Form>
      </Modal>

      <Modal title="Update stock" open={modal === 'stock'} onCancel={() => setModal(null)} footer={null}>
        <Form form={stockForm} layout="vertical" onFinish={submitStock}>
          <Form.Item name="medicine_id" label="Medicine" rules={[{ required: true }]}>
            <Select options={state.medicines.map((item) => ({ label: item.name, value: item.id }))} />
          </Form.Item>
          <Form.Item name="quantity" label="Quantity change" rules={[{ required: true }]}><InputNumber className="full-width" /></Form.Item>
          <Form.Item name="transaction_type" label="Type" initialValue="manual">
            <Select options={[{ label: 'Receipt', value: 'receipt' }, { label: 'Consumption', value: 'consumption' }, { label: 'Manual', value: 'manual' }]} />
          </Form.Item>
          <Form.Item name="notes" label="Notes"><Input /></Form.Item>
          <Alert type="info" showIcon message="Use a negative number for consumption." className="form-alert" />
          <Button type="primary" htmlType="submit" icon={<ReloadOutlined />}>Update</Button>
        </Form>
      </Modal>

      <Modal title="Update beds" open={modal === 'beds'} onCancel={() => setModal(null)} footer={null}>
        <Form form={bedForm} layout="vertical" onFinish={submitBeds}>
          <Form.Item name="bed_type" label="Bed type" rules={[{ required: true }]}><Select options={['General', 'ICU', 'Oxygen', 'Pediatric'].map((value) => ({ label: value, value }))} /></Form.Item>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="total" label="Total" rules={[{ required: true }]}><InputNumber min={0} className="full-width" /></Form.Item></Col>
            <Col span={12}><Form.Item name="occupied" label="Occupied" rules={[{ required: true }]}><InputNumber min={0} className="full-width" /></Form.Item></Col>
          </Row>
          <Button type="primary" htmlType="submit" icon={<DatabaseOutlined />}>Save</Button>
        </Form>
      </Modal>

      <Modal title="Record patient visit" open={modal === 'visit'} onCancel={() => setModal(null)} footer={null}>
        <Form form={visitForm} layout="vertical" onFinish={submitVisit}>
          <Form.Item name="patient_id" label="Patient ID"><Input /></Form.Item>
          <Form.Item name="symptoms" label="Symptoms"><Input /></Form.Item>
          <Form.Item name="diagnosis" label="Diagnosis"><Input /></Form.Item>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="wait_time_min" label="Wait time"><InputNumber min={0} className="full-width" /></Form.Item></Col>
            <Col span={12}><Form.Item name="is_emergency" label="Emergency" valuePropName="checked"><Switch /></Form.Item></Col>
          </Row>
          <Button type="primary" htmlType="submit" icon={<ExperimentOutlined />}>Record</Button>
        </Form>
      </Modal>

      <Modal title="Add doctor" open={modal === 'doctor'} onCancel={() => setModal(null)} footer={null}>
        <Form form={doctorForm} layout="vertical" onFinish={submitDoctor}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="specialization" label="Specialization"><Input /></Form.Item>
          <Form.Item name="phone" label="Phone"><Input /></Form.Item>
          <Form.Item name="email" label="Email"><Input /></Form.Item>
          <Button type="primary" htmlType="submit" icon={<UserAddOutlined />}>Create</Button>
        </Form>
      </Modal>
>>>>>>> 8e2315b (MedAI Feature Updation Commit)
    </Layout>
  );
}

export default Dashboard;
