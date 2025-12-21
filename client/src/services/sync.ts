import api from './api';
import { localDb } from '../db/localDb';

// 检查网络连接
export function isOnline(): boolean {
  return navigator.onLine;
}

// 同步本地数据到服务器
export async function syncToServer(): Promise<void> {
  if (!isOnline()) {
    console.log('离线状态，无法同步');
    return;
  }

  try {
    // 获取所有未同步的记录（synced_at为空或isLocal为true）
    const allRecords = await localDb.customers.toArray();
    const unsyncedRecords = allRecords.filter(
      record => !record.synced_at || record.isLocal === true
    );

    if (unsyncedRecords.length === 0) {
      console.log('没有需要同步的数据');
      return;
    }

    // 发送到服务器
    const response = await api.post('/customers/sync', {
      records: unsyncedRecords
    });

    // 更新本地记录的同步状态
    for (const mapping of response.data.syncedRecords) {
      if (mapping.localId !== mapping.serverId) {
        // 更新本地ID为服务器ID（负数ID转换为正数ID）
        const localRecord = await localDb.customers.get(mapping.localId);
        if (localRecord) {
          // 删除旧记录
          await localDb.customers.delete(mapping.localId);
          // 添加新记录（使用服务器ID）
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

    console.log(`成功同步 ${unsyncedRecords.length} 条记录`);
  } catch (error) {
    console.error('同步失败:', error);
    throw error;
  }
}

// 从服务器拉取最新数据
export async function syncFromServer(): Promise<void> {
  if (!isOnline()) {
    console.log('离线状态，无法从服务器拉取数据');
    return;
  }

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

    console.log('从服务器同步完成');
  } catch (error) {
    console.error('从服务器同步失败:', error);
    throw error;
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

