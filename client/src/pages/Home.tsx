import { useState, useEffect } from 'react';
import { Layout, Card, Row, Col, Statistic, Button, Badge, Switch } from 'antd';
import {
  TeamOutlined,
  ShoppingOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserAddOutlined,
  PauseCircleOutlined,
  BulbOutlined,
  BulbFilled,
  FileTextOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
import { isOnline } from '../services/sync';
import { useTheme } from '../contexts/ThemeContext';
import { getCustomers } from '../services/customers';
import dayjs from 'dayjs';
import logo from '../assets/logo.svg';
import '../styles/tech-theme.css';

const { Header, Content } = Layout;

export default function Home() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const { theme, toggleTheme } = useTheme();
  const [stats, setStats] = useState({
    totalCustomers: 0,      // 总客户数（结单客户数量）
    pendingFollowUp: 0,     // 待跟进（试用+建联中）
    monthlyNew: 0,         // 本月新增（当月新增的结单客户）
    closedCount: 0          // 结单数（结单客户数量）
  });

  // 模块卡片数据
  const modules = [
    {
      key: 'customer',
      title: '客户管理',
      icon: <TeamOutlined style={{ fontSize: 48, color: theme === 'dark' ? '#667eea' : '#1890ff' }} />,
      description: '管理客户全生命周期',
      color: theme === 'dark' ? '#667eea' : '#1890ff',
      subModules: [
        { key: 'closed', name: '成交客户', icon: <CheckCircleOutlined />, path: '/customer/closed' },
        { key: 'opportunity', name: '潜在机会', icon: <ClockCircleOutlined />, path: '/customer/opportunity' }
      ]
    },
    {
      key: 'ai',
      title: '销售AI',
      icon: <RobotOutlined style={{ fontSize: 48, color: theme === 'dark' ? '#764ba2' : '#722ed1' }} />,
      description: '客户QA整理与周报生成',
      color: theme === 'dark' ? '#764ba2' : '#722ed1',
      subModules: [
        { key: 'qa', name: '客户QA', icon: <UserAddOutlined />, path: '/ai/qa' },
        { key: 'report', name: '周报生成', icon: <ClockCircleOutlined />, path: '/ai/report' },
        { key: 'visit', name: '拜访行程', icon: <ClockCircleOutlined />, path: '/sales/visit' },
        { key: 'opportunity', name: '机会挖掘', icon: <ThunderboltOutlined />, path: '/ai/opportunity' }
      ]
    },
    {
      key: 'product',
      title: '产品详情',
      icon: <ShoppingOutlined style={{ fontSize: 48, color: theme === 'dark' ? '#10b981' : '#52c41a' }} />,
      description: '产品信息与详情管理',
      color: theme === 'dark' ? '#10b981' : '#52c41a',
      subModules: [
        { key: 'requirement', name: '需求管理', icon: <FileTextOutlined />, path: '/ai/requirement' }
      ]
    }
  ];

  const getBackgroundStyle = (): React.CSSProperties => {
    if (theme === 'dark') {
      return { background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1419 100%)' };
    }
    return { background: '#f0f2f5' };
  };

  const getTextColor = () => {
    return theme === 'dark' ? '#e0e7ff' : '#262626';
  };

  // 加载统计数据
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const customers = await getCustomers();
      
      // 计算总客户数（结单客户数量）
      const closedCustomers = customers.filter((c: any) => c.category === '结单');
      const totalCustomers = closedCustomers.length;
      
      // 计算待跟进（潜在机会：试用/谈判/高意向 + 建联中 + 静默）
      const pendingFollowUp = customers.filter((c: any) => 
        c.category === '试用/谈判/高意向' || 
        c.category === '建联中' || 
        c.category === '静默'
      ).length;
      
      // 计算本月新增（当月新增的结单客户）
      const now = dayjs();
      const startOfMonth = now.startOf('month');
      const monthlyNew = closedCustomers.filter((c: any) => {
        if (!c.created_at) return false;
        const createdDate = dayjs(c.created_at);
        return createdDate.isAfter(startOfMonth) || createdDate.isSame(startOfMonth, 'day');
      }).length;
      
      setStats({
        totalCustomers,
        pendingFollowUp,
        monthlyNew,
        closedCount: totalCustomers // 结单数等于总客户数
      });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  // 计算距离2026年12月31日的天数
  const calculateDaysRemaining = () => {
    const targetDate = new Date('2026-12-31');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = calculateDaysRemaining();

  return (
    <Layout style={{ height: '100vh', ...getBackgroundStyle(), display: 'flex', flexDirection: 'column' }}>
      <Header className="tech-header" style={{
        padding: '0 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 56
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img 
            src={logo} 
            alt="Logo" 
            style={{ 
              height: 30,
              width: 'auto'
            }} 
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: getTextColor() }}>
          <h2 className={theme === 'dark' ? 'gradient-text' : ''} style={{ 
            margin: 0, 
            fontSize: 18,
            fontWeight: 'bold',
            letterSpacing: '0.5px',
            color: theme === 'light' ? '#262626' : undefined
          }}>
            CSM系统
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {theme === 'dark' ? <BulbFilled style={{ fontSize: 16 }} /> : <BulbOutlined style={{ fontSize: 16 }} />}
            <Switch
              checked={theme === 'dark'}
              onChange={toggleTheme}
              checkedChildren="深色"
              unCheckedChildren="浅色"
              size="small"
            />
          </div>
          <Badge 
            status={isOnline() ? 'success' : 'error'} 
            text={<span style={{ color: getTextColor(), fontSize: 12 }}>{isOnline() ? '在线' : '离线'}</span>} 
          />
          <span style={{ fontSize: 13 }}>
            {user?.username} ({user?.role === 'admin' ? '管理员' : '成员'})
          </span>
        </div>
      </Header>

      <Content style={{ padding: '20px 20px 20px 20px', paddingTop: '32px', flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Row gutter={[24, 24]} style={{ flex: 1, marginBottom: 16 }}>
          {modules.map((module, index) => (
            <Col xs={24} lg={8} key={module.key}>
              <Card
                hoverable
                className="tech-card"
                style={{
                  height: '100%',
                  borderRadius: 16,
                  overflow: 'hidden'
                }}
                styles={{ body: { padding: '32px', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center' } }}
              >
                <div style={{ textAlign: 'center', marginBottom: 24, width: '100%', paddingTop: 32 }}>
                  <div className={theme === 'dark' ? 'tech-icon' : ''} style={{ 
                    display: 'inline-block',
                    ...(theme === 'dark' ? { animationDelay: `${index * 0.5}s` } : {})
                  }}>
                    {module.icon}
                  </div>
                  <h3 style={{ 
                    marginTop: 20, 
                    marginBottom: 8, 
                    fontSize: 22,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    ...(theme === 'dark' ? {
                      background: `linear-gradient(135deg, ${module.color} 0%, #764ba2 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    } : {
                      color: module.color
                    })
                  }}>
                    {module.title}
                  </h3>
                  <p style={{ 
                    color: theme === 'dark' ? '#a0aec0' : '#595959', 
                    marginBottom: 0, 
                    fontSize: 14,
                    textAlign: 'center'
                  }}>
                    {module.description}
                  </p>
                </div>

                <div style={{ marginTop: 20, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {module.subModules.map((subModule) => (
                    <Button
                      key={subModule.key}
                      className="tech-button"
                      size="small"
                      icon={subModule.icon}
                      style={{
                        marginBottom: 8,
                        height: 36,
                        width: '80%',
                        textAlign: 'center',
                        fontWeight: 500,
                        fontSize: 13
                      }}
                      onClick={() => navigate(subModule.path)}
                    >
                      {subModule.name}
                    </Button>
                  ))}
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* 快速统计 */}
        <Row gutter={[16, 16]} style={{ marginTop: 16, marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card" style={{ borderRadius: 12 }}>
              <Statistic
                title={<span style={{ color: theme === 'dark' ? '#a0aec0' : '#595959' }}>总客户数</span>}
                value={stats.totalCustomers}
                prefix={<TeamOutlined style={{ color: theme === 'dark' ? '#667eea' : '#1890ff' }} />}
                valueStyle={{ 
                  color: theme === 'dark' ? '#e0e7ff' : '#262626', 
                  fontSize: 28, 
                  fontWeight: 'bold' 
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card" style={{ borderRadius: 12 }}>
              <Statistic
                title={<span style={{ color: theme === 'dark' ? '#a0aec0' : '#595959' }}>待跟进</span>}
                value={stats.pendingFollowUp}
                prefix={<ClockCircleOutlined style={{ color: '#f59e0b' }} />}
                valueStyle={{ color: '#f59e0b', fontSize: 28, fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card" style={{ borderRadius: 12 }}>
              <Statistic
                title={<span style={{ color: theme === 'dark' ? '#a0aec0' : '#595959' }}>本月新增</span>}
                value={stats.monthlyNew}
                prefix={<UserAddOutlined style={{ color: '#10b981' }} />}
                valueStyle={{ color: '#10b981', fontSize: 28, fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card" style={{ borderRadius: 12 }}>
              <Statistic
                title={<span style={{ color: theme === 'dark' ? '#a0aec0' : '#595959' }}>结单数</span>}
                value={stats.closedCount}
                prefix={<CheckCircleOutlined style={{ color: theme === 'dark' ? '#667eea' : '#1890ff' }} />}
                valueStyle={{ 
                  color: theme === 'dark' ? '#818cf8' : '#1890ff', 
                  fontSize: 28, 
                  fontWeight: 'bold' 
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* 倒计时提醒 */}
        <div style={{
          fontSize: 12,
          color: theme === 'dark' ? '#a0aec0' : '#8c8c8c',
          marginTop: 8,
          marginLeft: 4,
          textAlign: 'left'
        }}>
          距离2026年12月31日还剩 <span style={{ fontWeight: 'bold', color: theme === 'dark' ? '#667eea' : '#1890ff' }}>{daysRemaining}</span> 天
        </div>
      </Content>
    </Layout>
  );
}

