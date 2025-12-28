/**
 * Supabase客户服务 - 与现有customers.ts兼容的包装器
 * 这个文件提供了与现有customers.ts API兼容的Supabase实现
 */

import { 
  getCustomersFromSupabase, 
  createCustomerInSupabase, 
  updateCustomerInSupabase, 
  deleteCustomerFromSupabase,
  getNextStepHistoryFromSupabase,
  createNextStepHistoryInSupabase,
  SupabaseCustomer,
  SupabaseNextStepHistory
} from './supabase';
import { Customer, NextStepHistory } from '../db/localDb';
import { localDb } from '../db/localDb';
import { isOnline } from './sync';

// 类型转换辅助函数
function convertToCustomer(supabaseCustomer: SupabaseCustomer): Customer {
  return {
    ...supabaseCustomer,
    // 确保类型兼容
  } as Customer;
}

function convertToSupabaseCustomer(customer: Customer): SupabaseCustomer {
  return {
    ...customer,
  } as SupabaseCustomer;
}

/**
 * 获取客户列表（兼容现有API）
 * 优先使用Supabase，如果失败则回退到本地数据库
 */
export async function getCustomers(filters?: { category?: string; search?: string }): Promise<Customer[]> {
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const currentUserId = currentUser?.id;
  const isAdmin = currentUser?.role === 'admin';
  
  // 优先尝试从Supabase获取
  if (isOnline()) {
    try {
      const supabaseCustomers = await getCustomersFromSupabase(filters);
      
      // 同步到本地数据库
      for (const supabaseCustomer of supabaseCustomers) {
        await localDb.customers.put(convertToCustomer(supabaseCustomer));
      }
      
      // 应用本地筛选（如果需要）
      let customers = supabaseCustomers.map(convertToCustomer);
      
      if (!isAdmin) {
        customers = customers.filter(c => c.owner_id === currentUserId);
      }
      
      return customers;
    } catch (error) {
      console.error('从Supabase获取客户失败，使用本地数据:', error);
    }
  }
  
  // 回退到本地数据库
  let customers = await localDb.customers.toArray();
  
  if (!isAdmin) {
    customers = customers.filter(c => c.owner_id === currentUserId);
  }
  
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
  
  return customers.sort((a, b) => {
    const dateA = new Date(a.updated_at || 0).getTime();
    const dateB = new Date(b.updated_at || 0).getTime();
    return dateB - dateA;
  });
}

/**
 * 创建客户（兼容现有API）
 */
export async function createCustomer(customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> {
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  
  // 优先尝试保存到Supabase
  if (isOnline()) {
    try {
      const supabaseCustomer = await createCustomerInSupabase(convertToSupabaseCustomer(customerData as Customer));
      const customer = convertToCustomer(supabaseCustomer);
      
      // 同时保存到本地数据库
      await localDb.customers.put(customer);
      
      return customer;
    } catch (error) {
      console.error('保存到Supabase失败，保存到本地:', error);
    }
  }
  
  // 回退到本地数据库
  const customer: Customer = {
    ...customerData,
    created_by: currentUser?.id,
    owner_id: customerData.owner_id || currentUser?.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    isLocal: true,
  };
  
  const id = await localDb.customers.add(customer);
  return { ...customer, id: id as number };
}

/**
 * 更新客户（兼容现有API）
 */
export async function updateCustomer(id: number, customerData: Partial<Customer>): Promise<Customer> {
  // 优先尝试更新Supabase
  if (isOnline()) {
    try {
      const supabaseCustomer = await updateCustomerInSupabase(id, convertToSupabaseCustomer(customerData as Customer));
      const customer = convertToCustomer(supabaseCustomer);
      
      // 同时更新本地数据库
      await localDb.customers.put(customer);
      
      return customer;
    } catch (error) {
      console.error('更新Supabase失败，更新本地:', error);
    }
  }
  
  // 回退到本地数据库
  const existingCustomer = await localDb.customers.get(id);
  if (!existingCustomer) {
    throw new Error('客户不存在');
  }
  
  const updatedCustomer: Customer = {
    ...existingCustomer,
    ...customerData,
    updated_at: new Date().toISOString(),
    isLocal: true,
  };
  
  await localDb.customers.put(updatedCustomer);
  return updatedCustomer;
}

/**
 * 删除客户（兼容现有API）
 */
export async function deleteCustomer(id: number): Promise<void> {
  // 优先尝试从Supabase删除
  if (isOnline()) {
    try {
      await deleteCustomerFromSupabase(id);
    } catch (error) {
      console.error('从Supabase删除失败，从本地删除:', error);
    }
  }
  
  // 同时从本地数据库删除
  await localDb.customers.delete(id);
}

/**
 * 获取历史记录（兼容现有API）
 */
export async function getNextStepHistory(customerId: number): Promise<NextStepHistory[]> {
  // 优先从Supabase获取
  if (isOnline()) {
    try {
      const supabaseHistory = await getNextStepHistoryFromSupabase(customerId);
      return supabaseHistory as NextStepHistory[];
    } catch (error) {
      console.error('从Supabase获取历史记录失败:', error);
    }
  }
  
  // 回退到本地（如果需要）
  return [];
}

/**
 * 创建历史记录（兼容现有API）
 */
export async function createNextStepHistory(history: Omit<NextStepHistory, 'id' | 'created_at'>): Promise<NextStepHistory> {
  // 优先保存到Supabase
  if (isOnline()) {
    try {
      const supabaseHistory = await createNextStepHistoryInSupabase(history as SupabaseNextStepHistory);
      return supabaseHistory as NextStepHistory;
    } catch (error) {
      console.error('保存到Supabase失败:', error);
      throw error;
    }
  }
  
  throw new Error('离线状态下无法创建历史记录');
}

