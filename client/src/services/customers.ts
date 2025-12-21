import api from './api';
import { localDb, Customer, NextStepHistory } from '../db/localDb';
import { isOnline } from './sync';

// 获取所有客户记录（只返回当前用户负责的客户）
export async function getCustomers(filters?: { category?: string; search?: string }): Promise<Customer[]> {
  // 获取当前用户ID
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const currentUserId = currentUser?.id;

  // 先从本地获取（只获取当前用户负责的客户）
  let customers = await localDb.customers.toArray();
  customers = customers.filter(c => c.owner_id === currentUserId);

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

  // 如果在线，尝试从服务器获取最新数据
  if (isOnline()) {
    try {
      const response = await api.get('/customers', { params: filters });
      const serverCustomers = response.data.customers;
      
      // 更新本地数据库（只保存当前用户的客户）
      for (const customer of serverCustomers) {
        if (customer.owner_id === currentUserId) {
          await localDb.customers.put({
            ...customer,
            isLocal: false
          });
        }
      }

      // 返回服务器数据（更准确）
      return serverCustomers;
    } catch (error) {
      console.error('从服务器获取数据失败，使用本地数据:', error);
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

  // 先保存到本地（使用负数ID作为临时ID）
  const localId = await localDb.customers.add({
    ...newCustomer,
    id: -Date.now() // 临时负数ID
  } as Customer);

  // 如果在线，尝试同步到服务器
  if (isOnline()) {
    try {
      const response = await api.post('/customers', customer);
      const serverCustomer = response.data.customer;
      
      // 更新本地记录，确保包含所有字段
      await localDb.customers.update(localId, {
        ...serverCustomer,
        synced_at: new Date().toISOString(),
        isLocal: false
      });

      // 返回更新后的本地记录，确保数据完整
      const updatedCustomer = await localDb.customers.get(serverCustomer.id) || serverCustomer;
      return updatedCustomer as Customer;
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

  // 如果在线且不是负数ID（负数ID表示本地创建但未同步），尝试同步到服务器
  if (isOnline() && id > 0) {
    try {
      const response = await api.put(`/customers/${id}`, customer);
      const serverCustomer = response.data.customer;
      
      console.log('updateCustomer - 服务器返回的 service_expiry_date:', serverCustomer.service_expiry_date);
      
      // 更新本地记录
      await localDb.customers.update(id, {
        ...serverCustomer,
        synced_at: new Date().toISOString(),
        isLocal: false
      });
      
      // 再次验证
      const finalUpdated = await localDb.customers.get(id);
      console.log('updateCustomer - 最终本地数据库的 service_expiry_date:', finalUpdated?.service_expiry_date);

      return serverCustomer;
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

