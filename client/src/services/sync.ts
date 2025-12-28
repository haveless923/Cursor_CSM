import api from './api';
import { localDb } from '../db/localDb';
import { getCustomersFromSupabase, createCustomerInSupabase, updateCustomerInSupabase } from './supabase';

// 检查网络连接
export function isOnline(): boolean {
  return navigator.onLine;
}

// 同步本地数据到Supabase
export async function syncToServer(): Promise<void> {
  if (!isOnline()) {
    console.log('离线状态，无法同步');
    return;
  }

  try {
    // 获取所有未同步的记录（synced_at为空或isLocal为true，且ID为负数表示本地创建）
    const allRecords = await localDb.customers.toArray();
    const unsyncedRecords = allRecords.filter(
      record => (!record.synced_at || record.isLocal === true) && record.id && record.id < 0
    );

    if (unsyncedRecords.length === 0) {
      console.log('没有需要同步的数据');
      return;
    }

    console.log(`发现 ${unsyncedRecords.length} 条未同步记录，开始同步到Supabase...`);

    // 优先同步到Supabase
    let successCount = 0;
    for (const record of unsyncedRecords) {
      try {
        // 创建到Supabase
        const supabaseCustomer = await createCustomerInSupabase(record);
        
        // 删除旧的临时记录，添加新的同步记录
        if (record.id) {
          await localDb.customers.delete(record.id);
        }
        await localDb.customers.put({
          ...supabaseCustomer,
          synced_at: new Date().toISOString(),
          isLocal: false
        });
        
        successCount++;
      } catch (error) {
        console.error(`同步记录失败 (ID: ${record.id}):`, error);
        // 继续同步其他记录
      }
    }

    if (successCount > 0) {
      console.log(`成功同步 ${successCount} 条记录到Supabase`);
    }

    // 如果有失败的记录，尝试同步到后端API（作为备选）
    const failedRecords = unsyncedRecords.slice(successCount);
    if (failedRecords.length > 0) {
      try {
        const response = await api.post('/customers/sync', {
          records: failedRecords
        });

        // 更新本地记录的同步状态
        for (const mapping of response.data.syncedRecords) {
          if (mapping.localId !== mapping.serverId) {
            const localRecord = await localDb.customers.get(mapping.localId);
            if (localRecord) {
              await localDb.customers.delete(mapping.localId);
              await localDb.customers.put({
                ...localRecord,
                id: mapping.serverId,
                synced_at: new Date().toISOString(),
                isLocal: false
              });
            }
          } else {
            await localDb.customers.update(mapping.serverId, {
              synced_at: new Date().toISOString(),
              isLocal: false
            });
          }
        }
        console.log(`通过后端API同步了 ${failedRecords.length} 条记录`);
      } catch (apiError) {
        console.warn('后端API同步也失败，记录将保留在本地:', apiError);
      }
    }
  } catch (error) {
    console.error('同步失败:', error);
    // 不抛出错误，避免影响自动同步
  }
}

// 从Supabase拉取最新数据
export async function syncFromServer(): Promise<void> {
  if (!isOnline()) {
    console.log('离线状态，无法从Supabase拉取数据');
    return;
  }

  try {
    // 优先从Supabase获取
    try {
      const supabaseCustomers = await getCustomersFromSupabase();
      
      if (supabaseCustomers && supabaseCustomers.length > 0) {
        // 更新本地数据库
        for (const customer of supabaseCustomers) {
          const localCustomer = await localDb.customers.get(customer.id);
          if (!localCustomer || new Date(customer.updated_at || 0) > new Date(localCustomer.updated_at || 0)) {
            await localDb.customers.put({
              ...customer,
              isLocal: false
            });
          }
        }
        console.log(`从Supabase同步了 ${supabaseCustomers.length} 条记录`);
        return;
      }
    } catch (supabaseError) {
      console.warn('从Supabase同步失败，尝试从后端API获取:', supabaseError);
    }

    // 如果Supabase失败，回退到后端API
    try {
      const response = await api.get('/customers');
      const serverCustomers = response.data.customers;

      // 更新本地数据库
      for (const customer of serverCustomers) {
        const localCustomer = await localDb.customers.get(customer.id);
        if (!localCustomer || new Date(customer.updated_at) > new Date(localCustomer.updated_at || 0)) {
          await localDb.customers.put({
            ...customer,
            isLocal: false
          });
        }
      }
      console.log('从后端API同步完成');
    } catch (apiError) {
      console.warn('从后端API同步失败:', apiError);
      // 不抛出错误，避免影响自动同步
    }
  } catch (error) {
    console.error('同步失败:', error);
    // 不抛出错误，避免影响自动同步
  }
}

// 自动同步（定期执行）
export function startAutoSync(interval: number = 30000): () => void {
  const syncInterval = setInterval(async () => {
    if (isOnline()) {
      try {
        await syncToServer();
        await syncFromServer();
      } catch (error) {
        console.error('自动同步失败:', error);
      }
    }
  }, interval);

  // 监听网络状态变化
  window.addEventListener('online', async () => {
    console.log('网络已连接，开始同步...');
    try {
      await syncToServer();
      await syncFromServer();
    } catch (error) {
      console.error('网络恢复后同步失败:', error);
    }
  });

  // 返回清理函数
  return () => clearInterval(syncInterval);
}

