// 清除本地数据库中的测试数据
// 在浏览器控制台中执行此代码

async function clearLocalTestData() {
  try {
    // 获取本地数据库
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('CSMDatabase', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    const transaction = db.transaction(['customers'], 'readwrite');
    const store = transaction.objectStore('customers');
    
    // 获取所有客户
    const getAllRequest = store.getAll();
    const allCustomers = await new Promise((resolve, reject) => {
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    });
    
    // 筛选测试数据
    const testCustomers = allCustomers.filter(c => 
      c.category === '结单' || 
      c.category === '试用/谈判/高意向' || 
      c.category === '建联中' || 
      c.category === '静默'
    );
    
    console.log(`📊 找到 ${testCustomers.length} 条本地测试数据`);
    
    if (testCustomers.length === 0) {
      console.log('✅ 本地数据库中没有测试数据');
      return;
    }
    
    // 显示要删除的数据
    console.log('\n📋 要删除的客户:');
    testCustomers.forEach((c, i) => {
      console.log(`  ${i + 1}. ID: ${c.id}, 公司: ${c.company_name || '未设置'}, 分类: ${c.category}`);
    });
    
    // 确认删除
    const confirm = prompt(`⚠️ 确定要删除这 ${testCustomers.length} 条本地测试数据吗？\n输入 "DELETE" 确认：`);
    
    if (confirm !== 'DELETE') {
      console.log('❌ 操作已取消');
      return;
    }
    
    // 删除数据
    let deletedCount = 0;
    for (const customer of testCustomers) {
      const deleteRequest = store.delete(customer.id);
      await new Promise((resolve, reject) => {
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      });
      deletedCount++;
    }
    
    console.log(`✅ 成功删除 ${deletedCount} 条本地测试数据`);
    
    // 验证
    const remainingRequest = store.getAll();
    const remaining = await new Promise((resolve, reject) => {
      remainingRequest.onsuccess = () => resolve(remainingRequest.result);
      remainingRequest.onerror = () => reject(remainingRequest.error);
    });
    
    console.log(`📊 剩余本地客户数: ${remaining.length} 条`);
    
  } catch (error) {
    console.error('❌ 操作失败:', error);
  }
}

// 执行清除
clearLocalTestData();

