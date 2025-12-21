import { useState, useEffect } from 'react';
import {
  Layout,
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  DatePicker,
  TimePicker,
  message,
  Card,
  Tag,
  Badge,
  Dropdown,
  MenuProps,
  Select
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  LogoutOutlined,
  CalendarOutlined
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
const { Option } = Select;

export default function VisitList() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVisit, setEditingVisit] = useState<any>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
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
    loadVisits();
  }, [searchText, statusFilter]);

  const loadVisits = async () => {
    setLoading(true);
    try {
      // TODO: 调用API获取行程列表
      setVisits([]);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingVisit(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingVisit(record);
    form.setFieldsValue({
      ...record,
      visit_date: record.visit_date ? dayjs(record.visit_date) : null,
      visit_time: record.visit_time ? dayjs(record.visit_time, 'HH:mm') : null
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个行程吗？',
      onOk: async () => {
        try {
          // TODO: 调用删除API
          message.success('删除成功');
          loadVisits();
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      const visitData = {
        ...values,
        visit_date: values.visit_date ? values.visit_date.format('YYYY-MM-DD') : null,
        visit_time: values.visit_time ? values.visit_time.format('HH:mm') : null
      };

      if (editingVisit?.id) {
        // TODO: 更新API
        message.success('更新成功');
      } else {
        // TODO: 创建API
        message.success('创建成功');
      }

      setModalVisible(false);
      form.resetFields();
      loadVisits();
    } catch (error) {
      message.error(editingVisit ? '更新失败' : '创建失败');
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
      title: '拜访日期',
      dataIndex: 'visit_date',
      width: 120,
      sorter: true
    },
    {
      title: '拜访时间',
      dataIndex: 'visit_time',
      width: 100
    },
    {
      title: '客户名称',
      dataIndex: 'customer_name',
      width: 150,
      ellipsis: true
    },
    {
      title: '拜访地点',
      dataIndex: 'location',
      width: 200,
      ellipsis: true
    },
    {
      title: '拜访目的',
      dataIndex: 'purpose',
      width: 200,
      ellipsis: true
    },
    {
      title: '参与人员',
      dataIndex: 'participants',
      width: 150,
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status) => {
        const colorMap: Record<string, string> = {
          '待执行': 'orange',
          '已完成': 'green',
          '已取消': 'red'
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      }
    },
    {
      title: '备注',
      dataIndex: 'notes',
      width: 200,
      ellipsis: true
    },
    {
      title: '操作',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
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
            拜访行程管理
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
            创建行程
          </Button>
          <Space>
            <Select
              className="tech-input"
              placeholder="状态筛选"
              style={{ width: 120 }}
              allowClear
              value={statusFilter || undefined}
              onChange={(value) => setStatusFilter(value || '')}
            >
              <Option value="待执行">待执行</Option>
              <Option value="已完成">已完成</Option>
              <Option value="已取消">已取消</Option>
            </Select>
            <Input
              placeholder="搜索客户名称"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              allowClear
              variant="borderless"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Space>
        </Space>

        <div className="tech-table">
          <Table
          columns={columns}
          dataSource={visits}
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
          title={editingVisit ? '编辑行程' : '创建行程'}
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
            <Form.Item name="visit_date" label="拜访日期" rules={[{ required: true, message: '请选择拜访日期' }]}>
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>

            <Form.Item name="visit_time" label="拜访时间">
              <TimePicker style={{ width: '100%' }} format="HH:mm" />
            </Form.Item>

            <Form.Item name="customer_name" label="客户名称" rules={[{ required: true, message: '请输入客户名称' }]}>
              <Input placeholder="请输入客户名称" />
            </Form.Item>

            <Form.Item name="location" label="拜访地点">
              <Input placeholder="请输入拜访地点" />
            </Form.Item>

            <Form.Item name="purpose" label="拜访目的">
              <Input placeholder="请输入拜访目的" />
            </Form.Item>

            <Form.Item name="participants" label="参与人员">
              <Input placeholder="请输入参与人员，多个用逗号分隔" />
            </Form.Item>

            <Form.Item name="status" label="状态" initialValue="待执行">
              <Select>
                <Option value="待执行">待执行</Option>
                <Option value="已完成">已完成</Option>
                <Option value="已取消">已取消</Option>
              </Select>
            </Form.Item>

            <Form.Item name="notes" label="备注">
              <Input.TextArea rows={3} placeholder="请输入备注信息" />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
}

