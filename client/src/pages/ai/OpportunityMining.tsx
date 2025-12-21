import { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Button,
  Input,
  Space,
  Badge,
  Dropdown,
  MenuProps,
  Table,
  Tag,
  Statistic,
  Row,
  Col
} from 'antd';
import {
  SearchOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  LogoutOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import logo from '../../assets/logo.svg';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../../services/auth';
import { isOnline } from '../../services/sync';
import { useTheme } from '../../contexts/ThemeContext';
import { getCustomers } from '../../services/customers';
import '../../styles/tech-theme.css';

const { Header, Content } = Layout;

export default function OpportunityMining() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const user = getCurrentUser();

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    setLoading(true);
    try {
      const customers = await getCustomers();
      const opportunityList: any[] = [];
      
      // 分析客户数据，挖掘潜在机会
      customers.forEach((customer: any) => {
        // 分析跟进记录中的机会
        if (customer.follow_up_action) {
          try {
            let followUpRecords: any[] = [];
            if (typeof customer.follow_up_action === 'string') {
              followUpRecords = JSON.parse(customer.follow_up_action);
            } else if (Array.isArray(customer.follow_up_action)) {
              followUpRecords = customer.follow_up_action;
            }
            
            followUpRecords.forEach((record: any) => {
              if (record.details && record.details.length > 50) {
                // 如果跟进详情较长，可能包含重要信息
                opportunityList.push({
                  id: `${customer.id}-${record.date || Date.now()}`,
                  customerName: customer.company_name,
                  customerId: customer.id,
                  category: customer.category,
                  date: record.date || '',
                  type: '跟进记录',
                  content: record.details,
                  score: calculateOpportunityScore(customer, record)
                });
              }
            });
          } catch (e) {
            console.error('解析跟进记录失败:', e);
          }
        }
        
        // 分析需求列表中的机会
        if (customer.requirement_list) {
          try {
            let requirementList: any[] = [];
            if (typeof customer.requirement_list === 'string') {
              requirementList = JSON.parse(customer.requirement_list);
            } else if (Array.isArray(customer.requirement_list)) {
              requirementList = customer.requirement_list;
            }
            
            requirementList.forEach((req: any) => {
              if (req.status === '待处理' || req.status === '进行中') {
                opportunityList.push({
                  id: `${customer.id}-req-${req.date || Date.now()}`,
                  customerName: customer.company_name,
                  customerId: customer.id,
                  category: customer.category,
                  date: req.date || '',
                  type: '需求/Bug',
                  content: req.description,
                  status: req.status,
                  score: calculateRequirementScore(customer, req)
                });
              }
            });
          } catch (e) {
            console.error('解析需求列表失败:', e);
          }
        }
      });
      
      // 按分数排序
      opportunityList.sort((a, b) => b.score - a.score);
      setOpportunities(opportunityList);
    } catch (error) {
      console.error('加载机会数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 计算跟进记录的机会分数
  const calculateOpportunityScore = (customer: any, record: any): number => {
    let score = 0;
    
    // 根据客户分类给分
    if (customer.category === '试用/谈判/高意向') score += 30;
    else if (customer.category === '建联中') score += 20;
    else if (customer.category === '静默') score += 10;
    
    // 根据跟进详情长度给分
    if (record.details && record.details.length > 100) score += 20;
    else if (record.details && record.details.length > 50) score += 10;
    
    // 根据客户评级给分
    if (customer.customer_rating) {
      score += customer.customer_rating * 5;
    }
    
    return score;
  };

  // 计算需求的机会分数
  const calculateRequirementScore = (customer: any, req: any): number => {
    let score = 0;
    
    // 根据客户分类给分
    if (customer.category === '试用/谈判/高意向') score += 40;
    else if (customer.category === '建联中') score += 25;
    else if (customer.category === '静默') score += 15;
    
    // 根据需求状态给分
    if (req.status === '待处理') score += 20;
    else if (req.status === '进行中') score += 15;
    
    // 根据客户评级给分
    if (customer.customer_rating) {
      score += customer.customer_rating * 5;
    }
    
    return score;
  };

  const getBackgroundStyle = (): React.CSSProperties => {
    if (theme === 'dark') {
      return { background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1419 100%)' };
    }
    return { background: '#f0f2f5' };
  };

  const getTextColor = () => {
    return theme === 'dark' ? '#e0e7ff' : '#262626';
  };

  const filteredOpportunities = opportunities.filter((opp) => {
    return !searchText || 
      opp.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
      opp.content.toLowerCase().includes(searchText.toLowerCase());
  });

  const stats = {
    total: opportunities.length,
    high: opportunities.filter(o => o.score >= 50).length,
    medium: opportunities.filter(o => o.score >= 30 && o.score < 50).length,
    low: opportunities.filter(o => o.score < 30).length
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: () => {
        logout();
        navigate('/login');
      }
    }
  ];

  const columns: ColumnsType<any> = [
    {
      title: '机会分数',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      sorter: (a, b) => a.score - b.score,
      render: (score: number) => {
        let color = 'default';
        if (score >= 50) color = 'red';
        else if (score >= 30) color = 'orange';
        else color = 'blue';
        return <Tag color={color}>{score}分</Tag>;
      }
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 150,
      render: (text: string, record: any) => (
        <Button
          type="link"
          onClick={() => navigate(`/customer/${record.category}`)}
          style={{ padding: 0 }}
        >
          {text}
        </Button>
      )
    },
    {
      title: '客户分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => {
        const colorMap: Record<string, string> = {
          '结单': 'red',
          '试用/谈判/高意向': 'orange',
          '建联中': 'blue',
          '静默': 'default'
        };
        return <Tag color={colorMap[category] || 'default'}>{category}</Tag>;
      }
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        if (!status) return '-';
        const colorMap: Record<string, string> = {
          '待处理': 'orange',
          '进行中': 'blue',
          '已解决': 'green'
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      }
    }
  ];

  return (
    <Layout style={{ height: '100vh', ...getBackgroundStyle() }}>
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
            alt="UWA"
            onClick={() => navigate('/')}
            style={{ 
              height: 30,
              width: 'auto',
              cursor: 'pointer'
            }}
          />
          <h3 style={{ margin: 0, color: getTextColor() }}>
            机会挖掘
          </h3>
        </div>
        <Space style={{ color: getTextColor() }}>
          <Badge status={isOnline() ? 'success' : 'error'} text={<span style={{ color: getTextColor() }}>{isOnline() ? '在线' : '离线'}</span>} />
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <UserOutlined />
              <span>{user?.username}</span>
            </Space>
          </Dropdown>
        </Space>
      </Header>

      <Content style={{ padding: '20px', overflow: 'auto' }}>
        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card" style={{ borderRadius: 12 }}>
              <Statistic
                title={<span style={{ color: theme === 'dark' ? '#a0aec0' : '#595959' }}>总机会数</span>}
                value={stats.total}
                prefix={<ThunderboltOutlined style={{ color: theme === 'dark' ? '#667eea' : '#1890ff' }} />}
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
                title={<span style={{ color: theme === 'dark' ? '#a0aec0' : '#595959' }}>高价值</span>}
                value={stats.high}
                prefix={<ThunderboltOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: '#ff4d4f', fontSize: 28, fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card" style={{ borderRadius: 12 }}>
              <Statistic
                title={<span style={{ color: theme === 'dark' ? '#a0aec0' : '#595959' }}>中等价值</span>}
                value={stats.medium}
                prefix={<ThunderboltOutlined style={{ color: '#f59e0b' }} />}
                valueStyle={{ color: '#f59e0b', fontSize: 28, fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card" style={{ borderRadius: 12 }}>
              <Statistic
                title={<span style={{ color: theme === 'dark' ? '#a0aec0' : '#595959' }}>低价值</span>}
                value={stats.low}
                prefix={<ThunderboltOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff', fontSize: 28, fontWeight: 'bold' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 搜索 */}
        <Card style={{ marginBottom: 16, borderRadius: 12 }}>
          <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Input
              placeholder="搜索客户名称或内容"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
            <Button onClick={loadOpportunities}>
              刷新
            </Button>
          </Space>
        </Card>

        {/* 机会列表 */}
        <Card style={{ borderRadius: 12 }}>
          <Table
            columns={columns}
            dataSource={filteredOpportunities}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`
            }}
          />
        </Card>
      </Content>
    </Layout>
  );
}

