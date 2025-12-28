import { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  List,
  Tag,
  Button,
  Space,
  Select,
  Input,
  Badge,
  Dropdown,
  MenuProps,
  message,
  Pagination,
  Spin,
  Empty
} from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  LogoutOutlined,
  StarOutlined,
  StarFilled,
  SyncOutlined,
  GlobalOutlined,
  HeartOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../../services/auth';
import { isOnline } from '../../services/sync';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  getIndustryNews, 
  toggleFavorite, 
  getFavoriteNews,
  triggerCrawl,
  IndustryNews 
} from '../../services/industryIntelligence';
import '../../styles/tech-theme.css';
import logo from '../../assets/logo.svg';

const { Header, Content } = Layout;
const { Option } = Select;

export default function IndustryIntelligence() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [newsList, setNewsList] = useState<IndustryNews[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [showFavorites, setShowFavorites] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(30);
  const user = getCurrentUser();

  const getBackgroundStyle = (): React.CSSProperties => {
    if (theme === 'dark') {
      return { background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1419 100%)' };
    }
    return { background: '#f0f2f5' };
  };

  const getTextColor = () => {
    return theme === 'dark' ? '#e0e7ff' : '#262626';
  };

  useEffect(() => {
    loadNews();
  }, [currentPage, sourceFilter, showFavorites]);

  const loadNews = async () => {
    setLoading(true);
    try {
      let response;
      if (showFavorites) {
        response = await getFavoriteNews({ page: currentPage, pageSize });
      } else {
        response = await getIndustryNews({
          page: currentPage,
          pageSize,
          source: sourceFilter || undefined,
          favorite: showFavorites
        });
      }
      setNewsList(response.news);
      setTotal(response.total);
    } catch (error) {
      console.error('加载新闻失败:', error);
      message.error('加载新闻失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async (news: IndustryNews) => {
    try {
      const result = await toggleFavorite(news.id);
      message.success(result.message);
      loadNews(); // 重新加载列表
    } catch (error) {
      console.error('收藏操作失败:', error);
      message.error('收藏操作失败');
    }
  };

  const handleTriggerCrawl = async () => {
    try {
      await triggerCrawl();
      message.success('爬取任务已启动，将在后台执行');
      // 3秒后刷新列表
      setTimeout(() => {
        loadNews();
      }, 3000);
    } catch (error: any) {
      if (error.response?.status === 403) {
        message.error('需要管理员权限');
      } else {
        message.error('触发爬取失败');
      }
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: () => {
        logout();
        navigate('/login');
      }
    }
  ];

  const sourceOptions = [
    { label: '全部来源', value: '' },
    { label: '游戏葡萄', value: '游戏葡萄' },
    { label: '游戏陀螺', value: '游戏陀螺' },
    { label: 'GameLook', value: 'GameLook' }
  ];

  return (
    <Layout style={{ minHeight: '100vh', ...getBackgroundStyle() }}>
      <Header className="tech-header" style={{
        padding: '0 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 56,
        background: theme === 'dark' ? 'rgba(26, 31, 58, 0.8)' : '#fff',
        borderBottom: `1px solid ${theme === 'dark' ? 'rgba(102, 126, 234, 0.3)' : '#f0f0f0'}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img 
            src={logo} 
            alt="Logo" 
            onClick={() => navigate('/')}
            style={{ 
              height: 30,
              width: 'auto',
              cursor: 'pointer'
            }} 
          />
          <span style={{ color: getTextColor(), fontSize: 18, fontWeight: 600 }}>
            行业情报
          </span>
        </div>
        <Space size="small" style={{ color: getTextColor() }}>
          <Badge status={isOnline() ? 'success' : 'error'} text={<span style={{ color: getTextColor(), fontSize: 12 }}>{isOnline() ? '在线' : '离线'}</span>} />
          {user?.role === 'admin' && (
            <Button
              className="tech-button"
              size="small"
              icon={<SyncOutlined />}
              onClick={handleTriggerCrawl}
            >
              手动爬取
            </Button>
          )}
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button className="tech-button" size="small" type="text" icon={<UserOutlined />}>
              {user?.username}
            </Button>
          </Dropdown>
        </Space>
      </Header>

      <Content style={{ padding: '20px', flex: 1, overflow: 'auto' }}>
        <Card
          className="tech-card"
          style={{ marginBottom: 16 }}
        >
          <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Space>
              <Button
                type={showFavorites ? 'default' : 'primary'}
                icon={<HeartOutlined />}
                onClick={() => {
                  setShowFavorites(!showFavorites);
                  setCurrentPage(1);
                }}
              >
                {showFavorites ? '显示全部' : '我的收藏'}
              </Button>
              <Select
                style={{ width: 150 }}
                placeholder="选择来源"
                value={sourceFilter}
                onChange={(value) => {
                  setSourceFilter(value);
                  setCurrentPage(1);
                }}
                allowClear
              >
                {sourceOptions.map(opt => (
                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                ))}
              </Select>
              <Input
                placeholder="搜索新闻标题"
                prefix={<SearchOutlined />}
                style={{ width: 300 }}
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={loadNews}
              />
            </Space>
          </Space>
        </Card>

        <Spin spinning={loading}>
          {newsList.length === 0 ? (
            <Card className="tech-card">
              <Empty description="暂无新闻数据" />
            </Card>
          ) : (
            <List
              dataSource={newsList}
              renderItem={(news) => (
                <Card
                  className="tech-card"
                  style={{ marginBottom: 16, cursor: 'pointer' }}
                  hoverable
                  onClick={() => window.open(news.url, '_blank')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                        <Tag color={news.source === '游戏葡萄' ? 'blue' : news.source === '游戏陀螺' ? 'purple' : 'green'}>
                          {news.source}
                        </Tag>
                        {news.relevance_score && news.relevance_score > 0 && (
                          <Tag color="orange">相关性: {news.relevance_score.toFixed(1)}</Tag>
                        )}
                        {news.publish_date && (
                          <span style={{ color: getTextColor(), fontSize: 12, marginLeft: 8 }}>
                            {news.publish_date}
                          </span>
                        )}
                      </div>
                      <h3 style={{ 
                        color: getTextColor(), 
                        marginBottom: 8,
                        fontSize: 16,
                        fontWeight: 600
                      }}>
                        {news.title}
                      </h3>
                      {news.summary && (
                        <p style={{ 
                          color: theme === 'dark' ? '#a0aec0' : '#666',
                          marginBottom: 8,
                          lineHeight: 1.6
                        }}>
                          {news.summary}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
                        <a
                          href={news.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{ 
                            color: theme === 'dark' ? '#667eea' : '#1890ff',
                            fontSize: 12
                          }}
                        >
                          <GlobalOutlined /> 查看原文
                        </a>
                      </div>
                    </div>
                    <Button
                      type="text"
                      icon={news.is_favorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFavorite(news);
                      }}
                      style={{ marginLeft: 16 }}
                    />
                  </div>
                </Card>
              )}
            />
          )}
        </Spin>

        {total > 0 && (
          <div style={{ 
            marginTop: 24, 
            textAlign: 'center',
            padding: '16px',
            background: theme === 'dark' ? 'rgba(26, 31, 58, 0.5)' : '#fff',
            borderRadius: 8
          }}>
            <Pagination
              current={currentPage}
              total={total}
              pageSize={pageSize}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger={false}
              showTotal={(total) => `共 ${total} 条新闻`}
            />
          </div>
        )}
      </Content>
    </Layout>
  );
}

