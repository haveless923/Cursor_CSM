import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tech-theme.css';

// 初始化主题
const savedTheme = localStorage.getItem('theme') || 'dark';
document.body.setAttribute('data-theme', savedTheme);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

