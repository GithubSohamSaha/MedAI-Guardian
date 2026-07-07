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
  getDiseaseTrends,
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

const menuItems = [
  { key: 'overview', icon: <DashboardOutlined />, label: 'Overview' },
  { key: 'analytics', icon: <BarChartOutlined />, label: 'Analytics' },
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
  diseaseTrends: [],
};

const statusColor = {
  RED: 'red',
  YELLOW: 'gold',
  GREEN: 'green',
};

const severityColor = {
  critical: 'red',
  high: 'volcano',
  medium: 'gold',
  low: 'green',
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

function MetricCard({ icon, label, value, suffix, accent }) {
  return (
    <div className={`metric-card ${accent || ''}`}>
      <div className="metric-icon">{icon}</div>
      <Statistic title={label} value={value} suffix={suffix} />
    </div>
  );
}

function DonutChart({ data, centerLabel, centerValue }) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const total = Math.max(data.reduce((sum, item) => sum + item.value, 0), 1);
  let running = 0;

  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 132 132" className="donut-chart" role="img" aria-label={centerLabel}>
        <circle className="donut-bg" cx="66" cy="66" r={radius} />
        {data.map((item) => {
          const dash = (item.value / total) * circumference;
          const segment = (
            <circle
              key={item.label}
              className="donut-segment"
              cx="66"
              cy="66"
              r={radius}
              stroke={item.color}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-running}
            />
          );
          running += dash;
          return segment;
        })}
      </svg>
      <div className="donut-center">
        <Text className="eyebrow">{centerLabel}</Text>
        <Text strong>{centerValue}</Text>
      </div>
      <div className="chart-legend">
        {data.map((item) => (
          <div key={item.label}>
            <span style={{ background: item.color }} />
            <Text>{item.label}</Text>
            <Text strong>{item.value}</Text>
          </div>
        ))}
      </div>
    </div>
  );
}

function ColumnChart({ data, labelKey, valueKey, color = 'var(--blue)' }) {
  const max = Math.max(...data.map((item) => item[valueKey] || 0), 1);
  return (
    <div className="column-chart">
      {data.map((item) => {
        const rawLabel = String(item[labelKey]);
        const label = /^\d{4}-\d{2}-\d{2}/.test(rawLabel) ? rawLabel.slice(5) : rawLabel.slice(0, 10);
        return (
          <div className="column-item" key={item[labelKey]}>
            <div className="column-track">
              <span style={{ height: `${Math.max(6, ((item[valueKey] || 0) / max) * 100)}%`, background: color }} />
            </div>
            <Text type="secondary">{label}</Text>
          </div>
        );
      })}
    </div>
  );
}

function LineChart({ data }) {
  const width = 420;
  const height = 150;
  const max = Math.max(...data.map((item) => item.count || 0), 1);
  const points = data.map((item, index) => {
    const x = data.length <= 1 ? width / 2 : (index / (data.length - 1)) * width;
    const y = height - ((item.count || 0) / max) * (height - 18) - 9;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="line-chart-wrap">
      {data.length ? (
        <svg viewBox={`0 0 ${width} ${height}`} className="line-chart" role="img" aria-label="Patient visit trend">
          <polyline points={points} />
          {data.map((item, index) => {
            const x = data.length <= 1 ? width / 2 : (index / (data.length - 1)) * width;
            const y = height - ((item.count || 0) / max) * (height - 18) - 9;
            return <circle key={item.date} cx={x} cy={y} r="4" />;
          })}
        </svg>
      ) : (
        <Empty description="No chart data" />
      )}
    </div>
  );
}

function Dashboard({ onLogout }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [state, setState] = useState(emptyState);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatAnswer, setChatAnswer] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

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
      getDiseaseTrends(),
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
      diseaseTrends: resultValue(results[8], []),
    });

    if (results.some((item) => item.status === 'rejected')) {
      message.warning({ key: 'live-module-warning', content: 'Some live modules could not be loaded.' });
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const summary = state.summary;
  const red = summary?.red_phcs || 0;
  const yellow = summary?.yellow_phcs || 0;
  const green = summary?.green_phcs || 0;
  const totalPhcs = summary?.total_phcs || 0;
  const systemScore = totalPhcs ? Math.round(((green + yellow * 0.55) / totalPhcs) * 100) : 0;
  const totalBeds = state.beds.reduce((sum, bed) => sum + (bed.total || 0), 0);
  const availableBeds = state.beds.reduce((sum, bed) => sum + (bed.available || 0), 0);
  const criticalForecast = state.forecast.filter((item) => item.is_critical);
  const patientTotal = state.patientStats?.total || 0;
  const predictedPatients = state.patientForecast?.predicted_count || 0;

  const patientTrend = useMemo(() => {
    const counts = state.patientStats?.daily_counts || {};
    const values = Object.entries(counts).map(([date, count]) => ({ date, count }));
    const max = Math.max(...values.map((item) => item.count), 1);
    return values.map((item) => ({ ...item, width: `${Math.max(8, (item.count / max) * 100)}%` }));
  }, [state.patientStats]);

  const topStockRisks = useMemo(() => {
    const sorted = [...state.forecast].sort((a, b) => {
      if (a.is_critical !== b.is_critical) return a.is_critical ? -1 : 1;
      return (a.days_remaining || 999) - (b.days_remaining || 999);
    });
    const maxStock = Math.max(...sorted.map((item) => item.current_stock || 0), 1);
    return sorted.slice(0, 6).map((item) => ({
      ...item,
      width: `${Math.max(8, ((item.current_stock || 0) / maxStock) * 100)}%`,
    }));
  }, [state.forecast]);

  const bedAnalytics = useMemo(() => {
    return state.beds.map((bed) => {
      const occupancy = bed.total ? Math.round(((bed.occupied || 0) / bed.total) * 100) : 0;
      return { ...bed, occupancy };
    });
  }, [state.beds]);

  const diseaseAnalytics = useMemo(() => {
    const max = Math.max(...state.diseaseTrends.map((item) => item.case_count || 0), 1);
    return state.diseaseTrends.slice(0, 6).map((item) => ({
      ...item,
      width: `${Math.max(8, ((item.case_count || 0) / max) * 100)}%`,
    }));
  }, [state.diseaseTrends]);

  const healthMix = useMemo(() => {
    const total = Math.max(totalPhcs, 1);
    return [
      { label: 'Green', value: green, color: 'var(--teal)', width: `${(green / total) * 100}%` },
      { label: 'Yellow', value: yellow, color: 'var(--amber)', width: `${(yellow / total) * 100}%` },
      { label: 'Red', value: red, color: 'var(--red)', width: `${(red / total) * 100}%` },
    ];
  }, [green, red, totalPhcs, yellow]);

  const stockMix = useMemo(() => ([
    { label: 'Critical', value: criticalForecast.length, color: 'var(--red)' },
    { label: 'Stable', value: Math.max(state.forecast.length - criticalForecast.length, 0), color: 'var(--teal)' },
  ]), [criticalForecast.length, state.forecast.length]);

  const bedMix = useMemo(() => ([
    { label: 'Occupied', value: Math.max(totalBeds - availableBeds, 0), color: 'var(--blue)' },
    { label: 'Available', value: availableBeds, color: 'var(--teal)' },
  ]), [availableBeds, totalBeds]);

  const alertMix = useMemo(() => {
    const critical = state.alerts.filter((item) => ['critical', 'high'].includes(String(item.severity).toLowerCase())).length;
    return [
      { label: 'High risk', value: critical, color: 'var(--red)' },
      { label: 'Other', value: Math.max(state.alerts.length - critical, 0), color: 'var(--amber)' },
      { label: 'Clear', value: state.alerts.length ? 0 : 1, color: 'var(--teal)' },
    ];
  }, [state.alerts]);

  const assistantPrompts = useMemo(() => {
    const prompts = [
      'What should the district team handle first today?',
      'Summarize the highest operational risks.',
      'Which medicine stock needs action?',
    ];
    if (criticalForecast.length) {
      prompts.unshift(`What should we do about ${criticalForecast[0].medicine_name}?`);
    }
    if (availableBeds < Math.max(1, totalBeds * 0.2)) {
      prompts.unshift('How should we handle bed capacity pressure?');
    }
    if (state.patientForecast?.risk_level === 'HIGH') {
      prompts.unshift('Create a patient surge response plan.');
    }
    return prompts.slice(0, 5);
  }, [availableBeds, criticalForecast, state.patientForecast, totalBeds]);

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
          <Progress
            type="circle"
            percent={value}
            size={46}
            strokeColor={record.status === 'RED' ? '#d92d20' : record.status === 'YELLOW' ? '#b7791f' : '#00856f'}
          />
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
    { title: 'Medicine', dataIndex: 'name', key: 'name', render: (value) => <Text strong>{value}</Text> },
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
    { title: 'Daily Use', dataIndex: 'avg_daily_consumption', key: 'avg_daily_consumption', render: (value) => Number(value || 0).toFixed(1) },
    { title: 'Days Left', dataIndex: 'days_remaining', key: 'days_remaining' },
    { title: 'Risk', dataIndex: 'is_critical', key: 'is_critical', render: (value) => <Tag color={value ? 'red' : 'green'}>{value ? 'Critical' : 'Normal'}</Tag> },
  ];

  const alertColumns = [
    {
      title: 'Alert',
      dataIndex: 'title',
      key: 'title',
      render: (value, row) => (
        <Space direction="vertical" size={0}>
          <Text strong>{value}</Text>
          <Text type="secondary">{row.description}</Text>
        </Space>
      ),
    },
    { title: 'Type', dataIndex: 'alert_type', key: 'alert_type', render: (value) => <Tag>{String(value).replaceAll('_', ' ')}</Tag> },
    { title: 'Severity', dataIndex: 'severity', key: 'severity', render: (value) => <Tag color={severityColor[String(value).toLowerCase()]}>{value}</Tag> },
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

  const openModal = (name) => {
    setModal(name);
    medicineForm.resetFields();
    stockForm.resetFields();
    bedForm.resetFields();
    visitForm.resetFields();
    doctorForm.resetFields();
  };

  const submitAndReload = async (action, successText) => {
    try {
      await action();
      message.success(successText);
      setModal(null);
      loadData(true);
    } catch (error) {
      message.error(error?.response?.data?.detail || 'Could not save changes');
    }
  };

  const handleResolveAlert = (id) => {
    submitAndReload(() => resolveAlert(id), 'Alert resolved');
  };

  const askAssistant = async (prompt) => {
    const question = typeof prompt === 'string' ? prompt : chatQuestion.trim();
    if (!question) return;
    setChatLoading(true);
    setChatQuestion('');
    try {
      const res = await askGemini(question);
      const entry = {
        id: Date.now(),
        question,
        answer: res.data.answer,
        sources: res.data.sources || [],
      };
      setChatAnswer(res.data.answer);
      setChatHistory((items) => [entry, ...items].slice(0, 6));
    } catch {
      const fallback = 'AI response is unavailable. Review stock, bed, patient, and alert panels for live operational signals.';
      setChatAnswer(fallback);
      setChatHistory((items) => [{ id: Date.now(), question, answer: fallback, sources: [] }, ...items].slice(0, 6));
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <Spin size="large" />
      </div>
    );
  }

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
        <Menu mode="inline" selectedKeys={[activeSection]} items={menuItems} onClick={({ key }) => setActiveSection(key)} />
        <div className="side-footer">
          <Text className="eyebrow">Signed in</Text>
          <Text strong>{user.username || 'admin'}</Text>
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
                    <Table rowKey="phc_id" columns={healthColumns} dataSource={summary?.alerts || []} pagination={false} locale={{ emptyText: <Empty description="No PHC data" /> }} />
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

          {activeSection === 'analytics' && (
            <>
              <SectionTitle
                eyebrow="Operational analytics"
                title="Visual command insights"
                actions={[
                  <Button key="refresh" icon={<ReloadOutlined />} loading={refreshing} onClick={() => loadData(true)}>Refresh analytics</Button>,
                  <Button key="assistant" type="primary" icon={<RobotOutlined />} onClick={() => setActiveSection('assistant')}>Ask assistant</Button>,
                ]}
              />

              <Row gutter={[16, 16]} className="metric-grid">
                <Col xs={24} sm={12} xl={6}><MetricCard icon={<SafetyCertificateOutlined />} label="Readiness Score" value={systemScore} suffix="%" accent="teal" /></Col>
                <Col xs={24} sm={12} xl={6}><MetricCard icon={<MedicineBoxOutlined />} label="Stock Risks" value={criticalForecast.length} accent={criticalForecast.length ? 'red' : 'teal'} /></Col>
                <Col xs={24} sm={12} xl={6}><MetricCard icon={<DatabaseOutlined />} label="Bed Occupancy" value={totalBeds ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100) : 0} suffix="%" accent="blue" /></Col>
                <Col xs={24} sm={12} xl={6}><MetricCard icon={<ExperimentOutlined />} label="Disease Signals" value={diseaseAnalytics.length} accent="amber" /></Col>
              </Row>

              <Row gutter={[16, 16]} className="metric-grid">
                <Col xs={24} lg={8}>
                  <div className="panel chart-panel">
                    <div className="panel-head">
                      <Title level={3}>PHC status pie</Title>
                      <Tag color={red ? 'red' : yellow ? 'gold' : 'green'}>{totalPhcs} monitored</Tag>
                    </div>
                    <DonutChart data={healthMix} centerLabel="Readiness" centerValue={`${systemScore}%`} />
                  </div>
                </Col>
                <Col xs={24} lg={8}>
                  <div className="panel chart-panel">
                    <div className="panel-head">
                      <Title level={3}>Stock risk pie</Title>
                      <Tag color={criticalForecast.length ? 'red' : 'green'}>{state.forecast.length} medicines</Tag>
                    </div>
                    <DonutChart data={stockMix} centerLabel="Critical" centerValue={criticalForecast.length} />
                  </div>
                </Col>
                <Col xs={24} lg={8}>
                  <div className="panel chart-panel">
                    <div className="panel-head">
                      <Title level={3}>Bed capacity pie</Title>
                      <Tag color={availableBeds ? 'blue' : 'red'}>{availableBeds} open</Tag>
                    </div>
                    <DonutChart data={bedMix} centerLabel="Available" centerValue={`${availableBeds}/${totalBeds || 0}`} />
                  </div>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} xl={10}>
                  <div className="panel">
                    <div className="panel-head">
                      <Title level={3}>PHC health distribution</Title>
                      <Tag color={red ? 'red' : yellow ? 'gold' : 'green'}>{totalPhcs} PHC</Tag>
                    </div>
                    <div className="health-stack">
                      {healthMix.map((item) => (
                        <span key={item.label} style={{ width: item.width, background: item.color }} />
                      ))}
                    </div>
                    <div className="legend-grid">
                      {healthMix.map((item) => (
                        <div key={item.label}>
                          <span style={{ background: item.color }} />
                          <Text>{item.label}</Text>
                          <Text strong>{item.value}</Text>
                        </div>
                      ))}
                    </div>
                  </div>
                </Col>

                <Col xs={24} xl={14}>
                  <div className="panel">
                    <div className="panel-head">
                      <Title level={3}>Medicine runway</Title>
                      <Tag color={criticalForecast.length ? 'red' : 'green'}>{criticalForecast.length ? 'Action needed' : 'Stable'}</Tag>
                    </div>
                    <div className="viz-list">
                      {topStockRisks.length ? topStockRisks.map((item) => (
                        <div className="viz-row" key={item.medicine_id}>
                          <div>
                            <Text strong>{item.medicine_name}</Text>
                            <Text type="secondary">{item.days_remaining} days left</Text>
                          </div>
                          <div className="viz-track"><span className={item.is_critical ? 'danger' : ''} style={{ width: item.width }} /></div>
                          <Tag color={item.is_critical ? 'red' : 'green'}>{item.current_stock}</Tag>
                        </div>
                      )) : <Empty description="No stock forecast data" />}
                    </div>
                  </div>
                </Col>

                <Col xs={24} xl={12}>
                  <div className="panel">
                    <div className="panel-head">
                      <Title level={3}>Bed occupancy</Title>
                      <Tag color={availableBeds ? 'blue' : 'red'}>{availableBeds} available</Tag>
                    </div>
                    <div className="occupancy-grid">
                      {bedAnalytics.length ? bedAnalytics.map((bed) => (
                        <div className="occupancy-card" key={`${bed.phc_id}-${bed.bed_type}`}>
                          <Text strong>{bed.bed_type}</Text>
                          <Progress percent={bed.occupancy} strokeColor={bed.occupancy >= 90 ? '#d92d20' : bed.occupancy >= 75 ? '#b7791f' : '#00856f'} />
                          <Text type="secondary">{bed.occupied} occupied of {bed.total}</Text>
                        </div>
                      )) : <Empty description="No bed data" />}
                    </div>
                  </div>
                </Col>

                <Col xs={24} xl={12}>
                  <div className="panel">
                    <div className="panel-head">
                      <Title level={3}>Patient trend</Title>
                      <Tag color={state.patientForecast?.risk_level === 'HIGH' ? 'red' : 'blue'}>{state.patientForecast?.risk_level || 'LOW'}</Tag>
                    </div>
                    <LineChart data={patientTrend} />
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

                <Col xs={24} xl={14}>
                  <div className="panel">
                    <div className="panel-head">
                      <Title level={3}>Disease trend signals</Title>
                      <Tag color={diseaseAnalytics.some((item) => item.alert_level !== 'NORMAL') ? 'gold' : 'green'}>Last 30 days</Tag>
                    </div>
                    <ColumnChart data={diseaseAnalytics} labelKey="disease" valueKey="case_count" color="var(--amber)" />
                    <div className="viz-list">
                      {diseaseAnalytics.length ? diseaseAnalytics.map((item) => (
                        <div className="viz-row" key={item.disease}>
                          <div>
                            <Text strong>{item.disease}</Text>
                            <Text type="secondary">{item.seven_day_avg} seven-day avg</Text>
                          </div>
                          <div className="viz-track"><span className={item.alert_level !== 'NORMAL' ? 'warning' : ''} style={{ width: item.width }} /></div>
                          <Tag color={item.alert_level === 'NORMAL' ? 'green' : 'gold'}>{item.case_count}</Tag>
                        </div>
                      )) : <Empty description="No disease trend data" />}
                    </div>
                  </div>
                </Col>

                <Col xs={24} xl={10}>
                  <div className="panel">
                    <div className="panel-head">
                      <Title level={3}>AI insight prompts</Title>
                      <Tag color="blue">Live context</Tag>
                    </div>
                    <div className="mini-donut">
                      <DonutChart data={alertMix} centerLabel="Alerts" centerValue={state.alerts.length} />
                    </div>
                    <div className="prompt-grid">
                      {assistantPrompts.map((prompt) => (
                        <Button key={prompt} onClick={() => askAssistant(prompt)}>{prompt}</Button>
                      ))}
                    </div>
                    <div className="insight-summary">
                      <Text strong>Current priority</Text>
                      <Text type="secondary">
                        {criticalForecast.length
                          ? `${criticalForecast.length} medicines need review before the next dispensing cycle.`
                          : availableBeds === 0
                            ? 'Capacity is the main operational constraint.'
                            : 'Operations are stable with routine monitoring required.'}
                      </Text>
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
                <Col xs={24} xl={12}><div className="panel"><Table rowKey="id" columns={medicineColumns} dataSource={state.medicines} pagination={{ pageSize: 8 }} /></div></Col>
                <Col xs={24} xl={12}><div className="panel"><Table rowKey="medicine_id" columns={forecastColumns} dataSource={state.forecast} pagination={{ pageSize: 8 }} /></div></Col>
              </Row>
            </>
          )}

          {activeSection === 'capacity' && (
            <>
              <SectionTitle eyebrow="Facility capacity" title="Beds and patient load" actions={[<Button key="bed" type="primary" icon={<DatabaseOutlined />} onClick={() => openModal('beds')}>Update beds</Button>]} />
              <Row gutter={[16, 16]}>
                {state.beds.map((bed) => (
                  <Col xs={24} sm={12} xl={6} key={`${bed.phc_id}-${bed.bed_type}`}>
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
              <SectionTitle eyebrow="Patient intelligence" title="Footfall, surge risk, and visit capture" actions={[<Button key="visit" type="primary" icon={<ExperimentOutlined />} onClick={() => openModal('visit')}>Record visit</Button>]} />
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
              <div className="panel"><Table rowKey="id" columns={alertColumns} dataSource={state.alerts} pagination={{ pageSize: 10 }} /></div>
            </>
          )}

          {activeSection === 'assistant' && (
            <>
              <SectionTitle eyebrow="Decision support" title="AI operations assistant" actions={[<Button key="ask" type="primary" icon={<SendOutlined />} loading={chatLoading} onClick={askAssistant}>Ask</Button>]} />
              <Row gutter={[16, 16]}>
                <Col xs={24} xl={9}>
                  <div className="panel">
                    <div className="panel-head">
                      <Title level={3}>Ask from live context</Title>
                      <Tag color="blue">Dynamic</Tag>
                    </div>
                    <Space direction="vertical" size={14} className="full-width">
                      <TextArea value={chatQuestion} onChange={(event) => setChatQuestion(event.target.value)} rows={5} placeholder="Which PHCs need intervention today?" />
                      <Button type="primary" icon={<SendOutlined />} loading={chatLoading} onClick={askAssistant}>Ask assistant</Button>
                      <div className="prompt-grid">
                        {assistantPrompts.map((prompt) => (
                          <Button key={prompt} onClick={() => askAssistant(prompt)}>{prompt}</Button>
                        ))}
                      </div>
                    </Space>
                  </div>
                </Col>
                <Col xs={24} xl={15}>
                  <div className="panel assistant-live">
                    <div className="panel-head">
                      <Title level={3}>Latest answer</Title>
                      <Badge status={chatLoading ? 'processing' : 'success'} text={chatLoading ? 'Thinking' : 'Ready'} />
                    </div>
                    <div className="assistant-answer">{chatLoading ? <Spin /> : chatAnswer || <Text type="secondary">Ask a question or choose a prompt to generate an operational response.</Text>}</div>
                  </div>
                </Col>
                <Col span={24}>
                  <div className="panel">
                    <div className="panel-head">
                      <Title level={3}>Conversation trail</Title>
                      <Tag color="blue">{chatHistory.length} saved</Tag>
                    </div>
                    <div className="chat-history">
                      {chatHistory.length ? chatHistory.map((item) => (
                        <div className="chat-card" key={item.id}>
                          <Text strong>{item.question}</Text>
                          <Text>{item.answer}</Text>
                          {!!item.sources.length && (
                            <Space wrap>
                              {item.sources.map((source) => <Tag key={source}>{source}</Tag>)}
                            </Space>
                          )}
                        </div>
                      )) : <Empty description="No assistant questions yet" />}
                    </div>
                  </div>
                </Col>
              </Row>
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
                    ['Stock forecasting', 'Enabled', true],
                    ['Bed census', 'Enabled', true],
                    ['Patient forecasting', 'Enabled', !!state.patientForecast],
                    ['AI assistant', 'Local decision support enabled', true],
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
          <TextArea value={chatQuestion} onChange={(event) => setChatQuestion(event.target.value)} rows={4} placeholder="What should the district team handle first today?" />
          <Button type="primary" icon={<SendOutlined />} loading={chatLoading} onClick={askAssistant}>Ask</Button>
          <div className="prompt-grid compact">
            {assistantPrompts.slice(0, 3).map((prompt) => (
              <Button key={prompt} onClick={() => askAssistant(prompt)}>{prompt}</Button>
            ))}
          </div>
          <div className="assistant-answer">{chatLoading ? <Spin /> : chatAnswer || 'No response yet.'}</div>
          {!!chatHistory.length && (
            <div className="chat-history compact">
              {chatHistory.slice(0, 3).map((item) => (
                <div className="chat-card" key={item.id}>
                  <Text strong>{item.question}</Text>
                  <Text>{item.answer}</Text>
                </div>
              ))}
            </div>
          )}
        </Space>
      </Drawer>

      <Modal title="Add medicine" open={modal === 'medicine'} onCancel={() => setModal(null)} footer={null}>
        <Form form={medicineForm} layout="vertical" onFinish={(values) => submitAndReload(() => createMedicine(values), 'Medicine added')}>
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
        <Form form={stockForm} layout="vertical" onFinish={(values) => submitAndReload(() => updateStock(values), 'Stock updated')}>
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
        <Form form={bedForm} layout="vertical" onFinish={(values) => submitAndReload(() => updateBeds(values), 'Bed census updated')}>
          <Form.Item name="bed_type" label="Bed type" rules={[{ required: true }]}><Select options={['General', 'ICU', 'Oxygen', 'Pediatric'].map((value) => ({ label: value, value }))} /></Form.Item>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="total" label="Total" rules={[{ required: true }]}><InputNumber min={0} className="full-width" /></Form.Item></Col>
            <Col span={12}><Form.Item name="occupied" label="Occupied" rules={[{ required: true }]}><InputNumber min={0} className="full-width" /></Form.Item></Col>
          </Row>
          <Button type="primary" htmlType="submit" icon={<DatabaseOutlined />}>Save</Button>
        </Form>
      </Modal>

      <Modal title="Record patient visit" open={modal === 'visit'} onCancel={() => setModal(null)} footer={null}>
        <Form
          form={visitForm}
          layout="vertical"
          onFinish={(values) => submitAndReload(() => recordVisit({
            ...values,
            symptoms: values.symptoms ? values.symptoms.split(',').map((item) => item.trim()).filter(Boolean) : [],
          }), 'Visit recorded')}
        >
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
        <Form form={doctorForm} layout="vertical" onFinish={(values) => submitAndReload(() => createDoctor(values), 'Doctor added')}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="specialization" label="Specialization"><Input /></Form.Item>
          <Form.Item name="phone" label="Phone"><Input /></Form.Item>
          <Form.Item name="email" label="Email"><Input /></Form.Item>
          <Button type="primary" htmlType="submit" icon={<UserAddOutlined />}>Create</Button>
        </Form>
      </Modal>
    </Layout>
  );
}

export default Dashboard;
