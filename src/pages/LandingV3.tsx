import { useEffect, useState, useRef } from 'react';
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
  Database,
  Activity,
  Globe,
  Lock,
  Star,
  Code,
  Layers,
  Eye,
  Heart,
  Share2,
  Download,
  Clock,
  Award
} from 'lucide-react';

const LandingV3 = () => {
  const [activeSection, setActiveSection] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      setScrollProgress((currentScroll / scrollHeight) * 100);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const problems = [
    { icon: Database, text: "정보 과잉 속 실행 부재", metric: "87%", label: "실행 실패율" },
    { icon: GitBranch, text: "일회성 진단, 단절된 지원", metric: "3.2개월", label: "평균 정체" },
    { icon: Target, text: "측정-개선-검증 사이클 없음", metric: "92%", label: "반복 실패" }
  ];

  const integrations = [
    { name: "진단 도구", icon: Activity, delay: 0, color: "from-purple-500 to-pink-500" },
    { name: "실행 프로그램", icon: Rocket, delay: 0.2, color: "from-blue-500 to-cyan-500" },
    { name: "매칭 플랫폼", icon: Target, delay: 0.4, color: "from-green-500 to-emerald-500" },
    { name: "문서 관리", icon: FileText, delay: 0.6, color: "from-orange-500 to-red-500" },
    { name: "성과 추적", icon: TrendingUp, delay: 0.8, color: "from-indigo-500 to-purple-500" }
  ];

  const weeklyFlow = [
    { day: "월", task: "대시보드에서 '이번 주 할 일' 확인", icon: BarChart3, color: "from-blue-600 to-blue-400" },
    { day: "화", task: "KPI 업데이트하며 개선점 발견", icon: TrendingUp, color: "from-purple-600 to-purple-400" },
    { day: "수", task: "매칭된 프로그램 신청", icon: Target, color: "from-green-600 to-green-400" },
    { day: "목", task: "빌드업 프로젝트 진행", icon: Rocket, color: "from-orange-600 to-orange-400" },
    { day: "금", task: "VDR로 투자자와 공유", icon: FileText, color: "from-red-600 to-red-400" }
  ];

  const features = [
    { name: "KPI 진단 시스템", icon: Activity, stat: "41개", unit: "핵심 지표" },
    { name: "빌드업 실행 관리", icon: Rocket, stat: "25개", unit: "클러스터" },
    { name: "정부지원 매칭", icon: Award, stat: "85%", unit: "매칭률" },
    { name: "투자자 문서 공유", icon: Lock, stat: "실시간", unit: "암호화" },
    { name: "성과 트래킹", icon: BarChart3, stat: "5축", unit: "분석" },
    { name: "자동화 워크플로우", icon: Zap, stat: "24/7", unit: "자동화" }
  ];

  const stats = [
    { value: "1,247", label: "활성 스타트업", trend: "+23%" },
    { value: "82%", label: "성장 성공률", trend: "+15%" },
    { value: "3.2개월", label: "평균 단축", trend: "-45%" },
    { value: "37억", label: "매칭 성공", trend: "+67%" }
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-black overflow-hidden">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 z-50">
        <div 
          className="h-full bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Animated Cursor Follower */}
      <div 
        className="fixed w-96 h-96 rounded-full pointer-events-none z-0 transition-all duration-1000 ease-out"
        style={{
          left: `${mousePosition.x - 192}px`,
          top: `${mousePosition.y - 192}px`,
          background: `radial-gradient(circle at center, rgba(147, 97, 253, 0.1) 0%, transparent 70%)`,
          filter: 'blur(40px)'
        }}
      />

      {/* Particle Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Gradient Orbs */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-0 -right-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-40 left-20 w-80 h-80 bg-cyan-600 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section with Parallax */}
        <section className={`min-h-screen flex items-center justify-center px-8 transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="max-w-7xl mx-auto text-center">
            {/* Floating Badge */}
            <div className="mb-8 inline-block animate-float">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
                <div className="relative bg-black/80 backdrop-blur-2xl border border-white/10 rounded-full px-6 py-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                  <span className="text-sm text-gray-300">Live Platform</span>
                </div>
              </div>
            </div>

            {/* Glowing Logo with Rotation */}
            <div className="mb-8 inline-block">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl blur-3xl opacity-60 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" />
                <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 transform transition-all duration-700 group-hover:rotate-3">
                  <Sparkles className="h-16 w-16 text-white animate-pulse" />
                </div>
              </div>
            </div>

            {/* Animated Title */}
            <h1 className="text-7xl md:text-9xl font-bold mb-6">
              <span className="inline-block animate-gradient bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent bg-300% animate-gradient">
                포켓비즈
              </span>
            </h1>
            
            {/* Subtitle with Typewriter Effect */}
            <div className="mb-4">
              <p className="text-3xl md:text-4xl text-gray-300 font-light">
                스타트업 성장 OS
              </p>
            </div>
            
            {/* Animated Description */}
            <p className="text-lg md:text-xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
              측정→진단→처방→실행→검증의 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400"> 완전한 사이클</span>
            </p>

            {/* Interactive Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-16">
              {["정보가 아닌 실행", "선택이 아닌 따름", "AI 기반 자동화"].map((text, i) => (
                <div
                  key={i}
                  className="group relative"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-blue-600/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                  <div className="relative px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer">
                    <span className="text-sm font-medium text-gray-300">{text}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Animated Scroll Indicator */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-20 w-px mx-auto" />
              <ChevronDown className="h-8 w-8 text-gray-600 mx-auto animate-bounce" />
            </div>
          </div>
        </section>

        {/* Problem Section with Cards */}
        <section className="min-h-screen flex items-center justify-center px-8 py-20">
          <div className="max-w-7xl mx-auto">
            {/* Section Title with Underline Animation */}
            <div className="text-center mb-20">
              <h2 className="text-6xl font-bold mb-4">
                <span className="text-white">스타트업은 </span>
                <span className="relative">
                  <span className="relative z-10 bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                    성장 방법을 알아도
                  </span>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                </span>
              </h2>
              <h2 className="text-6xl font-bold text-white">실행하지 못합니다</h2>
            </div>

            {/* Problem Cards with 3D Effect */}
            <div className="grid lg:grid-cols-3 gap-8">
              {problems.map((problem, index) => {
                const Icon = problem.icon;
                return (
                  <div
                    key={index}
                    className="group relative transform transition-all duration-500 hover:-translate-y-2"
                    style={{ animationDelay: `${index * 150}ms` }}
                    onMouseEnter={() => setActiveFeature(index)}
                    onMouseLeave={() => setActiveFeature(null)}
                  >
                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-orange-600/20 to-transparent rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
                    
                    {/* Card with Perspective */}
                    <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-2xl border border-red-500/20 rounded-3xl p-8 overflow-hidden transform transition-all duration-300 group-hover:border-red-500/40"
                         style={{
                           transform: activeFeature === index ? 'perspective(1000px) rotateX(-5deg)' : 'none'
                         }}>
                      {/* Animated Background Pattern */}
                      <div className="absolute inset-0 opacity-5">
                        <div className="absolute inset-0" style={{
                          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)`,
                          animation: 'slide 20s linear infinite'
                        }} />
                      </div>
                      
                      {/* Icon with Pulse */}
                      <div className="relative mb-6">
                        <div className="absolute inset-0 bg-red-500 rounded-2xl blur-2xl opacity-20 animate-pulse" />
                        <div className="relative w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center">
                          <Icon className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      
                      {/* Metric Display */}
                      <div className="mb-4">
                        <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
                          {problem.metric}
                        </div>
                        <div className="text-sm text-gray-500 uppercase tracking-wider">
                          {problem.label}
                        </div>
                      </div>
                      
                      {/* Problem Text */}
                      <p className="text-lg text-gray-300 leading-relaxed">
                        {problem.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Integration Section with Orbital Animation */}
        <section className="min-h-screen flex items-center justify-center px-8 py-20 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-6xl font-bold mb-4">
                <span className="text-white">분산된 5가지를 </span>
                <span className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  하나로 통합
                </span>
              </h2>
            </div>

            {/* Orbital Integration Diagram */}
            <div className="relative h-[600px] flex items-center justify-center">
              {/* Central Hub with Layers */}
              <div className="absolute z-30">
                <div className="relative group cursor-pointer">
                  {/* Multiple Glow Layers */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl blur-3xl opacity-60 animate-pulse scale-150" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl blur-2xl opacity-40 animate-pulse animation-delay-1000 scale-125" />

                  {/* Main Hub */}
                  <div className="relative bg-black backdrop-blur-3xl rounded-3xl p-12 border-2 border-transparent"
                       style={{
                         background: 'linear-gradient(135deg, rgba(0,0,0,0.9), rgba(0,0,0,0.95))',
                         backgroundClip: 'padding-box',
                         borderImage: 'linear-gradient(135deg, #9333ea, #3b82f6, #06b6d4) 1'
                       }}>
                    <div className="text-center">
                      <div className="mb-4">
                        <Layers className="h-12 w-12 text-white mx-auto" />
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-2">포켓비즈</h3>
                      <p className="text-gray-400">성장 OS</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Orbiting Elements with Trail Effect */}
              <div className="absolute inset-0 z-20">
                {/* Orbital Path - 한번만 그리기 */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="250"
                    fill="none"
                    stroke="url(#orbital-gradient)"
                    strokeWidth="1"
                    strokeDasharray="5,10"
                    opacity="0.1"
                  />
                  <defs>
                    <linearGradient id="orbital-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#9333ea" stopOpacity="0.5" />
                      <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.5" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Orbiting Elements */}
                {integrations.map((item, index) => {
                  const Icon = item.icon;
                  const angle = (index * 72) - 90;
                  const radius = 250;
                  const x = Math.round(Math.cos(angle * Math.PI / 180) * radius);
                  const y = Math.round(Math.sin(angle * Math.PI / 180) * radius);

                  console.log(`Element ${index} (${item.name}): angle=${angle}, x=${x}, y=${y}`);

                  return (
                    <div
                      key={index}
                      className="absolute"
                      style={{
                        top: `calc(50% + ${y}px)`,
                        left: `calc(50% + ${x}px)`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                        <div className="group cursor-pointer">
                          {/* Element Glow */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-all duration-500 scale-150`} />
                          
                          {/* Element Card */}
                          <div className="relative bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 hover:border-white/30 transition-all duration-300 group-hover:scale-110">
                            <div className="flex items-center gap-3">
                              <Icon className="h-5 w-5 text-white" />
                              <span className="text-sm font-medium text-gray-200 whitespace-nowrap">{item.name}</span>
                            </div>
                          </div>
                        </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Integration Result */}
            <div className="text-center mt-20">
              <div className="inline-block">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600/40 to-emerald-600/40 rounded-3xl blur-2xl animate-pulse" />
                  <div className="relative bg-black/60 backdrop-blur-2xl border border-green-500/30 rounded-3xl px-12 py-6 group-hover:border-green-500/50 transition-all duration-300">
                    <p className="text-2xl text-green-400 font-semibold flex items-center gap-3">
                      <CheckCircle className="h-8 w-8" />
                      하나의 플랫폼에서 끊김 없이
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Weekly Flow with Timeline */}
        <section className="min-h-screen flex items-center justify-center px-8 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-6xl font-bold mb-4">
                <span className="text-white">매주 반복되는 </span>
                <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
                  성장 루틴
                </span>
              </h2>
            </div>

            {/* Timeline Flow */}
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute left-24 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-600/50 via-purple-600/50 to-cyan-600/50" />
              
              {weeklyFlow.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className="relative flex items-center mb-8 group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Day Circle */}
                    <div className="relative z-10">
                      <div className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-full blur-xl opacity-50 group-hover:opacity-100 transition-all duration-500`} />
                      <div className={`relative w-20 h-20 bg-gradient-to-br ${item.color} rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-all duration-300`}>
                        <span className="text-2xl font-bold text-white">{item.day}</span>
                      </div>
                    </div>
                    
                    {/* Task Card */}
                    <div className="ml-8 flex-1">
                      <div className="relative overflow-hidden">
                        {/* Hover Background Animation */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        
                        {/* Card Content */}
                        <div className="relative bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 group-hover:border-white/20 transition-all duration-300">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-xl text-gray-200 mb-2">{item.task}</p>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-500">평균 30분 소요</span>
                              </div>
                            </div>
                            <div className={`p-4 bg-gradient-to-br ${item.color} rounded-xl bg-opacity-10`}>
                              <Icon className="h-8 w-8 text-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Weekly Result */}
            <div className="mt-16 text-center">
              <div className="inline-block">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600/40 to-emerald-600/40 rounded-3xl blur-3xl animate-pulse scale-110" />
                  <div className="relative bg-black/80 backdrop-blur-2xl border-2 border-green-500/30 rounded-3xl px-12 py-8 group-hover:border-green-500/50 transition-all duration-300">
                    <div className="flex items-center gap-6">
                      <TrendingUp className="h-12 w-12 text-green-400" />
                      <div className="text-left">
                        <p className="text-3xl font-bold text-green-400">매주 평균 12% 성장</p>
                        <p className="text-gray-400">지속 가능한 성장 사이클 구축</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid with Hover States */}
        <section className="min-h-screen flex items-center justify-center px-8 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-6xl font-bold mb-4">
                <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                  통합된 기능
                </span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="group relative"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Card Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                    
                    {/* Card */}
                    <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-2xl border border-green-500/20 rounded-2xl p-6 overflow-hidden group-hover:border-green-500/40 transition-all duration-300">
                      {/* Animated Background */}
                      <div className="absolute inset-0 opacity-5">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-transparent transform rotate-12 scale-150" />
                      </div>
                      
                      {/* Content */}
                      <div className="relative">
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl">
                            <Icon className="h-6 w-6 text-green-400" />
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-400">{feature.stat}</div>
                            <div className="text-xs text-gray-500 uppercase">{feature.unit}</div>
                          </div>
                        </div>
                        <h3 className="text-lg font-medium text-gray-200">{feature.name}</h3>
                      </div>
                      
                      {/* Hover Effect Line */}
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-green-500 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Stats Section with Counter Animation */}
        <section className="py-20 px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="group relative"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="text-center">
                    <div className="mb-2">
                      <span className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                        {stat.value}
                      </span>
                    </div>
                    <div className="text-gray-400 mb-2">{stat.label}</div>
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/10 rounded-full">
                      <TrendingUp className="h-3 w-3 text-green-400" />
                      <span className="text-xs text-green-400">{stat.trend}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Principles with 3D Cards */}
        <section className="min-h-screen flex items-center justify-center px-8 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-6xl font-bold text-white mb-4">핵심 원칙</h2>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {[
                {
                  title: "선택 피로 제거",
                  description: "따라가기만 하면 됨",
                  icon: Zap,
                  gradient: "from-purple-600 to-pink-600"
                },
                {
                  title: "실행 중심",
                  description: "모든 인사이트는 액션으로",
                  icon: Rocket,
                  gradient: "from-blue-600 to-cyan-600"
                },
                {
                  title: "증빙 기반",
                  description: "측정 가능한 것만 관리",
                  icon: Shield,
                  gradient: "from-cyan-600 to-teal-600"
                }
              ].map((principle, index) => {
                const Icon = principle.icon;
                return (
                  <div
                    key={index}
                    className="group relative"
                    style={{ 
                      animationDelay: `${index * 200}ms`,
                      transform: 'perspective(1000px)'
                    }}
                  >
                    {/* 3D Card */}
                    <div className="relative transform transition-all duration-500 group-hover:rotateY-12"
                         style={{
                           transformStyle: 'preserve-3d'
                         }}>
                      {/* Card Glow */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${principle.gradient} rounded-3xl blur-2xl opacity-30 group-hover:opacity-60 transition-all duration-500`} />
                      
                      {/* Card Face */}
                      <div className="relative bg-black/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 overflow-hidden group-hover:border-white/20 transition-all duration-300">
                        {/* Animated Pattern */}
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute inset-0" style={{
                            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
                            animation: 'pulse 4s ease-in-out infinite'
                          }} />
                        </div>
                        
                        {/* Icon */}
                        <div className="relative mb-6">
                          <div className={`inline-block p-4 bg-gradient-to-br ${principle.gradient} rounded-2xl`}>
                            <Icon className="h-8 w-8 text-white" />
                          </div>
                        </div>
                        
                        {/* Text */}
                        <h3 className="text-2xl font-bold text-white mb-3">{principle.title}</h3>
                        <p className="text-gray-400 text-lg">{principle.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section with Premium Buttons */}
        <section className="min-h-screen flex items-center justify-center px-8 py-20">
          <div className="max-w-5xl mx-auto text-center">
            {/* Title with Animation */}
            <div className="mb-16">
              <h2 className="text-6xl md:text-7xl font-bold mb-6">
                <span className="text-white">어떤 입장에서 </span>
                <span className="inline-block animate-gradient bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 bg-clip-text text-transparent bg-300%">
                  보시겠습니까?
                </span>
              </h2>
            </div>

            {/* Main CTA with Complex Animation */}
            <div className="mb-12">
              <button
                onClick={() => window.location.href = '/?role=startup'}
                className="group relative inline-block"
              >
                {/* Multi-layer Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl blur-3xl opacity-50 group-hover:opacity-100 transition-all duration-500 animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-70 transition-all duration-700 animation-delay-200" />
                
                {/* Button */}
                <div className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 p-1 rounded-3xl overflow-hidden">
                  <div className="relative bg-black rounded-3xl px-16 py-8 group-hover:bg-transparent transition-all duration-500">
                    <div className="flex items-center justify-center gap-4">
                      <Rocket className="h-10 w-10 text-white" />
                      <span className="text-3xl font-bold text-white">스타트업으로 체험</span>
                      <ArrowRight className="h-8 w-8 text-white group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Secondary CTAs Grid */}
            <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {[
                { role: 'admin', icon: Shield, label: '관리자 환경', color: 'from-indigo-600 to-purple-600' },
                { role: 'internal-builder', icon: Users, label: '내부 빌더', color: 'from-purple-600 to-pink-600' },
                { role: 'partner', icon: Building2, label: '외부 빌더', color: 'from-green-600 to-emerald-600' }
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={index}
                    onClick={() => window.location.href = `/?role=${item.role}`}
                    className="group relative"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${item.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-all duration-500`} />
                    <div className="relative bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl px-6 py-4 group-hover:border-white/30 transition-all duration-300">
                      <div className="flex items-center justify-center gap-3">
                        <Icon className="h-6 w-6 text-gray-400 group-hover:text-white transition-colors duration-300" />
                        <span className="text-gray-300 group-hover:text-white transition-colors duration-300">{item.label}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer Links */}
            <div className="mt-20 flex justify-center gap-8">
              {[
                { icon: Globe, label: 'Website' },
                { icon: Code, label: 'GitHub' },
                { icon: FileText, label: 'Docs' }
              ].map((link, index) => {
                const Icon = link.icon;
                return (
                  <div
                    key={index}
                    className="group cursor-pointer"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-2 text-gray-500 group-hover:text-white transition-colors duration-300">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm">{link.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
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
        
        @keyframes slide {
          from { transform: translateX(0); }
          to { transform: translateX(70px); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        
        .bg-300\\% {
          background-size: 300%;
        }
        
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        
        .animation-delay-1000 {
          animation-delay: 1000ms;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default LandingV3;