import api from './api';

export interface IndustryNews {
  id: number;
  title: string;
  content?: string;
  url: string;
  source: string;
  publish_date?: string;
  summary?: string;
  keywords?: string;
  relevance_score?: number;
  is_favorite?: number;
  created_at?: string;
  updated_at?: string;
}

export interface NewsListResponse {
  news: IndustryNews[];
  total: number;
  page: number;
  pageSize: number;
}

// 获取行业新闻列表
export async function getIndustryNews(params?: {
  page?: number;
  pageSize?: number;
  source?: string;
  favorite?: boolean;
}): Promise<NewsListResponse> {
  const queryParams: any = {};
  if (params?.page) queryParams.page = params.page;
  if (params?.pageSize) queryParams.pageSize = params.pageSize;
  if (params?.source) queryParams.source = params.source;
  if (params?.favorite) queryParams.favorite = 'true';
  
  const response = await api.get('/industry-intelligence/news', { params: queryParams });
  return response.data;
}

// 收藏/取消收藏新闻
export async function toggleFavorite(newsId: number): Promise<{ favorited: boolean; message: string }> {
  const response = await api.post(`/industry-intelligence/news/${newsId}/favorite`);
  return response.data;
}

// 获取收藏的新闻列表
export async function getFavoriteNews(params?: {
  page?: number;
  pageSize?: number;
}): Promise<NewsListResponse> {
  const queryParams: any = {};
  if (params?.page) queryParams.page = params.page;
  if (params?.pageSize) queryParams.pageSize = params.pageSize;
  
  const response = await api.get('/industry-intelligence/favorites', { params: queryParams });
  return response.data;
}

// 手动触发爬取（仅管理员）
export async function triggerCrawl(): Promise<{ message: string }> {
  const response = await api.post('/industry-intelligence/crawl');
  return response.data;
}

