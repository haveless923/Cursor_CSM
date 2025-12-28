import express from 'express';
import cors from 'cors';
import { initDatabase } from './db.js';
import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customers.js';
import industryIntelligenceRoutes from './routes/industry-intelligence.js';
import { startScheduler } from './services/scheduler.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

// 初始化数据库
initDatabase().then(() => {
  // 数据库初始化完成后启动定时任务
  startScheduler();
}).catch(console.error);

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/industry-intelligence', industryIntelligenceRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CSM系统运行正常' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`局域网访问: http://你的IP地址:${PORT}`);
  console.log(`前端地址: http://localhost:3000 或 http://你的IP地址:3000`);
});


