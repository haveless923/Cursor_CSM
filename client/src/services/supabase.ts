// Supabase客户端初始化
declare global {
  interface Window {
    supabase: any;
  }
}

// Supabase客户端实例（单例）
let supabaseClient: any = null;

// 获取Supabase客户端
export function getSupabaseClient() {
  if (!window.supabase) {
    throw new Error('Supabase客户端未初始化，请确保index.html中已加载Supabase脚本');
  }
  
  // 如果客户端已创建，直接返回
  if (supabaseClient) {
    return supabaseClient;
  }
  
  // 创建客户端实例
  const supabaseUrl = 'https://jpaurpkibrjwqthrcexc.supabase.co';
  const supabaseKey = 'sb_publishable_eJMFki07-yqFP8Hv2kdu9g_7lrSRdBB';
  
  if (!window.supabase.createClient) {
    throw new Error('Supabase.createClient不存在，请检查Supabase脚本版本');
  }
  
  try {
    supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
    return supabaseClient;
  } catch (error: any) {
    throw new Error(`创建Supabase客户端失败: ${error.message}`);
  }
}

// 类型定义
export interface SupabaseCustomer {
  id?: number;
  customer_name?: string;
  company_name?: string;
  city?: string | string[];
  customer_source?: string;
  customer_source_other?: string;
  custom_tags?: string | string[];
  due_date?: string;
  contact_person?: string;
  position?: string | string[];
  name?: string;
  financial_capacity?: string;
  customer_rating?: number;
  status?: string;
  category?: string;
  follow_up_action?: string;
  requirement_list?: string | Array<{ description: string; ticket_url: string; status: string }>;
  next_step?: string;
  got_online_projects?: string | Array<{ project_name: string; url: string; tag: string }>;
  pipeline_status?: string;
  service_expiry_date?: string;
  has_mini_game?: boolean;
  mini_game_name?: string;
  mini_game_platforms?: string | string[];
  mini_game_url?: string;
  gpm_status?: string;
  projects?: string | Array<{ project: string; links: string[] }>;
  owner_id?: number;
  project_link?: string;
  notes?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  synced_at?: string;
  isLocal?: boolean;
}

export interface SupabaseUser {
  id: number;
  username: string;
  role: 'admin' | 'member';
  password?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseNextStepHistory {
  id?: number;
  customer_id: number;
  next_step: string;
  created_by?: number;
  username?: string;
  created_at?: string;
}

// ==================== 客户相关操作 ====================

/**
 * 获取客户列表
 */
export async function getCustomersFromSupabase(filters?: { 
  category?: string; 
  search?: string;
  owner_id?: number;
}): Promise<SupabaseCustomer[]> {
  const supabase = getSupabaseClient();
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isAdmin = currentUser?.role === 'admin';
  
  try {
    let query = supabase
      .from('customers')
      .select('*');
    
    // 如果不是admin，只获取自己负责的客户
    if (!isAdmin && currentUser?.id) {
      query = query.eq('owner_id', currentUser.id);
    }
    
    // 应用筛选
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    
    const { data, error } = await query.order('updated_at', { ascending: false });
    
    if (error) {
      console.error('从Supabase获取客户失败:', error);
      throw error;
    }
    
    // 应用搜索筛选（如果提供）
    let customers = data || [];
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      customers = customers.filter((c: SupabaseCustomer) =>
        c.customer_name?.toLowerCase().includes(searchLower) ||
        c.company_name?.toLowerCase().includes(searchLower) ||
        c.contact_person?.toLowerCase().includes(searchLower) ||
        c.name?.toLowerCase().includes(searchLower)
      );
    }
    
    return customers;
  } catch (error) {
    console.error('getCustomersFromSupabase错误:', error);
    return [];
  }
}

/**
 * 创建客户
 */
export async function createCustomerInSupabase(customer: Omit<SupabaseCustomer, 'id' | 'created_at' | 'updated_at'>): Promise<SupabaseCustomer> {
  const supabase = getSupabaseClient();
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  
  try {
    // 准备数据，过滤掉Supabase表中不存在的字段
    const customerData: any = {
      customer_name: customer.customer_name,
      company_name: customer.company_name,
      city: Array.isArray(customer.city) ? JSON.stringify(customer.city) : customer.city,
      customer_source: customer.customer_source,
      customer_source_other: customer.customer_source_other,
      custom_tags: Array.isArray(customer.custom_tags) ? JSON.stringify(customer.custom_tags) : customer.custom_tags,
      due_date: customer.due_date,
      contact_person: customer.contact_person,
      position: Array.isArray(customer.position) ? JSON.stringify(customer.position) : customer.position,
      name: customer.name,
      financial_capacity: customer.financial_capacity,
      customer_rating: customer.customer_rating,
      status: customer.status,
      category: customer.category,
      follow_up_action: customer.follow_up_action,
      next_step: customer.next_step,
      got_online_projects: typeof customer.got_online_projects === 'string' 
        ? customer.got_online_projects 
        : JSON.stringify(customer.got_online_projects),
      pipeline_status: customer.pipeline_status,
      service_expiry_date: customer.service_expiry_date,
      has_mini_game: customer.has_mini_game,
      mini_game_name: customer.mini_game_name,
      mini_game_platforms: Array.isArray(customer.mini_game_platforms) 
        ? JSON.stringify(customer.mini_game_platforms) 
        : customer.mini_game_platforms,
      mini_game_url: customer.mini_game_url,
      gpm_status: customer.gpm_status,
      projects: typeof customer.projects === 'string' 
        ? customer.projects 
        : JSON.stringify(customer.projects),
      requirement_list: typeof customer.requirement_list === 'string' 
        ? customer.requirement_list 
        : JSON.stringify(customer.requirement_list),
      owner_id: customer.owner_id || currentUser?.id,
      project_link: customer.project_link,
      notes: customer.notes,
      created_by: currentUser?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // 移除undefined、null字段，以及Supabase表中不存在的字段（如contacts, follow_up_records等）
    const allowedFields = [
      'customer_name', 'company_name', 'city', 'customer_source', 'customer_source_other',
      'custom_tags', 'due_date', 'contact_person', 'position', 'name', 'financial_capacity',
      'customer_rating', 'status', 'category', 'follow_up_action', 'next_step',
      'got_online_projects', 'pipeline_status', 'service_expiry_date', 'has_mini_game',
      'mini_game_name', 'mini_game_platforms', 'mini_game_url', 'gpm_status', 'projects',
      'requirement_list', 'owner_id', 'project_link', 'notes', 'created_by', 'created_at', 'updated_at'
    ];
    
    Object.keys(customerData).forEach(key => {
      if (!allowedFields.includes(key) || customerData[key] === undefined || customerData[key] === null) {
        delete customerData[key];
      }
    });
    
    console.log('📤 准备插入到Supabase，数据:', customerData);
    
    const { data, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ 在Supabase创建客户失败:', error);
      console.error('错误代码:', error.code);
      console.error('错误消息:', error.message);
      console.error('错误详情:', error.details);
      console.error('错误提示:', error.hint);
      
      // 如果是表不存在的错误，给出更友好的提示
      if (error.code === 'PGRST116' || error.code === '42P01') {
        throw new Error('customers表不存在，请在Supabase Dashboard中执行 supabase_schema_simple.sql 创建表');
      }
      
      throw error;
    }
    
    console.log('✅ Supabase插入成功，返回数据:', data);
    return data;
  } catch (error) {
    console.error('createCustomerInSupabase错误:', error);
    throw error;
  }
}

/**
 * 更新客户
 */
export async function updateCustomerInSupabase(
  id: number, 
  customer: Partial<SupabaseCustomer>
): Promise<SupabaseCustomer> {
  const supabase = getSupabaseClient();
  
  try {
    // 准备更新数据，只包含Supabase表中存在的字段，过滤掉不存在的字段（如contacts, follow_up_records等）
    const updateData: any = {};
    const allowedFields = [
      'customer_name', 'company_name', 'city', 'customer_source', 'customer_source_other',
      'custom_tags', 'due_date', 'contact_person', 'position', 'name', 'financial_capacity',
      'customer_rating', 'status', 'category', 'follow_up_action', 'next_step',
      'got_online_projects', 'pipeline_status', 'service_expiry_date', 'has_mini_game',
      'mini_game_name', 'mini_game_platforms', 'mini_game_url', 'gpm_status', 'projects',
      'requirement_list', 'owner_id', 'project_link', 'notes', 'updated_at'
    ];
    
    // 只添加存在的字段
    if (customer.customer_name !== undefined) updateData.customer_name = customer.customer_name;
    if (customer.company_name !== undefined) updateData.company_name = customer.company_name;
    if (customer.city !== undefined) updateData.city = Array.isArray(customer.city) ? JSON.stringify(customer.city) : customer.city;
    if (customer.customer_source !== undefined) updateData.customer_source = customer.customer_source;
    if (customer.customer_source_other !== undefined) updateData.customer_source_other = customer.customer_source_other;
    if (customer.custom_tags !== undefined) updateData.custom_tags = Array.isArray(customer.custom_tags) ? JSON.stringify(customer.custom_tags) : customer.custom_tags;
    if (customer.due_date !== undefined) updateData.due_date = customer.due_date;
    if (customer.contact_person !== undefined) updateData.contact_person = customer.contact_person;
    if (customer.position !== undefined) updateData.position = Array.isArray(customer.position) ? JSON.stringify(customer.position) : customer.position;
    if (customer.name !== undefined) updateData.name = customer.name;
    if (customer.financial_capacity !== undefined) updateData.financial_capacity = customer.financial_capacity;
    if (customer.customer_rating !== undefined) updateData.customer_rating = customer.customer_rating;
    if (customer.status !== undefined) updateData.status = customer.status;
    if (customer.category !== undefined) updateData.category = customer.category;
    if (customer.follow_up_action !== undefined) updateData.follow_up_action = customer.follow_up_action;
    if (customer.next_step !== undefined) updateData.next_step = customer.next_step;
    if (customer.got_online_projects !== undefined) updateData.got_online_projects = typeof customer.got_online_projects === 'string' ? customer.got_online_projects : JSON.stringify(customer.got_online_projects);
    if (customer.pipeline_status !== undefined) updateData.pipeline_status = customer.pipeline_status;
    if (customer.service_expiry_date !== undefined) updateData.service_expiry_date = customer.service_expiry_date;
    if (customer.has_mini_game !== undefined) updateData.has_mini_game = customer.has_mini_game;
    if (customer.mini_game_name !== undefined) updateData.mini_game_name = customer.mini_game_name;
    if (customer.mini_game_platforms !== undefined) updateData.mini_game_platforms = Array.isArray(customer.mini_game_platforms) ? JSON.stringify(customer.mini_game_platforms) : customer.mini_game_platforms;
    if (customer.mini_game_url !== undefined) updateData.mini_game_url = customer.mini_game_url;
    if (customer.gpm_status !== undefined) updateData.gpm_status = customer.gpm_status;
    if (customer.projects !== undefined) updateData.projects = typeof customer.projects === 'string' ? customer.projects : JSON.stringify(customer.projects);
    if (customer.requirement_list !== undefined) updateData.requirement_list = typeof customer.requirement_list === 'string' ? customer.requirement_list : JSON.stringify(customer.requirement_list);
    if (customer.owner_id !== undefined) updateData.owner_id = customer.owner_id;
    if (customer.project_link !== undefined) updateData.project_link = customer.project_link;
    if (customer.notes !== undefined) updateData.notes = customer.notes;
    
    updateData.updated_at = new Date().toISOString();
    
    // 移除null和空字符串字段
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === null || updateData[key] === '') {
        delete updateData[key];
      }
    });
    
    console.log('📤 准备更新Supabase，ID:', id, '数据:', updateData);
    
    const { data, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ 在Supabase更新客户失败:', error);
      console.error('错误代码:', error.code);
      console.error('错误消息:', error.message);
      console.error('错误详情:', error.details);
      
      // 如果是表不存在的错误，给出更友好的提示
      if (error.code === 'PGRST116' || error.code === '42P01') {
        throw new Error('customers表不存在，请在Supabase Dashboard中执行 supabase_schema_simple.sql 创建表');
      }
      
      throw error;
    }
    
    console.log('✅ Supabase更新成功，返回数据:', data);
    return data;
  } catch (error) {
    console.error('updateCustomerInSupabase错误:', error);
    throw error;
  }
}

/**
 * 删除客户
 */
export async function deleteCustomerFromSupabase(id: number): Promise<void> {
  const supabase = getSupabaseClient();
  
  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('在Supabase删除客户失败:', error);
      throw error;
    }
  } catch (error) {
    console.error('deleteCustomerFromSupabase错误:', error);
    throw error;
  }
}

// ==================== 用户相关操作 ====================

/**
 * 用户登录（使用Supabase Auth）
 */
export async function loginWithSupabase(username: string, password: string) {
  const supabase = getSupabaseClient();
  
  try {
    // 首先尝试使用 RPC 函数（最简单可靠）
    const { data: rpcData, error: rpcError } = await supabase.rpc('verify_login', {
      p_username: username,
      p_password: password
    });
    
    if (!rpcError && rpcData && rpcData.success) {
      return {
        user: rpcData.user,
        token: rpcData.token || ''
      };
    }
    
    // 如果 RPC 不存在，尝试直接查询（需要禁用 RLS 或配置允许查询的策略）
    console.warn('RPC 函数不存在或失败，尝试直接查询用户表');
    
    // 使用 maybeSingle() 而不是 single()，避免 0 行时报错
    const { data: users, error: queryError } = await supabase
      .from('users')
      .select('id, username, role')
      .eq('username', username)
      .maybeSingle(); // 使用 maybeSingle 避免 PGRST116 错误
    
    if (queryError) {
      console.error('查询用户失败:', queryError);
      // 如果是 RLS 错误（406 或 PGRST301），给出明确的修复提示
      if (queryError.code === 'PGRST301' || 
          queryError.status === 406 ||
          queryError.message?.includes('row-level security') ||
          queryError.message?.includes('RLS')) {
        throw new Error('数据库权限配置错误。请确保已执行：ALTER TABLE users DISABLE ROW LEVEL SECURITY;');
      }
      throw new Error('查询用户时发生错误：' + (queryError.message || queryError.code));
    }
    
    if (!users) {
      // 检查表中是否有任何用户数据
      const { data: allUsers } = await supabase
        .from('users')
        .select('username')
        .limit(5);
      
      if (!allUsers || allUsers.length === 0) {
        throw new Error('用户表中没有数据。请在 Supabase SQL Editor 中执行 创建测试用户.sql 来创建用户。');
      } else {
        const usernames = allUsers.map(u => u.username).join(', ');
        throw new Error(`用户名 "${username}" 不存在。可用的用户名：${usernames}`);
      }
    }
    
    // 注意：这里不验证密码，因为前端无法安全地验证 bcrypt 密码
    // 生产环境必须使用 RPC 函数或 Edge Function 来验证密码
    console.warn('⚠️ 警告：当前登录方式未验证密码，仅用于测试！');
    
    // 生成简单的 token
    const token = btoa(JSON.stringify({ 
      userId: users.id, 
      username: users.username, 
      role: users.role 
    }));
    
    return {
      user: {
        id: users.id,
        username: users.username,
        role: users.role,
      },
      token: token
    };
  } catch (error: any) {
    console.error('Supabase登录失败:', error);
    throw new Error(error.message || '登录失败，请检查用户名和密码');
  }
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUserFromSupabase() {
  const supabase = getSupabaseClient();
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  
  if (!currentUser?.id) {
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, role')
      .eq('id', currentUser.id)
      .single();
    
    if (error) {
      console.error('从Supabase获取用户信息失败:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('getCurrentUserFromSupabase错误:', error);
    return null;
  }
}

// ==================== 历史记录相关操作 ====================

/**
 * 获取客户的历史记录
 */
export async function getNextStepHistoryFromSupabase(customerId: number): Promise<SupabaseNextStepHistory[]> {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('next_step_history')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('从Supabase获取历史记录失败:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('getNextStepHistoryFromSupabase错误:', error);
    return [];
  }
}

/**
 * 创建历史记录
 */
export async function createNextStepHistoryInSupabase(
  history: Omit<SupabaseNextStepHistory, 'id' | 'created_at'>
): Promise<SupabaseNextStepHistory> {
  const supabase = getSupabaseClient();
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  
  try {
    const historyData = {
      ...history,
      created_by: history.created_by || currentUser?.id,
      created_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('next_step_history')
      .insert([historyData])
      .select()
      .single();
    
    if (error) {
      console.error('在Supabase创建历史记录失败:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('createNextStepHistoryInSupabase错误:', error);
    throw error;
  }
}

// ==================== 测试连接 ====================

/**
 * 测试Supabase连接
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    // 检查Supabase是否加载
    if (!window.supabase) {
      console.warn('⚠️ Supabase脚本未加载');
      return false;
    }
    
    const supabase = getSupabaseClient();
    
    // 检查客户端是否正确创建
    if (!supabase || typeof supabase.from !== 'function') {
      console.error('❌ Supabase客户端创建失败或格式不正确');
      return false;
    }
    
    const { data, error } = await supabase.from('customers').select('count').limit(1);
    
    if (error) {
      // 表不存在也是连接成功的标志
      if (error.code === 'PGRST116' || error.code === '42P01') {
        console.log('✅ Supabase连接成功！但customers表不存在（这是正常的，如果表还没创建）');
        return true;
      }
      console.error('Supabase连接测试失败:', error);
      return false;
    }
    
    console.log('✅ Supabase连接成功！');
    return true;
  } catch (error: any) {
    console.error('testSupabaseConnection错误:', error);
    console.error('错误详情:', error.message);
    return false;
  }
}

