import { useEffect, useState } from 'react';
import { 
  Rocket, 
  Shield, 
  Users, 
  Building2,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Target,
  FileText,
  CheckCircle,
  ChevronDown,
  Zap,
  BarChart3,
  GitBranch,
  Database
} from 'lucide-react';

const LandingV2 = () => {
  const [activeSection, setActiveSection] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const problems = [
    { icon: Database, text: "정보 과잉 속 실행 부재" },
    { icon: GitBranch, text: "일회성 진단, 단절된 지원" },
    { icon: Target, text: "측정-개선-검증 사이클 없음" }
  ];

  const integrations = [
    { name: "진단 도구", delay: 0 },
    { name: "실행 프로그램", delay: 0.2 },
    { name: "매칭 플랫폼", delay: 0.4 },
    { name: "문서 관리", delay: 0.6 },
    { name: "성과 추적", delay: 0.8 }
  ];

  const weeklyFlow = [
    { day: "월", task: "대시보드에서 '이번 주 할 일' 확인", icon: BarChart3 },
    { day: "화", task: "KPI 업데이트하며 개선점 발견", icon: TrendingUp },
    { day: "수", task: "매칭된 프로그램 신청", icon: Target },
    { day: "목", task: "빌드업 프로젝트 진행", icon: Rocket },
    { day: "금", task: "VDR로 투자자와 공유", icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-600/20 via-transparent to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-600/20 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className={`min-h-screen flex items-center justify-center px-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="max-w-7xl mx-auto text-center">
            {/* Glowing Logo */}
            <div className="mb-8 inline-block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur-xl opacity-60 animate-pulse" />
                <div className="relative bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                  <Sparkles className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold mb-4 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
              포켓비즈
            </h1>
            <p className="text-2xl md:text-3xl text-gray-400 mb-2">
              스타트업 성장 OS
            </p>
            <p className="text-lg text-gray-500 mb-12">
              측정→진단→처방→실행→검증의 완전한 사이클
            </p>

            {/* Key Features Pills */}
            <div className="flex justify-center gap-4 mb-12">
              <div className="px-6 py-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-xl border border-purple-500/30 rounded-full">
                <span className="text-purple-300">정보가 아닌 실행</span>
              </div>
              <div className="px-6 py-3 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 backdrop-blur-xl border border-blue-500/30 rounded-full">
                <span className="text-blue-300">선택이 아닌 따름</span>
              </div>
            </div>

            {/* Scroll Indicator */}
            <div className="animate-bounce">
              <ChevronDown className="h-8 w-8 text-gray-600 mx-auto" />
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="min-h-screen flex items-center justify-center px-8 py-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-5xl font-bold text-center mb-16">
              <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                스타트업은 성장 방법을 알아도
              </span>
              <br />
              <span className="text-white">실행하지 못합니다</span>
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {problems.map((problem, index) => {
                const Icon = problem.icon;
                return (
                  <div
                    key={index}
                    className="group relative"
                    style={{ animationDelay: `${index * 200}ms` }}
                  >
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-orange-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Card */}
                    <div className="relative bg-black/40 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 hover:border-red-500/40 transition-all duration-300">
                      <Icon className="h-12 w-12 text-red-400 mb-4" />
                      <p className="text-xl text-gray-300">{problem.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Solution Integration Section */}
        <section className="min-h-screen flex items-center justify-center px-8 py-20">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-5xl font-bold mb-16">
              <span className="text-white">분산된 5가지를</span>
              <br />
              <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                하나로 통합
              </span>
            </h2>

            {/* Integration Diagram */}
            <div className="relative mb-20">
              {/* Center Hub */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl blur-2xl animate-pulse" />
                  <div className="relative bg-black/80 backdrop-blur-xl border-2 border-transparent bg-clip-padding rounded-3xl p-8"
                       style={{ backgroundImage: 'linear-gradient(black, black), linear-gradient(135deg, #9333ea, #3b82f6)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' }}>
                    <h3 className="text-2xl font-bold text-white mb-2">포켓비즈</h3>
                    <p className="text-gray-400">성장 OS</p>
                  </div>
                </div>
              </div>

              {/* Orbiting Elements */}
              <div className="relative h-96 w-full max-w-2xl mx-auto">
                {integrations.map((item, index) => {
                  const angle = (index * 72) - 90; // 360/5 = 72 degrees per item
                  const radius = 180;
                  const x = Math.cos(angle * Math.PI / 180) * radius;
                  const y = Math.sin(angle * Math.PI / 180) * radius;
                  
                  return (
                    <div
                      key={index}
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        transform: `translate(${x}px, ${y}px)`,
                        animation: `fadeInScale 0.5s ease-out ${item.delay}s both`
                      }}
                    >
                      <div className="group cursor-pointer">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-blue-600/30 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative bg-black/60 backdrop-blur-xl border border-white/20 rounded-xl px-4 py-3 hover:border-white/40 transition-all duration-300">
                          <span className="text-sm text-gray-300 whitespace-nowrap">{item.name}</span>
                        </div>
                      </div>
                      
                      {/* Connection Line */}
                      <svg
                        className="absolute top-1/2 left-1/2 -z-10"
                        style={{
                          width: `${Math.abs(x)}px`,
                          height: `${Math.abs(y)}px`,
                          transform: `translate(${x < 0 ? '0' : '-100'}%, ${y < 0 ? '0' : '-100'}%)`
                        }}
                      >
                        <line
                          x1={x < 0 ? Math.abs(x) : 0}
                          y1={y < 0 ? Math.abs(y) : 0}
                          x2={x < 0 ? 0 : Math.abs(x)}
                          y2={y < 0 ? 0 : Math.abs(y)}
                          stroke="url(#gradient)"
                          strokeWidth="1"
                          strokeDasharray="5,5"
                          className="animate-pulse"
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#9333ea" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Result */}
            <div className="inline-block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-600/30 to-emerald-600/30 rounded-2xl blur-xl" />
                <div className="relative bg-black/60 backdrop-blur-xl border border-green-500/30 rounded-2xl px-8 py-4">
                  <p className="text-xl text-green-400 font-medium">
                    = 하나의 플랫폼에서 끊김 없이
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Weekly Flow Section */}
        <section className="min-h-screen flex items-center justify-center px-8 py-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-5xl font-bold text-center mb-16">
              <span className="text-white">매주 반복되는</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
                성장 루틴
              </span>
            </h2>

            <div className="space-y-4">
              {weeklyFlow.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className="group relative overflow-hidden"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Background Gradient Animation */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-transparent rounded-2xl transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
                    
                    {/* Card Content */}
                    <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex items-center gap-6 hover:border-white/20 transition-all duration-300">
                      {/* Day Badge */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-purple-600/30">
                          {item.day}
                        </div>
                      </div>
                      
                      {/* Task */}
                      <div className="flex-grow">
                        <p className="text-xl text-gray-200">{item.task}</p>
                      </div>
                      
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <Icon className="h-8 w-8 text-blue-400" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Result Arrow */}
            <div className="mt-12 text-center">
              <ArrowRight className="h-8 w-8 text-gray-600 mx-auto mb-4 rotate-90" />
              <div className="inline-block">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600/30 to-emerald-600/30 rounded-2xl blur-xl animate-pulse" />
                  <div className="relative bg-black/60 backdrop-blur-xl border border-green-500/30 rounded-2xl px-8 py-4">
                    <p className="text-2xl text-green-400 font-bold">
                      매주 성장
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Checklist */}
        <section className="min-h-screen flex items-center justify-center px-8 py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold text-center mb-16">
              <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                통합된 기능
              </span>
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                "KPI 진단 시스템",
                "빌드업 실행 관리",
                "정부지원 매칭",
                "투자자 문서 공유",
                "성과 트래킹",
                "자동화된 워크플로우"
              ].map((feature, index) => (
                <div
                  key={index}
                  className="group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative bg-black/40 backdrop-blur-xl border border-green-500/20 rounded-xl p-4 flex items-center gap-4 hover:border-green-500/40 transition-all duration-300">
                      <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                      <span className="text-lg text-gray-200">{feature}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Core Principles */}
        <section className="min-h-screen flex items-center justify-center px-8 py-20">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-5xl font-bold mb-16">
              <span className="text-white">핵심 원칙</span>
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "선택 피로 제거",
                  description: "따라가기만 하면 됨",
                  icon: Zap,
                  color: "purple"
                },
                {
                  title: "실행 중심",
                  description: "모든 인사이트는 액션으로",
                  icon: Rocket,
                  color: "blue"
                },
                {
                  title: "증빙 기반",
                  description: "측정 가능한 것만 관리",
                  icon: Shield,
                  color: "cyan"
                }
              ].map((principle, index) => {
                const Icon = principle.icon;
                const colorClasses = {
                  purple: "from-purple-600/20 to-pink-600/20 border-purple-500/30 text-purple-400",
                  blue: "from-blue-600/20 to-cyan-600/20 border-blue-500/30 text-blue-400",
                  cyan: "from-cyan-600/20 to-teal-600/20 border-cyan-500/30 text-cyan-400"
                };
                
                return (
                  <div
                    key={index}
                    className="group relative"
                    style={{ animationDelay: `${index * 200}ms` }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[principle.color as keyof typeof colorClasses].split(' ')[0]} ${colorClasses[principle.color as keyof typeof colorClasses].split(' ')[1]} rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
                    
                    <div className={`relative bg-black/40 backdrop-blur-xl border ${colorClasses[principle.color as keyof typeof colorClasses].split(' ')[2]} rounded-2xl p-8 hover:scale-105 transition-all duration-300`}>
                      <Icon className={`h-12 w-12 ${colorClasses[principle.color as keyof typeof colorClasses].split(' ')[3]} mb-4 mx-auto`} />
                      <h3 className="text-xl font-bold text-white mb-2">{principle.title}</h3>
                      <p className="text-gray-400">{principle.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="min-h-screen flex items-center justify-center px-8 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl font-bold mb-8">
              <span className="text-white">어떤 입장에서</span>
              <br />
              <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                보시겠습니까?
              </span>
            </h2>

            <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
              {/* Main CTA */}
              <button
                onClick={() => window.location.href = '/?role=startup'}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl px-12 py-6 transform group-hover:scale-105 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <Rocket className="h-8 w-8 text-white" />
                    <span className="text-2xl font-bold text-white">스타트업으로 체험</span>
                    <ArrowRight className="h-6 w-6 text-white group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </div>
              </button>

              {/* Secondary CTAs */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => window.location.href = '/?role=admin'}
                  className="group"
                >
                  <div className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-xl px-6 py-3 hover:border-white/40 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-300">관리자 환경</span>
                    </div>
                  </div>
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={() => window.location.href = '/?role=internal-builder'}
                    className="group"
                  >
                    <div className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-xl px-4 py-2 hover:border-white/40 transition-all duration-300">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-300">내부 빌더</span>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => window.location.href = '/?role=partner'}
                    className="group"
                  >
                    <div className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-xl px-4 py-2 hover:border-white/40 transition-all duration-300">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-300">외부 빌더</span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Add custom styles */}
      <style jsx>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default LandingV2;