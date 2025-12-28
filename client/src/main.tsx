import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tech-theme.css';
import { testSupabaseConnection } from './services/supabase';

// 初始化主题
const savedTheme = localStorage.getItem('theme') || 'dark';
document.body.setAttribute('data-theme', savedTheme);

// 测试Supabase连接（可选，用于调试）
if (import.meta.env.DEV) {
  // 等待Supabase脚本加载
  setTimeout(async () => {
    try {
      const connected = await testSupabaseConnection();
      if (connected) {
        console.log('✅ Supabase 连接成功！');
      } else {
        console.warn('⚠️ Supabase 连接失败，请检查配置和表结构');
      }
    } catch (error) {
      console.warn('⚠️ Supabase 未初始化或连接失败:', error);
    }
  }, 1000);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

