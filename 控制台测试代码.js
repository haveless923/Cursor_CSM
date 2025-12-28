// ============================================
// 在浏览器控制台直接测试 Supabase 连接
// ============================================
// 使用方法：
// 1. 打开应用：http://localhost:5173
// 2. 按 F12 打开开发者工具
// 3. 切换到 Console 标签
// 4. 复制粘贴下面的代码并回车
// ============================================

// 检查Supabase是否加载
console.log('=== 开始测试 Supabase 连接 ===');
console.log('1. 检查 Supabase 对象:', typeof window.supabase);

if (typeof window.supabase === 'undefined') {
  console.error('❌ Supabase 未加载！请检查 index.html 中的脚本');
} else {
  console.log('✅ Supabase 对象存在');
  console.log('2. 检查 createClient 方法:', typeof window.supabase.createClient);
  
  if (typeof window.supabase.createClient !== 'function') {
    console.error('❌ Supabase.createClient 不是函数！');
  } else {
    try {
      // 创建客户端
      const supabaseUrl = 'https://jpaurpkibrjwqthrcexc.supabase.co';
      const supabaseKey = 'sb_publishable_eJMFki07-yqFP8Hv2kdu9g_7lrSRdBB';
      
      const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
      
      console.log('✅ Supabase 客户端创建成功');
      console.log('3. 客户端对象:', supabase);
      console.log('4. 检查 from 方法:', typeof supabase.from);
      
      if (typeof supabase.from !== 'function') {
        console.error('❌ supabase.from 不是函数！客户端创建可能有问题');
      } else {
        console.log('5. 开始测试连接...');
        
        // 测试查询
        supabase.from('customers').select('count').limit(1)
          .then(({ data, error }) => {
            console.log('6. 查询结果:', { data, error });
            
            if (error) {
              if (error.code === 'PGRST116' || error.code === '42P01') {
                console.log('⚠️ 连接成功！但 customers 表不存在');
                console.log('这是正常的，如果表还没创建');
                console.log('请在 Supabase Dashboard 中执行: supabase_schema_simple.sql');
              } else {
                console.error('❌ 连接失败:', error);
                console.error('错误代码:', error.code);
                console.error('错误消息:', error.message);
              }
            } else {
              console.log('✅✅✅ 连接成功！可以访问数据库');
              console.log('数据:', data);
            }
          })
          .catch(err => {
            console.error('❌ 测试异常:', err);
          });
      }
    } catch (error) {
      console.error('❌ 创建客户端失败:', error);
    }
  }
}

console.log('=== 测试完成，请查看上面的结果 ===');

