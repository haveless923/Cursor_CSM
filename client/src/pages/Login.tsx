import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { login } from '../services/auth';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/tech-theme.css';

export default function Login() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  const getBackgroundStyle = (): React.CSSProperties => {
    if (theme === 'dark') {
      return {
        background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1419 100%)',
        position: 'relative' as const,
        overflow: 'hidden' as const
      };
    }
    return {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    };
  };

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
      message.success('登录成功');
      navigate('/');
    } catch (error: any) {
      console.error('登录错误:', error);
      const errorMessage = error.response?.data?.error 
        || error.message 
        || (error.code === 'ECONNREFUSED' ? '无法连接到服务器，请检查服务器是否运行' : '登录失败，请检查用户名和密码');
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      ...getBackgroundStyle()
    }}>
      {theme === 'dark' && (
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.3) 0%, transparent 50%)',
          animation: 'pulse 4s ease-in-out infinite'
        }} />
      )}
      <Card
        className="tech-card"
        title={
          <h2 
            className={theme === 'dark' ? 'gradient-text' : ''} 
            style={{ 
              textAlign: 'center', 
              margin: 0, 
              fontSize: 24,
              color: theme === 'light' ? '#fff' : undefined
            }}
          >
            CSM 客户成功管理系统
          </h2>
        }
        style={{ 
          width: 420,
          position: 'relative',
          zIndex: 1,
          borderRadius: 16,
          boxShadow: theme === 'dark' 
            ? '0 20px 60px rgba(102, 126, 234, 0.4)' 
            : '0 10px 40px rgba(0, 0, 0, 0.2)'
        }}
        styles={{ body: { padding: '32px' } }}
      >
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#667eea' }} />}
              placeholder="用户名"
              bordered={false}
              style={{ 
                height: 44,
                fontSize: 15
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#667eea' }} />}
              placeholder="密码"
              bordered={false}
              style={{ 
                height: 44,
                fontSize: 15
              }}
            />
          </Form.Item>

          <Form.Item>
            <Button className="tech-button-primary" type="primary" htmlType="submit" block loading={loading} style={{ height: 44, fontSize: 16, fontWeight: 600 }}>
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ 
          marginTop: 24, 
          fontSize: 12, 
          color: theme === 'dark' ? '#a0aec0' : 'rgba(255, 255, 255, 0.8)', 
          textAlign: 'center', 
          lineHeight: 1.8 
        }}>
          <p style={{ 
            marginBottom: 8, 
            fontWeight: 600, 
            color: theme === 'dark' ? '#e0e7ff' : '#fff' 
          }}>
            默认账号：
          </p>
          <p style={{ margin: 4 }}>管理员：admin / admin123</p>
          <p style={{ margin: 4 }}>成员：member1 / member1123 (member1-5)</p>
        </div>
      </Card>
    </div>
  );
}


