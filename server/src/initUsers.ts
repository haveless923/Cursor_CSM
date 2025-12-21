import bcrypt from 'bcryptjs';
import { dbRun, dbGet } from './db.js';

async function initUsers() {
  try {
    console.log('开始初始化用户账号...');

    // 初始化默认管理员账号（密码: admin123）
    const adminExists = await dbGet('SELECT id FROM users WHERE username = ?', ['admin']);
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await dbRun(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        ['admin', hashedPassword, 'admin']
      );
      console.log('✅ 管理员账号已创建: admin / admin123');
    } else {
      console.log('ℹ️  管理员账号已存在');
    }

    // 初始化5个成员账号
    for (let i = 1; i <= 5; i++) {
      const memberExists = await dbGet('SELECT id FROM users WHERE username = ?', [`member${i}`]);
      if (!memberExists) {
        const hashedPassword = await bcrypt.hash(`member${i}123`, 10);
        await dbRun(
          'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
          [`member${i}`, hashedPassword, 'member']
        );
        console.log(`✅ 成员账号已创建: member${i} / member${i}123`);
      } else {
        console.log(`ℹ️  成员账号 member${i} 已存在`);
      }
    }

    console.log('✅ 用户初始化完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    process.exit(1);
  }
}

initUsers();



