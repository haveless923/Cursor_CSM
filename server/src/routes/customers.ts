import express from 'express';
import { dbAll, dbGet, dbRun } from '../db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 测试端点（用于调试）
router.get('/test', async (req: AuthRequest, res) => {
  try {
    res.json({ 
      message: '测试成功',
      userId: req.userId,
      userRole: req.userRole,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取所有客户记录（只返回当前用户负责的客户）
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { category, search } = req.query;
    
    console.log('获取客户列表 - userId:', req.userId);
    console.log('获取客户列表 - userId类型:', typeof req.userId);
    console.log('获取客户列表 - category:', category);
    console.log('获取客户列表 - search:', search);
    
    if (!req.userId) {
      console.error('获取客户列表失败 - userId未定义');
      return res.status(401).json({ error: '未授权' });
    }
    
    // 确保userId是数字类型
    const userId = typeof req.userId === 'string' ? parseInt(req.userId) : req.userId;
    if (isNaN(userId)) {
      console.error('获取客户列表失败 - userId无效:', req.userId);
      return res.status(401).json({ error: '用户ID无效' });
    }
    
    // admin用户可以看到所有客户，普通用户只能看到自己负责的客户
    const isAdmin = req.userRole === 'admin';
    console.log('获取客户列表 - userRole:', req.userRole, 'isAdmin:', isAdmin);
    let query = 'SELECT * FROM customers';
    const params: any[] = [];
    const conditions: string[] = [];

    // 如果不是admin，添加owner_id条件
    if (!isAdmin) {
      conditions.push('owner_id = ?');
      params.push(userId);
    }

    // 添加category条件
    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    // 添加search条件
    if (search) {
      conditions.push('(customer_name LIKE ? OR company_name LIKE ? OR contact_person LIKE ? OR name LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // 组合WHERE子句
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY updated_at DESC';

    console.log('查询客户 - SQL:', query);
    console.log('查询客户 - 参数:', params);
    
    try {
      console.log('准备执行数据库查询...');
      const customers = await dbAll(query, params);
      console.log('查询客户 - 返回数量:', customers.length);
      if (customers.length > 0) {
        console.log('查询客户 - 前3条记录的ID:', customers.slice(0, 3).map((c: any) => c.id));
      }
      
      res.json({ customers });
    } catch (dbError: any) {
      console.error('数据库查询失败 - 错误类型:', dbError.constructor.name);
      console.error('数据库查询失败 - 错误消息:', dbError.message);
      console.error('数据库查询失败 - 错误代码:', dbError.code);
      console.error('SQL:', query);
      console.error('参数:', JSON.stringify(params));
      throw dbError; // 重新抛出错误，让外层catch处理
    }
  } catch (error: any) {
    console.error('获取客户列表失败 - 错误详情:', error);
    console.error('错误消息:', error.message);
    console.error('错误名称:', error.name);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({ 
      error: error.message || '获取客户列表失败',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 获取单个客户记录（只能查看自己负责的客户）
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const customer: any = await dbGet('SELECT * FROM customers WHERE id = ? AND owner_id = ?', [req.params.id, req.userId]);
    if (!customer) {
      return res.status(404).json({ error: '客户记录不存在或无权限访问' });
    }
    res.json({ customer });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建客户记录（自动分配当前用户为负责人）
router.post('/', async (req: AuthRequest, res) => {
  try {
    const {
      customer_name,
      company_name,
      city,
      customer_source,
      customer_source_other,
      due_date,
      contact_person,
      position,
      name,
      financial_capacity,
      status,
      category,
      follow_up_action,
      next_step,
      got_online_projects,
      pipeline_status,
      service_expiry_date,
      has_mini_game,
      mini_game_name,
      mini_game_platforms,
      mini_game_url,
      gpm_status,
      projects,
      custom_tags,
      customer_rating,
      sales_owner,
      requirement_list
    } = req.body;

    console.log('创建客户 - 接收到的 service_expiry_date:', service_expiry_date);
    console.log('创建客户 - 完整的 req.body:', JSON.stringify(req.body, null, 2));

    const result: any = await dbRun(
      `INSERT INTO customers (
        customer_name, company_name, city, customer_source, customer_source_other, custom_tags, due_date, contact_person, position, name,
        financial_capacity, customer_rating, sales_owner, status, category, follow_up_action, requirement_list, next_step,
        got_online_projects, pipeline_status, service_expiry_date, has_mini_game, mini_game_name, mini_game_platforms, mini_game_url, gpm_status, projects,
        created_by, owner_id, synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        customer_name,
        company_name,
        typeof city === 'string' ? city : JSON.stringify(city || []),
        customer_source || null,
        customer_source_other || null,
        typeof custom_tags === 'string' ? custom_tags : JSON.stringify(custom_tags || []),
        due_date,
        contact_person,
        Array.isArray(position) ? position.join(',') : position,
        name,
        financial_capacity,
        customer_rating || 0,
        sales_owner || null,
        status || '进行中',
        category || '建联中',
        follow_up_action,
        requirement_list || null,
        next_step,
        typeof got_online_projects === 'string' ? got_online_projects : JSON.stringify(got_online_projects || []),
        pipeline_status || null,
        service_expiry_date || null,
        has_mini_game ? 1 : 0,
        mini_game_name || null,
        mini_game_platforms || null,
        mini_game_url || null,
        gpm_status,
        typeof projects === 'string' ? projects : JSON.stringify(projects || []),
        req.userId,
        req.userId // 自动分配当前用户为负责人
      ]
    );

    const customerId = result.lastID;
    
    // 如果提供了next_step，创建历史记录
    if (next_step) {
      await dbRun(
        `INSERT INTO next_step_history (customer_id, next_step, created_by) VALUES (?, ?, ?)`,
        [customerId, next_step, req.userId]
      );
    }

    const customer: any = await dbGet('SELECT * FROM customers WHERE id = ?', [customerId]);
    res.status(201).json({ customer });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新客户记录（只能更新自己负责的客户）
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    // 先检查客户是否属于当前用户
    const existingCustomer: any = await dbGet('SELECT owner_id, next_step FROM customers WHERE id = ?', [req.params.id]);
    if (!existingCustomer) {
      return res.status(404).json({ error: '客户记录不存在' });
    }
    if (existingCustomer.owner_id !== req.userId) {
      return res.status(403).json({ error: '无权修改此客户记录' });
    }

    const {
      customer_name,
      company_name,
      city,
      customer_source,
      customer_source_other,
      due_date,
      contact_person,
      position,
      name,
      financial_capacity,
      status,
      category,
      follow_up_action,
      next_step,
      got_online_projects,
      pipeline_status,
      service_expiry_date,
      has_mini_game,
      mini_game_name,
      mini_game_platforms,
      mini_game_url,
      gpm_status,
      projects,
      custom_tags,
      customer_rating,
      sales_owner,
      requirement_list
    } = req.body;

    console.log('更新客户 - 接收到的 service_expiry_date:', service_expiry_date);
    console.log('更新客户 - 客户ID:', req.params.id);

    // 检查next_step是否发生变化，如果变化则创建历史记录
    if (next_step && next_step !== existingCustomer?.next_step) {
      await dbRun(
        `INSERT INTO next_step_history (customer_id, next_step, created_by) VALUES (?, ?, ?)`,
        [req.params.id, next_step, req.userId]
      );
    }

    await dbRun(
      `UPDATE customers SET
        customer_name = ?, company_name = ?, city = ?, customer_source = ?, customer_source_other = ?, custom_tags = ?, due_date = ?, contact_person = ?, position = ?, name = ?,
        financial_capacity = ?, customer_rating = ?, sales_owner = ?, status = ?, category = ?, follow_up_action = ?, requirement_list = ?, next_step = ?,
        got_online_projects = ?, pipeline_status = ?, service_expiry_date = ?, has_mini_game = ?, mini_game_name = ?, mini_game_platforms = ?, mini_game_url = ?, gpm_status = ?, projects = ?,
        updated_at = datetime('now'), synced_at = datetime('now')
      WHERE id = ? AND owner_id = ?`,
      [
        customer_name,
        company_name,
        typeof city === 'string' ? city : JSON.stringify(city || []),
        customer_source || null,
        customer_source_other || null,
        typeof custom_tags === 'string' ? custom_tags : JSON.stringify(custom_tags || []),
        due_date,
        contact_person,
        Array.isArray(position) ? position.join(',') : position,
        name,
        financial_capacity,
        customer_rating || 0,
        sales_owner || null,
        status,
        category,
        follow_up_action,
        typeof requirement_list === 'string' ? requirement_list : JSON.stringify(requirement_list || []),
        next_step,
        typeof got_online_projects === 'string' ? got_online_projects : JSON.stringify(got_online_projects || []),
        pipeline_status || null,
        service_expiry_date || null,
        has_mini_game ? 1 : 0,
        mini_game_name || null,
        mini_game_platforms || null,
        mini_game_url || null,
        gpm_status,
        typeof projects === 'string' ? projects : JSON.stringify(projects || []),
        req.params.id,
        req.userId // 确保只能更新自己负责的客户
      ]
    );

    const customer: any = await dbGet('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    console.log('更新客户成功，返回的 service_expiry_date:', customer?.service_expiry_date);
    res.json({ customer });
  } catch (error: any) {
    console.error('更新客户失败 - 错误详情:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({ error: error.message || '更新客户失败' });
  }
});

// 删除客户记录（只能删除自己负责的客户）
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    // 先检查客户是否属于当前用户
    const existingCustomer: any = await dbGet('SELECT owner_id FROM customers WHERE id = ?', [req.params.id]);
    if (!existingCustomer) {
      return res.status(404).json({ error: '客户记录不存在' });
    }
    if (existingCustomer.owner_id !== req.userId) {
      return res.status(403).json({ error: '无权删除此客户记录' });
    }

    await dbRun('DELETE FROM customers WHERE id = ? AND owner_id = ?', [req.params.id, req.userId]);
    res.json({ message: '删除成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 批量同步（用于离线同步，只同步当前用户的客户）
router.post('/sync', async (req: AuthRequest, res) => {
  try {
    console.log('同步请求 - userId:', req.userId);
    console.log('同步请求 - records数量:', req.body?.records?.length || 0);
    
    if (!req.userId) {
      console.error('同步失败 - userId未定义');
      return res.status(401).json({ error: '未授权' });
    }
    
    const { records } = req.body; // 本地未同步的记录
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'records字段必须是数组' });
    }
    
    const syncedRecords = [];

    for (const record of records) {
      // 只同步属于当前用户的记录
      if (record.owner_id !== req.userId) {
        continue;
      }

      if (record.id && record.id < 0) {
        // 新记录（本地生成的负数ID）
        const result: any = await dbRun(
          `INSERT INTO customers (
            customer_name, company_name, city, customer_source, customer_source_other, custom_tags, due_date, contact_person, position, name,
            financial_capacity, customer_rating, sales_owner, status, category, follow_up_action, requirement_list, next_step,
            got_online_projects, pipeline_status, service_expiry_date, has_mini_game, mini_game_name, mini_game_platforms, mini_game_url, gpm_status, projects,
            created_by, owner_id, synced_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
          [
            record.customer_name,
            record.company_name,
            typeof record.city === 'string' ? record.city : JSON.stringify(record.city || []),
            record.customer_source || null,
            record.customer_source_other || null,
            typeof record.custom_tags === 'string' ? record.custom_tags : JSON.stringify(record.custom_tags || []),
            record.due_date,
            record.contact_person,
            Array.isArray(record.position) ? record.position.join(',') : record.position,
            record.name,
            record.financial_capacity,
            record.customer_rating || 0,
            record.sales_owner || null,
            record.status || '进行中',
            record.category || '建联中',
            record.follow_up_action,
            typeof record.requirement_list === 'string' ? record.requirement_list : JSON.stringify(record.requirement_list || []),
            record.next_step,
            typeof record.got_online_projects === 'string' ? record.got_online_projects : JSON.stringify(record.got_online_projects || []),
            record.pipeline_status || null,
            record.service_expiry_date || null,
            record.has_mini_game ? 1 : 0,
            record.mini_game_name || null,
            record.mini_game_platforms || null,
            record.mini_game_url || null,
            record.gpm_status,
            typeof record.projects === 'string' ? record.projects : JSON.stringify(record.projects || []),
            req.userId,
            req.userId // 确保owner_id是当前用户
          ]
        );
        syncedRecords.push({ localId: record.id, serverId: result.lastID });
      } else {
        // 更新现有记录（确保只能更新自己的客户）
        await dbRun(
          `UPDATE customers SET
            customer_name = ?, company_name = ?, city = ?, customer_source = ?, customer_source_other = ?, custom_tags = ?, due_date = ?, contact_person = ?, position = ?, name = ?,
            financial_capacity = ?, customer_rating = ?, sales_owner = ?, status = ?, category = ?, follow_up_action = ?, requirement_list = ?, next_step = ?,
            got_online_projects = ?, pipeline_status = ?, service_expiry_date = ?, has_mini_game = ?, mini_game_name = ?, mini_game_platforms = ?, mini_game_url = ?, gpm_status = ?, projects = ?,
            updated_at = datetime('now'), synced_at = datetime('now')
          WHERE id = ? AND owner_id = ?`,
          [
            record.customer_name,
            record.company_name,
            typeof record.city === 'string' ? record.city : JSON.stringify(record.city || []),
            record.customer_source || null,
            record.customer_source_other || null,
            typeof record.custom_tags === 'string' ? record.custom_tags : JSON.stringify(record.custom_tags || []),
            record.due_date,
            record.contact_person,
            Array.isArray(record.position) ? record.position.join(',') : record.position,
            record.name,
            record.financial_capacity,
            record.customer_rating || 0,
            record.sales_owner || null,
            record.status,
            record.category,
            record.follow_up_action,
            typeof record.requirement_list === 'string' ? record.requirement_list : JSON.stringify(record.requirement_list || []),
            record.next_step,
            typeof record.got_online_projects === 'string' ? record.got_online_projects : JSON.stringify(record.got_online_projects || []),
            record.pipeline_status || null,
            record.service_expiry_date || null,
            record.has_mini_game ? 1 : 0,
            record.mini_game_name || null,
            record.mini_game_platforms || null,
            record.mini_game_url || null,
            record.gpm_status,
            typeof record.projects === 'string' ? record.projects : JSON.stringify(record.projects || []),
            record.id,
            req.userId // 确保只能更新自己的客户
          ]
        );
        syncedRecords.push({ localId: record.id, serverId: record.id });
      }
    }

    res.json({ syncedRecords });
  } catch (error: any) {
    console.error('同步失败 - 错误详情:', error);
    console.error('错误消息:', error.message);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({ error: error.message || '同步失败' });
  }
});

// 获取NextStep历史记录
router.get('/:id/next-step-history', async (req: AuthRequest, res) => {
  try {
    // 先检查客户是否属于当前用户
    const customer: any = await dbGet('SELECT owner_id FROM customers WHERE id = ?', [req.params.id]);
    if (!customer) {
      return res.status(404).json({ error: '客户记录不存在' });
    }
    if (customer.owner_id !== req.userId) {
      return res.status(403).json({ error: '无权查看此客户记录' });
    }

    const history = await dbAll(
      `SELECT nsh.*, u.username 
       FROM next_step_history nsh
       LEFT JOIN users u ON nsh.created_by = u.id
       WHERE nsh.customer_id = ?
       ORDER BY nsh.created_at DESC`,
      [req.params.id]
    );
    res.json({ history });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建NextStep历史记录
router.post('/:id/next-step-history', async (req: AuthRequest, res) => {
  try {
    const customerId = parseInt(req.params.id);
    console.log('创建历史记录 - 客户ID:', customerId);
    console.log('创建历史记录 - 用户ID:', req.userId);
    console.log('创建历史记录 - 请求体:', req.body);
    
    if (isNaN(customerId)) {
      return res.status(400).json({ error: '无效的客户ID' });
    }
    
    if (!req.userId) {
      return res.status(401).json({ error: '未授权' });
    }

    // 先检查客户是否属于当前用户
    const customer: any = await dbGet('SELECT owner_id FROM customers WHERE id = ?', [customerId]);
    if (!customer) {
      console.error('客户记录不存在，ID:', customerId);
      return res.status(404).json({ error: '客户记录不存在' });
    }
    if (customer.owner_id !== req.userId) {
      console.error('无权修改，客户owner_id:', customer.owner_id, '当前用户ID:', req.userId);
      return res.status(403).json({ error: '无权修改此客户记录' });
    }

    const { next_step } = req.body;
    if (!next_step || !next_step.trim()) {
      return res.status(400).json({ error: 'next_step字段不能为空' });
    }

    console.log('准备插入历史记录，next_step长度:', next_step.length);

    // 创建历史记录
    const result: any = await dbRun(
      `INSERT INTO next_step_history (customer_id, next_step, created_by) VALUES (?, ?, ?)`,
      [customerId, next_step.trim(), req.userId]
    );

    console.log('历史记录插入成功，lastID:', result.lastID);

    // 更新客户的next_step字段
    await dbRun(
      `UPDATE customers SET next_step = ?, updated_at = datetime('now') WHERE id = ?`,
      [next_step.trim(), customerId]
    );

    console.log('客户next_step字段更新成功');

    const history: any = await dbGet(
      `SELECT nsh.*, u.username 
       FROM next_step_history nsh
       LEFT JOIN users u ON nsh.created_by = u.id
       WHERE nsh.id = ?`,
      [result.lastID]
    );
    
    if (!history) {
      console.error('查询历史记录失败，lastID:', result.lastID);
      // 即使查询失败，也返回成功，因为记录已经创建
      const fallbackHistory = {
        id: result.lastID,
        customer_id: customerId,
        next_step: next_step.trim(),
        created_by: req.userId,
        created_at: new Date().toISOString(),
        username: null
      };
      return res.status(201).json({ history: fallbackHistory });
    }
    
    console.log('创建历史记录成功，返回数据:', history);
    res.status(201).json({ history });
  } catch (error: any) {
    console.error('创建历史记录失败 - 错误详情:', error);
    console.error('错误消息:', error.message);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({ error: error.message || '创建历史记录失败' });
  }
});

export default router;


