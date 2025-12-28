import { loginWithSupabase } from './supabase';

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'member';
}

export async function login(username: string, password: string) {
  try {
    // 使用 Supabase 进行登录
    const result = await loginWithSupabase(username, password);
    
    if (!result.user) {
      throw new Error('登录失败，未返回用户信息');
    }
    
    // 保存用户信息到 localStorage
    localStorage.setItem('user', JSON.stringify(result.user));
    // 如果有 token，也保存
    if (result.token) {
      localStorage.setItem('token', result.token);
    }
    
    return { token: result.token || '', user: result.user };
  } catch (error: any) {
    console.error('登录失败:', error);
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
  // 直接从 localStorage 获取用户信息
  // 如果需要从服务器验证，可以使用 Supabase
  return getCurrentUser();
}


