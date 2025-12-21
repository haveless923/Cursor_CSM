import axios from 'axios';

// 自动检测API地址
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // 优先使用环境变量配置
  if ((import.meta as any).env?.VITE_API_URL) {
    return (import.meta as any).env.VITE_API_URL;
  }
  
  // 如果是 localhost 或 127.0.0.1，使用本地地址
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001/api';
  }
  
  // 如果通过公网IP或内网IP访问，使用相同IP的后端端口
  // 例如：前端 http://58.33.84.228:3000，后端 http://58.33.84.228:3001
  if (hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    // 是IP地址（公网或内网）
    return `${protocol}//${hostname}:3001/api`;
  }
  
  // 如果是域名访问，使用相对路径（通过Vite代理）
  // 或者使用相同域名不同端口
  const backendUrl = localStorage.getItem('backend_url');
  if (backendUrl) {
    return `${backendUrl}/api`;
  }
  
  // 默认使用相对路径（Vite代理会转发到后端）
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

// 在开发环境打印API地址以便调试
if ((import.meta as any).env?.DEV) {
  console.log('API Base URL:', API_BASE_URL);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10秒超时
});

// 请求拦截器：添加 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 记录错误详情以便调试
    if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
      console.error('API连接失败:', error.message);
      console.error('尝试连接的地址:', error.config?.url);
      console.error('Base URL:', API_BASE_URL);
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 只在非登录页面才跳转
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;


