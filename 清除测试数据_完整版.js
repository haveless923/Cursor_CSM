// 完整版：同时清除Supabase和本地数据库中的测试数据
// ⚠️ 警告：此操作不可逆，请谨慎使用！
// 在浏览器控制台中执行此代码

const supabaseUrl = 'https://jpaurpkibrjwqthrcexc.supabase.co';
const supabaseKey = 'sb_publishable_eJMFki07-yqFP8Hv2kdu9g_7lrSRdBB';

// 获取Supabase客户端
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 清除测试数据（同时清除Supabase和本地数据库）
async function clearAllTestData() {
  try {
    console.log('🔍 开始查找测试数据...\n');
    
    // ========== 1. 查询Supabase中的测试数据 ==========
    const { data: closedCustomers, error: closedError } = await supabase
      .from('customers')
      .select('id, company_name, category')
      .eq('category', '结单');
    
    const { data: opportunityCustomers, error: opportunityError } = await supabase
      .from('customers')
      .select('id, company_name, category')
      .in('category', ['试用/谈判/高意向', '建联中', '静默']);
    
    if (closedError || opportunityError) {
      console.error('❌ Supabase查询失败:', closedError || opportunityError);
      return;
    }
    
    const supabaseTestCustomers = [
      ...(closedCustomers || []),
      ...(opportunityCustomers || [])
    ];
    
    console.log('📊 Supabase中的测试数据:');
    console.log(`  结单客户: ${closedCustomers?.length || 0} 条`);
    console.log(`  潜在客户: ${opportunityCustomers?.length || 0} 条`);
    console.log(`  总计: ${supabaseTestCustomers.length} 条`);
    
    // ========== 2. 查询本地数据库中的测试数据 ==========
    let localTestCustomers = [];
    try {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('CSMDatabase', 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      const transaction = db.transaction(['customers'], 'readonly');
      const store = transaction.objectStore('customers');
      const getAllRequest = store.getAll();
      
      const allLocalCustomers = await new Promise((resolve, reject) => {
        getAllRequest.onsuccess = () => resolve(getAllRequest.result);
        getAllRequest.onerror = () => reject(getAllRequest.error);
      });
      
      localTestCustomers = allLocalCustomers.filter(c => 
        c.category === '结单' || 
        c.category === '试用/谈判/高意向' || 
        c.category === '建联中' || 
        c.category === '静默'
      );
      
      console.log(`\n📊 本地数据库中的测试数据: ${localTestCustomers.length} 条`);
    } catch (error) {
      console.warn('⚠️ 无法访问本地数据库:', error);
    }
    
    // ========== 3. 显示汇总信息 ==========
    const totalCount = supabaseTestCustomers.length + localTestCustomers.length;
    
    if (totalCount === 0) {
      console.log('\n✅ 没有找到需要删除的测试数据');
      return;
    }
    
    console.log(`\n📋 总计要删除: ${totalCount} 条测试数据`);
    console.log('\n要删除的客户列表:');
    supabaseTestCustomers.forEach((c, i) => {
      console.log(`  ${i + 1}. [Supabase] ID: ${c.id}, 公司: ${c.company_name || '未设置'}, 分类: ${c.category}`);
    });
    localTestCustomers.forEach((c, i) => {
      console.log(`  ${supabaseTestCustomers.length + i + 1}. [本地] ID: ${c.id}, 公司: ${c.company_name || '未设置'}, 分类: ${c.category}`);
    });
    
    // ========== 4. 确认删除 ==========
    const confirmMessage = `⚠️ 确定要删除这 ${totalCount} 条测试数据吗？\n\n` +
      `- Supabase: ${supabaseTestCustomers.length} 条\n` +
      `- 本地数据库: ${localTestCustomers.length} 条\n\n` +
      `此操作不可逆！\n\n输入 "DELETE" 确认删除：`;
    
    const userInput = prompt(confirmMessage);
    
    if (userInput !== 'DELETE') {
      console.log('❌ 操作已取消');
      return;
    }
    
    // ========== 5. 删除Supabase中的数据 ==========
    if (supabaseTestCustomers.length > 0) {
      console.log('\n🗑️ 开始删除Supabase中的数据...');
      const idsToDelete = supabaseTestCustomers.map(c => c.id);
      
      const { error: deleteError } = await supabase
        .from('customers')
        .delete()
        .in('id', idsToDelete);
      
      if (deleteError) {
        console.error('❌ Supabase删除失败:', deleteError);
      } else {
        console.log(`✅ 成功删除Supabase中的 ${supabaseTestCustomers.length} 条数据`);
      }
    }
    
    // ========== 6. 删除本地数据库中的数据 ==========
    if (localTestCustomers.length > 0) {
      try {
        console.log('\n🗑️ 开始删除本地数据库中的数据...');
        const db = await new Promise((resolve, reject) => {
          const request = indexedDB.open('CSMDatabase', 1);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        
        const transaction = db.transaction(['customers'], 'readwrite');
        const store = transaction.objectStore('customers');
        
        let deletedCount = 0;
        for (const customer of localTestCustomers) {
          const deleteRequest = store.delete(customer.id);
          await new Promise((resolve, reject) => {
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
          });
          deletedCount++;
        }
        
        console.log(`✅ 成功删除本地数据库中的 ${deletedCount} 条数据`);
      } catch (error) {
        console.error('❌ 本地数据库删除失败:', error);
      }
    }
    
    // ========== 7. 验证删除结果 ==========
    console.log('\n📊 验证删除结果...');
    
    const { data: remainingSupabase, count: supabaseCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: false });
    
    console.log(`✅ Supabase剩余客户数: ${supabaseCount || remainingSupabase?.length || 0} 条`);
    
    try {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('CSMDatabase', 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      const transaction = db.transaction(['customers'], 'readonly');
      const store = transaction.objectStore('customers');
      const getAllRequest = store.getAll();
      
      const remainingLocal = await new Promise((resolve, reject) => {
        getAllRequest.onsuccess = () => resolve(getAllRequest.result);
        getAllRequest.onerror = () => reject(getAllRequest.error);
      });
      
      console.log(`✅ 本地数据库剩余客户数: ${remainingLocal.length} 条`);
    } catch (error) {
      console.warn('⚠️ 无法验证本地数据库:', error);
    }
    
    console.log('\n✅ 清除完成！');
    
  } catch (error) {
    console.error('❌ 操作失败:', error);
  }
}

// 执行清除
clearAllTestData();

