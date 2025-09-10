import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Home,
  Users,
  Briefcase,
  BarChart3,
  Target,
  FileText,
  Settings,
  LogOut,
  Building2
} from 'lucide-react';

const InternalBuilderLayout = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/internal-builder/dashboard', label: '대시보드', icon: Home },
    { path: '/internal-builder/startups', label: '담당 스타트업', icon: Building2 },
    { path: '/internal-builder/programs', label: '빌드업 프로그램', icon: Briefcase },
    { path: '/internal-builder/matching', label: '스마트 매칭', icon: Target },
    { path: '/internal-builder/analytics', label: '성과 분석', icon: BarChart3 },
    { path: '/internal-builder/reports', label: '리포트', icon: FileText },
    { path: '/internal-builder/resources', label: '내부 자료실', icon: Users },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-purple-800 to-purple-900">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white">포켓 빌더</h1>
          <p className="text-sm text-purple-200 mt-1">내부 빌더 환경</p>
        </div>
        
        <nav className="mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-purple-700 text-white border-l-4 border-white'
                    : 'text-purple-100 hover:bg-purple-700 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="absolute bottom-0 w-64 p-6 border-t border-purple-700">
          <Link
            to="/internal-builder/settings"
            className="flex items-center text-purple-100 hover:text-white mb-4"
          >
            <Settings className="h-5 w-5 mr-3" />
            설정
          </Link>
          <button className="flex items-center text-purple-100 hover:text-white">
            <LogOut className="h-5 w-5 mr-3" />
            로그아웃
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default InternalBuilderLayout;