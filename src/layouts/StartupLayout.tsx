import { Outlet, Link, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, Suspense } from 'react';
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
  ChevronRight,
  ShoppingCart,
  MessageSquare,
  GraduationCap,
  Calendar,
  Wrench,
  Bot,
  FolderLock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useBuildupContext } from '../contexts/BuildupContext';
import { useChatContext } from '../contexts/ChatContext';
import { NotificationBell } from '../components/notifications/NotificationBell';

// 프로필 카드 지연 로딩
const ProfileCard = React.lazy(() => import('../components/dashboard/ProfileCard'));

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

  // 대시보드 페이지인지 확인
  const isDashboardPage = location.pathname === '/startup/dashboard';

  if (import.meta.env.DEV) {
    console.log('StartupLayout rendering, location:', location.pathname);
  }

  // MASTER_PLAN.md 기준 5개 메뉴 (Sprint 3 PRD v4.0) + 추가 메뉴 4개
  const menuItems: Array<{
    path: string;
    label: string;
    icon: any;
    subItems?: Array<{ path: string; label: string }>;
  }> = [
    { path: '/startup/dashboard', label: '대시보드', icon: LayoutDashboard },
    {
      path: '/startup/kpi',
      label: 'KPI 진단',
      icon: FileText,
      subItems: [
        { path: '/startup/kpi?tab=assess', label: '진단하기' },
        { path: '/startup/kpi?tab=insights', label: '결과 & 인사이트' },
        { path: '/startup/kpi?tab=action', label: '액션플랜' }
      ]
    },
    {
      path: '/startup/matching',
      label: '스마트 매칭',
      icon: Target,
      subItems: [
        { path: '/startup/matching/custom', label: '맞춤 추천' },
        { path: '/startup/matching/all', label: '전체 기회' }
      ]
    },
    {
      path: '/startup/buildup',
      label: '포켓빌드업',
      icon: Rocket,
      subItems: [
        { path: '/startup/buildup/dashboard', label: '대시보드' },
        { path: '/startup/buildup/catalog', label: '카탈로그' },
        { path: '/startup/buildup/calendar', label: '빌드업 캘린더' }
      ]
    },
    {
      path: '/startup/vdr',
      label: 'VDR/마이프로필',
      icon: FolderLock,
      subItems: [
        { path: '/startup/vdr', label: '문서 관리' },
        { path: '/startup/vdr?tab=investor', label: '투자자 & NDA 관리' },
        { path: '/startup/vdr?tab=profile', label: '마이프로필' }
      ]
    },
  ];

  return (
    <div className="flex h-screen bg-neutral-light" style={{ minHeight: '100vh', backgroundColor: '#f0f0f0' }}>
      {/* Sidebar */}
      <div className={`${collapsed ? 'w-20' : 'w-64'} bg-neutral-dark transition-all duration-300 ease-in-out relative flex flex-col`}>
        <div className="p-6 border-b border-neutral-gray">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
            <div className={`${collapsed ? 'hidden' : 'block'}`}>
              <h1 className="text-xl font-bold text-white">PocketBiz</h1>
              <p className="text-sm text-neutral-lighter mt-1">스타트업 올인원 성장 OS</p>
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
            const isActive = location.pathname.startsWith(item.path);
            const hasSubItems = item.subItems && item.subItems.length > 0;

            return (
              <div
                key={item.path}
                className="relative group"
              >
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-6 py-3.5 mx-3 rounded-xl text-sm font-medium
                             transition-all duration-300 ease-out relative overflow-hidden group/main ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-main to-primary-main/90 text-white shadow-lg shadow-primary-main/25 scale-[1.02]'
                      : 'text-neutral-lighter hover:bg-gradient-to-r hover:from-neutral-gray hover:to-neutral-gray/80 hover:text-white hover:scale-[1.02] hover:shadow-md'
                  }`}
                  title={collapsed ? item.label : ''}
                >
                  {/* Hover effect background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-main/10 to-transparent
                                  opacity-0 group-hover/main:opacity-100 transition-opacity duration-300"></div>

                  <Icon size={20} className={`flex-shrink-0 relative z-10 transition-transform duration-200 ${
                    isActive ? 'text-white' : 'group-hover/main:scale-110'
                  }`} />
                  <span className={`${collapsed ? 'hidden' : 'block'} truncate relative z-10 transition-all duration-200`}>
                    {item.label}
                  </span>
                  {hasSubItems && !collapsed && (
                    <ChevronRight className={`w-3 h-3 ml-auto relative z-10 transition-all duration-300 ease-out
                                              group-hover:rotate-90 group-hover:text-primary-light ${
                                                isActive ? 'text-white' : 'text-neutral-lighter'
                                              }`} />
                  )}
                </Link>

                {/* 아코디언 드롭다운 메뉴 - 개선된 UX */}
                {hasSubItems && !collapsed && (
                  <div className="overflow-hidden max-h-0 group-hover:max-h-96 transition-all duration-500 ease-out
                                  mx-3 mt-1 bg-gradient-to-r from-neutral-gray/30 to-neutral-gray/10
                                  rounded-lg border-l-2 border-primary-main/30 backdrop-blur-sm">
                    <div className="py-2 space-y-1">
                      {item.subItems?.map((subItem, index) => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className="group/item flex items-center px-4 py-2.5 mx-2 text-sm text-neutral-lighter
                                     hover:bg-primary-main/10 hover:text-white transition-all duration-200 ease-out
                                     rounded-md border-l-2 border-transparent hover:border-primary-main
                                     transform hover:translate-x-1 hover:scale-[1.02]"
                          style={{
                            transitionDelay: `${index * 50}ms`
                          }}
                        >
                          <div className="w-1.5 h-1.5 bg-primary-main/60 rounded-full mr-3
                                          group-hover/item:bg-primary-main transition-colors duration-200"></div>
                          <span className="font-medium">{subItem.label}</span>
                          <div className="ml-auto opacity-0 group-hover/item:opacity-100 transition-opacity duration-200">
                            <ChevronRight className="w-3 h-3 text-primary-main" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 축소 모드에서의 툴팁 드롭다운 */}
                {hasSubItems && collapsed && (
                  <div className="absolute left-full top-0 ml-2 bg-neutral-dark border border-neutral-gray rounded-lg shadow-xl
                                  overflow-hidden max-h-0 group-hover:max-h-96 transition-all duration-300 ease-in-out"
                       style={{ zIndex: 9999 }}>
                    <div className="px-4 py-2 border-b border-neutral-gray">
                      <p className="text-sm font-medium text-white">{item.label}</p>
                    </div>
                    <div className="py-2">
                      {item.subItems?.map((subItem) => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className="block px-4 py-2 text-sm text-neutral-lighter hover:bg-neutral-gray hover:text-white transition-colors whitespace-nowrap"
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        
        {/* Additional Menu Items */}
        <div className="py-3">
          {/* Section Header */}
          {!collapsed && (
            <div className="px-6 mb-3">
              <p className="text-xs text-neutral-lighter/70 font-medium uppercase tracking-wider">
                추후 서비스
              </p>
            </div>
          )}
          <Link
            to="/startup/mentor"
            className={`flex items-center gap-3 px-6 py-3.5 mx-3 rounded-xl text-sm font-medium
                       transition-all duration-300 ease-out relative overflow-hidden group/main
                       text-neutral-lighter hover:bg-gradient-to-r hover:from-neutral-gray hover:to-neutral-gray/80 hover:text-white hover:scale-[1.02] hover:shadow-md
                       ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? '포켓 멘토(강의/캠프)' : ''}
          >
            {/* Hover effect background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-main/10 to-transparent
                            opacity-0 group-hover/main:opacity-100 transition-opacity duration-300"></div>

            <GraduationCap size={20} className={`flex-shrink-0 relative z-10 transition-transform duration-200 group-hover/main:scale-110`} />
            <span className={`${collapsed ? 'hidden' : 'block'} truncate relative z-10 transition-all duration-200`}>
              포켓 멘토(강의/캠프)
            </span>
          </Link>

          <Link
            to="/startup/pocket-day"
            className={`flex items-center gap-3 px-6 py-3.5 mx-3 rounded-xl text-sm font-medium
                       transition-all duration-300 ease-out relative overflow-hidden group/main
                       text-neutral-lighter hover:bg-gradient-to-r hover:from-neutral-gray hover:to-neutral-gray/80 hover:text-white hover:scale-[1.02] hover:shadow-md
                       ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? '포켓 데이' : ''}
          >
            {/* Hover effect background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-main/10 to-transparent
                            opacity-0 group-hover/main:opacity-100 transition-opacity duration-300"></div>

            <Calendar size={20} className={`flex-shrink-0 relative z-10 transition-transform duration-200 group-hover/main:scale-110`} />
            <span className={`${collapsed ? 'hidden' : 'block'} truncate relative z-10 transition-all duration-200`}>
              포켓 데이
            </span>
          </Link>

          <Link
            to="/startup/pocket-builder"
            className={`flex items-center gap-3 px-6 py-3.5 mx-3 rounded-xl text-sm font-medium
                       transition-all duration-300 ease-out relative overflow-hidden group/main
                       text-neutral-lighter hover:bg-gradient-to-r hover:from-neutral-gray hover:to-neutral-gray/80 hover:text-white hover:scale-[1.02] hover:shadow-md
                       ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? '포켓 빌더(다음 버전/이번 X)' : ''}
          >
            {/* Hover effect background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-main/10 to-transparent
                            opacity-0 group-hover/main:opacity-100 transition-opacity duration-300"></div>

            <Wrench size={20} className={`flex-shrink-0 relative z-10 transition-transform duration-200 group-hover/main:scale-110`} />
            <span className={`${collapsed ? 'hidden' : 'block'} truncate relative z-10 transition-all duration-200`}>
              포켓 빌더(다음 버전/이번 X)
            </span>
          </Link>

          <Link
            to="/startup/connect-ai"
            className={`flex items-center gap-3 px-6 py-3.5 mx-3 rounded-xl text-sm font-medium
                       transition-all duration-300 ease-out relative overflow-hidden group/main
                       text-neutral-lighter hover:bg-gradient-to-r hover:from-neutral-gray hover:to-neutral-gray/80 hover:text-white hover:scale-[1.02] hover:shadow-md
                       ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? '커넥트AI' : ''}
          >
            {/* Hover effect background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-main/10 to-transparent
                            opacity-0 group-hover/main:opacity-100 transition-opacity duration-300"></div>

            <Bot size={20} className={`flex-shrink-0 relative z-10 transition-transform duration-200 group-hover/main:scale-110`} />
            <span className={`${collapsed ? 'hidden' : 'block'} truncate relative z-10 transition-all duration-200`}>
              커넥트AI
            </span>
          </Link>
        </div>

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