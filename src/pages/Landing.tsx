import { useNavigate } from 'react-router-dom';
import { 
  Rocket, 
  Shield, 
  Users, 
  Building2,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface RoleCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  color: string;
  bgGradient: string;
  role: string;
}

const Landing = () => {
  const navigate = useNavigate();

  const roles: RoleCard[] = [
    {
      id: 'startup',
      title: '스타트업',
      subtitle: '성장을 꿈꾸는 스타트업',
      description: 'KPI 진단, 성장 분석, 프로그램 매칭',
      icon: Rocket,
      color: 'text-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      role: ''
    },
    {
      id: 'admin',
      title: '관리자',
      subtitle: '플랫폼 운영 관리자',
      description: 'KPI 관리, 정책 설정, 품질 모니터링',
      icon: Shield,
      color: 'text-indigo-600',
      bgGradient: 'from-indigo-50 to-indigo-100',
      role: 'admin'
    },
    {
      id: 'internal-builder',
      title: '내부 빌더',
      subtitle: '포켓비즈 빌드업 팀',
      description: '담당 스타트업 관리, 성과 분석',
      icon: Users,
      color: 'text-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
      role: 'internal-builder'
    },
    {
      id: 'partner',
      title: '외부 빌더',
      subtitle: '파트너사 프로그램 제공자',
      description: '프로그램 관리, 매칭 스타트업 조회',
      icon: Building2,
      color: 'text-green-600',
      bgGradient: 'from-green-50 to-green-100',
      role: 'partner'
    }
  ];

  const handleRoleSelect = (role: string) => {
    if (role) {
      window.location.href = `/?role=${role}`;
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="pt-16 pb-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-white rounded-2xl shadow-lg">
            <Sparkles className="h-12 w-12 text-blue-600" />
          </div>
        </div>
        
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          포켓비즈
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          스타트업 성장 네비게이션 플랫폼
        </p>
        <p className="text-sm text-gray-500">
          데모 환경 - 역할을 선택하여 각 사용자 환경을 체험해보세요
        </p>
      </div>

      {/* Role Cards */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.id}
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer overflow-hidden"
                onClick={() => handleRoleSelect(role.role)}
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${role.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                {/* Content */}
                <div className="relative p-8">
                  <div className={`inline-flex p-3 rounded-xl bg-white shadow-md mb-4 ${role.color}`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {role.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {role.subtitle}
                  </p>
                  <p className="text-sm text-gray-600 mb-6 h-12">
                    {role.description}
                  </p>
                  
                  <button className="w-full py-3 px-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center group/btn">
                    <span>입장하기</span>
                    <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
                
                {/* Hover Effect Border */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-gray-200 rounded-2xl transition-colors pointer-events-none" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            역할별 주요 기능
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">기능</th>
                  <th className="text-center py-3 px-4 font-medium text-blue-600">스타트업</th>
                  <th className="text-center py-3 px-4 font-medium text-indigo-600">관리자</th>
                  <th className="text-center py-3 px-4 font-medium text-purple-600">내부 빌더</th>
                  <th className="text-center py-3 px-4 font-medium text-green-600">외부 빌더</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">KPI 진단</td>
                  <td className="text-center py-3 px-4">✅</td>
                  <td className="text-center py-3 px-4">👁️</td>
                  <td className="text-center py-3 px-4">👁️</td>
                  <td className="text-center py-3 px-4">-</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">프로그램 관리</td>
                  <td className="text-center py-3 px-4">-</td>
                  <td className="text-center py-3 px-4">✅</td>
                  <td className="text-center py-3 px-4">✅</td>
                  <td className="text-center py-3 px-4">⚠️</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">데이터 접근</td>
                  <td className="text-center py-3 px-4">⚠️</td>
                  <td className="text-center py-3 px-4">✅</td>
                  <td className="text-center py-3 px-4">✅</td>
                  <td className="text-center py-3 px-4">⚠️</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700">매칭 시스템</td>
                  <td className="text-center py-3 px-4">✅</td>
                  <td className="text-center py-3 px-4">✅</td>
                  <td className="text-center py-3 px-4">✅</td>
                  <td className="text-center py-3 px-4">👁️</td>
                </tr>
              </tbody>
            </table>
            
            <div className="mt-4 flex gap-4 text-sm text-gray-500">
              <span>✅ 전체 권한</span>
              <span>⚠️ 제한적 권한</span>
              <span>👁️ 읽기 전용</span>
              <span>- 접근 불가</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-gray-500 text-sm">
        <p>© 2025 PocketBiz. Demo Environment v4.0</p>
        <p className="mt-2">
          문의: admin@pocketbiz.io | 
          <a href="https://github.com/parkJH-0505/pocketbiz-platform" className="ml-1 text-blue-600 hover:underline">
            GitHub
          </a>
        </p>
      </div>
    </div>
  );
};

export default Landing;