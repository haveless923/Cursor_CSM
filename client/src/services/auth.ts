import api from './api';

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'member';
}

export async function login(username: string, password: string) {
  try {
    const response = await api.post('/auth/login', { username, password });
    const { token, user } = response.data;
    
    if (!token || !user) {
      throw new Error('服务器返回数据格式错误');
    }
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { token, user };
  } catch (error: any) {
    console.error('登录API调用失败:', error);
    console.error('请求URL:', error.config?.url);
    console.error('Base URL:', api.defaults.baseURL);
    throw error;
  }
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getCurrentUser(): User | null {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('token');
}

export async function getCurrentUserInfo(): Promise<User | null> {
  try {
    const response = await api.get('/auth/me');
    return response.data.user;
  } catch (error) {
    return null;
  }
}


