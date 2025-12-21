import { useState, useEffect } from 'react';
import {
  Layout,
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  message,
  Card,
  Tag,
  Badge,
  Dropdown,
  MenuProps
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  LogoutOutlined,
  LinkOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../../services/auth';
import { isOnline } from '../../services/sync';
import { useTheme } from '../../contexts/ThemeContext';
import TextArea from 'antd/es/input/TextArea';
import '../../styles/tech-theme.css';
import logo from '../../assets/logo.svg';

const { Header, Content } = Layout;

export default function OpportunityList() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<any>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
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
    loadOpportunities();
  }, [searchText]);

  const loadOpportunities = async () => {
    setLoading(true);
    try {
      // TODO: 调用API获取机会列表
      setOpportunities([]);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingOpportunity(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingOpportunity(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个客户机会吗？',
      onOk: async () => {
        try {
          // TODO: 调用删除API
          message.success('删除成功');
          loadOpportunities();
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingOpportunity?.id) {
        // TODO: 更新API
        message.success('更新成功');
      } else {
        // TODO: 创建API - 创建后自动到公海
        message.success('创建成功，已添加到公海等待认领');
      }

      setModalVisible(false);
      form.resetFields();
      loadOpportunities();
    } catch (error) {
      message.error(editingOpportunity ? '更新失败' : '创建失败');
    }
  };

  const handleClaim = async (id: number) => {
    try {
      // TODO: 认领机会API
      message.success('认领成功');
      loadOpportunities();
    } catch (error) {
      message.error('认领失败');
    }
  };

  const columns: ColumnsType<any> = [
    {
      title: '#',
      dataIndex: 'id',
      width: 60,
      render: (_, __, index) => index + 1
    },
    {
      title: '客户名称',
      dataIndex: 'customer_name',
      width: 150,
      ellipsis: true
    },
    {
      title: '项目名称',
      dataIndex: 'project_name',
      width: 200,
      ellipsis: true
    },
    {
      title: '项目链接',
      dataIndex: 'project_link',
      width: 200,
      render: (link) => link ? (
        <a href={link} target="_blank" rel="noopener noreferrer">
          <LinkOutlined /> 查看链接
        </a>
      ) : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (status) => {
        const colorMap: Record<string, string> = {
          '公海': 'green',
          '已认领': 'blue',
          '进行中': 'orange'
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      }
    },
    {
      title: '负责人',
      dataIndex: 'owner_name',
      width: 120,
      render: (name) => name || '未分配'
    },
    {
      title: '备注',
      dataIndex: 'notes',
      width: 250,
      ellipsis: true
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 150,
      render: (date) => date || '-'
    },
    {
      title: '操作',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          {record.status === '公海' && !record.owner_id && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleClaim(record.id)}>
              认领
            </Button>
          )}
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
            删除
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
            客户机会管理
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
        <Space style={{ marginBottom: 12, width: '100%', justifyContent: 'space-between' }}>
          <Button className="tech-button-primary" type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建客户机会
          </Button>
          <Input
            placeholder="搜索客户名称、项目名称"
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
            allowClear
            variant="borderless"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Space>

        <div className="tech-table">
          <Table
          columns={columns}
          dataSource={opportunities}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => <span style={{ color: getTextColor() }}>共 {total} 条记录</span>
            }}
          />
        </div>

        <Modal
          title={editingOpportunity ? '编辑客户机会' : '新建客户机会'}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            form.resetFields();
          }}
          onOk={() => form.submit()}
          width={700}
          destroyOnHidden
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item name="customer_name" label="客户名称" rules={[{ required: true, message: '请输入客户名称' }]}>
              <Input placeholder="请输入客户名称" />
            </Form.Item>

            <Form.Item name="project_name" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
              <Input placeholder="请输入项目名称" />
            </Form.Item>

            <Form.Item name="project_link" label="项目链接">
              <Input placeholder="请输入项目链接（可选）" />
            </Form.Item>

            <Form.Item name="notes" label="备注">
              <TextArea rows={4} placeholder="请输入备注信息（可选）" />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
}

