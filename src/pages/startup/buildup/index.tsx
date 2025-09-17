import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Calendar
} from 'lucide-react';

export default function BuildupLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      id: 'dashboard',
      label: '프로젝트 대시보드',
      icon: LayoutDashboard,
      path: '/startup/buildup/dashboard'
    },
    {
      id: 'catalog',
      label: '카탈로그',
      icon: ShoppingBag,
      path: '/startup/buildup/catalog'
    },
    {
      id: 'calendar',
      label: '빌드업 캘린더',
      icon: Calendar,
      path: '/startup/buildup/calendar'
    }
  ];

  const currentTab = tabs.find(tab => location.pathname === tab.path) || tabs[0];

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab.id === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                    transition-colors
                    ${isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}