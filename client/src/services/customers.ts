import api from './api';
import { localDb, Customer, NextStepHistory } from '../db/localDb';
import { isOnline } from './sync';
import { createCustomerInSupabase, updateCustomerInSupabase, getSupabaseClient, getCustomersFromSupabase } from './supabase';

// 获取所有客户记录（只返回当前用户负责的客户）
export async function getCustomers(filters?: { category?: string; search?: string }): Promise<Customer[]> {
  // 获取当前用户ID
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const currentUserId = currentUser?.id;

  // 检查是否为admin用户
  const isAdmin = currentUser?.role === 'admin';
  
  // 先从本地获取
  let customers = await localDb.customers.toArray();
  
  // admin用户可以看到所有客户，普通用户只能看到自己负责的客户
  if (!isAdmin) {
    customers = customers.filter(c => c.owner_id === currentUserId);
  }

  // 应用筛选
  if (filters) {
    if (filters.category) {
      customers = customers.filter(c => c.category === filters.category);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      customers = customers.filter(c =>
        c.customer_name?.toLowerCase().includes(searchLower) ||
        c.company_name?.toLowerCase().includes(searchLower) ||
        c.contact_person?.toLowerCase().includes(searchLower) ||
        c.name?.toLowerCase().includes(searchLower)
      );
    }
  }

  // 如果在线，优先从Supabase获取最新数据
  if (isOnline()) {
    try {
      // 优先尝试从Supabase获取
      try {
        console.log('getCustomers - 从Supabase获取数据，isAdmin:', isAdmin, 'currentUserId:', currentUserId, 'filters:', filters);
        const supabaseCustomers = await getCustomersFromSupabase(filters);
        console.log('getCustomers - Supabase返回数据数量:', supabaseCustomers?.length || 0);
        
        if (supabaseCustomers && Array.isArray(supabaseCustomers) && supabaseCustomers.length > 0) {
          // 同步到本地数据库
          let savedCount = 0;
          for (const customer of supabaseCustomers) {
            if (isAdmin || customer.owner_id === currentUserId) {
              await localDb.customers.put({
                ...customer,
                isLocal: false
              } as Customer);
              savedCount++;
            }
          }
          console.log('getCustomers - 从Supabase保存到本地数据库数量:', savedCount);
          
          // 应用筛选（Supabase已经做了部分筛选，但需要确保完全匹配）
          let filteredCustomers = supabaseCustomers;
          if (!isAdmin) {
            filteredCustomers = filteredCustomers.filter(c => c.owner_id === currentUserId);
          }
          
          return filteredCustomers as Customer[];
        }
      } catch (supabaseError) {
        console.warn('从Supabase获取数据失败，尝试从后端API获取:', supabaseError);
      }
      
      // 如果Supabase失败，不再回退到后端API（因为后端API也可能失败）
      // 直接使用本地数据
      console.warn('从Supabase获取数据失败，使用本地数据');
    } catch (error) {
      console.error('获取数据失败，使用本地数据:', error);
    }
  }

  return customers.sort((a, b) => {
    const dateA = new Date(a.updated_at || 0).getTime();
    const dateB = new Date(b.updated_at || 0).getTime();
    return dateB - dateA;
  });
}

// 创建客户记录（自动分配当前用户为负责人）
export async function createCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
  // 获取当前用户ID
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const currentUserId = currentUser?.id;

  const newCustomer: Customer = {
    ...customer,
    owner_id: currentUserId, // 自动分配当前用户为负责人
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    synced_at: '',
    isLocal: true
  };

  // 先保存到本地（使用负数ID作为临时ID，确保唯一性）
  // 使用更精确的时间戳和随机数确保唯一性
  const tempId = -(Date.now() + Math.random() * 1000);
  let localId: number;
  
  try {
    localId = await localDb.customers.add({
      ...newCustomer,
      id: tempId // 临时负数ID
    } as Customer);
  } catch (error: any) {
    // 如果ID冲突，尝试使用新的ID
    if (error.name === 'ConstraintError' || error.message?.includes('Key already exists')) {
      const newTempId = -(Date.now() + Math.random() * 10000);
      localId = await localDb.customers.add({
        ...newCustomer,
        id: newTempId
      } as Customer);
    } else {
      throw error;
    }
  }

  // 如果在线，尝试同步到服务器和Supabase
  if (isOnline()) {
    try {
      // 优先尝试保存到Supabase
      try {
        console.log('🔄 开始保存到Supabase，数据:', newCustomer);
        const supabaseCustomer = await createCustomerInSupabase(newCustomer);
        console.log('✅ 已保存到Supabase，返回数据:', supabaseCustomer);
        
        // 删除旧的临时记录，添加新的同步记录
        await localDb.customers.delete(localId);
        await localDb.customers.put({
          ...supabaseCustomer,
          synced_at: new Date().toISOString(),
          isLocal: false
        } as Customer);
        
        // 不再同步到后端API，只使用Supabase
        // 如果需要同步到后端API，可以通过自动同步功能完成
        
        const updatedCustomer = await localDb.customers.get(supabaseCustomer.id) || supabaseCustomer;
        return updatedCustomer as Customer;
      } catch (supabaseError: any) {
        console.error('❌ 保存到Supabase失败:', supabaseError);
        console.error('错误详情:', {
          message: supabaseError.message,
          code: supabaseError.code,
          details: supabaseError.details,
          hint: supabaseError.hint
        });
        // Supabase失败时，不尝试后端API（因为后端API也可能失败）
        // 保留本地记录，标记为未同步，等待后续自动同步
        console.warn('Supabase保存失败，记录已保存到本地，等待后续自动同步');
        
        // 返回本地记录，标记为未同步
        const localCustomer = await localDb.customers.get(localId) as Customer;
        return localCustomer;
      }
    } catch (error) {
      console.error('创建失败，已保存到本地:', error);
      // 如果服务器创建失败，返回本地记录
      const localCustomer = await localDb.customers.get(localId) as Customer;
      return localCustomer;
    }
  }

  return await localDb.customers.get(localId) as Customer;
}

// 更新客户记录
export async function updateCustomer(id: number, customer: Partial<Customer>): Promise<Customer> {
  console.log('updateCustomer - 接收到的 customer.service_expiry_date:', customer.service_expiry_date);
  console.log('updateCustomer - 完整的 customer 数据:', JSON.stringify(customer, null, 2));
  
  const updatedCustomer = {
    ...customer,
    updated_at: new Date().toISOString()
  };

  console.log('updateCustomer - 准备更新本地数据库，service_expiry_date:', updatedCustomer.service_expiry_date);

  // 先更新本地
  await localDb.customers.update(id, updatedCustomer);
  
  // 验证本地更新是否成功
  const localUpdated = await localDb.customers.get(id);
  console.log('updateCustomer - 本地更新后的 service_expiry_date:', localUpdated?.service_expiry_date);

  // 如果在线且不是负数ID（负数ID表示本地创建但未同步），尝试同步到Supabase和服务器
  if (isOnline() && id > 0) {
    try {
      // 优先尝试更新Supabase
      try {
        console.log('🔄 开始更新到Supabase，ID:', id, '数据:', updatedCustomer);
        const supabaseCustomer = await updateCustomerInSupabase(id, updatedCustomer);
        console.log('✅ 已更新到Supabase，返回数据:', supabaseCustomer);
        
        // 更新本地记录
        await localDb.customers.update(id, {
          ...supabaseCustomer,
          synced_at: new Date().toISOString(),
          isLocal: false
        });
        
        // 不再同步到后端API，只使用Supabase
        // 如果需要同步到后端API，可以通过自动同步功能完成
        
        const finalUpdated = await localDb.customers.get(id);
        return finalUpdated as Customer || supabaseCustomer as Customer;
      } catch (supabaseError: any) {
        console.error('❌ 更新到Supabase失败:', supabaseError);
        console.error('错误详情:', {
          message: supabaseError.message,
          code: supabaseError.code,
          details: supabaseError.details
        });
        // Supabase失败时，不尝试后端API（因为后端API也可能失败）
        // 保留本地更新，标记为未同步，等待后续自动同步
        console.warn('Supabase更新失败，记录已更新到本地，等待后续自动同步');
        
        // 返回本地更新后的记录
        const localUpdated = await localDb.customers.get(id);
        return localUpdated as Customer;
      }
    } catch (error) {
      console.error('更新失败，已保存到本地:', error);
      // 标记为未同步
      await localDb.customers.update(id, {
        synced_at: '',
        isLocal: true
      });
    }
  } else if (id < 0) {
    // 负数ID的记录标记为未同步
    await localDb.customers.update(id, {
      synced_at: '',
      isLocal: true
    });
  }

  const finalLocal = await localDb.customers.get(id);
  console.log('updateCustomer - 最终返回的 service_expiry_date:', finalLocal?.service_expiry_date);
  return finalLocal as Customer;
}

// 删除客户记录
export async function deleteCustomer(id: number): Promise<void> {
  // 先删除本地
  await localDb.customers.delete(id);

  // 如果在线且不是负数ID，尝试从服务器删除
  if (isOnline() && id > 0) {
    try {
      await api.delete(`/customers/${id}`);
    } catch (error) {
      console.error('删除失败，已从本地删除:', error);
    }
  }
}

// 获取NextStep历史记录
export async function getNextStepHistory(customerId: number): Promise<NextStepHistory[]> {
  if (isOnline()) {
    try {
      const response = await api.get(`/customers/${customerId}/next-step-history`);
      return response.data.history || [];
    } catch (error) {
      console.error('获取NextStep历史记录失败:', error);
      return [];
    }
  }
  return [];
}

// 创建NextStep历史记录
export async function createNextStepHistory(customerId: number, nextStep: string): Promise<NextStepHistory> {
  if (isOnline()) {
    try {
      const response = await api.post(`/customers/${customerId}/next-step-history`, { next_step: nextStep });
      console.log('创建历史记录响应:', response.data);
      // 后端返回的是 { history: {...} }，直接返回history对象
      return response.data.history;
    } catch (error: any) {
      console.error('创建NextStep历史记录失败:', error);
      console.error('错误详情:', error.response?.data || error.message);
      throw error;
    }
  }
  throw new Error('离线状态下无法创建NextStep历史记录');
}

