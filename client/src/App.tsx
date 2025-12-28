import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Login from './pages/Login';
import Home from './pages/Home';
import CustomerList from './pages/customer/CustomerList';
import OpportunityList from './pages/sales/OpportunityList';
import VisitList from './pages/sales/VisitList';
import QAList from './pages/ai/QAList';
import ReportList from './pages/ai/ReportList';
import RequirementList from './pages/ai/RequirementList';
import OpportunityMining from './pages/ai/OpportunityMining';
import IndustryIntelligence from './pages/ai/IndustryIntelligence';
import { isAuthenticated } from './services/auth';
import { startAutoSync } from './services/sync';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

function PrivateRoute({ children }: { children: React.ReactNode }) {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" />;
}

function AppContent() {
  const { theme } = useTheme();

  useEffect(() => {
    // 启动自动同步（现在同步到Supabase，而不是后端API）
    if (isAuthenticated()) {
      // 增加同步间隔到60秒，减少请求频率
      const cleanup = startAutoSync(60000); // 每60秒同步一次

      return () => {
        if (cleanup) cleanup();
      };
    }
  }, []);

  return (
    <ConfigProvider 
      locale={zhCN}
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: theme === 'dark' ? '#667eea' : '#1890ff',
        }
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated() ? <Navigate to="/" replace /> : <Login />
            } 
          />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />
          {/* 客户管理路由 */}
          <Route path="/customer/:category" element={<PrivateRoute><CustomerList /></PrivateRoute>} />
          {/* 销售管理路由 */}
          <Route path="/sales/opportunity" element={<PrivateRoute><OpportunityList /></PrivateRoute>} />
          <Route path="/sales/visit" element={<PrivateRoute><VisitList /></PrivateRoute>} />
          {/* 销售AI路由 */}
          <Route path="/ai/qa" element={<PrivateRoute><QAList /></PrivateRoute>} />
          <Route path="/ai/report" element={<PrivateRoute><ReportList /></PrivateRoute>} />
          <Route path="/ai/requirement" element={<PrivateRoute><RequirementList /></PrivateRoute>} />
          <Route path="/ai/opportunity" element={<PrivateRoute><OpportunityMining /></PrivateRoute>} />
          <Route path="/ai/intelligence" element={<PrivateRoute><IndustryIntelligence /></PrivateRoute>} />
          <Route
            path="/*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;


