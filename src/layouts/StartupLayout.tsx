import { Outlet, Link, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Rocket,
  Target,
  User,
  Settings,
  LogOut,
  Bell,
  ChevronLeft,
  ShoppingCart,
  MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useBuildupContext } from '../contexts/BuildupContext';
import { useChatContext } from '../contexts/ChatContext';
import { NotificationBell } from '../components/notifications/NotificationBell';

const StartupLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cart } = useBuildupContext();
  const { totalUnreadCount } = useChatContext();
  
  // KPI 진단 페이지의 평가 탭인지 확인
  const isKPIAssessmentTab = location.pathname === '/startup/kpi' && 
    (!searchParams.get('tab') || searchParams.get('tab') === 'assess');
  
  console.log('StartupLayout rendering, location:', location.pathname);

  // MASTER_PLAN.md 기준 5개 메뉴 (Sprint 3 PRD v4.0)
  const menuItems = [
    { path: '/startup/dashboard', label: '대시보드', icon: LayoutDashboard },
    { path: '/startup/kpi', label: 'KPI 진단', icon: FileText },
    { path: '/startup/buildup', label: '포켓빌드업', icon: Rocket },
    { path: '/startup/matching', label: '스마트 매칭', icon: Target },
    { path: '/startup/profile', label: 'VDR/마이프로필', icon: User },
  ];

  return (
    <div className="flex h-screen bg-neutral-light" style={{ minHeight: '100vh', backgroundColor: '#f0f0f0' }}>
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
        
        <div className="p-6 border-t border-neutral-gray space-y-3">
          {/* Settings - moved to bottom */}
          <Link
            to="/startup/settings"
            className={`flex items-center gap-3 text-sm text-neutral-lighter hover:text-white transition-colors ${collapsed ? 'justify-center' : ''}`}
          >
            <Settings size={18} className="flex-shrink-0" />
            <span className={`${collapsed ? 'hidden' : 'block'}`}>설정</span>
          </Link>
          
          {/* Logout */}
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
              {menuItems.find(item => location.pathname.startsWith(item.path))?.label || 'Dashboard'}
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
              
              {/* Cart Icon */}
              <button
                onClick={() => navigate('/startup/cart')}
                className="relative p-2 text-neutral-gray hover:text-neutral-dark transition-colors"
              >
                <ShoppingCart size={20} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>

              {/* Messages Icon */}
              <button
                onClick={() => navigate('/startup/messages')}
                className="relative p-2 text-neutral-gray hover:text-neutral-dark transition-colors"
                title="메시지함"
              >
                <MessageSquare size={20} />
                {totalUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                    {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                  </span>
                )}
              </button>

              {/* Notification Bell */}
              <NotificationBell />

              {/* Profile Icon */}
              <button className="p-2 text-neutral-gray hover:text-neutral-dark transition-colors">
                <User size={20} />
              </button>
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