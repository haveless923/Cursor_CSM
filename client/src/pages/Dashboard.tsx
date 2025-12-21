import { useState, useEffect } from 'react';
import {
  Layout,
  Table,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Form,
  DatePicker,
  message,
  Tag,
  Badge,
  Dropdown,
  MenuProps
} from 'antd';
import {
  PlusOutlined,
  SettingOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  LogoutOutlined,
  SyncOutlined,
  SearchOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Customer } from '../db/localDb';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../services/customers';
import { logout, getCurrentUser } from '../services/auth';
import { syncToServer, syncFromServer, isOnline } from '../services/sync';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Header, Content } = Layout;
const { Option } = Select;

export default function Dashboard() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<{ status?: string; search?: string }>({});
  const user = getCurrentUser();

  useEffect(() => {
    loadCustomers();
  }, [filters]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await getCustomers(filters);
      setCustomers(data || []);
    } catch (error: any) {
      console.error('加载数据失败:', error);
      // 即使失败也显示空列表，不阻止页面渲染
      setCustomers([]);
      if (isOnline()) {
        message.error('加载数据失败: ' + (error.message || '未知错误'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Customer) => {
    setEditingCustomer(record);
    form.setFieldsValue({
      ...record,
      due_date: record.due_date ? dayjs(record.due_date) : null,
      last_test_date: record.last_test_date ? dayjs(record.last_test_date) : null
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条客户记录吗？',
      onOk: async () => {
        try {
          await deleteCustomer(id);
          message.success('删除成功');
          loadCustomers();
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      const customerData = {
        ...values,
        due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : null,
        last_test_date: values.last_test_date ? values.last_test_date.format('YYYY-MM-DD') : null
      };

      if (editingCustomer?.id) {
        await updateCustomer(editingCustomer.id, customerData);
        message.success('更新成功');
      } else {
        await createCustomer(customerData);
        message.success('创建成功');
      }

      setModalVisible(false);
      form.resetFields();
      loadCustomers();
    } catch (error) {
      message.error(editingCustomer ? '更新失败' : '创建失败');
    }
  };

  const handleSync = async () => {
    if (!isOnline()) {
      message.warning('当前处于离线状态，无法同步');
      return;
    }

    try {
      message.loading({ content: '正在同步...', key: 'sync' });
      await syncToServer();
      await syncFromServer();
      message.success({ content: '同步成功', key: 'sync' });
      loadCustomers();
    } catch (error) {
      message.error({ content: '同步失败', key: 'sync' });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const columns: ColumnsType<Customer> = [
    {
      title: '#',
      dataIndex: 'id',
      width: 60,
      render: (_, __, index) => index + 1
    },
    {
      title: '客户姓名',
      dataIndex: 'customer_name',
      width: 150,
      ellipsis: true
    },
    {
      title: '到期',
      dataIndex: 'due_date',
      width: 120,
      render: (date) => date || '-'
    },
    {
      title: '联系人',
      dataIndex: 'contact_person',
      width: 150,
      ellipsis: true
    },
    {
      title: '名称',
      dataIndex: 'name',
      width: 200,
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (status) => (
        <Tag color={status === '结单' ? 'red' : 'blue'}>{status || '进行中'}</Tag>
      )
    },
    {
      title: '跟进动作',
      dataIndex: 'follow_up_action',
      width: 250,
      ellipsis: true,
      render: (text) => {
        if (!text) return '-';
        // 检查是否包含需要跟进的标记（红色）
        const hasUrgent = text.includes('需要跟进') || text.includes('紧急');
        return hasUrgent ? <span style={{ color: 'red' }}>{text}</span> : text;
      }
    },
    {
      title: 'Next Step',
      dataIndex: 'next_step',
      width: 200,
      ellipsis: true
    },
    {
      title: '提测频率',
      dataIndex: 'testing_frequency',
      width: 120,
      render: (freq) => freq || '-'
    },
    {
      title: '最近提测',
      dataIndex: 'last_test_date',
      width: 120,
      render: (date) => date || '-'
    },
    {
      title: 'GPM',
      dataIndex: 'gpm',
      width: 100,
      render: (gpm) => {
        if (!gpm) return '-';
        const colorMap: Record<string, string> = {
          '可推': 'green',
          '试用': 'orange',
          '转化': 'blue'
        };
        return <Tag color={colorMap[gpm] || 'default'}>{gpm}</Tag>;
      }
    },
    {
      title: 'PPL使用',
      dataIndex: 'ppl_usage',
      width: 150,
      render: (usage) => usage || '-'
    },
    {
      title: '操作',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(record.id!)}>
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
      onClick: handleLogout
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h2 style={{ margin: 0 }}>成单客户</h2>
          <Badge status={isOnline() ? 'success' : 'error'} text={isOnline() ? '在线' : '离线'} />
        </div>
        <Space>
          <Button
            icon={<SyncOutlined />}
            onClick={handleSync}
            disabled={!isOnline()}
          >
            同步
          </Button>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button type="text">
              {user?.username} ({user?.role === 'admin' ? '管理员' : '成员'})
            </Button>
          </Dropdown>
        </Space>
      </Header>

      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        <div style={{
          background: '#fff',
          padding: 16,
          marginBottom: 16,
          borderRadius: 8
        }}>
          <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                添加记录
              </Button>
              <Button icon={<SettingOutlined />}>
                字段管理
              </Button>
              <Button icon={<FilterOutlined />}>
                筛选
              </Button>
              <Button icon={<SortAscendingOutlined />}>
                排序
              </Button>
            </Space>
            <Space>
              <Input
                placeholder="搜索客户姓名、联系人、名称"
                prefix={<SearchOutlined />}
                style={{ width: 300 }}
                allowClear
                onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
              />
              <Select
                placeholder="状态筛选"
                style={{ width: 120 }}
                allowClear
                onChange={(value) => setFilters({ ...filters, status: value || undefined })}
              >
                <Option value="进行中">进行中</Option>
                <Option value="结单">结单</Option>
              </Select>
            </Space>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={customers}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1800 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />

        <Modal
          title={editingCustomer ? '编辑客户记录' : '添加客户记录'}
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
            <Form.Item name="customer_name" label="客户姓名">
              <Input placeholder="请输入客户姓名" />
            </Form.Item>

            <Form.Item name="due_date" label="到期日期">
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>

            <Form.Item name="contact_person" label="联系人">
              <Input placeholder="请输入联系人" />
            </Form.Item>

            <Form.Item name="name" label="名称">
              <Input placeholder="请输入名称" />
            </Form.Item>

            <Form.Item name="status" label="状态" initialValue="进行中">
              <Select>
                <Option value="进行中">进行中</Option>
                <Option value="结单">结单</Option>
              </Select>
            </Form.Item>

            <Form.Item name="follow_up_action" label="跟进动作">
              <Input.TextArea
                rows={3}
                placeholder="请输入跟进动作（红色表示需要跟进）"
              />
            </Form.Item>

            <Form.Item name="next_step" label="Next Step">
              <Input placeholder="请输入下一步计划" />
            </Form.Item>

            <Form.Item name="testing_frequency" label="提测频率">
              <Select placeholder="请选择提测频率">
                <Option value="双周">双周</Option>
                <Option value="单周">单周</Option>
                <Option value="月度">月度</Option>
                <Option value="不规律">不规律</Option>
              </Select>
            </Form.Item>

            <Form.Item name="last_test_date" label="最近提测日期">
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>

            <Form.Item name="gpm" label="GPM">
              <Select placeholder="请选择GPM状态">
                <Option value="可推">可推</Option>
                <Option value="试用">试用</Option>
                <Option value="转化">转化</Option>
              </Select>
            </Form.Item>

            <Form.Item name="ppl_usage" label="PPL使用">
              <Select placeholder="请选择PPL使用状态">
                <Option value="已搭建">已搭建</Option>
                <Option value="未搭建">未搭建</Option>
                <Option value="搭建到一半">搭建到一半</Option>
                <Option value="已搭建,并且">已搭建,并且</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
}


