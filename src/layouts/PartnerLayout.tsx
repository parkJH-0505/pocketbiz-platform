import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Briefcase, 
  Users,
  LogOut
} from 'lucide-react';

const PartnerLayout = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/partner/programs', label: '프로그램 관리', icon: Briefcase },
    { path: '/partner/candidates', label: '추천 스타트업', icon: Users },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-green-700 to-green-800">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white">파트너 포털</h1>
          <p className="text-sm text-green-200 mt-1">외부 빌더 환경</p>
        </div>
        
        <nav className="mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-700 text-white border-l-3 border-green-400'
                    : 'text-green-100 hover:bg-green-700 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <button className="flex items-center gap-3 text-sm text-green-200 hover:text-white">
            <LogOut size={18} />
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

export default PartnerLayout;