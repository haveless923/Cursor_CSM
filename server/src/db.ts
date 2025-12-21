import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 确保数据目录存在
const dataDir = path.join(__dirname, '../../data');
try {
  mkdirSync(dataDir, { recursive: true });
} catch (error) {
  // 目录已存在，忽略错误
}

const dbPath = path.join(dataDir, 'csm.db');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接错误:', err);
  } else {
    console.log('数据库连接成功');
  }
});

// 将回调式方法转换为 Promise（sqlite3 需要特殊处理）
export function dbRun(sql: string, params?: any[]): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params || [], function(err: Error | null) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export function dbGet(sql: string, params?: any[]): Promise<any> {
  return new Promise((resolve, reject) => {
    db.get(sql, params || [], (err: Error | null, row: any) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function dbAll(sql: string, params?: any[]): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params || [], (err: Error | null, rows: any[]) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// 初始化数据库表
export async function initDatabase() {
  // 用户表
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 客户记录表（更新支持新的状态分类）
  await dbRun(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT,
      company_name TEXT,
      city TEXT,
      customer_source TEXT,
      customer_source_other TEXT,
      custom_tags TEXT,
      due_date TEXT,
      contact_person TEXT,
      position TEXT,
      name TEXT,
      financial_capacity TEXT,
      customer_rating INTEGER DEFAULT 0,
      status TEXT DEFAULT '公海',
      category TEXT DEFAULT '公海',
      follow_up_action TEXT,
      next_step TEXT,
      got_online_projects TEXT,
      pipeline_status TEXT,
      service_expiry_date TEXT,
      has_mini_game INTEGER DEFAULT 0,
      mini_game_name TEXT,
      mini_game_platforms TEXT,
      mini_game_url TEXT,
      gpm_status TEXT,
      projects TEXT,
      requirement_list TEXT,
      owner_id INTEGER,
      project_link TEXT,
      notes TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      synced_at DATETIME,
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (owner_id) REFERENCES users(id)
    )
  `);

  // 添加新字段（如果表已存在）
  try {
    await dbRun(`ALTER TABLE customers ADD COLUMN company_name TEXT`);
  } catch (e) {
    // 字段已存在，忽略错误
  }
  try {
    await dbRun(`ALTER TABLE customers ADD COLUMN position TEXT`);
  } catch (e) {
    // 字段已存在，忽略错误
  }
  try {
    await dbRun(`ALTER TABLE customers ADD COLUMN financial_capacity TEXT`);
  } catch (e) {
    // 字段已存在，忽略错误
  }
  try {
    await dbRun(`ALTER TABLE customers ADD COLUMN has_mini_game INTEGER DEFAULT 0`);
  } catch (e) {
    // 字段已存在，忽略错误
  }
  try {
    await dbRun(`ALTER TABLE customers ADD COLUMN gpm_status TEXT`);
  } catch (e) {
    // 字段已存在，忽略错误
  }
  try {
    await dbRun(`ALTER TABLE customers ADD COLUMN projects TEXT`);
  } catch (e) {
    // 字段已存在，忽略错误
  }
  try {
    await dbRun(`ALTER TABLE customers ADD COLUMN mini_game_name TEXT`);
  } catch (e) {
    // 字段已存在，忽略错误
  }
  try {
    await dbRun(`ALTER TABLE customers ADD COLUMN mini_game_platforms TEXT`);
  } catch (e) {
    // 字段已存在，忽略错误
  }
  try {
    await dbRun(`ALTER TABLE customers ADD COLUMN mini_game_url TEXT`);
  } catch (e) {
    // 字段已存在，忽略错误
  }
  try {
    await dbRun(`ALTER TABLE customers ADD COLUMN customer_source TEXT`);
  } catch (e) {
    // 字段已存在，忽略错误
  }
  try {
    await dbRun(`ALTER TABLE customers ADD COLUMN customer_source_other TEXT`);
  } catch (e) {
    // 字段已存在，忽略错误
  }
  try {
    await dbRun(`ALTER TABLE customers ADD COLUMN custom_tags TEXT`);
  } catch (e) {
    // 字段已存在，忽略错误
  }
  try {
    await dbRun(`ALTER TABLE customers ADD COLUMN service_expiry_date TEXT`);
  } catch (e) {
    // 字段已存在，忽略错误
  }
  try {
    await dbRun(`ALTER TABLE customers ADD COLUMN got_online_projects TEXT`);
  } catch (e) {
    // 字段已存在，忽略错误
  }
  try {
    await dbRun(`ALTER TABLE customers ADD COLUMN pipeline_status TEXT`);
  } catch (e) {
    // 字段已存在，忽略错误
  }
  try {
    await dbRun(`ALTER TABLE customers ADD COLUMN customer_rating INTEGER DEFAULT 0`);
  } catch (e) {
    // 字段已存在，忽略错误
  }
  try {
    await dbRun(`ALTER TABLE customers ADD COLUMN sales_owner TEXT`);
  } catch (e) {
    // 字段已存在，忽略错误
  }

  // 销售机会表
  await dbRun(`
    CREATE TABLE IF NOT EXISTS opportunities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      project_name TEXT,
      project_link TEXT,
      notes TEXT,
      status TEXT DEFAULT '公海',
      owner_id INTEGER,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (owner_id) REFERENCES users(id)
    )
  `);

  // 行程表
  await dbRun(`
    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visit_date TEXT NOT NULL,
      visit_time TEXT,
      customer_id INTEGER,
      customer_name TEXT,
      location TEXT,
      purpose TEXT,
      participants TEXT,
      notes TEXT,
      status TEXT DEFAULT '待执行',
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // 客户QA记录表
  await dbRun(`
    CREATE TABLE IF NOT EXISTS customer_qa (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      customer_name TEXT,
      question TEXT NOT NULL,
      answer TEXT,
      category TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // NextStep历史记录表
  await dbRun(`
    CREATE TABLE IF NOT EXISTS next_step_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      next_step TEXT NOT NULL,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // 同步记录表（用于离线同步）
  await dbRun(`
    CREATE TABLE IF NOT EXISTS sync_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      record_id INTEGER NOT NULL,
      operation TEXT NOT NULL,
      data TEXT,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 初始化默认管理员账号（密码: admin123）
  const adminExists = await dbGet('SELECT id FROM users WHERE username = ?', ['admin']);
  if (!adminExists) {
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await dbRun(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      ['admin', hashedPassword, 'admin']
    );
    console.log('默认管理员账号已创建: admin / admin123');
  }

  // 初始化5个成员账号
  for (let i = 1; i <= 5; i++) {
    const memberExists = await dbGet('SELECT id FROM users WHERE username = ?', [`member${i}`]);
    if (!memberExists) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(`member${i}123`, 10);
      await dbRun(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        [`member${i}`, hashedPassword, 'member']
      );
    }
  }

  console.log('数据库初始化完成');
}

export default db;

