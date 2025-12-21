import { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Button,
  Space,
  message,
  Badge,
  Dropdown,
  MenuProps,
  Table,
  Tag,
  DatePicker
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  LogoutOutlined,
  FileTextOutlined,
  DownloadOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../../services/auth';
import { isOnline } from '../../services/sync';
import { useTheme } from '../../contexts/ThemeContext';
import dayjs from 'dayjs';
import '../../styles/tech-theme.css';
import logo from '../../assets/logo.svg';

const { Header, Content } = Layout;

export default function ReportList() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const user = getCurrentUser();

  const getBackgroundStyle = (): React.CSSProperties => {
    if (theme === 'dark') {
      return { background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1419 100%)' };
    }
    return { background: '#f0f2f5' };
  };

  const getTextColor = () => {
    return theme === 'dark' ? '#e0e7ff' : '#262626';
  };

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      // TODO: 调用API获取周报列表
      setReports([]);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // TODO: 调用API生成周报
      message.success('周报生成成功');
      loadReports();
    } catch (error) {
      message.error('周报生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (id: number) => {
    try {
      // TODO: 调用API下载周报
      message.success('开始下载');
    } catch (error) {
      message.error('下载失败');
    }
  };

  const columns: ColumnsType<any> = [
    {
      title: '周报日期',
      dataIndex: 'week',
      width: 150,
      render: (week) => week || '-'
    },
    {
      title: '生成时间',
      dataIndex: 'created_at',
      width: 180
    },
    {
      title: '客户数量',
      dataIndex: 'customer_count',
      width: 100
    },
    {
      title: '新增客户',
      dataIndex: 'new_customers',
      width: 100
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status) => {
        const colorMap: Record<string, string> = {
          '已完成': 'green',
          '生成中': 'orange',
          '失败': 'red'
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      }
    },
    {
      title: '操作',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(record.id)}>
            下载
          </Button>
        </Space>
      )
    }
  ];

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
            alt="UWA"
            onClick={() => navigate('/')}
            style={{ 
              height: 30,
              width: 'auto',
              cursor: 'pointer'
            }}
          />
          <h3 className={theme === 'dark' ? 'gradient-text' : ''} style={{ 
            margin: 0, 
            fontSize: 20,
            color: theme === 'light' ? '#262626' : undefined
          }}>
            销售周报
          </h3>
        </div>
        <Space style={{ color: getTextColor() }}>
          <Badge status={isOnline() ? 'success' : 'error'} text={<span style={{ color: getTextColor() }}>{isOnline() ? '在线' : '离线'}</span>} />
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button className="tech-button" type="text" icon={<UserOutlined />}>
              {user?.username}
            </Button>
          </Dropdown>
        </Space>
      </Header>

      <Content style={{ padding: '20px', flex: 1, overflow: 'auto' }}>
        <Card className="tech-card" style={{ marginBottom: 16 }}>
          <Space>
            <Button 
              className="tech-button-primary"
              type="primary" 
              icon={<FileTextOutlined />} 
              onClick={handleGenerate}
              loading={generating}
            >
              生成本周周报
            </Button>
            <Button className="tech-button" icon={<ReloadOutlined />} onClick={loadReports}>
              刷新
            </Button>
          </Space>
        </Card>

        <Card className="tech-card" title={<span style={{ color: getTextColor() }}>周报列表</span>}>
          <div className="tech-table">
            <Table
              columns={columns}
              dataSource={reports}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => <span style={{ color: getTextColor() }}>共 {total} 条记录</span>
              }}
            />
          </div>
        </Card>

        <Card className="tech-card" title={<span style={{ color: getTextColor() }}>周报说明</span>} style={{ marginTop: 16 }}>
          <p style={{ color: getTextColor() }}>周报功能说明：</p>
          <ul style={{ color: theme === 'dark' ? '#a0aec0' : '#595959' }}>
            <li>每周自动汇总客户数据</li>
            <li>分析客户QA常见问题</li>
            <li>生成销售数据统计</li>
            <li>支持导出Excel/PDF格式</li>
          </ul>
          <p style={{ color: theme === 'dark' ? '#a0aec0' : '#595959', marginTop: 16 }}>
            * 周报功能正在开发中，敬请期待
          </p>
        </Card>
      </Content>
    </Layout>
  );
}

