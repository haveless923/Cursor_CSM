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
  message,
  Tag,
  Card,
  Select,
  Dropdown,
  MenuProps,
  Badge,
  Row,
  Col,
  Radio,
  Checkbox,
  Divider,
  Timeline,
  Empty,
  Rate
} from 'antd';
const { TextArea } = Input;
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  LogoutOutlined,
  SyncOutlined,
  FileTextOutlined,
  CloudOutlined,
  AppstoreOutlined,
  HistoryOutlined,
  PlusCircleOutlined,
  SaveOutlined,
  MinusCircleOutlined,
  UpOutlined,
  DownOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate, useParams } from 'react-router-dom';
import { getCurrentUser, logout } from '../../services/auth';
import { isOnline } from '../../services/sync';
import { useTheme } from '../../contexts/ThemeContext';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, getNextStepHistory, createNextStepHistory } from '../../services/customers';
import dayjs from 'dayjs';
import RichTextEditor from '../../components/RichTextEditor';
import logo from '../../assets/logo.svg';
import '../../styles/tech-theme.css';

const { Header, Content } = Layout;
const { Option } = Select;

// 客户状态映射
const categoryMap: Record<string, { name: string; color: string }> = {
  '结单': { name: '结单', color: 'red' },
  '试用/谈判/高意向': { name: '试用/谈判/高意向', color: 'orange' },
  '建联中': { name: '建联中', color: 'blue' },
  '静默': { name: '静默', color: 'default' }
};

export default function CustomerList() {
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>();
  const { theme } = useTheme();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [hasMiniGame, setHasMiniGame] = useState(false);
  const [customerSource, setCustomerSource] = useState<string>('');
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [nextStepHistoryVisible, setNextStepHistoryVisible] = useState(false);
  const [nextStepHistory, setNextStepHistory] = useState<any[]>([]);
  const [currentCustomerId, setCurrentCustomerId] = useState<number | null>(null);
  const [newNextStep, setNewNextStep] = useState('');
  const [portraitExpanded, setPortraitExpanded] = useState<Record<number, boolean>>({});
  const [savedVisitRecords, setSavedVisitRecords] = useState<Set<number>>(new Set());
  const user = getCurrentUser();
  
  // 检查是否有编辑权限：只有负责人或admin可以编辑
  const canEdit = () => {
    // 新增时允许编辑
    if (!editingCustomer) return true;
    // 如果没有用户信息，不允许编辑（安全起见）
    if (!user) return false;
    const isAdmin = user.role === 'admin';
    const isOwner = editingCustomer.sales_owner === user.username;
    return isAdmin || isOwner;
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

  // 处理 category 名称显示
  const getCategoryName = () => {
    if (!category) return '客户';
    const decodedCategory = decodeURIComponent(category);
    if (decodedCategory === 'closed') {
      return '成交客户';
    }
    if (decodedCategory === 'opportunity') {
      return '潜在机会';
    }
    return categoryMap[decodedCategory]?.name || decodedCategory;
  };
  const categoryName = getCategoryName();

  useEffect(() => {
    loadCustomers();
  }, [category, searchText]);

  // 处理 category 参数
  const getCategoryForQuery = () => {
    if (!category) return undefined;
    const decodedCategory = decodeURIComponent(category);
    if (decodedCategory === 'closed') {
      return '结单';
    }
    if (decodedCategory === 'opportunity') {
      // 潜在机会包含：试用/谈判/高意向、建联中、静默
      return undefined; // 返回 undefined 表示不筛选，然后在 loadCustomers 中手动筛选
    }
    return decodedCategory;
  };

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const decodedCategory = category ? decodeURIComponent(category) : '';
      let data;
      
      if (decodedCategory === 'opportunity') {
        // 潜在机会：获取所有非结单的客户（试用/谈判/高意向、建联中、静默）
        const allCustomers = await getCustomers({ 
          search: searchText || undefined 
        });
        data = allCustomers.filter((c: any) => 
          c.category === '试用/谈判/高意向' || 
          c.category === '建联中' || 
          c.category === '静默'
        );
      } else {
        // 其他情况正常筛选
        data = await getCustomers({ 
          category: getCategoryForQuery(), 
          search: searchText || undefined 
        });
      }
      
      setCustomers(data);
    } catch (error) {
      message.error('加载数据失败');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    setHasMiniGame(false);
    setSavedVisitRecords(new Set());
    form.resetFields();
    // 设置初始值，确保Form.List有默认值
    setTimeout(() => {
      form.setFieldsValue({
        contacts: [{ name: '', position: '', portrait: '' }],
        follow_up_records: [],
        requirement_list: [],
        got_online_projects: [],
        pipeline_status: '',
        service_expiry_date: null,
        custom_tags: [],
        customer_source: '',
        customer_source_other: '',
        customer_rating: 0,
        sales_owner: '',
        financial_capacity: category && decodeURIComponent(category) === 'closed' ? '结单' : undefined, // 成交客户页面默认结单
        has_mini_game: false,
        mini_game_name: '',
        mini_game_platforms: [],
        mini_game_url: ''
      });
    }, 100);
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingCustomer(record);
    // 解析联系人数据
    let contacts = [];
    if (record.contact_person) {
      try {
        // 尝试解析JSON格式
        contacts = JSON.parse(record.contact_person);
        if (!Array.isArray(contacts)) {
          // 如果不是数组，可能是旧格式（单个联系人）
          contacts = [{ name: record.contact_person, position: record.position || '', portrait: '' }];
        }
      } catch (e) {
        // 解析失败，使用旧格式
        contacts = [{ name: record.contact_person, position: record.position || '', portrait: '' }];
      }
    }
    // 确保contacts至少有一个元素（用于编辑时）
    if (contacts.length === 0) {
      contacts = [{ name: '', position: '', portrait: '' }];
    }
    // 确保每个contact都有portrait字段
    contacts = contacts.map((c: any) => ({
      name: c.name || '',
      position: c.position || '',
      portrait: c.portrait || ''
    }));

    // 解析跟进记录数据
    let followUpRecords: Array<{ type: string; date: any; details: string }> = [];
    if (record.follow_up_action) {
      try {
        const parsed = JSON.parse(record.follow_up_action);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // 转换日期格式
          followUpRecords = parsed.map((r: any) => ({
            type: r.type || '',
            date: r.date ? dayjs(r.date) : null,
            details: r.details || ''
          }));
        }
      } catch (e) {
        // 解析失败，使用空数组
        followUpRecords = [];
      }
    }

    // 解析需求清单数据（这些数据会自动同步到工单进度页面）
    let requirementList: Array<{ date: any; type: string; description: string; ticket_url: string; status: string; priority?: string }> = [];
    if (record.requirement_list) {
      try {
        if (typeof record.requirement_list === 'string') {
          const parsed = JSON.parse(record.requirement_list);
          requirementList = parsed.map((r: any) => ({
            date: r.date ? dayjs(r.date) : null,
            type: r.type || '需求',
            description: r.description || '',
            ticket_url: r.ticket_url || '',
            status: r.status || '待处理',
            priority: r.priority || '一般'
          }));
        } else if (Array.isArray(record.requirement_list)) {
          requirementList = record.requirement_list.map((r: any) => ({
            date: r.date ? dayjs(r.date) : null,
            type: r.type || '需求',
            description: r.description || '',
            ticket_url: r.ticket_url || '',
            status: r.status || '待处理',
            priority: r.priority || '一般'
          }));
        }
      } catch (e) {
        requirementList = [];
      }
    }

    // 解析GOT Online项目数据
    let gotOnlineProjects: Array<{ project_name: string; url: string; tag: string; progress?: string }> = [];
    if (record.got_online_projects) {
      try {
        if (typeof record.got_online_projects === 'string') {
          gotOnlineProjects = JSON.parse(record.got_online_projects);
        } else if (Array.isArray(record.got_online_projects)) {
          gotOnlineProjects = record.got_online_projects;
        }
        // 确保每个项目都有完整字段
        gotOnlineProjects = gotOnlineProjects.map((p: any) => ({
          project_name: p.project_name || '',
          url: p.url || '',
          tag: p.tag || '',
          progress: p.progress || ''
        }));
      } catch (e) {
        gotOnlineProjects = [];
      }
    }

    // 解析城市数据
    let city: string[] = [];
    if (record.city) {
      try {
        if (typeof record.city === 'string') {
          city = JSON.parse(record.city);
        } else if (Array.isArray(record.city)) {
          city = record.city;
        }
      } catch (e) {
        city = [];
      }
    }

    // 解析自定义标签数据
    let customTags: string[] = [];
    if (record.custom_tags) {
      try {
        if (typeof record.custom_tags === 'string') {
          customTags = JSON.parse(record.custom_tags);
        } else if (Array.isArray(record.custom_tags)) {
          customTags = record.custom_tags;
        }
      } catch (e) {
        customTags = [];
      }
    }

    form.setFieldsValue({
      ...record,
      contacts: contacts,
      follow_up_records: followUpRecords,
      requirement_list: requirementList,
      got_online_projects: gotOnlineProjects,
      pipeline_status: record.pipeline_status || '',
      service_expiry_date: record.service_expiry_date ? dayjs(record.service_expiry_date) : null,
      city: city,
      custom_tags: customTags,
      customer_source: record.customer_source || '',
      customer_source_other: record.customer_source_other || '',
      customer_rating: record.customer_rating || 0,
      financial_capacity: record.financial_capacity || (category && decodeURIComponent(category) === 'closed' ? '结单' : undefined), // 成交客户页面默认结单
      due_date: record.due_date ? dayjs(record.due_date) : null,
      has_mini_game: record.has_mini_game === 1 || record.has_mini_game === true ? '是' : '否',
      mini_game_name: record.mini_game_name || '',
      mini_game_platforms: record.mini_game_platforms ? (typeof record.mini_game_platforms === 'string' ? JSON.parse(record.mini_game_platforms) : record.mini_game_platforms) : [],
      mini_game_url: record.mini_game_url || ''
    });
    // 设置hasMiniGame状态
    setHasMiniGame(record.has_mini_game === 1 || record.has_mini_game === true);
    // 设置customerSource状态
    setCustomerSource(record.customer_source || '');
    // 重置保存状态
    setSavedVisitRecords(new Set());
    setModalVisible(true);
  };

  const handleViewNextStepHistory = async (customerId: number) => {
    setCurrentCustomerId(customerId);
    setNextStepHistoryVisible(true);
    try {
      const history = await getNextStepHistory(customerId);
      setNextStepHistory(history);
    } catch (error) {
      message.error('获取历史记录失败');
    }
  };

  const handleAddNextStep = async () => {
    if (!newNextStep.trim() || !currentCustomerId) {
      message.warning('请输入客户信息内容');
      return;
    }
    try {
      await createNextStepHistory(currentCustomerId, newNextStep);
      message.success('添加成功');
      setNewNextStep('');
      const history = await getNextStepHistory(currentCustomerId);
      setNextStepHistory(history);
      // 刷新客户列表
      loadCustomers();
    } catch (error: any) {
      console.error('添加历史记录失败:', error);
      message.error(`添加失败: ${error.message || '未知错误'}`);
    }
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
      // 先验证表单字段
      try {
        await form.validateFields();
      } catch (errorInfo: any) {
        // 找到第一个验证失败的字段
        const firstErrorField = errorInfo?.errorFields?.[0];
        if (firstErrorField) {
          const fieldName = firstErrorField.name;
          const errorMessage = firstErrorField.errors?.[0];
          
          // 延迟一下，确保错误信息已经渲染
          setTimeout(() => {
            // 查找包含错误信息的 Form.Item
            const errorFormItem = document.querySelector('.ant-form-item-has-error');
            if (errorFormItem) {
              // 滚动到错误字段
              errorFormItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
              
              // 尝试聚焦到输入框
              setTimeout(() => {
                const input = errorFormItem.querySelector('input, textarea, .ant-select-selector') as HTMLElement;
                if (input) {
                  if (input.classList.contains('ant-select-selector')) {
                    // 如果是 Select，点击选择器
                    input.click();
                  } else {
                    input.focus();
                  }
                }
              }, 300);
            } else {
              // 如果找不到错误字段，尝试通过字段名查找
              let selector = '';
              if (Array.isArray(fieldName)) {
                // 处理数组形式的字段名，如 ['contacts', 0, 'name']
                const lastPart = fieldName[fieldName.length - 1];
                selector = `[name*="${lastPart}"]`;
              } else {
                selector = `[name="${fieldName}"]`;
              }
              
              const fieldElement = document.querySelector(selector);
              if (fieldElement) {
                fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => {
                  const input = fieldElement.querySelector('input, textarea') as HTMLElement;
                  if (input) {
                    input.focus();
                  }
                }, 300);
              }
            }
          }, 100);
          
          // 显示错误提示
          if (errorMessage) {
            message.error(errorMessage);
          } else {
            message.error('请填写完整的表单信息');
          }
        } else {
          message.error('请填写完整的表单信息');
        }
        return;
      }

      // 处理联系人数据：将联系人数组转换为JSON字符串
      const contacts = values.contacts || [];
      // 验证至少有一个联系人
      if (!contacts || contacts.length === 0) {
        message.error('至少需要添加一个联系人');
        // 滚动到联系人部分
        setTimeout(() => {
          const contactSection = document.querySelector('.ant-form-item-label:has-text("联系人")') || 
                                 document.querySelector('[name*="contacts"]') ||
                                 document.querySelector('.ant-form-item:has(.ant-form-item-label:contains("联系人"))');
          if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            // 如果找不到，尝试查找包含"联系人"文本的元素
            const labels = Array.from(document.querySelectorAll('.ant-form-item-label label'));
            const contactLabel = labels.find((label) => label.textContent?.includes('联系人'));
            if (contactLabel) {
              const formItem = contactLabel.closest('.ant-form-item');
              if (formItem) {
                formItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
          }
        }, 100);
        return;
      }
      
      // 验证每个联系人的必填字段
      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        if (!contact.name || !contact.position) {
          message.error(`请填写第 ${i + 1} 个联系人的完整信息`);
          // 滚动到对应的联系人字段
          setTimeout(() => {
            const contactNameField = document.querySelector(`[name="contacts"][data-index="${i}"]`) ||
                                    document.querySelector(`input[name*="contacts"][name*="${i}"][name*="name"]`);
            if (contactNameField) {
              contactNameField.scrollIntoView({ behavior: 'smooth', block: 'center' });
              const input = contactNameField.querySelector('input') as HTMLElement;
              if (input) {
                input.focus();
              }
            }
          }, 100);
          return;
        }
      }
      const contactPersonJson = JSON.stringify(contacts);
      // 提取所有职位（用于兼容旧字段）
      const positions = contacts.map((c: any) => c.position).filter((p: string) => p);
      
      // 处理跟进记录数据：将跟进记录数组转换为JSON字符串
      const followUpRecords = values.follow_up_records || [];
      const followUpRecordsJson = JSON.stringify(
        followUpRecords.map((r: any) => ({
          type: r.type,
          date: r.date ? r.date.format('YYYY-MM-DD') : null,
          details: r.details || ''
        }))
      );

      // 处理需求清单数据：将需求清单数组转换为JSON字符串
      // 这些数据会自动同步到工单进度页面，因为工单进度页面从客户的requirement_list字段读取数据
      const requirementList = values.requirement_list || [];
      const requirementListJson = JSON.stringify(
        requirementList.map((r: any) => ({
          date: r.date ? r.date.format('YYYY-MM-DD') : null,
          type: r.type || '需求',
          description: r.description || '',
          ticket_url: r.ticket_url || '',
          status: r.status || '待处理',
          priority: r.priority || '一般' // 添加priority字段，确保与工单进度页面数据格式一致
        }))
      );

      // 处理GOT Online项目数据：将项目数组转换为JSON字符串
      const gotOnlineProjects = values.got_online_projects || [];
      const gotOnlineProjectsJson = JSON.stringify(
        gotOnlineProjects.map((p: any) => ({
          project_name: p.project_name || '',
          url: p.url || '',
          tag: p.tag || '',
          progress: p.progress || ''
        }))
      );
      
      // 处理 category
      // 优先使用 URL 参数中的 category，如果没有则使用表单中的 category
      let finalCategory = values.category;
      if (category) {
        const decodedCategory = decodeURIComponent(category);
        if (decodedCategory === 'closed') {
          finalCategory = '结单';
        } else if (decodedCategory === 'opportunity') {
          // 潜在机会页面创建客户时，默认使用"建联中"
          finalCategory = finalCategory || '建联中';
        } else {
          finalCategory = decodedCategory;
        }
      } else if (!finalCategory) {
        // 如果都没有，默认使用"建联中"
        finalCategory = '建联中';
      }
      
      const serviceExpiryDateFormatted = values.service_expiry_date ? values.service_expiry_date.format('YYYY-MM-DD') : null;
      console.log('服务到期时间原始值:', values.service_expiry_date);
      console.log('服务到期时间格式化后:', serviceExpiryDateFormatted);
      
      const customerData = {
        ...values,
        category: finalCategory,
        contact_person: contactPersonJson,
        position: positions.join(','), // 保留职位字段用于兼容
        follow_up_action: followUpRecordsJson, // 使用跟进记录JSON
        requirement_list: requirementListJson, // 使用需求清单JSON
        got_online_projects: gotOnlineProjectsJson, // 使用GOT Online项目JSON
        contacts: undefined, // 移除contacts字段，不发送到后端
        follow_up_records: undefined, // 移除follow_up_records字段，不发送到后端
        city: values.city && Array.isArray(values.city) ? JSON.stringify(values.city) : (values.city || null),
        custom_tags: values.custom_tags && Array.isArray(values.custom_tags) ? JSON.stringify(values.custom_tags.filter((tag: string) => tag && tag.trim())) : (values.custom_tags || null),
        due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : null,
        service_expiry_date: serviceExpiryDateFormatted,
        has_mini_game: values.has_mini_game === '是' ? 1 : 0,
        mini_game_name: values.has_mini_game === '是' ? values.mini_game_name : null,
        mini_game_platforms: values.has_mini_game === '是' && values.mini_game_platforms ? JSON.stringify(values.mini_game_platforms) : null
      };
      
      console.log('发送到后端的 customerData.service_expiry_date:', customerData.service_expiry_date);

      if (editingCustomer?.id) {
        const updatedCustomer = await updateCustomer(editingCustomer.id, customerData);
        console.log('更新后的客户数据:', updatedCustomer);
        console.log('更新后的 service_expiry_date:', updatedCustomer.service_expiry_date);
        message.success('更新成功');
      } else {
        const newCustomer = await createCustomer(customerData);
        console.log('创建的客户数据:', newCustomer);
        console.log('创建的客户 category:', newCustomer.category);
        console.log('创建的客户 service_expiry_date:', newCustomer.service_expiry_date);
        console.log('当前页面 category:', category);
        message.success('创建成功');
      }

      setModalVisible(false);
      form.resetFields();
      setPortraitExpanded({});
      setSavedVisitRecords(new Set());
      setEditingCustomer(null);
      
      // 延迟一下再刷新，确保数据已保存到数据库
      setTimeout(() => {
        loadCustomers();
      }, 500);
    } catch (error: any) {
      console.error('保存客户失败:', error);
      message.error(editingCustomer ? `更新失败: ${error.message || '未知错误'}` : `创建失败: ${error.message || '未知错误'}`);
    }
  };

  // 已移除认领功能（公海功能已移到销售管理）

  const columns: ColumnsType<any> = [
    {
      title: '#',
      dataIndex: 'id',
      width: 60,
      render: (_, __, index) => index + 1
    },
    {
      title: '公司名称',
      dataIndex: 'company_name',
      width: 150,
      ellipsis: true
    },
    {
      title: '到期',
      dataIndex: 'service_expiry_date',
      width: 120,
      render: (date, record) => {
        if (!date) return '-';
        const expiryDate = dayjs(date);
        const today = dayjs();
        const daysRemaining = expiryDate.diff(today, 'day');
        
        if (daysRemaining > 0) {
          return (
            <span style={{ color: daysRemaining <= 30 ? '#ff4d4f' : daysRemaining <= 90 ? '#faad14' : '#52c41a' }}>
              剩余 {daysRemaining} 天
            </span>
          );
        } else if (daysRemaining === 0) {
          return <span style={{ color: '#ff4d4f' }}>今天到期</span>;
        } else {
          return <span style={{ color: '#ff4d4f' }}>已过期 {Math.abs(daysRemaining)} 天</span>;
        }
      }
    },
    {
      title: '联系人',
      dataIndex: 'contact_person',
      width: 200,
      ellipsis: true,
      render: (text) => {
        if (!text) return '-';
        try {
          const contacts = JSON.parse(text);
          if (Array.isArray(contacts)) {
            return (
              <div>
                {contacts.map((contact: any, index: number) => (
                  <div key={index} style={{ marginBottom: 4 }}>
                    <span>{contact.name || '-'}</span>
                    {contact.position && (
                      <Tag style={{ marginLeft: 4 }}>{contact.position}</Tag>
                    )}
                  </div>
                ))}
              </div>
            );
          }
        } catch (e) {
          // 旧格式兼容
          return text;
        }
        return '-';
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (status, record) => {
        // 如果是结单页面，统一显示"结单"
        const currentCategory = category ? decodeURIComponent(category) : '';
        if (currentCategory === 'closed' || record.category === '结单') {
          return <Tag color="red">结单</Tag>;
        }
        const statusInfo = categoryMap[status] || { name: status, color: 'default' };
        return <Tag color={statusInfo.color}>{statusInfo.name}</Tag>;
      }
    },
    {
      title: '跟进记录',
      dataIndex: 'follow_up_action',
      width: 300,
      ellipsis: true,
      render: (text) => {
        if (!text) return '-';
        try {
          const records = JSON.parse(text);
          if (Array.isArray(records) && records.length > 0) {
            return (
              <div>
                {records.slice(0, 2).map((record: any, index: number) => (
                  <div key={index} style={{ marginBottom: 4 }}>
                    <Tag color={record.type === '线下拜访' ? 'blue' : record.type === '线上沟通' ? 'green' : 'purple'}>
                      {record.type}
                    </Tag>
                    <span style={{ marginLeft: 8, fontSize: 12, color: '#999' }}>
                      {record.date || ''}
                    </span>
                  </div>
                ))}
                {records.length > 2 && (
                  <div style={{ fontSize: 12, color: '#999' }}>
                    还有 {records.length - 2} 条记录...
                  </div>
                )}
              </div>
            );
          }
        } catch (e) {
          // 旧格式兼容
          return <span>{text}</span>;
        }
        return '-';
      }
    },
    {
      title: '客户信息',
      dataIndex: 'next_step',
      width: 200,
      ellipsis: true,
      render: (text, record) => (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div 
            style={{ 
              maxHeight: '60px', 
              overflow: 'hidden',
              lineHeight: '20px'
            }}
            dangerouslySetInnerHTML={{ __html: text || '-' }}
          />
          {record.id && (
            <Button
              type="link"
              size="small"
              icon={<HistoryOutlined />}
              onClick={() => handleViewNextStepHistory(record.id)}
              style={{ padding: 0 }}
            >
              历史
            </Button>
          )}
        </Space>
      )
    },
    // 已移除负责人列（因为只显示当前用户的客户，不需要显示负责人）
    {
      title: '操作',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ padding: '0 4px' }}>
            编辑
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} style={{ padding: '0 4px' }}>
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
            fontSize: 16,
            fontWeight: 600,
            color: theme === 'light' ? '#262626' : undefined
          }}>
            {categoryName}
          </h3>
        </div>
        <Space size="small" style={{ color: getTextColor() }}>
          <Badge status={isOnline() ? 'success' : 'error'} text={<span style={{ color: getTextColor(), fontSize: 12 }}>{isOnline() ? '在线' : '离线'}</span>} />
          <Button className="tech-button" size="small" icon={<SyncOutlined />} onClick={loadCustomers}>
            刷新
          </Button>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button className="tech-button" size="small" type="text" icon={<UserOutlined />}>
              {user?.username}
            </Button>
          </Dropdown>
        </Space>
      </Header>

      <Content style={{ padding: '20px', flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Space style={{ marginBottom: 12 }}>
          <Button className="tech-button-primary" type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加客户
          </Button>
          <Input
            placeholder="搜索公司名称、联系人"
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
            allowClear
            variant="borderless"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Space>

        <div className="tech-table" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Table
            columns={columns}
            dataSource={customers}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1500, y: 'calc(100vh - 200px)' }}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => <span style={{ color: getTextColor() }}>共 {total} 条记录</span>,
              showQuickJumper: true,
              size: 'small'
            }}
          />
        </div>

        <Modal
          title={editingCustomer ? (canEdit() ? '编辑客户' : '查看客户') : '添加客户'}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            form.resetFields();
            setEditingCustomer(null);
            setHasMiniGame(false);
            setPortraitExpanded({});
            setCustomerSource('');
            setSavedVisitRecords(new Set());
          }}
          onOk={canEdit() ? () => form.submit() : undefined}
          okText={canEdit() ? '保存' : undefined}
          width={900}
          destroyOnHidden={true}
          style={{ top: 20 }}
          styles={{
            body: {
              maxHeight: 'calc(100vh - 200px)',
              overflowY: 'auto',
              padding: '16px'
            }
          }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            scrollToFirstError={{ behavior: 'smooth', block: 'center' }}
            initialValues={{
              contacts: [],
              follow_up_records: [],
              got_online_projects: [],
              pipeline_status: '',
              service_expiry_date: null,
              custom_tags: [],
              city: [],
              customer_source: '',
              customer_source_other: '',
              customer_rating: 0,
              sales_owner: '',
              financial_capacity: category && decodeURIComponent(category) === 'closed' ? '结单' : undefined, // 成交客户页面默认结单
              has_mini_game: '否',
              mini_game_name: '',
              mini_game_platforms: [],
              mini_game_url: ''
            }}
          >
            <Form.Item name="category" label="分类" initialValue={category} hidden>
              <Input />
            </Form.Item>

            {/* 基本信息 */}
            <div style={{
              padding: '12px',
              paddingTop: '20px',
              borderRadius: '8px',
              marginBottom: '12px',
              background: theme === 'dark' 
                ? 'rgba(64, 169, 255, 0.08)' 
                : 'rgba(230, 244, 255, 0.5)'
            }}>
            <Divider orientation="center" style={{ marginTop: 0, marginBottom: 48 }}>
              <UserOutlined style={{ marginRight: 8 }} />
              基本信息
            </Divider>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="company_name" label="公司名称" rules={[{ required: true }]} style={{ marginBottom: 12 }}>
                  <Input placeholder="请输入公司名称" style={{ width: '100%', maxWidth: 300 }} variant="borderless" disabled={!canEdit()} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Row gutter={4}>
                  <Col style={{ width: 133 }}>
                    <Form.Item name="customer_rating" label="客户评级" style={{ marginBottom: 12 }}>
                      <Rate count={3} disabled={!canEdit()} />
                    </Form.Item>
                  </Col>
                  <Col style={{ marginLeft: 32 }}>
                    <Form.Item name="sales_owner" label="负责人" style={{ marginBottom: 12 }}>
                      <Select 
                        placeholder="请选择负责人" 
                        style={{ width: 133 }} 
                        variant="borderless"
                        disabled={!canEdit()}
                      >
                        <Option value="Bonnie">Bonnie</Option>
                        <Option value="Sherry">Sherry</Option>
                        <Option value="Jessica">Jessica</Option>
                        <Option value="Xin">Xin</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="city" label="城市" style={{ marginBottom: 12 }}>
                  <Select 
                    mode="multiple" 
                    placeholder="请选择城市" 
                    style={{ width: '100%', maxWidth: 300 }} 
                    variant="borderless"
                    disabled={!canEdit()}
                  >
                    <Option value="上海">上海</Option>
                    <Option value="杭州">杭州</Option>
                    <Option value="北京">北京</Option>
                    <Option value="广州">广州</Option>
                    <Option value="深圳">深圳</Option>
                    <Option value="成都">成都</Option>
                    <Option value="厦门">厦门</Option>
                    <Option value="福州">福州</Option>
                    <Option value="武汉">武汉</Option>
                    <Option value="重庆">重庆</Option>
                    <Option value="珠海">珠海</Option>
                    <Option value="西安">西安</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Row gutter={4}>
                  <Col style={{ width: 133 }}>
                    <Form.Item name="customer_source" label="客户来源" style={{ marginBottom: 12 }}>
                      <Select 
                        placeholder="请选择客户来源" 
                        style={{ width: 133 }} 
                        variant="borderless"
                        disabled={!canEdit()}
                        onChange={(value) => {
                          setCustomerSource(value);
                          if (value !== '其他') {
                            form.setFieldValue('customer_source_other', '');
                          }
                        }}
                      >
                        <Option value="自拓">自拓</Option>
                        <Option value="移交">移交</Option>
                        <Option value="其他">其他</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col style={{ marginLeft: 32 }}>
                    <Form.Item name="financial_capacity" label="合作进度" style={{ marginBottom: 12 }}>
                      <Select placeholder="请选择合作进度" style={{ width: 133 }} variant="borderless" disabled={!canEdit()}>
                        <Option value="建联">建联</Option>
                        <Option value="转化中">转化中</Option>
                        <Option value="结单">结单</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Col>
            </Row>
            {customerSource === '其他' && (
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item 
                    name="customer_source_other" 
                    label="其他来源"
                    rules={[{ required: true, message: '请输入其他来源' }]}
                    style={{ marginBottom: 12 }}
                  >
                    <Input placeholder="请输入其他来源" style={{ width: '100%', maxWidth: 200 }} variant="borderless" disabled={!canEdit()} />
                  </Form.Item>
                </Col>
              </Row>
            )}
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label={
                    <Space>
                      <span>联系人</span>
                      <Form.Item noStyle shouldUpdate={(prevValues, curValues) => 
                        prevValues.contacts?.length !== curValues.contacts?.length
                      }>
                        {() => {
                          const contacts = form.getFieldValue('contacts') || [];
                          return contacts.length < 5 ? (
                            <Button
                              type="dashed"
                              size="small"
                              icon={<PlusOutlined />}
                              style={{ fontSize: 12 }}
                              onClick={() => {
                                try {
                                  const currentContacts = form.getFieldValue('contacts') || [];
                                  if (currentContacts.length >= 5) {
                                    message.warning('最多只能添加5个联系人');
                                    return;
                                  }
                                  form.setFieldsValue({
                                    contacts: [...currentContacts, { name: '', position: '', portrait: '' }]
                                  });
                                } catch (error) {
                                  console.error('添加联系人错误:', error);
                                  message.error('添加联系人失败');
                                }
                              }}
                              disabled={!canEdit()}
                            >
                              添加
                            </Button>
                          ) : null;
                        }}
                      </Form.Item>
                    </Space>
                  }
                  required
                  tooltip="至少需要添加一个联系人"
                  style={{ marginBottom: 12 }}
                >
                  <Form.List
                    name="contacts"
                  >
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} style={{ 
                        marginBottom: 8, 
                        padding: 8, 
                        border: theme === 'dark' ? '1px solid rgba(102, 126, 234, 0.3)' : '1px solid #d9d9d9', 
                        borderRadius: 6,
                        background: theme === 'dark' ? 'rgba(26, 31, 58, 0.3)' : '#fcfcfc',
                        width: 'fit-content',
                        maxWidth: '100%',
                        minHeight: 60
                      }}>
                        <Space direction="vertical" style={{ width: '100%' }} size={0}>
                          <Space style={{ display: 'flex', width: 'fit-content', alignItems: 'flex-end' }} size="small">
                            <Form.Item
                              {...restField}
                              name={[name, 'name']}
                              rules={[{ required: true, message: '请输入联系人姓名' }]}
                              style={{ marginBottom: 0, display: 'flex', alignItems: 'flex-end' }}
                            >
                              <Input placeholder="联系人姓名" variant="borderless" style={{ width: 133 }} size="small" disabled={!canEdit()} />
                            </Form.Item>
                            <Form.Item
                              {...restField}
                              name={[name, 'position']}
                              rules={[{ required: true, message: '请选择职位' }]}
                              style={{ marginBottom: 0, display: 'flex', alignItems: 'flex-end' }}
                            >
                              <Select placeholder="职位" variant="borderless" style={{ width: 150 }} size="small" disabled={!canEdit()}>
                                <Option value="QA">QA</Option>
                                <Option value="程序">程序</Option>
                                <Option value="制作人">制作人</Option>
                                <Option value="技术负责人">技术负责人</Option>
                                <Option value="CTO">CTO</Option>
                                <Option value="中台">中台</Option>
                                <Option value="其他">其他</Option>
                              </Select>
                            </Form.Item>
                            {fields.length > 1 && canEdit() && (
                              <MinusCircleOutlined
                                onClick={() => remove(name)}
                                style={{ color: '#ff4d4f', cursor: 'pointer' }}
                              />
                            )}
                          </Space>
                          <div style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
                            <span 
                              onClick={() => {
                                setPortraitExpanded(prev => ({
                                  ...prev,
                                  [name]: !prev[name]
                                }));
                              }}
                              style={{ 
                                cursor: 'pointer', 
                                fontSize: 13, 
                                color: theme === 'dark' ? '#667eea' : '#1890ff',
                                marginRight: 8,
                                userSelect: 'none'
                              }}
                            >
                              {portraitExpanded[name] ? <UpOutlined /> : <DownOutlined />} 画像
                            </span>
                          </div>
                          {portraitExpanded[name] && (
                            <Form.Item
                              {...restField}
                              name={[name, 'portrait']}
                              style={{ marginBottom: 0 }}
                            >
                              <Input.TextArea 
                                rows={1} 
                                placeholder="描述联系人的爱好、性格、年龄等人物特征" 
                                variant="borderless"
                                showCount
                                style={{ 
                                  fontSize: 13,
                                  borderBottom: 'none',
                                  paddingBottom: 0
                                }}
                                autoSize={{ minRows: 1, maxRows: 3 }}
                                disabled={!canEdit()}
                              />
                            </Form.Item>
                          )}
                        </Space>
                      </div>
                    ))}
                    {fields.length === 0 && (
                      <Form.Item style={{ marginBottom: 0 }}>
                        <Button
                          type="dashed"
                          onClick={() => {
                            try {
                              if (fields.length >= 5) {
                                message.warning('最多只能添加5个联系人');
                                return;
                              }
                              add();
                              // 使用setTimeout确保Form.List已经更新
                              setTimeout(() => {
                                const contacts = form.getFieldValue('contacts') || [];
                                const newIndex = contacts.length - 1;
                                if (newIndex >= 0) {
                                  form.setFieldValue(['contacts', newIndex, 'name'], '');
                                  form.setFieldValue(['contacts', newIndex, 'position'], '');
                                  form.setFieldValue(['contacts', newIndex, 'portrait'], '');
                                }
                              }, 0);
                            } catch (error) {
                              console.error('添加联系人错误:', error);
                              message.error('添加联系人失败');
                            }
                          }}
                          block
                          icon={<PlusOutlined />}
                        >
                          添加
                        </Button>
                      </Form.Item>
                    )}
                    {fields.length > 1 && fields.length < 5 && (
                      <Form.Item style={{ marginBottom: 0 }}>
                        <Button
                          type="dashed"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => {
                            try {
                              if (fields.length >= 5) {
                                message.warning('最多只能添加5个联系人');
                                return;
                              }
                              add();
                              // 使用setTimeout确保Form.List已经更新
                              setTimeout(() => {
                                const contacts = form.getFieldValue('contacts') || [];
                                const newIndex = contacts.length - 1;
                                if (newIndex >= 0) {
                                  form.setFieldValue(['contacts', newIndex, 'name'], '');
                                  form.setFieldValue(['contacts', newIndex, 'position'], '');
                                  form.setFieldValue(['contacts', newIndex, 'portrait'], '');
                                }
                              }, 0);
                            } catch (error) {
                              console.error('添加联系人错误:', error);
                              message.error('添加联系人失败');
                            }
                          }}
                        />
                      </Form.Item>
                    )}
                  </>
                )}
              </Form.List>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="custom_tags" label="自定义标签" style={{ marginBottom: 12 }}>
                  <Select
                    mode="tags"
                    placeholder="输入标签后按回车添加"
                    style={{ width: '100%', maxWidth: 300 }}
                    variant="borderless"
                    tokenSeparators={[',']}
                    disabled={!canEdit()}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item 
              name="next_step" 
              label="客户信息"
              getValueFromEvent={(value) => value}
              style={{ marginBottom: 12 }}
            >
              <RichTextEditor 
                placeholder="记录客户相关的文档资料，便于随时回忆和阅读"
                rows={2}
                disabled={!canEdit()}
              />
            </Form.Item>
            </div>

            {/* 跟进记录 */}
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '12px',
              background: theme === 'dark' 
                ? 'rgba(82, 196, 26, 0.08)' 
                : 'rgba(240, 249, 255, 0.5)'
            }}>
            <Divider orientation="center" style={{ marginTop: 8 }}>
              <FileTextOutlined style={{ marginRight: 8 }} />
              跟进记录
            </Divider>
            <Form.Item
              tooltip="记录重要的客户沟通事宜"
              style={{ marginBottom: 12 }}
            >
              <Form.List name="follow_up_records">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} style={{ 
                        marginBottom: 8, 
                        padding: 8, 
                        border: theme === 'dark' ? '1px solid rgba(102, 126, 234, 0.3)' : '1px solid #d9d9d9', 
                        borderRadius: 6,
                        background: theme === 'dark' ? 'rgba(26, 31, 58, 0.3)' : '#fcfcfc',
                        minHeight: 60
                      }}>
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                          <Row gutter={12}>
                            <Col span={12}>
                              <Form.Item
                                {...restField}
                                name={[name, 'date']}
                                label="拜访日期"
                                rules={[{ required: true, message: '请选择拜访日期' }]}
                                style={{ marginBottom: 0 }}
                              >
                                <DatePicker 
                                  style={{ width: 150 }} 
                                  format="YYYY-MM-DD" 
                                  variant="borderless"
                                  size="small"
                                  disabled={savedVisitRecords.has(name) || !canEdit()}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                {...restField}
                                name={[name, 'type']}
                                label="类型"
                                rules={[{ required: true, message: '请选择类型' }]}
                                style={{ marginBottom: 0 }}
                              >
                                <Select 
                                  placeholder="请选择类型" 
                                  style={{ width: 120 }} 
                                  variant="borderless"
                                  size="small"
                                  disabled={savedVisitRecords.has(name) || !canEdit()}
                                >
                                  <Option value="线下拜访">线下拜访</Option>
                                  <Option value="线上沟通">线上沟通</Option>
                                  <Option value="线上会议">线上会议</Option>
                                </Select>
                              </Form.Item>
                            </Col>
                          </Row>
                          <Form.Item
                            {...restField}
                            name={[name, 'details']}
                            label="拜访详情"
                            rules={[{ required: true, message: '请输入拜访详情' }]}
                            style={{ marginBottom: 6 }}
                          >
                            <Input.TextArea 
                              rows={2} 
                              placeholder="请输入拜访详情" 
                              variant="borderless"
                              showCount
                              style={{ fontSize: 13 }}
                              disabled={savedVisitRecords.has(name) || !canEdit()}
                            />
                          </Form.Item>
                          <div style={{ textAlign: 'right', marginTop: 0 }}>
                            <Space size="small">
                              {canEdit() && (
                                <>
                                  {savedVisitRecords.has(name) ? (
                                    <Button
                                      type="link"
                                      size="small"
                                      icon={<EditOutlined />}
                                      onClick={() => {
                                        setSavedVisitRecords(prev => {
                                          const newSet = new Set(prev);
                                          newSet.delete(name);
                                          return newSet;
                                        });
                                      }}
                                      style={{ padding: 0, fontSize: 12 }}
                                    >
                                      编辑
                                    </Button>
                                  ) : (
                                    <Button
                                      type="link"
                                      size="small"
                                      icon={<SaveOutlined />}
                                      onClick={async () => {
                                        try {
                                          // 验证当前记录
                                          const recordValues = form.getFieldValue(['follow_up_records', name]);
                                          if (!recordValues?.type || !recordValues?.date || !recordValues?.details) {
                                            message.warning('请填写完整的跟进记录信息');
                                            return;
                                          }
                                          // 标记为已保存
                                          setSavedVisitRecords(prev => new Set(prev).add(name));
                                          message.success('跟进记录已保存');
                                        } catch (error) {
                                          message.error('保存失败');
                                        }
                                      }}
                                      style={{ padding: 0, fontSize: 12 }}
                                    >
                                      保存
                                    </Button>
                                  )}
                                  <Button
                                    type="link"
                                    danger
                                    size="small"
                                    icon={<MinusCircleOutlined />}
                                    onClick={() => {
                                      setSavedVisitRecords(prev => {
                                        const newSet = new Set(prev);
                                        newSet.delete(name);
                                        return newSet;
                                      });
                                      remove(name);
                                    }}
                                    style={{ padding: 0, fontSize: 12 }}
                                  >
                                    删除
                                  </Button>
                                </>
                              )}
                            </Space>
                          </div>
                        </Space>
                      </div>
                    ))}
                    <Form.Item style={{ marginBottom: 0 }}>
                      <Button
                        type="dashed"
                        onClick={() => {
                          try {
                            add();
                            // 使用setTimeout确保Form.List已经更新
                            setTimeout(() => {
                              const newIndex = form.getFieldValue('follow_up_records')?.length - 1;
                              if (newIndex >= 0) {
                                form.setFieldValue(['follow_up_records', newIndex, 'type'], '');
                                form.setFieldValue(['follow_up_records', newIndex, 'date'], null);
                                form.setFieldValue(['follow_up_records', newIndex, 'details'], '');
                              }
                            }, 0);
                          } catch (error) {
                            console.error('添加跟进记录错误:', error);
                            message.error('添加跟进记录失败');
                          }
                        }}
                        icon={<PlusOutlined />}
                        size="small"
                        style={{ marginTop: 4, fontSize: 12 }}
                        disabled={!canEdit()}
                      >
                        添加拜访记录
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </Form.Item>

            {/* 需求清单 */}
            <Form.Item
              label="需求清单"
              tooltip="记录客户在使用服务中提出的需求或Bug"
              style={{ marginBottom: 12 }}
            >
              <Form.List name="requirement_list">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} style={{ 
                        marginBottom: 8, 
                        padding: 8, 
                        border: theme === 'dark' ? '1px solid rgba(102, 126, 234, 0.3)' : '1px solid #d9d9d9', 
                        borderRadius: 6,
                        background: theme === 'dark' ? 'rgba(26, 31, 58, 0.3)' : '#fcfcfc',
                        minHeight: 60
                      }}>
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                          <Row gutter={8} align="flex-end">
                            <Col span={20}>
                              <Form.Item
                                {...restField}
                                name={[name, 'date']}
                                label="日期"
                                rules={[{ required: true, message: '请选择日期' }]}
                                style={{ marginBottom: 0 }}
                              >
                                <DatePicker 
                                  style={{ width: 150 }} 
                                  format="YYYY-MM-DD" 
                                  variant="borderless"
                                  size="small"
                                  disabled={!canEdit()}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={4} style={{ textAlign: 'right', paddingBottom: 0 }}>
                              {canEdit() && (
                                <Button
                                  type="link"
                                  danger
                                  size="small"
                                  icon={<MinusCircleOutlined />}
                                  onClick={() => remove(name)}
                                  style={{ padding: 0, fontSize: 12 }}
                                >
                                  删除
                                </Button>
                              )}
                            </Col>
                          </Row>
                          <Row gutter={8} align="flex-end">
                            <Col span={12}>
                              <Form.Item
                                {...restField}
                                name={[name, 'type']}
                                label="类型"
                                rules={[{ required: true, message: '请选择类型' }]}
                                style={{ marginBottom: 0 }}
                              >
                                <Select 
                                  placeholder="请选择类型" 
                                  style={{ width: 100 }} 
                                  variant="borderless"
                                  size="small"
                                  disabled={!canEdit()}
                                >
                                  <Option value="需求">需求</Option>
                                  <Option value="bug">bug</Option>
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                {...restField}
                                name={[name, 'status']}
                                label="状态"
                                rules={[{ required: true, message: '请选择状态' }]}
                                style={{ marginBottom: 0 }}
                              >
                                <Select placeholder="请选择状态" style={{ width: 100 }} variant="borderless" size="small" disabled={!canEdit()}>
                                  <Option value="待处理">待处理</Option>
                                  <Option value="已解决">已解决</Option>
                                </Select>
                              </Form.Item>
                            </Col>
                          </Row>
                          <Row gutter={8}>
                            <Col span={24}>
                              <Form.Item
                                {...restField}
                                name={[name, 'description']}
                                label="描述"
                                rules={[{ required: true, message: '请输入描述' }]}
                                style={{ marginBottom: 0 }}
                              >
                                <Input.TextArea 
                                  rows={2} 
                                  placeholder="请输入描述" 
                                  variant="borderless"
                                  showCount
                                  style={{ fontSize: 13 }}
                                  disabled={!canEdit()}
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Row gutter={8}>
                            <Col span={24}>
                              <Form.Item
                                {...restField}
                                name={[name, 'ticket_url']}
                                label="链接"
                                rules={[
                                  { type: 'url', message: '请输入有效的URL' }
                                ]}
                                style={{ marginBottom: 0 }}
                              >
                                <Input 
                                  placeholder="https://example.com/ticket/123" 
                                  variant="borderless"
                                  style={{ fontSize: 13 }}
                                  disabled={!canEdit()}
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Space>
                      </div>
                    ))}
                    <Form.Item style={{ marginBottom: 0 }}>
                      <Button
                        type="dashed"
                        onClick={() => {
                          try {
                            add({ date: null, type: '需求', description: '', ticket_url: '', status: '待处理', priority: '一般' });
                            setTimeout(() => {
                              const newIndex = form.getFieldValue('requirement_list')?.length - 1;
                              if (newIndex >= 0) {
                                form.setFieldValue(['requirement_list', newIndex, 'date'], null);
                                form.setFieldValue(['requirement_list', newIndex, 'type'], '需求');
                                form.setFieldValue(['requirement_list', newIndex, 'description'], '');
                                form.setFieldValue(['requirement_list', newIndex, 'ticket_url'], '');
                                form.setFieldValue(['requirement_list', newIndex, 'status'], '待处理');
                                form.setFieldValue(['requirement_list', newIndex, 'priority'], '一般');
                              }
                            }, 0);
                          } catch (error) {
                            console.error('添加需求清单错误:', error);
                            message.error('添加失败');
                          }
                        }}
                        icon={<PlusOutlined />}
                        size="small"
                        style={{ marginTop: 4, fontSize: 12 }}
                        disabled={!canEdit()}
                      >
                        添加需求
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </Form.Item>
            </div>

            {/* SaaS 服务 */}
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '12px',
              background: theme === 'dark' 
                ? 'rgba(114, 46, 209, 0.08)' 
                : 'rgba(245, 240, 255, 0.5)'
            }}>
            <Divider orientation="center" style={{ marginTop: 8 }}>
              <CloudOutlined style={{ marginRight: 8 }} />
              SaaS 服务
            </Divider>
            
            {/* 服务到期时间 */}
            <Form.Item 
              name="service_expiry_date" 
              label="服务到期时间"
              style={{ marginBottom: 12 }}
            >
              <Space>
                <DatePicker 
                  style={{ width: 200 }} 
                  format="YYYY-MM-DD" 
                  variant="borderless"
                  placeholder="请选择服务到期时间"
                  disabled={!canEdit()}
                  onChange={() => {
                    // 触发重新计算剩余天数
                    form.validateFields(['service_expiry_date']);
                  }}
                />
                <Form.Item shouldUpdate noStyle>
                  {({ getFieldValue }) => {
                    const expiryDate = getFieldValue('service_expiry_date');
                    if (expiryDate) {
                      const today = dayjs();
                      const expiry = dayjs(expiryDate);
                      const daysRemaining = expiry.diff(today, 'day');
                      if (daysRemaining > 0) {
                        return (
                          <span style={{ color: daysRemaining <= 30 ? '#ff4d4f' : daysRemaining <= 90 ? '#faad14' : '#52c41a', fontSize: 13 }}>
                            剩余 {daysRemaining} 天
                          </span>
                        );
                      } else if (daysRemaining === 0) {
                        return (
                          <span style={{ color: '#ff4d4f', fontSize: 13 }}>
                            今天到期
                          </span>
                        );
                      } else {
                        return (
                          <span style={{ color: '#ff4d4f', fontSize: 13 }}>
                            已过期 {Math.abs(daysRemaining)} 天
                          </span>
                        );
                      }
                    }
                    return null;
                  }}
                </Form.Item>
              </Space>
            </Form.Item>
            
            {/* GOT Online 详情 */}
            <Form.Item
              label="GOT Online 详情"
              tooltip="记录GOT Online项目信息"
            >
              <Form.List name="got_online_projects">
                {(gotFields, { add: addGot, remove: removeGot }) => (
                  <>
                    {gotFields.map(({ key: gotKey, name: gotName, ...gotRestField }) => (
                      <div key={gotKey} style={{ 
                        marginBottom: 8, 
                        padding: 8, 
                        border: theme === 'dark' ? '1px solid rgba(102, 126, 234, 0.3)' : '1px solid #d9d9d9', 
                        borderRadius: 6,
                        background: theme === 'dark' ? 'rgba(26, 31, 58, 0.3)' : '#fcfcfc'
                      }}>
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                          <Row gutter={12} align="flex-end">
                            <Col span={6}>
                              <Form.Item
                                {...gotRestField}
                                name={[gotName, 'project_name']}
                                label="项目名称"
                                rules={[{ required: true, message: '请输入项目名称' }]}
                                style={{ marginBottom: 0 }}
                              >
                                <Input placeholder="项目名称" variant="borderless" maxLength={10} disabled={!canEdit()} />
                              </Form.Item>
                            </Col>
                            <Col span={4}>
                              <Form.Item
                                {...gotRestField}
                                name={[gotName, 'tag']}
                                label="负责人"
                                style={{ marginBottom: 0 }}
                              >
                                <Input placeholder="负责人" variant="borderless" disabled={!canEdit()} />
                              </Form.Item>
                            </Col>
                            <Col span={4}>
                              <Form.Item
                                {...gotRestField}
                                name={[gotName, 'progress']}
                                label="进度"
                                style={{ marginBottom: 0 }}
                              >
                                <Select placeholder="请选择进度" style={{ width: '100%' }} variant="borderless" disabled={!canEdit()}>
                                  <Option value="demo">demo</Option>
                                  <Option value="铺量">铺量</Option>
                                  <Option value="待公测">待公测</Option>
                                  <Option value="上限">上限</Option>
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col span={8}>
                              <Form.Item
                                {...gotRestField}
                                name={[gotName, 'url']}
                                label="URL"
                                rules={[
                                  { required: true, message: '请输入URL' },
                                  { type: 'url', message: '请输入有效的URL' }
                                ]}
                                style={{ marginBottom: 0 }}
                              >
                                <Input placeholder="https://example.com" variant="borderless" disabled={!canEdit()} />
                              </Form.Item>
                            </Col>
                            <Col span={2} style={{ textAlign: 'right', paddingBottom: 0 }}>
                              {canEdit() && (
                                <Button
                                  type="link"
                                  danger
                                  size="small"
                                  icon={<MinusCircleOutlined />}
                                  onClick={() => removeGot(gotName)}
                                  style={{ padding: 0 }}
                                />
                              )}
                            </Col>
                          </Row>
                        </Space>
                      </div>
                    ))}
                    <Form.Item style={{ marginBottom: 0 }}>
                      <Button
                        type="dashed"
                        onClick={() => {
                          try {
                            addGot({ project_name: '', url: '', tag: '', progress: '' });
                          } catch (error) {
                            console.error('添加GOT Online项目错误:', error);
                            message.error('添加失败');
                          }
                        }}
                        icon={<PlusOutlined />}
                        size="small"
                        style={{ marginTop: 4, fontSize: 12 }}
                        disabled={!canEdit()}
                      >
                        添加项目
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </Form.Item>

            {/* 小游戏 */}
            <Form.Item name="has_mini_game" label="是否有小游戏" style={{ marginBottom: 12 }}>
              <Space>
                <Radio.Group onChange={(e) => setHasMiniGame(e.target.value === '是')} value={hasMiniGame ? '是' : '否'} style={{ width: 'auto' }} disabled={!canEdit()}>
                  <Radio value="是">是</Radio>
                  <Radio value="否">否</Radio>
                </Radio.Group>
                {hasMiniGame && (
                  <>
                    <Form.Item 
                      name="mini_game_name" 
                      rules={[{ required: true, message: '请输入游戏名称' }]}
                      style={{ marginBottom: 0, display: 'inline-block' }}
                    >
                      <Input placeholder="游戏名称" variant="borderless" style={{ width: 150 }} disabled={!canEdit()} />
                    </Form.Item>
                    <Form.Item 
                      name="mini_game_platforms" 
                      rules={[{ required: true, message: '请选择平台' }]}
                      style={{ marginBottom: 0, display: 'inline-block' }}
                    >
                      <Select 
                        mode="multiple" 
                        placeholder="平台" 
                        style={{ width: 120 }} 
                        variant="borderless"
                        maxTagCount="responsive"
                        disabled={!canEdit()}
                      >
                        <Option value="微小">微小</Option>
                        <Option value="抖小">抖小</Option>
                        <Option value="其他">其他</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item 
                      name="mini_game_url" 
                      style={{ marginBottom: 0, display: 'inline-block' }}
                    >
                      <Input placeholder="URL" variant="borderless" style={{ width: 200 }} disabled={!canEdit()} />
                    </Form.Item>
                  </>
                )}
              </Space>
            </Form.Item>
            </div>

            {/* 其他服务使用情况 */}
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '12px',
              background: theme === 'dark' 
                ? 'rgba(250, 173, 20, 0.08)' 
                : 'rgba(255, 247, 230, 0.5)'
            }}>
            <Divider orientation="center" style={{ marginTop: 8 }}>
              <AppstoreOutlined style={{ marginRight: 8 }} />
              其他服务使用情况
            </Divider>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="pipeline_status" label="Pipeline">
                  <Select placeholder="请选择Pipeline状态" style={{ width: '100%', maxWidth: 200 }} variant="borderless">
                    <Option value="已搭建">已搭建</Option>
                    <Option value="未搭建">未搭建</Option>
                    <Option value="待激活">待激活</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="gpm_status" label="GPM">
                  <Select placeholder="请选择GPM状态" style={{ width: '100%', maxWidth: 200 }} variant="borderless">
                    <Option value="待激活">待激活</Option>
                    <Option value="试用">试用</Option>
                    <Option value="转化">转化</Option>
                    <Option value="暂无意向">暂无意向</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            </div>

          </Form>
        </Modal>

        {/* 客户信息历史记录Modal */}
        <Modal
          title="客户信息 历史记录"
          open={nextStepHistoryVisible}
          onCancel={() => {
            setNextStepHistoryVisible(false);
            setNextStepHistory([]);
            setCurrentCustomerId(null);
            setNewNextStep('');
          }}
          footer={null}
          width={700}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <RichTextEditor
                placeholder="记录客户相关的文档资料，便于随时回忆和阅读"
                value={newNextStep}
                onChange={(value) => setNewNextStep(value)}
                rows={4}
              />
              <Button
                type="primary"
                icon={<PlusCircleOutlined />}
                onClick={handleAddNextStep}
                block
                style={{ marginTop: 8 }}
              >
                新建记录
              </Button>
            </div>
            <Divider />
            {nextStepHistory.length > 0 ? (
              <Timeline
                items={nextStepHistory.map((item) => ({
                  children: (
                    <div>
                      <div 
                        style={{ marginBottom: 8 }}
                        dangerouslySetInnerHTML={{ __html: item.next_step || '' }}
                      />
                      <div style={{ fontSize: 12, color: '#999' }}>
                        {item.username} · {item.created_at ? dayjs(item.created_at).format('YYYY-MM-DD HH:mm') : ''}
                      </div>
                    </div>
                  )
                }))}
              />
            ) : (
              <Empty description="暂无历史记录" />
            )}
          </Space>
        </Modal>

      </Content>
    </Layout>
  );
}

