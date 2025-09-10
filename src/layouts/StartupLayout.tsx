import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  ChartPie, 
  Sparkles, 
  History, 
  Settings,
  LogOut
} from 'lucide-react';

const StartupLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const menuItems = [
    { path: '/startup/dashboard', label: '대시보드', icon: LayoutDashboard },
    { path: '/startup/assessments', label: '진단', icon: FileText },
    { path: '/startup/results', label: '결과', icon: ChartPie },
    { path: '/startup/matches', label: '추천 & 매칭', icon: Sparkles },
    { path: '/startup/history', label: '히스토리', icon: History },
    { path: '/startup/settings', label: '설정', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-neutral-light">
      {/* Sidebar */}
      <div className={`${collapsed ? 'w-20' : 'w-64'} bg-neutral-dark transition-all duration-300 ease-in-out relative flex flex-col`}>
        <div className="p-6 border-b border-neutral-gray">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
            <div className={`${collapsed ? 'hidden' : 'block'}`}>
              <h1 className="text-xl font-bold text-white">Startup Hub</h1>
              <p className="text-sm text-neutral-lighter mt-1">스타트업 평가 시스템</p>
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-neutral-lighter hover:text-white transition-colors p-2 hover:bg-neutral-gray rounded-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {collapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-6 py-3 mx-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary-main text-white shadow-md'
                    : 'text-neutral-lighter hover:bg-neutral-gray hover:text-white'
                }`}
                title={collapsed ? item.label : ''}
              >
                <Icon size={20} className="flex-shrink-0" />
                <span className={`${collapsed ? 'hidden' : 'block'} truncate`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-6 border-t border-neutral-gray">
          <button className={`flex items-center gap-3 text-sm text-neutral-lighter hover:text-white transition-colors w-full ${collapsed ? 'justify-center' : ''}`}>
            <LogOut size={18} className="flex-shrink-0" />
            <span className={`${collapsed ? 'hidden' : 'block'}`}>로그아웃</span>
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-neutral-border px-8 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-dark">
              {menuItems.find(item => location.pathname === item.path)?.label || 'Dashboard'}
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-neutral-gray">
                {new Date().toLocaleDateString('ko-KR', { 
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </span>
            </div>
          </div>
        </div>
        
        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-neutral-light">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default StartupLayout;