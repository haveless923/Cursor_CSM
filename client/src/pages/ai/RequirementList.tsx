import { useState, useEffect } from 'react';
import {
  Layout,
  Table,
  Button,
  Input,
  Space,
  Card,
  Tag,
  Badge,
  Dropdown,
  MenuProps,
  Select,
  Statistic,
  Row,
  Col,
  Upload,
  Modal,
  message,
  Form,
  DatePicker
} from 'antd';
import {
  SearchOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  LogoutOutlined,
  BugOutlined,
  FileTextOutlined,
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import logo from '../../assets/logo.svg';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../../services/auth';
import { isOnline } from '../../services/sync';
import { useTheme } from '../../contexts/ThemeContext';
import { getCustomers, updateCustomer, createCustomer } from '../../services/customers';
import '../../styles/tech-theme.css';

const { Header, Content } = Layout;
const { Option } = Select;

export default function RequirementList() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [requirements, setRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<any>(null);
  const [form] = Form.useForm();
  const user = getCurrentUser();

  useEffect(() => {
    loadRequirements();
  }, []);

  const loadRequirements = async () => {
    setLoading(true);
    try {
      const customers = await getCustomers();
      const allRequirements: any[] = [];
      
      customers.forEach((customer: any) => {
        if (customer.requirement_list) {
          try {
            let requirementList: any[] = [];
            if (typeof customer.requirement_list === 'string') {
              requirementList = JSON.parse(customer.requirement_list);
            } else if (Array.isArray(customer.requirement_list)) {
              requirementList = customer.requirement_list;
            }
            
            requirementList.forEach((req: any, index: number) => {
              allRequirements.push({
                id: `${customer.id}-${index}`,
                customerName: customer.company_name || customer.customer_name || '',
                customerId: customer.id,
                date: req.date || '',
                type: req.type || '需求',
                description: req.description || '',
                ticketUrl: req.ticket_url || '',
                status: req.status || '待处理',
                priority: req.priority || '一般',
                requirementIndex: index
              });
            });
          } catch (e) {
            console.error('解析需求列表失败:', e);
          }
        }
      });
      
      setRequirements(allRequirements);
    } catch (error) {
      console.error('加载需求失败:', error);
    } finally {
      setLoading(false);
    }
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


  // 获取所有唯一的值用于筛选
  const allCustomers = Array.from(new Set(requirements.map(r => r.customerName).filter(Boolean))).sort();
  const allTypes = Array.from(new Set(requirements.map(r => r.type).filter(Boolean))).sort();
  const allStatuses = Array.from(new Set(requirements.map(r => r.status).filter(Boolean))).sort();
  const allPriorities = Array.from(new Set(requirements.map(r => r.priority).filter(Boolean))).sort();

  const filteredRequirements = requirements.filter((req) => {
    const matchSearch = !searchText || 
      req.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
      req.description.toLowerCase().includes(searchText.toLowerCase());
    return matchSearch;
  });

  const stats = {
    total: requirements.length,
    requirement: requirements.filter(r => r.type === '需求').length,
    bug: requirements.filter(r => r.type === 'bug').length,
    pending: requirements.filter(r => r.status === '待处理').length,
    resolved: requirements.filter(r => r.status === '已解决').length
  };

  // 处理新增
  const handleAdd = () => {
    setEditingRequirement(null);
    form.resetFields();
    form.setFieldsValue({
      type: '需求',
      status: '待处理',
      priority: '一般',
      date: dayjs()
    });
    setEditModalVisible(true);
  };

  // 处理编辑
  const handleEdit = (record: any) => {
    setEditingRequirement(record);
    form.setFieldsValue({
      customerName: record.customerName,
      date: record.date ? dayjs(record.date) : dayjs(),
      type: record.type || '需求',
      description: record.description || '',
      status: record.status || '待处理',
      priority: record.priority || '一般',
      ticketUrl: record.ticketUrl || ''
    });
    setEditModalVisible(true);
  };

  // 处理删除
  const handleDelete = async (record: any) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条需求记录吗？',
      onOk: async () => {
        try {
          const customers = await getCustomers();
          const customer = customers.find((c: any) => c.id === record.customerId);
          
          if (!customer) {
            message.error('客户不存在');
            return;
          }

          // 获取现有需求列表
          let requirementList: any[] = [];
          if (customer.requirement_list) {
            try {
              if (typeof customer.requirement_list === 'string') {
                requirementList = JSON.parse(customer.requirement_list);
              } else if (Array.isArray(customer.requirement_list)) {
                requirementList = customer.requirement_list;
              }
            } catch (e) {
              console.error('解析需求列表失败:', e);
            }
          }

          // 删除指定索引的需求
          requirementList.splice(record.requirementIndex, 1);

          // 更新客户
          await updateCustomer(customer.id!, {
            requirement_list: JSON.stringify(requirementList)
          });

          message.success('删除成功');
          loadRequirements();
        } catch (error: any) {
          message.error(`删除失败: ${error.message || '未知错误'}`);
        }
      }
    });
  };

  // 处理保存
  const handleSave = async (values: any) => {
    try {
      const customers = await getCustomers();
      let customer = customers.find((c: any) => 
        (c.company_name || c.customer_name) === values.customerName
      );

      // 如果客户不存在，创建新客户
      if (!customer) {
        customer = await createCustomer({
          company_name: values.customerName,
          category: '静默',
          requirement_list: JSON.stringify([])
        });
      }

      // 获取现有需求列表
      let requirementList: any[] = [];
      if (customer.requirement_list) {
        try {
          if (typeof customer.requirement_list === 'string') {
            requirementList = JSON.parse(customer.requirement_list);
          } else if (Array.isArray(customer.requirement_list)) {
            requirementList = customer.requirement_list;
          }
        } catch (e) {
          console.error('解析需求列表失败:', e);
        }
      }

      const requirementData = {
        date: values.date ? values.date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        type: values.type || '需求',
        description: values.description || '',
        ticket_url: values.ticketUrl || '',
        status: values.status || '待处理',
        priority: values.priority || '一般'
      };

      if (editingRequirement) {
        // 编辑：更新指定索引的需求
        requirementList[editingRequirement.requirementIndex] = requirementData;
        message.success('更新成功');
      } else {
        // 新增：添加到列表末尾
        requirementList.push(requirementData);
        message.success('添加成功');
      }

      // 更新客户
      await updateCustomer(customer.id!, {
        requirement_list: JSON.stringify(requirementList)
      });

      setEditModalVisible(false);
      form.resetFields();
      loadRequirements();
    } catch (error: any) {
      message.error(`保存失败: ${error.message || '未知错误'}`);
    }
  };

  // 解析CSV文件（改进版本，支持引号内的逗号）
  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV文件至少需要包含表头和数据行');
    }

    // 改进的CSV解析函数，支持引号内的逗号
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    // 解析表头
    const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, ''));
    const expectedHeaders = ['客户', '日期', '类型', '描述', '状态', '工单链接'];
    
    // 验证表头
    if (headers.length !== expectedHeaders.length) {
      throw new Error(`表头格式不正确，应为：${expectedHeaders.join(', ')}，实际列数：${headers.length}`);
    }
    
    for (let i = 0; i < expectedHeaders.length; i++) {
      if (headers[i] !== expectedHeaders[i]) {
        throw new Error(`第${i + 1}列应为"${expectedHeaders[i]}"，实际为"${headers[i]}"`);
      }
    }

    // 解析数据行
    const data: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, ''));
      if (values.length === expectedHeaders.length && values[0]) {
        data.push({
          customerName: values[0],
          date: values[1] || '',
          type: values[2] || '需求',
          description: values[3] || '',
          status: values[4] || '待处理',
          ticketUrl: values[5] || ''
        });
      } else if (values[0]) {
        console.warn(`第${i + 1}行数据格式不正确，已跳过：`, values);
      }
    }

    return data;
  };

  // 解析Excel文件（使用SheetJS库，如果未安装则提示）
  const parseExcel = async (file: File): Promise<any[]> => {
    try {
      // 动态导入xlsx库
      let XLSX: any;
      try {
        XLSX = await import('xlsx');
      } catch (importError) {
        throw new Error('请先安装xlsx库：在client目录下运行 npm install xlsx，或使用CSV格式导入');
      }
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

      if (jsonData.length < 2) {
        throw new Error('Excel文件至少需要包含表头和数据行');
      }

      // 验证表头
      const headers = jsonData[0].map((h: any) => String(h).trim());
      const expectedHeaders = ['客户', '日期', '类型', '描述', '状态', '工单链接'];
      
      if (headers.length !== expectedHeaders.length) {
        throw new Error(`表头格式不正确，应为：${expectedHeaders.join(', ')}`);
      }

      for (let i = 0; i < expectedHeaders.length; i++) {
        if (headers[i] !== expectedHeaders[i]) {
          throw new Error(`第${i + 1}列应为"${expectedHeaders[i]}"，实际为"${headers[i]}"`);
        }
      }

      // 解析数据
      const result: any[] = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (row && row[0]) {
          // 处理日期格式（Excel日期可能是数字）
          let dateStr = '';
          if (row[1]) {
            if (typeof row[1] === 'number') {
              // Excel日期是1900年1月1日以来的天数
              const excelEpoch = new Date(1899, 11, 30);
              const date = new Date(excelEpoch.getTime() + row[1] * 24 * 60 * 60 * 1000);
              dateStr = date.toISOString().split('T')[0];
            } else {
              dateStr = String(row[1]).trim();
            }
          }

          result.push({
            customerName: String(row[0] || '').trim(),
            date: dateStr,
            type: String(row[2] || '需求').trim(),
            description: String(row[3] || '').trim(),
            status: String(row[4] || '待处理').trim(),
            ticketUrl: String(row[5] || '').trim()
          });
        }
      }

      return result;
    } catch (error: any) {
      if (error.message.includes('Failed to fetch dynamically imported module')) {
        throw new Error('请先安装xlsx库：npm install xlsx，或使用CSV格式导入');
      }
      throw error;
    }
  };

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    setImportLoading(true);
    try {
      let data: any[] = [];
      
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        data = parseCSV(text);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        data = await parseExcel(file);
      } else {
        message.error('不支持的文件格式，请使用CSV或Excel文件');
        setImportLoading(false);
        return;
      }

      if (data.length === 0) {
        message.warning('文件中没有有效数据');
        setImportLoading(false);
        return;
      }

      setImportData(data);
      setImportModalVisible(true);
    } catch (error: any) {
      message.error(error.message || '文件解析失败');
    } finally {
      setImportLoading(false);
    }
  };

  // 执行导入
  const handleImport = async () => {
    setImportLoading(true);
    try {
      const customers = await getCustomers();
      
      // 创建多个匹配键的映射（支持company_name和customer_name，去除空格）
      const customerMap = new Map<string, any>();
      const normalizeName = (name: string) => name.trim().toLowerCase();
      
      customers.forEach((c: any) => {
        if (c.company_name) {
          customerMap.set(normalizeName(c.company_name), c);
          customerMap.set(c.company_name, c); // 也保留原始名称
        }
        if (c.customer_name) {
          customerMap.set(normalizeName(c.customer_name), c);
          customerMap.set(c.customer_name, c); // 也保留原始名称
        }
      });

      let successCount = 0;
      let failCount = 0;
      const failReasons: string[] = [];

      for (const item of importData) {
        try {
          // 尝试精确匹配
          let customer = customerMap.get(item.customerName);
          
          // 如果精确匹配失败，尝试去除空格后匹配
          if (!customer) {
            customer = customerMap.get(normalizeName(item.customerName));
          }
          
          // 如果还是失败，尝试模糊匹配（包含关系）
          if (!customer) {
            customer = customers.find((c: any) => {
              const cName = (c.company_name || c.customer_name || '').toLowerCase();
              const iName = item.customerName.toLowerCase();
              return cName === iName || cName.includes(iName) || iName.includes(cName);
            });
          }
          
          // 如果客户不存在，自动创建新客户
          if (!customer) {
            customer = await createCustomer({
              company_name: item.customerName,
              category: '静默', // 默认分类
              requirement_list: JSON.stringify([])
            });
            // 将新创建的客户添加到列表和映射中
            customers.push(customer);
            if (customer.company_name) {
              customerMap.set(customer.company_name, customer);
              customerMap.set(normalizeName(customer.company_name), customer);
            }
          }

          // 获取现有需求列表
          let requirementList: any[] = [];
          if (customer.requirement_list) {
            try {
              if (typeof customer.requirement_list === 'string') {
                requirementList = JSON.parse(customer.requirement_list);
              } else if (Array.isArray(customer.requirement_list)) {
                requirementList = customer.requirement_list;
              }
            } catch (e) {
              console.error('解析需求列表失败:', e);
              requirementList = [];
            }
          }

          // 添加新需求
          requirementList.push({
            date: item.date,
            type: item.type,
            description: item.description,
            ticket_url: item.ticketUrl,
            status: item.status
          });

          // 更新客户
          await updateCustomer(customer.id!, {
            requirement_list: JSON.stringify(requirementList)
          });

          successCount++;
        } catch (error: any) {
          failCount++;
          failReasons.push(`处理客户"${item.customerName}"失败: ${error.message || '未知错误'}`);
          console.error(`导入失败 - 客户: ${item.customerName}`, error);
        }
      }

      let messageText = `导入完成：成功 ${successCount} 条`;
      if (failCount > 0) {
        messageText += `，失败 ${failCount} 条`;
        if (failReasons.length > 0 && failReasons.length <= 10) {
          messageText += `\n失败原因：${failReasons.join('; ')}`;
        } else if (failReasons.length > 10) {
          messageText += `\n失败原因（前10条）：${failReasons.slice(0, 10).join('; ')}...`;
        }
      }
      
      if (failCount > 0) {
        Modal.warning({
          title: '导入结果',
          content: messageText,
          width: 600
        });
      } else {
        message.success(messageText);
      }
      
      setImportModalVisible(false);
      setImportData([]);
      // 延迟一下确保数据已保存
      setTimeout(() => {
        loadRequirements();
      }, 500);
    } catch (error: any) {
      console.error('导入过程出错:', error);
      message.error(`导入失败: ${error.message || '未知错误'}`);
    } finally {
      setImportLoading(false);
    }
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
      title: '序号',
      key: 'index',
      width: 80,
      align: 'center',
      render: (_: any, __: any, index: number) => index + 1
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 150,
      filters: allCustomers.map(customer => ({ text: customer, value: customer })),
      onFilter: (value: any, record: any) => record.customerName === value,
      render: (text: string, record: any) => (
        <Button
          type="link"
          onClick={() => navigate(`/customer/${record.customerId}`)}
          style={{ padding: 0 }}
        >
          {text}
        </Button>
      )
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      sorter: (a: any, b: any) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return a.date.localeCompare(b.date);
      },
      sortDirections: ['descend', 'ascend']
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      filters: allTypes.map(type => ({ text: type, value: type })),
      onFilter: (value: any, record: any) => record.type === value,
      render: (type: string) => (
        <Tag color={type === '需求' ? 'blue' : 'red'}>
          {type === '需求' ? <FileTextOutlined /> : <BugOutlined />} {type}
        </Tag>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      filters: allStatuses.map(status => ({ text: status, value: status })),
      onFilter: (value: any, record: any) => record.status === value,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          '待处理': 'orange',
          '已解决': 'green',
          '进行中': 'blue',
          '留档': 'default'
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      }
    },
    {
      title: '重要度',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      filters: allPriorities.map(priority => ({ text: priority, value: priority })),
      onFilter: (value: any, record: any) => record.priority === value,
      render: (priority: string) => {
        const colorMap: Record<string, string> = {
          '紧急': 'red',
          '一般': 'blue',
          '低': 'default'
        };
        return <Tag color={colorMap[priority] || 'default'}>{priority || '一般'}</Tag>;
      }
    },
    {
      title: 'URL',
      dataIndex: 'ticketUrl',
      key: 'ticketUrl',
      width: 60,
      align: 'center',
      render: (url: string) => 
        url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" title={url}>
            <EyeOutlined style={{ fontSize: 16, color: '#1890ff' }} />
          </a>
        ) : (
          <span style={{ color: '#999' }}>-</span>
        )
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
            title="编辑"
          />
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            size="small"
            title="删除"
          />
        </Space>
      )
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
          <h3 style={{ margin: 0, color: '#046BFF' }}>
            工单进度
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

      <Content style={{ padding: '16px', overflow: 'auto', position: 'relative' }}>
        {/* 统计卡片 */}
        <Row gutter={12} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card" style={{ borderRadius: 12 }}>
              <Statistic
                title={<span style={{ color: theme === 'dark' ? '#a0aec0' : '#595959' }}>总需求数</span>}
                value={stats.total}
                prefix={<FileTextOutlined style={{ color: theme === 'dark' ? '#667eea' : '#1890ff' }} />}
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
                title={<span style={{ color: theme === 'dark' ? '#a0aec0' : '#595959' }}>需求</span>}
                value={stats.requirement}
                prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff', fontSize: 28, fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card" style={{ borderRadius: 12 }}>
              <Statistic
                title={<span style={{ color: theme === 'dark' ? '#a0aec0' : '#595959' }}>Bug</span>}
                value={stats.bug}
                prefix={<BugOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: '#ff4d4f', fontSize: 28, fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card" style={{ borderRadius: 12 }}>
              <Statistic
                title={<span style={{ color: theme === 'dark' ? '#a0aec0' : '#595959' }}>待处理</span>}
                value={stats.pending}
                prefix={<FileTextOutlined style={{ color: '#f59e0b' }} />}
                valueStyle={{ color: '#f59e0b', fontSize: 28, fontWeight: 'bold' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 筛选和搜索 */}
        <Card style={{ marginBottom: 0, borderRadius: 12, padding: '12px' }}>
          <Space style={{ width: '100%', flexWrap: 'wrap' }}>
            <Input
              placeholder="搜索客户名称或需求描述"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ 
                width: 200,
                border: 'none',
                borderBottom: `1px solid ${theme === 'dark' ? '#434343' : '#d9d9d9'}`,
                borderRadius: 0,
                boxShadow: 'none',
                backgroundColor: 'transparent',
                paddingLeft: 0
              }}
              allowClear
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              新增
            </Button>
            <Upload
              accept=".csv,.xlsx,.xls"
              showUploadList={false}
              beforeUpload={(file) => {
                handleFileUpload(file);
                return false;
              }}
            >
              <Button icon={<UploadOutlined />}>
                导入
              </Button>
            </Upload>
            <Button onClick={loadRequirements}>
              刷新
            </Button>
          </Space>
        </Card>

        {/* 需求列表 */}
        <Card style={{ borderRadius: 12, padding: '12px', marginTop: 0 }}>
          <Table
            columns={columns}
            dataSource={filteredRequirements}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`
            }}
          />
        </Card>

        {/* 导入确认Modal */}
        <Modal
          title="导入确认"
          open={importModalVisible}
          onOk={handleImport}
          onCancel={() => {
            setImportModalVisible(false);
            setImportData([]);
          }}
          confirmLoading={importLoading}
          width={800}
        >
          <div style={{ marginBottom: 16 }}>
            <p>共 {importData.length} 条数据，请确认后导入：</p>
          </div>
          <Table
            columns={[
              { title: '客户', dataIndex: 'customerName', key: 'customerName', width: 150 },
              { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
              { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
              { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
              { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
              { title: '工单链接', dataIndex: 'ticketUrl', key: 'ticketUrl', width: 150 }
            ]}
            dataSource={importData}
            pagination={{ pageSize: 10 }}
            scroll={{ y: 300 }}
            size="small"
          />
        </Modal>

        {/* 编辑/新增Modal */}
        <Modal
          title={editingRequirement ? '编辑工单' : '新增工单'}
          open={editModalVisible}
          onOk={() => form.submit()}
          onCancel={() => {
            setEditModalVisible(false);
            form.resetFields();
            setEditingRequirement(null);
          }}
          width={600}
          destroyOnHidden
          styles={{ body: { padding: '16px 20px' } }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            style={{ marginBottom: 0 }}
          >
            <Row gutter={12}>
              <Col flex="auto">
                <Form.Item
                  name="customerName"
                  label="客户"
                  rules={[{ required: true, message: '请输入客户名称' }]}
                  style={{ marginBottom: 12 }}
                >
                  <Input
                    placeholder="请输入客户名称"
                    disabled={!!editingRequirement}
                    style={{ width: 'auto', minWidth: 150 }}
                    size="small"
                  />
                </Form.Item>
              </Col>
              <Col flex="auto">
                <Form.Item
                  name="date"
                  label="日期"
                  rules={[{ required: true, message: '请选择日期' }]}
                  style={{ marginBottom: 12 }}
                >
                  <DatePicker
                    style={{ width: 'auto', minWidth: 150 }}
                    format="YYYY-MM-DD"
                    placeholder="请选择日期"
                    size="small"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col flex="auto">
                <Form.Item
                  name="type"
                  label="类型"
                  rules={[{ required: true, message: '请选择类型' }]}
                  style={{ marginBottom: 12 }}
                >
                  <Select 
                    placeholder="请选择类型" 
                    style={{ width: 'auto', minWidth: 100 }} 
                    size="small"
                    variant="borderless"
                  >
                    <Option value="需求">需求</Option>
                    <Option value="bug">Bug</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col flex="auto">
                <Form.Item
                  name="status"
                  label="状态"
                  rules={[{ required: true, message: '请选择状态' }]}
                  style={{ marginBottom: 12 }}
                >
                  <Select 
                    placeholder="请选择状态" 
                    style={{ width: 'auto', minWidth: 100 }} 
                    size="small"
                    variant="borderless"
                  >
                    {allStatuses.map(status => (
                      <Option key={status} value={status}>{status}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col flex="auto">
                <Form.Item
                  name="priority"
                  label="重要度"
                  rules={[{ required: true, message: '请选择重要度' }]}
                  style={{ marginBottom: 12 }}
                >
                  <Select 
                    placeholder="请选择重要度" 
                    style={{ width: 'auto', minWidth: 100 }} 
                    size="small"
                    variant="borderless"
                  >
                    <Option value="紧急">紧急</Option>
                    <Option value="一般">一般</Option>
                    <Option value="低">低</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col flex="auto">
                <Form.Item
                  name="ticketUrl"
                  label="工单链接"
                  style={{ marginBottom: 12, marginLeft: 96 }}
                >
                  <Input
                    placeholder="请输入工单链接（可选）"
                    style={{ width: 'auto', minWidth: 200 }}
                    size="small"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="描述"
              rules={[{ required: true, message: '请输入描述' }]}
              style={{ marginBottom: 0 }}
            >
              <Input.TextArea
                rows={2}
                placeholder="请输入需求描述"
                style={{ width: 300, border: 'none', borderBottom: '1px solid #d9d9d9', borderRadius: 0 }}
                autoSize={{ minRows: 2, maxRows: 3 }}
                variant="borderless"
              />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
}

