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
  LogoutOutlined
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
const { Option } = Select;

export default function QAList() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [qaList, setQaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQA, setEditingQA] = useState<any>(null);
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
    loadQAList();
  }, [searchText]);

  const loadQAList = async () => {
    setLoading(true);
    try {
      // TODO: 调用API获取QA列表
      setQaList([]);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingQA(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingQA(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条QA记录吗？',
      onOk: async () => {
        try {
          // TODO: 调用删除API
          message.success('删除成功');
          loadQAList();
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingQA?.id) {
        // TODO: 更新API
        message.success('更新成功');
      } else {
        // TODO: 创建API
        message.success('创建成功');
      }

      setModalVisible(false);
      form.resetFields();
      loadQAList();
    } catch (error) {
      message.error(editingQA ? '更新失败' : '创建失败');
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
      title: '问题',
      dataIndex: 'question',
      width: 300,
      ellipsis: true
    },
    {
      title: '回答',
      dataIndex: 'answer',
      width: 400,
      ellipsis: true
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 120,
      render: (category) => category ? <Tag>{category}</Tag> : '-'
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 150
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
            客户QA管理
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
            添加QA
          </Button>
          <Input
            placeholder="搜索客户名称、问题"
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
          dataSource={qaList}
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
          title={editingQA ? '编辑QA' : '添加QA'}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            form.resetFields();
          }}
          onOk={() => form.submit()}
          width={800}
          destroyOnHidden
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item name="customer_name" label="客户名称">
              <Input placeholder="请输入客户名称" />
            </Form.Item>

            <Form.Item name="question" label="问题" rules={[{ required: true, message: '请输入问题' }]}>
              <TextArea rows={3} placeholder="请输入客户问题" />
            </Form.Item>

            <Form.Item name="answer" label="回答" rules={[{ required: true, message: '请输入回答' }]}>
              <TextArea rows={4} placeholder="请输入回答" />
            </Form.Item>

            <Form.Item name="category" label="分类">
              <Select placeholder="请选择分类（可选）">
                <Option value="产品功能">产品功能</Option>
                <Option value="价格">价格</Option>
                <Option value="技术支持">技术支持</Option>
                <Option value="其他">其他</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
}

