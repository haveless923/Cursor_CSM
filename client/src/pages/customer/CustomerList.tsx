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
  Rate,
  Upload,
  Progress
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
  DownOutlined,
  UploadOutlined
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
import * as XLSX from 'xlsx';

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
  const [savedContacts, setSavedContacts] = useState<Set<number>>(new Set());
  const [savedRequirementRecords, setSavedRequirementRecords] = useState<Set<number>>(new Set());
  const [savedGotOnlineRecords, setSavedGotOnlineRecords] = useState<Set<number>>(new Set());
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importing, setImporting] = useState(false);
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
      
      // 调试信息：检查 service_expiry_date 字段
      if (data.length > 0) {
        console.log('loadCustomers - 加载的客户数据:', data.length, '条');
        data.forEach((c: any) => {
          console.log('loadCustomers - 客户ID:', c.id, '公司名称:', c.company_name, 'service_expiry_date:', c.service_expiry_date, '类型:', typeof c.service_expiry_date);
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

  // 解析 CSV 文件（改进版，支持引号内的逗号）
  const parseCSV = (text: string): any[] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) return [];
    
    // 解析表头（改进的CSV解析，处理引号）
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            // 转义的双引号
            current += '"';
            i++;
          } else {
            // 切换引号状态
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          // 字段分隔符
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim()); // 最后一个字段
      return result;
    };
    
    const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, ''));
    
    // 解析数据行
    const data: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // 跳过空行
      
      const values = parseCSVLine(line).map(v => v.replace(/^"|"$/g, ''));
      if (values.some(v => v)) { // 至少有一个非空值
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }
    return data;
  };

  // 解析 XLSX 文件
  const parseXLSX = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // 映射 CSV/XLSX 数据到客户数据结构
  const mapRowToCustomer = (row: any): any => {
    // 字段映射表（支持多种可能的列名）
    const fieldMap: Record<string, string[]> = {
      company_name: ['公司名称', 'company_name', '公司名', '企业名称'],
      customer_name: ['客户名称', 'customer_name', '客户名'],
      contact_person: ['联系人', 'contact_person', '联系人姓名', '联系人名称'],
      position: ['职位', 'position', '联系人职位'],
      city: ['城市', 'city', '所在城市'],
      customer_source: ['客户来源', 'customer_source', '来源'],
      financial_capacity: ['合作进度', 'financial_capacity', '财务能力', '合作状态'],
      sales_owner: ['负责人', 'sales_owner', '销售负责人'],
      category: ['分类', 'category', '客户分类', '状态'],
      status: ['状态', 'status', '客户状态'],
      custom_tags: ['标签', 'custom_tags', '自定义标签'],
      service_expiry_date: ['服务到期时间', 'service_expiry_date', '到期时间'],
      customer_rating: ['客户评级', 'customer_rating', '评级'],
      has_mini_game: ['是否有小游戏', 'has_mini_game', '小游戏'],
      mini_game_name: ['游戏名称', 'mini_game_name', '小游戏名称'],
      mini_game_platforms: ['游戏平台', 'mini_game_platforms', '平台'],
      mini_game_url: ['游戏URL', 'mini_game_url', '小游戏URL'],
      pipeline_status: ['Pipeline', 'pipeline_status', 'Pipeline状态'],
      gpm_status: ['GPM', 'gpm_status', 'GPM状态'],
      phone: ['电话', 'phone', '联系电话'],
      email: ['邮箱', 'email', '电子邮件'],
      notes: ['备注', 'notes', '说明', '描述']
    };

    const getFieldValue = (fieldName: string): string => {
      const possibleNames = fieldMap[fieldName] || [fieldName];
      for (const name of possibleNames) {
        if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
          return String(row[name]);
        }
      }
      return '';
    };

    // 解析城市（可能是逗号分隔的字符串）
    const cityValue = getFieldValue('city');
    const cityArray = cityValue ? cityValue.split(/[,，]/).map(c => c.trim()).filter(c => c) : [];

    // 解析标签（可能是逗号分隔的字符串）
    const tagsValue = getFieldValue('custom_tags');
    const tagsArray = tagsValue ? tagsValue.split(/[,，]/).map(t => t.trim()).filter(t => t) : [];

    // 解析联系人
    const contactName = getFieldValue('contact_person');
    const contactPosition = getFieldValue('position');
    const contacts = contactName ? [{ name: contactName, position: contactPosition || '', portrait: '' }] : [];

    // 解析日期
    const expiryDateStr = getFieldValue('service_expiry_date');
    let serviceExpiryDate = null;
    if (expiryDateStr) {
      const parsedDate = dayjs(expiryDateStr);
      if (parsedDate.isValid()) {
        serviceExpiryDate = parsedDate.format('YYYY-MM-DD');
      }
    }

    // 确定分类
    let customerCategory = getFieldValue('category');
    if (!customerCategory) {
      // 如果没有指定分类，根据当前页面设置
      customerCategory = category && decodeURIComponent(category) === 'closed' ? '结单' : '建联中';
    }

    // 确定状态
    const statusValue = getFieldValue('status');
    
    // 确定合作进度
    let financialCapacity = getFieldValue('financial_capacity');
    if (!financialCapacity && customerCategory === '结单') {
      financialCapacity = '结单';
    }

    // 解析客户评级（数字）
    const ratingValue = getFieldValue('customer_rating');
    let customerRating = 0;
    if (ratingValue) {
      const parsed = parseInt(ratingValue);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 3) {
        customerRating = parsed;
      }
    }

    // 解析小游戏相关字段
    const hasMiniGameValue = getFieldValue('has_mini_game');
    const hasMiniGame = hasMiniGameValue === '是' || hasMiniGameValue === '1' || hasMiniGameValue === 'true' || hasMiniGameValue === 'True';
    const miniGameName = getFieldValue('mini_game_name');
    const miniGamePlatformsValue = getFieldValue('mini_game_platforms');
    const miniGamePlatforms = miniGamePlatformsValue ? miniGamePlatformsValue.split(/[,，]/).map(p => p.trim()).filter(p => p) : [];
    const miniGameUrl = getFieldValue('mini_game_url');

    return {
      company_name: getFieldValue('company_name') || getFieldValue('customer_name'),
      city: cityArray.length > 0 ? cityArray : (cityValue || undefined),
      customer_source: getFieldValue('customer_source') || undefined,
      custom_tags: tagsArray.length > 0 ? tagsArray : undefined,
      contacts: contacts.length > 0 ? contacts : undefined,
      sales_owner: getFieldValue('sales_owner') || undefined,
      financial_capacity: financialCapacity || undefined,
      category: customerCategory,
      status: statusValue || undefined,
      customer_rating: customerRating || 0,
      service_expiry_date: serviceExpiryDate,
      has_mini_game: hasMiniGame,
      mini_game_name: hasMiniGame && miniGameName ? miniGameName : undefined,
      mini_game_platforms: hasMiniGame && miniGamePlatforms.length > 0 ? miniGamePlatforms : undefined,
      mini_game_url: hasMiniGame && miniGameUrl ? miniGameUrl : undefined,
      pipeline_status: getFieldValue('pipeline_status') || undefined,
      gpm_status: getFieldValue('gpm_status') || undefined,
      notes: getFieldValue('notes') || undefined
    };
  };

  // 处理文件导入
  const handleFileImport = async (file: File) => {
    try {
      setImporting(true);
      setImportProgress(0);

      let rows: any[] = [];
      
      // 根据文件类型解析
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        rows = parseCSV(text);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        rows = await parseXLSX(file);
      } else {
        message.error('不支持的文件格式，请上传 CSV 或 XLSX 文件');
        setImporting(false);
        return;
      }

      if (rows.length === 0) {
        message.error('文件中没有有效数据');
        setImporting(false);
        return;
      }

      // 映射数据并批量创建
      let successCount = 0;
      let failCount = 0;
      let skipCount = 0;
      const total = rows.length;
      const failDetails: string[] = [];

      console.log(`开始导入，共 ${total} 行数据`);

      for (let i = 0; i < rows.length; i++) {
        try {
          const row = rows[i];
          console.log(`处理第 ${i + 1} 行:`, row);
          
          const customerData = mapRowToCustomer(row);
          console.log(`第 ${i + 1} 行映射后的数据:`, customerData);
          
          // 至少需要公司名称
          if (!customerData.company_name || customerData.company_name.trim() === '') {
            const reason = `第 ${i + 1} 行：缺少公司名称`;
            console.warn(reason);
            failDetails.push(reason);
            skipCount++;
            continue;
          }

          await createCustomer(customerData);
          successCount++;
          console.log(`第 ${i + 1} 行导入成功`);
          
          // 更新进度
          setImportProgress(Math.round(((i + 1) / total) * 100));
        } catch (error: any) {
          const reason = `第 ${i + 1} 行：${error.message || '未知错误'}`;
          console.error(`导入第 ${i + 1} 行数据失败:`, error);
          failDetails.push(reason);
          failCount++;
        }
      }

      setImporting(false);
      setImportProgress(100);
      
      // 显示详细的导入结果
      let resultMessage = `导入完成！成功: ${successCount} 条`;
      if (skipCount > 0) {
        resultMessage += `，跳过: ${skipCount} 条（缺少公司名称）`;
      }
      if (failCount > 0) {
        resultMessage += `，失败: ${failCount} 条`;
      }
      
      if (failDetails.length > 0) {
        console.log('导入失败的详细信息:', failDetails);
        message.warning(resultMessage + '，请查看控制台了解详情', 5);
        // 在控制台输出详细信息
        console.group('导入失败详情');
        failDetails.forEach((detail, idx) => {
          console.log(`${idx + 1}. ${detail}`);
        });
        console.groupEnd();
      } else {
        message.success(resultMessage);
      }
      
      // 刷新列表
      await loadCustomers();
      
      // 关闭导入窗口
      setTimeout(() => {
        setImportModalVisible(false);
        setImportProgress(0);
      }, 1000);
    } catch (error) {
      console.error('导入失败:', error);
      message.error('导入失败: ' + (error instanceof Error ? error.message : '未知错误'));
      setImporting(false);
      setImportProgress(0);
    }
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    setHasMiniGame(false);
    setSavedVisitRecords(new Set());
    setSavedContacts(new Set());
    setSavedRequirementRecords(new Set());
    setSavedGotOnlineRecords(new Set());
    
    // 先打开Modal，确保Form组件已经渲染
    setModalVisible(true);
    
    // 然后在下一个事件循环中重置表单
    setTimeout(() => {
      if (form) {
        form.resetFields();
        // 设置初始值，确保Form.List有默认值
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
      }
    }, 100);
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
        // 确保每个项目都有完整字段，并限制项目名称长度为10个字符
        gotOnlineProjects = gotOnlineProjects.map((p: any) => {
          const projectName = p.project_name || '';
          return {
            project_name: projectName.length > 10 ? projectName.substring(0, 10) : projectName,
            url: p.url || '',
            tag: p.tag || '',
            progress: p.progress || ''
          };
        });
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

    // 处理服务到期时间：确保正确解析
    let serviceExpiryDate = null;
    if (record.service_expiry_date) {
      if (dayjs.isDayjs(record.service_expiry_date)) {
        serviceExpiryDate = record.service_expiry_date;
      } else {
        const parsedDate = dayjs(record.service_expiry_date);
        if (parsedDate.isValid()) {
          serviceExpiryDate = parsedDate;
        } else {
          console.warn('无法解析服务到期时间:', record.service_expiry_date);
        }
      }
    }
    console.log('handleEdit - 原始 service_expiry_date:', record.service_expiry_date);
    console.log('handleEdit - 解析后的 service_expiry_date:', serviceExpiryDate);

    form.setFieldsValue({
      ...record,
      contacts: contacts,
      follow_up_records: followUpRecords,
      requirement_list: requirementList,
      got_online_projects: gotOnlineProjects,
      pipeline_status: record.pipeline_status || '',
      service_expiry_date: serviceExpiryDate,
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
    
    // 验证表单值是否正确设置
    setTimeout(() => {
      const formValue = form.getFieldValue('service_expiry_date');
      console.log('handleEdit - 表单中的 service_expiry_date:', formValue);
    }, 100);
    // 设置hasMiniGame状态
    setHasMiniGame(record.has_mini_game === 1 || record.has_mini_game === true);
    // 设置customerSource状态
    setCustomerSource(record.customer_source || '');
    // 将所有已存在的记录标记为已保存（预览状态）
    const savedVisitRecordsSet = new Set<number>();
    followUpRecords.forEach((_, index) => {
      savedVisitRecordsSet.add(index);
    });
    setSavedVisitRecords(savedVisitRecordsSet);
    
    const savedContactsSet = new Set<number>();
    contacts.forEach((_, index) => {
      savedContactsSet.add(index);
    });
    setSavedContacts(savedContactsSet);
    
    const savedRequirementRecordsSet = new Set<number>();
    requirementList.forEach((_, index) => {
      savedRequirementRecordsSet.add(index);
    });
    setSavedRequirementRecords(savedRequirementRecordsSet);
    
    const savedGotOnlineRecordsSet = new Set<number>();
    gotOnlineProjects.forEach((_, index) => {
      savedGotOnlineRecordsSet.add(index);
    });
    setSavedGotOnlineRecords(savedGotOnlineRecordsSet);
    
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
        // 如果选择了"是"，需要验证小游戏相关字段
        if (values.has_mini_game === '是') {
          await form.validateFields(['mini_game_name', 'mini_game_platforms']);
        }
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
        gotOnlineProjects.map((p: any) => {
          const projectName = p.project_name || '';
          return {
            project_name: projectName.length > 10 ? projectName.substring(0, 10) : projectName,
            url: p.url || '',
            tag: p.tag || '',
            progress: p.progress || ''
          };
        })
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
      
      // 处理服务到期时间：确保正确格式化
      let serviceExpiryDateFormatted = null;
      if (values.service_expiry_date) {
        if (dayjs.isDayjs(values.service_expiry_date)) {
          serviceExpiryDateFormatted = values.service_expiry_date.format('YYYY-MM-DD');
        } else if (typeof values.service_expiry_date === 'string') {
          // 如果已经是字符串格式，直接使用
          serviceExpiryDateFormatted = values.service_expiry_date;
        } else {
          // 尝试转换为 dayjs 对象
          const date = dayjs(values.service_expiry_date);
          if (date.isValid()) {
            serviceExpiryDateFormatted = date.format('YYYY-MM-DD');
          }
        }
      }
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
        mini_game_platforms: values.has_mini_game === '是' && values.mini_game_platforms ? JSON.stringify(values.mini_game_platforms) : null,
        mini_game_url: values.has_mini_game === '是' ? values.mini_game_url : null
      };
      
      console.log('发送到后端的小游戏数据:', {
        has_mini_game: customerData.has_mini_game,
        mini_game_name: customerData.mini_game_name,
        mini_game_platforms: customerData.mini_game_platforms,
        mini_game_url: customerData.mini_game_url
      });
      
      console.log('发送到后端的 customerData.service_expiry_date:', customerData.service_expiry_date);

      if (editingCustomer?.id) {
        const updatedCustomer = await updateCustomer(editingCustomer.id, customerData);
        console.log('更新后的客户数据:', updatedCustomer);
        console.log('更新后的 service_expiry_date:', updatedCustomer.service_expiry_date);
        console.log('更新后的 service_expiry_date 类型:', typeof updatedCustomer.service_expiry_date);
        console.log('更新后的小游戏数据:', {
          has_mini_game: updatedCustomer.has_mini_game,
          mini_game_name: updatedCustomer.mini_game_name,
          mini_game_platforms: updatedCustomer.mini_game_platforms,
          mini_game_url: updatedCustomer.mini_game_url
        });
        
        // 立即更新本地状态，确保表格显示最新数据
        setCustomers(prevCustomers => {
          const updated = prevCustomers.map(c => {
            if (c.id === editingCustomer.id) {
              const merged = { 
                ...c, 
                ...updatedCustomer,
                // 确保 service_expiry_date 字段被正确设置
                service_expiry_date: updatedCustomer.service_expiry_date || customerData.service_expiry_date || null,
                // 确保小游戏字段被正确设置
                has_mini_game: updatedCustomer.has_mini_game,
                mini_game_name: updatedCustomer.mini_game_name,
                mini_game_platforms: updatedCustomer.mini_game_platforms,
                mini_game_url: updatedCustomer.mini_game_url
              };
              console.log('更新表格数据 - 客户ID:', merged.id, 'service_expiry_date:', merged.service_expiry_date);
              console.log('更新表格数据 - 小游戏:', {
                has_mini_game: merged.has_mini_game,
                mini_game_name: merged.mini_game_name,
                mini_game_platforms: merged.mini_game_platforms,
                mini_game_url: merged.mini_game_url
              });
              return merged;
            }
            return c;
          });
          return updated;
        });
        
        message.success('更新成功');
      } else {
        const newCustomer = await createCustomer(customerData);
        console.log('创建的客户数据:', newCustomer);
        console.log('创建的客户 category:', newCustomer.category);
        console.log('创建的客户 service_expiry_date:', newCustomer.service_expiry_date);
        console.log('创建的客户小游戏数据:', {
          has_mini_game: newCustomer.has_mini_game,
          mini_game_name: newCustomer.mini_game_name,
          mini_game_platforms: newCustomer.mini_game_platforms,
          mini_game_url: newCustomer.mini_game_url
        });
        console.log('当前页面 category:', category);
        message.success('创建成功');
      }

      setModalVisible(false);
      form.resetFields();
      setPortraitExpanded({});
      setSavedVisitRecords(new Set());
      setSavedContacts(new Set());
      setSavedRequirementRecords(new Set());
      setSavedGotOnlineRecords(new Set());
      setEditingCustomer(null);
      
      // 延迟一下再刷新，确保数据已保存到数据库（这会从服务器获取最新数据）
      setTimeout(() => {
        loadCustomers();
      }, 800);
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
        // 调试信息
        console.log('表格渲染 - 客户ID:', record.id, '公司名称:', record.company_name, 'service_expiry_date:', date, '类型:', typeof date);
        
        if (!date) {
          return '-';
        }
        
        // 尝试解析日期
        let expiryDate;
        if (dayjs.isDayjs(date)) {
          expiryDate = date;
        } else if (typeof date === 'string') {
          expiryDate = dayjs(date);
        } else {
          expiryDate = dayjs(date);
        }
        
        // 检查日期是否有效
        if (!expiryDate.isValid()) {
          console.warn('无效的服务到期时间:', date, '客户ID:', record.id);
          return '-';
        }
        
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
      title: 'GOT Online 详情',
      dataIndex: 'got_online_projects',
      width: 300,
      ellipsis: true,
      render: (text, record) => {
        if (!text) return '-';
        try {
          const projects = typeof text === 'string' ? JSON.parse(text) : text;
          if (!Array.isArray(projects) || projects.length === 0) return '-';
          
          return (
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {projects.map((project: any, index: number) => {
                const projectNameRaw = project.project_name || '-';
                const projectNameDisplay = projectNameRaw !== '-' && projectNameRaw.length > 10 
                  ? projectNameRaw.substring(0, 10) + '...' 
                  : projectNameRaw;
                return (
                  <div key={index} style={{ marginBottom: index < projects.length - 1 ? 8 : 0 }}>
                    <div style={{ marginBottom: 4 }}>
                      <span style={{ fontWeight: 500, color: theme === 'dark' ? '#d4d4d4' : '#595959' }}>
                        {projectNameDisplay}
                      </span>
                      {project.tag && (
                        <span style={{ 
                          marginLeft: 8, 
                          fontSize: 12, 
                          color: theme === 'dark' ? '#a0a0a0' : '#8c8c8c',
                          padding: '2px 6px',
                          background: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#f0f0f0',
                          borderRadius: '4px'
                        }}>
                          {project.tag}
                        </span>
                      )}
                    </div>
                    {project.url && (
                      <a 
                        href={project.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ 
                          fontSize: 12, 
                          color: theme === 'dark' ? '#667eea' : '#1890ff',
                          wordBreak: 'break-all'
                        }}
                      >
                        {project.url}
                      </a>
                    )}
                  </div>
                );
              })}
            </Space>
          );
        } catch (e) {
          return '-';
        }
      }
    },
    // 已移除负责人列（因为只显示当前用户的客户，不需要显示负责人）
    {
      title: '操作',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ padding: '0 4px' }} />
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} style={{ padding: '0 4px' }} />
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
          <Button className="tech-button-primary" type="primary" icon={<PlusOutlined />} onClick={handleAdd} />
          <Button className="tech-button" icon={<UploadOutlined />} onClick={() => setImportModalVisible(true)}>
            导入
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
            scroll={{ x: 1500, y: 'calc(100vh - 250px)' }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total) => <span style={{ color: getTextColor() }}>共 {total} 条记录</span>,
              showQuickJumper: true,
              size: 'small',
              position: ['bottomCenter']
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
              padding: '24px 32px'
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
            <Row gutter={16}>
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
                              type="text"
                              size="small"
                              icon={<PlusOutlined />}
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
                              style={{ 
                                padding: '2px 4px',
                                fontSize: 14,
                                color: theme === 'dark' ? '#8c8c8c' : '#595959'
                              }}
                            />
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
                        marginBottom: 10, 
                        padding: '12px 14px', 
                        border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e0e0e0', 
                        borderRadius: 6,
                        background: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#fafafa',
                        width: '100%',
                        maxWidth: 300,
                        boxSizing: 'border-box',
                        transition: 'all 0.2s ease'
                      }}>
                        <Form.Item shouldUpdate noStyle>
                          {({ getFieldValue }) => {
                            const contactData = getFieldValue(['contacts', name]);
                            const isSaved = savedContacts.has(name);
                            
                            if (isSaved) {
                              // 预览模式
                              const nameValue = contactData?.name || '-';
                              const positionValue = contactData?.position || '-';
                              const portraitValue = contactData?.portrait || '';
                              
                              return (
                                <div style={{ width: '100%' }}>
                                  <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 8,
                                    marginBottom: portraitValue ? 10 : 0,
                                    flexWrap: 'wrap'
                                  }}>
                                    <span style={{ 
                                      fontSize: 14, 
                                      color: theme === 'dark' ? '#e8e8e8' : '#262626',
                                      fontWeight: 500,
                                      flexShrink: 0
                                    }}>{nameValue}</span>
                                    {canEdit() && (
                                      <Space size={4} style={{ flexShrink: 0 }}>
                                        <Button
                                          type="text"
                                          size="small"
                                          icon={<EditOutlined />}
                                          onClick={() => {
                                            setSavedContacts(prev => {
                                              const newSet = new Set(prev);
                                              newSet.delete(name);
                                              return newSet;
                                            });
                                          }}
                                          style={{ 
                                            padding: '2px 4px',
                                            color: theme === 'dark' ? '#667eea' : '#1890ff',
                                            fontSize: 12,
                                            width: 24,
                                            height: 24
                                          }}
                                        />
                                        {fields.length > 1 && (
                                          <Button
                                            type="text"
                                            size="small"
                                            danger
                                            icon={<MinusCircleOutlined />}
                                            onClick={() => {
                                              Modal.confirm({
                                                title: '确认删除',
                                                content: `确定要删除联系人"${nameValue}"吗？`,
                                                okText: '确定',
                                                cancelText: '取消',
                                                onOk: () => {
                                                  setSavedContacts(prev => {
                                                    const newSet = new Set(prev);
                                                    newSet.delete(name);
                                                    return newSet;
                                                  });
                                                  remove(name);
                                                }
                                              });
                                            }}
                                            style={{ 
                                              padding: '2px 4px',
                                              fontSize: 12,
                                              width: 24,
                                              height: 24
                                            }}
                                          />
                                        )}
                                      </Space>
                                    )}
                                    {positionValue !== '-' && (
                                      <span style={{ 
                                        fontSize: 11, 
                                        color: theme === 'dark' ? '#667eea' : '#1890ff',
                                        padding: '2px 8px',
                                        background: theme === 'dark' ? 'rgba(102, 126, 234, 0.2)' : '#e6f7ff',
                                        borderRadius: '10px',
                                        fontWeight: 500,
                                        whiteSpace: 'nowrap',
                                        flexShrink: 0
                                      }}>{positionValue}</span>
                                    )}
                                  </div>
                                  {portraitValue && (
                                    <div style={{ 
                                      marginTop: 10, 
                                      paddingTop: 10,
                                      borderTop: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f0f0f0',
                                      fontSize: 13, 
                                      color: theme === 'dark' ? '#bfbfbf' : '#8c8c8c',
                                      lineHeight: '1.7'
                                    }}>
                                      {portraitValue}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            
                            // 编辑模式
                            return (
                              <div style={{ width: '100%' }}>
                                <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'flex-end', 
                                  gap: 12,
                                  marginBottom: 10
                                }}>
                                  <Form.Item
                                    {...restField}
                                    name={[name, 'name']}
                                    rules={[{ required: true, message: '请输入联系人姓名' }]}
                                    style={{ marginBottom: 0, flex: 1, minWidth: 0 }}
                                  >
                                    <Input 
                                      placeholder="联系人姓名" 
                                      variant="borderless" 
                                      size="small" 
                                      disabled={!canEdit()}
                                      style={{ fontSize: 13 }}
                                    />
                                  </Form.Item>
                                  <Form.Item
                                    {...restField}
                                    name={[name, 'position']}
                                    rules={[{ required: true, message: '请选择职位' }]}
                                    style={{ marginBottom: 0, flex: 1, minWidth: 0, maxWidth: 140 }}
                                  >
                                    <Select 
                                      placeholder="职位" 
                                      variant="borderless" 
                                      size="small" 
                                      disabled={!canEdit()}
                                      style={{ fontSize: 13 }}
                                    >
                                      <Option value="QA">QA</Option>
                                      <Option value="程序">程序</Option>
                                      <Option value="制作人">制作人</Option>
                                      <Option value="技术负责人">技术负责人</Option>
                                      <Option value="CTO">CTO</Option>
                                      <Option value="中台">中台</Option>
                                      <Option value="其他">其他</Option>
                                    </Select>
                                  </Form.Item>
                                  {canEdit() && (
                                    <Space size={4} style={{ flexShrink: 0 }}>
                                      <Button
                                        type="text"
                                        size="small"
                                        icon={<SaveOutlined />}
                                        onClick={async () => {
                                          try {
                                            const contactValues = form.getFieldValue(['contacts', name]);
                                            if (!contactValues?.name || !contactValues?.position) {
                                              message.warning('请填写完整的联系人信息');
                                              return;
                                            }
                                            setSavedContacts(prev => new Set(prev).add(name));
                                            message.success('联系人已保存');
                                          } catch (error) {
                                            message.error('保存失败');
                                          }
                                        }}
                                        style={{ 
                                          padding: '2px 4px',
                                          fontSize: 12,
                                          width: 24,
                                          height: 24
                                        }}
                                      />
                                      {fields.length > 1 && (
                                        <Button
                                          type="text"
                                          size="small"
                                          danger
                                          icon={<MinusCircleOutlined />}
                                          onClick={() => {
                                            const contactValues = form.getFieldValue(['contacts', name]);
                                            const contactName = contactValues?.name || '该联系人';
                                            Modal.confirm({
                                              title: '确认删除',
                                              content: `确定要删除联系人"${contactName}"吗？`,
                                              okText: '确定',
                                              cancelText: '取消',
                                              onOk: () => {
                                                setSavedContacts(prev => {
                                                  const newSet = new Set(prev);
                                                  newSet.delete(name);
                                                  return newSet;
                                                });
                                                remove(name);
                                              }
                                            });
                                          }}
                                          style={{ 
                                            padding: '2px 4px',
                                            fontSize: 12,
                                            width: 24,
                                            height: 24
                                          }}
                                        />
                                      )}
                                    </Space>
                                  )}
                                </div>
                                <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  marginTop: 8,
                                  paddingTop: 8,
                                  borderTop: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f0f0f0'
                                }}>
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
                                      userSelect: 'none',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 4
                                    }}
                                  >
                                    {portraitExpanded[name] ? <UpOutlined /> : <DownOutlined />} 
                                    <span>画像</span>
                                  </span>
                                </div>
                                {portraitExpanded[name] && (
                                  <Form.Item
                                  {...restField}
                                  name={[name, 'portrait']}
                                  style={{ marginBottom: 0, marginTop: 8 }}
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
                            </div>
                            );
                          }}
                        </Form.Item>
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
                          disabled={!canEdit()}
                          style={{
                            height: 40,
                            borderRadius: 6,
                            borderStyle: 'dashed',
                            borderWidth: 1,
                            fontSize: 13,
                            color: theme === 'dark' ? '#8c8c8c' : '#8c8c8c'
                          }}
                        />
                      </Form.Item>
                    )}
                    {fields.length > 0 && fields.length < 5 && (
                      <Form.Item style={{ marginBottom: 0, marginTop: 6 }}>
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
                          disabled={!canEdit()}
                          style={{
                            borderRadius: 4,
                            borderStyle: 'dashed',
                            borderWidth: 1,
                            fontSize: 12,
                            color: theme === 'dark' ? '#8c8c8c' : '#8c8c8c',
                            height: 28
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
                        marginBottom: 10, 
                        padding: '12px 14px', 
                        border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e0e0e0', 
                        borderRadius: 8,
                        background: theme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#fafafa',
                        minHeight: 60,
                        transition: 'all 0.2s ease'
                      }}>
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                          <Form.Item shouldUpdate noStyle>
                            {({ getFieldValue }) => {
                              const recordData = getFieldValue(['follow_up_records', name]);
                              const isSaved = savedVisitRecords.has(name);
                              
                              if (isSaved) {
                                // 预览模式：显示为只读文本
                                const dateValue = recordData?.date;
                                const typeValue = recordData?.type;
                                const detailsValue = recordData?.details;
                                
                                return (
                                  <>
                                    <Row gutter={12}>
                                      <Col span={12}>
                                        <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center' }}>
                                          <span style={{ 
                                            fontSize: 12, 
                                            color: theme === 'dark' ? '#a0a0a0' : '#8c8c8c', 
                                            marginRight: 8,
                                            fontWeight: 500,
                                            minWidth: 60
                                          }}>拜访日期</span>
                                          <span style={{ 
                                            fontSize: 13, 
                                            color: theme === 'dark' ? '#d4d4d4' : '#595959',
                                            fontWeight: 500
                                          }}>
                                            {dateValue ? (dayjs.isDayjs(dateValue) ? dateValue.format('YYYY-MM-DD') : dateValue) : '-'}
                                          </span>
                                        </div>
                                      </Col>
                                      <Col span={12}>
                                        <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center' }}>
                                          <span style={{ 
                                            fontSize: 12, 
                                            color: theme === 'dark' ? '#a0a0a0' : '#8c8c8c', 
                                            marginRight: 8,
                                            fontWeight: 500,
                                            minWidth: 40
                                          }}>类型</span>
                                          <span style={{ 
                                            fontSize: 13, 
                                            color: theme === 'dark' ? '#d4d4d4' : '#595959',
                                            fontWeight: 500
                                          }}>
                                            {typeValue || '-'}
                                          </span>
                                        </div>
                                      </Col>
                                    </Row>
                                    <div style={{ marginBottom: 8 }}>
                                      <div style={{ 
                                        fontSize: 12, 
                                        color: theme === 'dark' ? '#a0a0a0' : '#8c8c8c', 
                                        marginBottom: 6,
                                        fontWeight: 500
                                      }}>拜访详情</div>
                                      <div style={{ 
                                        fontSize: 13, 
                                        color: theme === 'dark' ? '#d4d4d4' : '#595959',
                                        padding: '10px 12px',
                                        background: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#fafafa',
                                        border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e8e8e8',
                                        borderRadius: '6px',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        minHeight: '44px',
                                        lineHeight: '1.6'
                                      }}>
                                        {detailsValue || '-'}
                                      </div>
                                    </div>
                                    {canEdit() && (
                                      <div style={{ textAlign: 'right', marginTop: 8 }}>
                                        <Space size="small">
                                          <Button
                                            type="text"
                                            size="small"
                                            icon={<EditOutlined />}
                                            onClick={() => {
                                              setSavedVisitRecords(prev => {
                                                const newSet = new Set(prev);
                                                newSet.delete(name);
                                                return newSet;
                                              });
                                            }}
                                            style={{ 
                                              padding: '4px 8px',
                                              fontSize: 13,
                                              color: theme === 'dark' ? '#667eea' : '#1890ff'
                                            }}
                                          />
                                          <Button
                                            type="text"
                                            size="small"
                                            danger
                                            icon={<MinusCircleOutlined />}
                                            onClick={() => {
                                              const recordInfo = `${typeValue || '跟进记录'} - ${dateValue ? (dayjs.isDayjs(dateValue) ? dateValue.format('YYYY-MM-DD') : dateValue) : '未设置日期'}`;
                                              Modal.confirm({
                                                title: '确认删除',
                                                content: `确定要删除跟进记录"${recordInfo}"吗？`,
                                                okText: '确定',
                                                cancelText: '取消',
                                                onOk: () => {
                                                  setSavedVisitRecords(prev => {
                                                    const newSet = new Set(prev);
                                                    newSet.delete(name);
                                                    return newSet;
                                                  });
                                                  remove(name);
                                                }
                                              });
                                            }}
                                            style={{ 
                                              padding: '4px 8px',
                                              fontSize: 13
                                            }}
                                          />
                                        </Space>
                                      </div>
                                    )}
                                  </>
                                );
                              }
                              
                              // 编辑模式：显示为输入框
                              return (
                                <>
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
                                        disabled={!canEdit()}
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
                                        disabled={!canEdit()}
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
                                  style={{ marginBottom: 8 }}
                                >
                                  <Input.TextArea 
                                    rows={2} 
                                    placeholder="请输入拜访详情" 
                                    variant="borderless"
                                    showCount
                                    style={{ fontSize: 13 }}
                                    disabled={!canEdit()}
                                  />
                                </Form.Item>
                                {canEdit() && (
                                  <div style={{ textAlign: 'right', marginTop: 0 }}>
                                    <Space size="small">
                                      <Button
                                        type="text"
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
                                        style={{ 
                                          padding: '4px 8px',
                                          fontSize: 13
                                        }}
                                      />
                                      <Button
                                        type="text"
                                        size="small"
                                        danger
                                        icon={<MinusCircleOutlined />}
                                        onClick={() => {
                                          const recordValues = form.getFieldValue(['follow_up_records', name]);
                                          const recordInfo = `${recordValues?.type || '跟进记录'} - ${recordValues?.date ? (dayjs.isDayjs(recordValues.date) ? recordValues.date.format('YYYY-MM-DD') : recordValues.date) : '未设置日期'}`;
                                          Modal.confirm({
                                            title: '确认删除',
                                            content: `确定要删除跟进记录"${recordInfo}"吗？`,
                                            okText: '确定',
                                            cancelText: '取消',
                                            onOk: () => {
                                              setSavedVisitRecords(prev => {
                                                const newSet = new Set(prev);
                                                newSet.delete(name);
                                                return newSet;
                                              });
                                              remove(name);
                                            }
                                          });
                                        }}
                                        style={{ 
                                          padding: '4px 8px',
                                          fontSize: 13
                                        }}
                                      />
                                    </Space>
                                  </div>
                                )}
                              </>
                            );
                          }}
                        </Form.Item>
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
                      />
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
                        marginBottom: 10, 
                        padding: '12px 14px', 
                        border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e0e0e0', 
                        borderRadius: 8,
                        background: theme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#fafafa',
                        minHeight: 60,
                        transition: 'all 0.2s ease'
                      }}>
                        <Form.Item shouldUpdate noStyle>
                          {({ getFieldValue }) => {
                            const requirementData = getFieldValue(['requirement_list', name]);
                            const isSaved = savedRequirementRecords.has(name);
                            
                            if (isSaved) {
                              // 预览模式
                              const dateValue = requirementData?.date;
                              const typeValue = requirementData?.type;
                              const statusValue = requirementData?.status;
                              const descriptionValue = requirementData?.description;
                              const ticketUrlValue = requirementData?.ticket_url;
                              
                              return (
                                <Space direction="vertical" style={{ width: '100%' }} size="small">
                                  <Row gutter={8}>
                                    <Col span={20}>
                                      <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center' }}>
                                        <span style={{ 
                                          fontSize: 12, 
                                          color: theme === 'dark' ? '#a0a0a0' : '#8c8c8c', 
                                          marginRight: 8,
                                          fontWeight: 500,
                                          minWidth: 40
                                        }}>日期</span>
                                        <span style={{ 
                                          fontSize: 13, 
                                          color: theme === 'dark' ? '#d4d4d4' : '#595959',
                                          fontWeight: 500
                                        }}>
                                          {dateValue ? (dayjs.isDayjs(dateValue) ? dateValue.format('YYYY-MM-DD') : dateValue) : '-'}
                                        </span>
                                      </div>
                                    </Col>
                                    <Col span={4} style={{ textAlign: 'right' }}>
                                      {canEdit() && (
                                        <Space size="small">
                                        <Button
                                          type="link"
                                          size="small"
                                          icon={<EditOutlined />}
                                          onClick={() => {
                                            setSavedRequirementRecords(prev => {
                                              const newSet = new Set(prev);
                                              newSet.delete(name);
                                              return newSet;
                                            });
                                          }}
                                          style={{ padding: 0, fontSize: 12, color: theme === 'dark' ? '#667eea' : '#1890ff' }}
                                        />
                                          <Button
                                            type="link"
                                            danger
                                            size="small"
                                            icon={<MinusCircleOutlined />}
                                            onClick={() => {
                                              const requirementInfo = descriptionValue || (dateValue ? (dayjs.isDayjs(dateValue) ? dateValue.format('YYYY-MM-DD') : dateValue) : '需求记录');
                                              Modal.confirm({
                                                title: '确认删除',
                                                content: `确定要删除需求清单"${requirementInfo.length > 20 ? requirementInfo.substring(0, 20) + '...' : requirementInfo}"吗？`,
                                                okText: '确定',
                                                cancelText: '取消',
                                                onOk: () => {
                                                  setSavedRequirementRecords(prev => {
                                                    const newSet = new Set(prev);
                                                    newSet.delete(name);
                                                    return newSet;
                                                  });
                                                  remove(name);
                                                }
                                              });
                                            }}
                                            style={{ padding: 0, fontSize: 12 }}
                                          />
                                        </Space>
                                      )}
                                    </Col>
                                  </Row>
                                  <Row gutter={8}>
                                    <Col span={12}>
                                      <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center' }}>
                                        <span style={{ 
                                          fontSize: 12, 
                                          color: theme === 'dark' ? '#a0a0a0' : '#8c8c8c', 
                                          marginRight: 8,
                                          fontWeight: 500,
                                          minWidth: 40
                                        }}>类型</span>
                                        <span style={{ 
                                          fontSize: 13, 
                                          color: theme === 'dark' ? '#d4d4d4' : '#595959',
                                          fontWeight: 500
                                        }}>{typeValue || '-'}</span>
                                      </div>
                                    </Col>
                                    <Col span={12}>
                                      <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center' }}>
                                        <span style={{ 
                                          fontSize: 12, 
                                          color: theme === 'dark' ? '#a0a0a0' : '#8c8c8c', 
                                          marginRight: 8,
                                          fontWeight: 500,
                                          minWidth: 40
                                        }}>状态</span>
                                        <span style={{ 
                                          fontSize: 13, 
                                          color: theme === 'dark' ? '#d4d4d4' : '#595959',
                                          fontWeight: 500
                                        }}>{statusValue || '-'}</span>
                                      </div>
                                    </Col>
                                  </Row>
                                  <div style={{ marginBottom: 8 }}>
                                    <div style={{ 
                                      fontSize: 12, 
                                      color: theme === 'dark' ? '#a0a0a0' : '#8c8c8c', 
                                      marginBottom: 6,
                                      fontWeight: 500
                                    }}>描述</div>
                                    <div style={{ 
                                      fontSize: 13, 
                                      color: theme === 'dark' ? '#d4d4d4' : '#595959',
                                      padding: '10px 12px',
                                      background: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#fafafa',
                                      border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e8e8e8',
                                      borderRadius: '6px',
                                      whiteSpace: 'pre-wrap',
                                      wordBreak: 'break-word',
                                      minHeight: '44px',
                                      lineHeight: '1.6'
                                    }}>
                                      {descriptionValue || '-'}
                                    </div>
                                  </div>
                                  {ticketUrlValue && (
                                    <div style={{ marginBottom: 8 }}>
                                      <div style={{ 
                                        fontSize: 12, 
                                        color: theme === 'dark' ? '#a0a0a0' : '#8c8c8c', 
                                        marginBottom: 6,
                                        fontWeight: 500
                                      }}>链接</div>
                                      <a 
                                        href={ticketUrlValue} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        style={{ 
                                          fontSize: 13, 
                                          color: theme === 'dark' ? '#667eea' : '#1890ff',
                                          textDecoration: 'none',
                                          wordBreak: 'break-all'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                                      >
                                        {ticketUrlValue}
                                      </a>
                                    </div>
                                  )}
                                </Space>
                              );
                            }
                            
                            // 编辑模式
                            return (
                              <Space direction="vertical" style={{ width: '100%' }} size="small">
                                <Row gutter={8} align="bottom">
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
                                      <Space size="small">
                                        <Button
                                          type="link"
                                          size="small"
                                          icon={<SaveOutlined />}
                                          onClick={async () => {
                                            try {
                                              const recordValues = form.getFieldValue(['requirement_list', name]);
                                              if (!recordValues?.type || !recordValues?.date || !recordValues?.description) {
                                                message.warning('请填写完整的需求清单信息');
                                                return;
                                              }
                                              setSavedRequirementRecords(prev => new Set(prev).add(name));
                                              message.success('需求清单已保存');
                                            } catch (error) {
                                              message.error('保存失败');
                                            }
                                          }}
                                          style={{ padding: 0, fontSize: 12 }}
                                        />
                                        <Button
                                          type="link"
                                          danger
                                          size="small"
                                          icon={<MinusCircleOutlined />}
                                          onClick={() => {
                                            const requirementValues = form.getFieldValue(['requirement_list', name]);
                                            const requirementInfo = requirementValues?.description || (requirementValues?.date ? (dayjs.isDayjs(requirementValues.date) ? requirementValues.date.format('YYYY-MM-DD') : requirementValues.date) : '需求记录');
                                            Modal.confirm({
                                              title: '确认删除',
                                              content: `确定要删除需求清单"${requirementInfo.length > 20 ? requirementInfo.substring(0, 20) + '...' : requirementInfo}"吗？`,
                                              okText: '确定',
                                              cancelText: '取消',
                                              onOk: () => remove(name)
                                            });
                                          }}
                                          style={{ padding: 0, fontSize: 12 }}
                                        />
                                      </Space>
                                    )}
                                  </Col>
                                </Row>
                          <Row gutter={8} align="bottom">
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
                            );
                          }}
                        </Form.Item>
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
                      />
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
              getValueFromEvent={(date) => date} // 确保 DatePicker 的值正确传递
              normalize={(value) => {
                // 确保值格式正确
                if (value && dayjs.isDayjs(value)) {
                  return value;
                }
                if (value && typeof value === 'string') {
                  return dayjs(value);
                }
                return value;
              }}
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

            {/* GOT Online 详情 */}
            <Form.Item
              label="GOT Online 详情"
              tooltip="记录GOT Online项目信息"
              style={{ marginBottom: 12 }}
            >
              <Form.List name="got_online_projects">
                {(gotFields, { add: addGot, remove: removeGot }) => (
                  <>
                    {gotFields.map(({ key: gotKey, name: gotName, ...gotRestField }) => (
                      <div key={gotKey} style={{ 
                        marginBottom: 10, 
                        padding: '12px 14px', 
                        border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e0e0e0', 
                        borderRadius: 8,
                        background: theme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#fafafa',
                        transition: 'all 0.2s ease'
                      }}>
                        <Form.Item shouldUpdate noStyle>
                          {({ getFieldValue }) => {
                            const projectData = getFieldValue(['got_online_projects', gotName]);
                            const isSaved = savedGotOnlineRecords.has(gotName);
                            
                            if (isSaved) {
                              // 预览模式
                              const projectNameRaw = projectData?.project_name || '-';
                              const projectNameValue = projectNameRaw !== '-' && projectNameRaw.length > 10 
                                ? projectNameRaw.substring(0, 10) + '...' 
                                : projectNameRaw;
                              const tagValue = projectData?.tag || '-';
                              const urlValue = projectData?.url || '';
                              
                              return (
                                <Space direction="vertical" style={{ width: '100%' }} size="small">
                                  <Row gutter={12}>
                                    <Col span={8}>
                                      <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ 
                                          fontSize: 12, 
                                          color: theme === 'dark' ? '#a0a0a0' : '#8c8c8c', 
                                          marginBottom: 4,
                                          fontWeight: 500
                                        }}>项目名称</span>
                                        <span style={{ 
                                          fontSize: 13, 
                                          color: theme === 'dark' ? '#d4d4d4' : '#595959',
                                          fontWeight: 500
                                        }}>{projectNameValue}</span>
                                      </div>
                                    </Col>
                                    <Col span={8}>
                                      <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ 
                                          fontSize: 12, 
                                          color: theme === 'dark' ? '#a0a0a0' : '#8c8c8c', 
                                          marginBottom: 4,
                                          fontWeight: 500
                                        }}>负责人</span>
                                        <span style={{ 
                                          fontSize: 13, 
                                          color: theme === 'dark' ? '#d4d4d4' : '#595959',
                                          fontWeight: 500
                                        }}>{tagValue}</span>
                                      </div>
                                    </Col>
                                    <Col span={8}>
                                      <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ 
                                          fontSize: 12, 
                                          color: theme === 'dark' ? '#a0a0a0' : '#8c8c8c', 
                                          marginBottom: 4,
                                          fontWeight: 500
                                        }}>URL</span>
                                        {urlValue ? (
                                          <a 
                                            href={urlValue} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            style={{ 
                                              fontSize: 13, 
                                              color: theme === 'dark' ? '#667eea' : '#1890ff',
                                              textDecoration: 'none',
                                              wordBreak: 'break-all'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                                          >
                                            {urlValue}
                                          </a>
                                        ) : (
                                          <span style={{ fontSize: 13, color: theme === 'dark' ? '#a0a0a0' : '#8c8c8c' }}>-</span>
                                        )}
                                      </div>
                                    </Col>
                                  </Row>
                                  <div style={{ textAlign: 'right', marginTop: 4 }}>
                                    {canEdit() && (
                                      <Space size="small">
                                          <Button
                                            type="link"
                                            size="small"
                                            icon={<EditOutlined />}
                                            onClick={() => {
                                              setSavedGotOnlineRecords(prev => {
                                                const newSet = new Set(prev);
                                                newSet.delete(gotName);
                                                return newSet;
                                              });
                                            }}
                                            style={{ padding: 0, fontSize: 12, color: theme === 'dark' ? '#667eea' : '#1890ff' }}
                                          />
                                        <Button
                                          type="link"
                                          danger
                                          size="small"
                                          icon={<MinusCircleOutlined />}
                                          onClick={() => {
                                            const projectInfo = projectNameValue !== '-' ? projectNameValue : '项目';
                                            Modal.confirm({
                                              title: '确认删除',
                                              content: `确定要删除GOT Online项目"${projectInfo}"吗？`,
                                              okText: '确定',
                                              cancelText: '取消',
                                              onOk: () => {
                                                setSavedGotOnlineRecords(prev => {
                                                  const newSet = new Set(prev);
                                                  newSet.delete(gotName);
                                                  return newSet;
                                                });
                                                removeGot(gotName);
                                              }
                                            });
                                          }}
                                          style={{ padding: 0, fontSize: 12 }}
                                        />
                                      </Space>
                                    )}
                                  </div>
                                </Space>
                              );
                            }
                            
                            // 编辑模式
                            return (
                              <Space direction="vertical" style={{ width: '100%' }} size="small">
                                <Row gutter={12}>
                                  <Col span={8}>
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
                                  <Col span={8}>
                                    <Form.Item
                                      {...gotRestField}
                                      name={[gotName, 'tag']}
                                      label="负责人"
                                      style={{ marginBottom: 0 }}
                                    >
                                      <Input placeholder="负责人" variant="borderless" disabled={!canEdit()} />
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
                                </Row>
                                <div style={{ textAlign: 'right', marginTop: 4 }}>
                                  {canEdit() && (
                                    <Space size="small">
                                      <Button
                                        type="link"
                                        size="small"
                                        icon={<SaveOutlined />}
                                        onClick={async () => {
                                          try {
                                            const projectValues = form.getFieldValue(['got_online_projects', gotName]);
                                            if (!projectValues?.project_name || !projectValues?.url) {
                                              message.warning('请填写完整的项目信息');
                                              return;
                                            }
                                            setSavedGotOnlineRecords(prev => new Set(prev).add(gotName));
                                            message.success('项目已保存');
                                          } catch (error) {
                                            message.error('保存失败');
                                          }
                                        }}
                                        style={{ padding: 0, fontSize: 12 }}
                                      />
                                      <Button
                                        type="link"
                                        danger
                                        size="small"
                                        icon={<MinusCircleOutlined />}
                                        onClick={() => {
                                          const projectValues = form.getFieldValue(['got_online_projects', gotName]);
                                          const projectInfo = projectValues?.project_name || '项目';
                                          Modal.confirm({
                                            title: '确认删除',
                                            content: `确定要删除GOT Online项目"${projectInfo}"吗？`,
                                            okText: '确定',
                                            cancelText: '取消',
                                            onOk: () => removeGot(gotName)
                                          });
                                        }}
                                        style={{ padding: 0, fontSize: 12 }}
                                      />
                                    </Space>
                                  )}
                                </div>
                              </Space>
                            );
                          }}
                        </Form.Item>
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
                      />
                    </Form.Item>
                  </>
                )}
              </Form.List>
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

        {/* 数据导入Modal */}
        <Modal
          title="导入客户数据"
          open={importModalVisible}
          onCancel={() => {
            setImportModalVisible(false);
            setImportProgress(0);
            setImporting(false);
          }}
          footer={null}
          width={600}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <p style={{ 
                marginBottom: 8, 
                color: theme === 'dark' ? '#bfbfbf' : '#595959',
                padding: '8px 12px',
                background: theme === 'dark' ? 'rgba(64, 169, 255, 0.1)' : '#e6f7ff',
                borderRadius: 4,
                border: theme === 'dark' ? '1px solid rgba(64, 169, 255, 0.3)' : '1px solid #91d5ff'
              }}>
                <strong>注意：</strong>导入的数据将作为<strong>新客户记录</strong>添加，<strong>不会覆盖</strong>现有数据。
              </p>
              <p style={{ marginBottom: 8, color: theme === 'dark' ? '#bfbfbf' : '#595959' }}>
                支持 CSV 或 XLSX 格式文件导入。请确保文件包含以下列（列名支持中英文）：
              </p>
              <ul style={{ 
                marginLeft: 20, 
                color: theme === 'dark' ? '#a0a0a0' : '#8c8c8c',
                fontSize: 13,
                lineHeight: '1.8'
              }}>
                <li><strong>公司名称</strong>（必填）</li>
                <li>联系人、职位</li>
                <li>城市（多个城市用逗号分隔）</li>
                <li>客户来源</li>
                <li>合作进度</li>
                <li>负责人</li>
                <li>分类、状态</li>
                <li>客户评级（0-3）</li>
                <li>标签（多个标签用逗号分隔）</li>
                <li>服务到期时间</li>
                <li>是否有小游戏、游戏名称、游戏平台、游戏URL</li>
                <li>Pipeline状态、GPM状态</li>
                <li>备注</li>
              </ul>
            </div>
            <Upload
              accept=".csv,.xlsx,.xls"
              beforeUpload={(file) => {
                handleFileImport(file);
                return false; // 阻止自动上传
              }}
              showUploadList={false}
              disabled={importing}
            >
              <Button 
                type="primary" 
                icon={<UploadOutlined />} 
                block
                loading={importing}
                disabled={importing}
              >
                选择文件
              </Button>
            </Upload>
            {importing && (
              <div>
                <Progress percent={importProgress} status="active" />
                <p style={{ 
                  textAlign: 'center', 
                  marginTop: 8,
                  color: theme === 'dark' ? '#a0a0a0' : '#8c8c8c',
                  fontSize: 12
                }}>
                  正在导入数据...
                </p>
              </div>
            )}
          </Space>
        </Modal>

      </Content>
    </Layout>
  );
}

