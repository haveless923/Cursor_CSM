// 查询Supabase数据库中的客户数量
// 在浏览器控制台中执行此代码

const supabaseUrl = 'https://jpaurpkibrjwqthrcexc.supabase.co';
const supabaseKey = 'sb_publishable_eJMFki07-yqFP8Hv2kdu9g_7lrSRdBB';

// 获取Supabase客户端
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 查询所有客户
async function countCustomers() {
  try {
    // 方法1: 获取所有客户并计数
    const { data, error, count } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: false });
    
    if (error) {
      console.error('❌ 查询失败:', error);
      return;
    }
    
    console.log('📊 客户统计:');
    console.log(`总客户数: ${data.length} 条`);
    console.log(`数据库返回的count: ${count} 条`);
    
    // 按分类统计
    const categoryCount = {};
    const statusCount = {};
    const ownerCount = {};
    
    data.forEach(customer => {
      // 按分类统计
      const category = customer.category || '未分类';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
      
      // 按状态统计
      const status = customer.status || '未设置';
      statusCount[status] = (statusCount[status] || 0) + 1;
      
      // 按负责人统计
      const ownerId = customer.owner_id || '未分配';
      ownerCount[ownerId] = (ownerCount[ownerId] || 0) + 1;
    });
    
    console.log('\n📈 按分类统计:');
    Object.entries(categoryCount).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} 条`);
    });
    
    console.log('\n📈 按状态统计:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} 条`);
    });
    
    console.log('\n📈 按负责人统计:');
    Object.entries(ownerCount).forEach(([ownerId, count]) => {
      console.log(`  负责人ID ${ownerId}: ${count} 条`);
    });
    
    // 显示最近创建的5条记录
    console.log('\n📋 最近创建的5条记录:');
    const sortedByCreated = [...data].sort((a, b) => 
      new Date(b.created_at || 0) - new Date(a.created_at || 0)
    ).slice(0, 5);
    
    sortedByCreated.forEach((customer, index) => {
      console.log(`  ${index + 1}. ID: ${customer.id}, 公司: ${customer.company_name || '未设置'}, 分类: ${customer.category || '未分类'}, 创建时间: ${customer.created_at || '未知'}`);
    });
    
    return {
      total: data.length,
      categoryCount,
      statusCount,
      ownerCount,
      data
    };
  } catch (error) {
    console.error('❌ 查询出错:', error);
  }
}

// 执行查询
countCustomers();

