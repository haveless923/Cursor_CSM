// 简化版：快速查询客户数量
// 在浏览器控制台中执行此代码

(async function() {
  const supabase = window.supabase.createClient(
    'https://jpaurpkibrjwqthrcexc.supabase.co',
    'sb_publishable_eJMFki07-yqFP8Hv2kdu9g_7lrSRdBB'
  );
  
  const { data, error, count } = await supabase
    .from('customers')
    .select('*', { count: 'exact' });
  
  if (error) {
    console.error('❌ 查询失败:', error);
    return;
  }
  
  console.log(`✅ 总客户数: ${count || data.length} 条`);
  console.log('📋 客户列表:', data);
  
  // 按分类统计
  const categories = {};
  data.forEach(c => {
    const cat = c.category || '未分类';
    categories[cat] = (categories[cat] || 0) + 1;
  });
  
  console.log('📊 按分类统计:', categories);
})();

