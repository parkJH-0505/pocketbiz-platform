import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Target, Grid } from 'lucide-react';

const SmartMatchingContainer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname.includes('all') ? 'all' : 'custom';

  const tabs = [
    { id: 'custom', label: '맞춤 추천', icon: Target, path: '/startup/matching/custom' },
    { id: 'all', label: '전체 기회', icon: Grid, path: '/startup/matching/all' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl font-bold py-4">스마트 매칭</h1>
          <nav className="flex gap-8">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={`py-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </div>
    </div>
  );
};

export default SmartMatchingContainer;