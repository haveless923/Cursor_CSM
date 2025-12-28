// 清除Supabase中的测试数据（成交客户和潜在客户）
// ⚠️ 警告：此操作不可逆，请谨慎使用！
// 在浏览器控制台中执行此代码

const supabaseUrl = 'https://jpaurpkibrjwqthrcexc.supabase.co';
const supabaseKey = 'sb_publishable_eJMFki07-yqFP8Hv2kdu9g_7lrSRdBB';

// 获取Supabase客户端
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 清除测试数据
async function clearTestData() {
  try {
    // 1. 先查询要删除的数据
    const { data: closedCustomers, error: closedError } = await supabase
      .from('customers')
      .select('id, company_name, category')
      .eq('category', '结单');
    
    const { data: opportunityCustomers, error: opportunityError } = await supabase
      .from('customers')
      .select('id, company_name, category')
      .in('category', ['试用/谈判/高意向', '建联中', '静默']);
    
    if (closedError || opportunityError) {
      console.error('❌ 查询失败:', closedError || opportunityError);
      return;
    }
    
    const allTestCustomers = [
      ...(closedCustomers || []),
      ...(opportunityCustomers || [])
    ];
    
    console.log('📊 找到的测试数据:');
    console.log(`  结单客户: ${closedCustomers?.length || 0} 条`);
    console.log(`  潜在客户: ${opportunityCustomers?.length || 0} 条`);
    console.log(`  总计: ${allTestCustomers.length} 条`);
    
    if (allTestCustomers.length === 0) {
      console.log('✅ 没有找到需要删除的测试数据');
      return;
    }
    
    // 显示要删除的数据详情
    console.log('\n📋 要删除的客户列表:');
    allTestCustomers.forEach((customer, index) => {
      console.log(`  ${index + 1}. ID: ${customer.id}, 公司: ${customer.company_name || '未设置'}, 分类: ${customer.category}`);
    });
    
    // 2. 确认删除
    const confirmMessage = `⚠️ 确定要删除这 ${allTestCustomers.length} 条测试数据吗？\n此操作不可逆！\n\n输入 "DELETE" 确认删除：`;
    const userInput = prompt(confirmMessage);
    
    if (userInput !== 'DELETE') {
      console.log('❌ 操作已取消');
      return;
    }
    
    // 3. 执行删除
    const idsToDelete = allTestCustomers.map(c => c.id);
    
    console.log('\n🗑️ 开始删除...');
    const { data, error } = await supabase
      .from('customers')
      .delete()
      .in('id', idsToDelete);
    
    if (error) {
      console.error('❌ 删除失败:', error);
      return;
    }
    
    console.log(`✅ 成功删除 ${allTestCustomers.length} 条测试数据`);
    
    // 4. 验证删除结果
    const { data: remaining, count } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: false });
    
    console.log(`\n📊 剩余客户数: ${count || remaining?.length || 0} 条`);
    
  } catch (error) {
    console.error('❌ 操作失败:', error);
  }
}

// 执行清除
clearTestData();

