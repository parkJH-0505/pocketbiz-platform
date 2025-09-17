import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  FileText,
  Users,
  MessageSquare,
  Target,
  ChevronRight,
  Package,
  TrendingUp,
  AlertTriangle,
  Plus,
  Heart,
  Download,
  PlayCircle,
  Star,
  Zap,
  ArrowRight,
  Settings,
  Edit2
} from 'lucide-react';
import { useBuildupContext } from '../../../contexts/BuildupContext';
import type { Project, ProjectPhase } from '../../../types/buildup.types';
import PhaseTransitionModal from '../../../components/project/PhaseTransitionModal';
import ProjectPhaseIndicator from '../../../components/project/ProjectPhaseIndicator';
import {
  PHASE_INFO,
  ALL_PHASES,
  calculatePhaseProgress,
  getPhaseIndex
} from '../../../utils/projectPhaseUtils';

type ProjectFilter = 'all' | 'active' | 'completed' | 'wishlist';

export default function ProjectManagement() {
  const navigate = useNavigate();
  const { projects, activeProjects, completedProjects, updateProject } = useBuildupContext();
  const [selectedFilter, setSelectedFilter] = useState<ProjectFilter>('active');
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // 7단계 기반 진행률 계산
  const calculateProgress = (project: Project) => {
    const phase = project.phase || 'contract_pending';
    const progress = calculatePhaseProgress(phase);

    return {
      phase,
      progress,
      phaseIndex: getPhaseIndex(phase),
      phaseInfo: PHASE_INFO[phase]
    };
  };

  // D-Day 계산
  const calculateDDay = (project: Project) => {
    if (!project.meetings || project.meetings.length === 0) return null;

    const nextMeeting = project.meetings[0];
    const daysRemaining = Math.ceil(
      (new Date(nextMeeting.date).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24)
    );

    return {
      days: daysRemaining,
      isUrgent: daysRemaining <= 3,
      isWarning: daysRemaining <= 7,
      text: daysRemaining > 0 ? `D-${daysRemaining}` : '오늘'
    };
  };

  // 오늘 해야 할 일
  const getTodaysTasks = () => {
    const tasks = [];

    activeProjects.forEach(project => {
      // 연락 필요
      if (project.communication?.unread_messages > 0) {
        tasks.push({
          type: 'message' as const,
          project: project.title,
          title: '확인 필요',
          urgent: true
        });
      }

      // 오늘 마감 마일스톤
      const dday = calculateDDay(project);
      if (dday && dday.days === 0) {
        tasks.push({
          type: 'milestone' as const,
          project: project.title,
          title: '미팅 예정',
          urgent: true
        });
      }
    });

    return tasks;
  };

  const todaysTasks = getTodaysTasks();

  // 단계 전환 핸들러
  const handlePhaseTransition = (newPhase: ProjectPhase, reason: string) => {
    if (!selectedProject) return;

    // 프로젝트 업데이트
    updateProject(selectedProject.id, {
      phase: newPhase,
      phaseHistory: [
        ...(selectedProject.phaseHistory || []),
        {
          phase: newPhase,
          timestamp: new Date().toISOString(),
          reason,
          changedBy: 'admin' // TODO: 실제 사용자 ID
        }
      ]
    });

    // 모달 닫기
    setShowPhaseModal(false);
    setSelectedProject(null);
  };

  // 단계 변경 버튼 클릭 핸들러
  const handlePhaseChangeClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
    setSelectedProject(project);
    setShowPhaseModal(true);
  };

  // 찜한 서비스 (Mock)
  const wishlistServices = [
    {
      id: 'wish1',
      name: '비즈니스 모델 컨설팅',
      category: '컨설팅',
      price: 6000000,
      expectedImprovement: 'GO 축 30% 향상'
    },
    {
      id: 'wish2',
      name: '퍼포먼스 마케팅',
      category: '마케팅',
      price: 5000000,
      expectedImprovement: 'EC 축 25% 향상'
    }
  ];

  // 필터링된 콘텐츠 가져오기
  const getFilteredContent = () => {
    switch (selectedFilter) {
      case 'active':
        return activeProjects;
      case 'completed':
        return completedProjects;
      case 'wishlist':
        return [];
      default:
        return projects;
    }
  };

  const filteredProjects = getFilteredContent();

  return (
    <>
      <style>{`
        @keyframes progressAnimation {
          from {
            stroke-dasharray: 0 352;
          }
        }

        @keyframes countUp {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out;
        }

        .animate-pulse-slow {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">프로젝트 관리</h1>
              <p className="text-sm text-gray-600 mt-1">
                진행 중인 프로젝트를 한눈에 확인하세요
              </p>
            </div>
            <button
              onClick={() => navigate('/startup/buildup/catalog')}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              새 프로젝트 시작
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Today's Focus */}
        {todaysTasks.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 mb-6 border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">오늘 확인이 필요해요</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {todaysTasks.map((task, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    task.urgent ? 'bg-red-100' : 'bg-yellow-100'
                  }`}>
                    {task.type === 'review' && <AlertCircle className="w-4 h-4 text-gray-700" />}
                    {task.type === 'message' && <MessageSquare className="w-4 h-4 text-gray-700" />}
                    {task.type === 'milestone' && <Target className="w-4 h-4 text-gray-700" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    <p className="text-xs text-gray-500">{task.project}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setSelectedFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              selectedFilter === 'active'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            진행중 ({activeProjects.length})
          </button>
          <button
            onClick={() => setSelectedFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              selectedFilter === 'completed'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            완료 ({completedProjects.length})
          </button>
          <button
            onClick={() => setSelectedFilter('wishlist')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              selectedFilter === 'wishlist'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            관심 서비스 ({wishlistServices.length})
          </button>
        </div>

        {/* Main Content Area */}
        <div className="space-y-4">
          {/* Active Projects - Large Cards */}
          {selectedFilter === 'active' && (
            <>
              {activeProjects.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 mb-3">진행중인 프로젝트가 없습니다</p>
                  <button
                    onClick={() => navigate('/startup/buildup/catalog')}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    서비스 둘러보기 →
                  </button>
                </div>
              ) : (
                activeProjects.map(project => {
                  const progress = calculateProgress(project);
                  const dday = calculateDDay(project);

                  return (
                    <div
                      key={project.id}
                      className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all overflow-hidden animate-fade-in-up cursor-pointer"
                      style={{
                        animationDelay: `${activeProjects.indexOf(project) * 0.1}s`
                      }}
                      onClick={() => navigate(`/startup/buildup/projects/${project.id}`)}
                    >

                      {/* 매거진 스타일 레이아웃 */}
                      <div className="p-6">

                        {/* 상단: 프로젝트 헤더 정보 */}
                        <div className="flex items-start justify-between mb-4">
                          {/* 프로젝트 제목 - 크게 강조 */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-2xl font-bold text-gray-900">
                                {project.title}
                              </h3>
                              <span className="px-2.5 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                                {project.category}
                              </span>

                              {/* 알림 아이콘 (호버 시 말풍선) */}
                              {project.communication?.unread_messages > 0 && (
                                <div className="relative group">
                                  <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-amber-200 transition-colors">
                                    <AlertCircle className="w-3 h-3 text-amber-600" />
                                  </div>

                                  {/* 호버 말풍선 */}
                                  <div className="hidden group-hover:block absolute top-6 left-1/2 transform -translate-x-1/2 z-30">
                                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                                      <div className="text-xs font-semibold">확인이 필요한 사항이 있습니다</div>
                                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 w-2 h-2 bg-amber-50 border-l border-t border-amber-200"></div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 다음 미팅 D-Day (우측 상단) */}
                          {dday && (
                            <div className={`text-center px-3 py-1.5 rounded-lg border ${
                              dday.isUrgent ? 'bg-red-50 border-red-200' :
                              dday.isWarning ? 'bg-yellow-50 border-yellow-200' :
                              'bg-blue-50 border-blue-200'
                            }`}>
                              <div className={`text-sm font-bold ${
                                dday.isUrgent ? 'text-red-600' :
                                dday.isWarning ? 'text-yellow-600' :
                                'text-blue-600'
                              }`}>
                                {dday.text}
                              </div>
                              <div className="text-xs text-gray-500">다음 미팅</div>
                            </div>
                          )}
                        </div>

                        {/* 컨텐츠 레이아웃 - 좌측 원형 차트 (30%) + 우측 정보 (70%) */}
                        <div className="flex gap-4">
                          {/* 좌측 - 원형 프로그레스 차트 (35%) */}
                          <div className="w-[35%] flex flex-col items-center justify-center">
                            <div className="relative w-60 h-60">
                              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                {/* 배경 원 */}
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="45"
                                  fill="none"
                                  stroke="#e5e7eb"
                                  strokeWidth="8"
                                />
                                {/* 진행률 원 */}
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="45"
                                  fill="none"
                                  stroke="#3b82f6"
                                  strokeWidth="8"
                                  strokeLinecap="round"
                                  strokeDasharray={`${progress.progress * 2.827} ${282.7 - progress.progress * 2.827}`}
                                  className="transition-all duration-1000"
                                />
                              </svg>

                              {/* 중앙 텍스트 */}
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold text-gray-900">
                                  {progress.phaseIndex + 1}/7
                                </span>
                                <span className="text-base text-gray-600 font-semibold">
                                  {progress.phaseInfo.label}
                                </span>
                                {/* 단계 변경 버튼 */}
                                <button
                                  onClick={(e) => handlePhaseChangeClick(e, project)}
                                  className="mt-2 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors flex items-center gap-1"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  단계 변경
                                </button>
                              </div>

                              {/* 7단계 점들 - 원 주위에 배치 */}
                              {ALL_PHASES.map((phase, idx) => {
                                const phaseProgress = calculatePhaseProgress(phase);
                                const isCurrent = phase === progress.phase;
                                const isPassed = phaseProgress <= progress.progress;
                                const phaseData = PHASE_INFO[phase];
                                const angle = (idx / 7) * 360 - 90; // -90도로 상단에서 시작
                                const radian = (angle * Math.PI) / 180;
                                const x = 50 + 45 * Math.cos(radian);
                                const y = 50 + 45 * Math.sin(radian);

                                return (
                                  <div
                                    key={phase}
                                    className="absolute group"
                                    style={{
                                      left: `${x}%`,
                                      top: `${y}%`,
                                      transform: 'translate(-50%, -50%)',
                                      zIndex: 20
                                    }}
                                  >
                                    {/* 점 마커 */}
                                    <div className={`w-4 h-4 rounded-full transition-all cursor-pointer border-2 border-white shadow-md ${
                                      isPassed
                                        ? 'bg-blue-600'
                                        : isCurrent
                                        ? 'bg-blue-400'
                                        : 'bg-gray-300'
                                    } ${isCurrent ? 'ring-2 ring-blue-400 ring-offset-2 scale-150' : 'hover:scale-125'}`} />

                                    {/* 호버시 단계 정보 표시 */}
                                    <div className="hidden group-hover:block absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30">
                                      <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                                        <div className="text-sm font-semibold">{phaseData.label}</div>
                                        <div className="text-xs opacity-80">{phaseData.description}</div>
                                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* 우측 - 컨텐츠 (65%) */}
                          <div className="w-[65%] space-y-4">
                            {/* 다음 미팅 정보 */}
                            {project.meetings && project.meetings.length > 0 && (
                              <div className="bg-blue-50 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                    <span className="text-base font-semibold text-blue-900">다음 미팅</span>
                                  </div>
                                </div>
                                <p className="font-semibold text-gray-900 text-base mb-2">
                                  {project.meetings[0].title}
                                </p>
                                <p className="font-semibold text-gray-900 text-base mb-1">
                                  {new Date(project.meetings[0].date).toLocaleDateString('ko-KR', {
                                    month: 'long',
                                    day: 'numeric',
                                    weekday: 'short'
                                  })} {new Date(project.meetings[0].date).toLocaleTimeString('ko-KR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                                <p className="font-semibold text-gray-900 text-base">
                                  {project.meetings[0].location}
                                </p>
                              </div>
                            )}

                            {/* 최근 활동 */}
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-semibold text-gray-700">최근 미팅내용 한 줄 요약</span>
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                "디자인 시안 검토 완료, 개발 일정 조정, 추가 기능 요청사항 논의"
                              </p>
                            </div>

                            {/* PM 정보 & 액션 버튼 */}
                            <div className="grid grid-cols-3 gap-3">
                              {/* PM 정보 */}
                              {project.team?.pm && (
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                      {project.team.pm.name[0]}
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-600">담당 PM</p>
                                      <p className="text-sm font-semibold text-gray-900">{project.team.pm.name}</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* 액션 버튼들 */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // 메시지 기능
                                }}
                                className="py-2 px-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors flex items-center justify-center gap-1.5 text-sm font-medium text-gray-700 hover:text-blue-600"
                              >
                                <MessageSquare className="w-4 h-4" />
                                메시지
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // 자료실 기능 (비활성)
                                }}
                                className="py-2 px-3 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed flex items-center justify-center gap-1.5 text-sm font-medium text-gray-400"
                                disabled
                              >
                                <FileText className="w-4 h-4" />
                                자료실
                              </button>
                            </div>

                            {/* 상세보기 버튼 */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/startup/buildup/projects/${project.id}`);
                              }}
                              className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
                            >
                              상세 내용 보기
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </>
          )}

          {/* Completed Projects - Compact Cards */}
          {selectedFilter === 'completed' && (
            <div className="grid grid-cols-2 gap-4">
              {completedProjects.length === 0 ? (
                <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">완료된 프로젝트가 없습니다</p>
                </div>
              ) : (
                completedProjects.map(project => (
                  <div key={project.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{project.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">{project.category}</p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        완료일: {project.timeline.completion_date
                          ? new Date(project.timeline.completion_date).toLocaleDateString('ko-KR')
                          : '-'}
                      </span>
                      <button className="text-blue-600 hover:text-blue-700 font-medium">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Wishlist Services */}
          {selectedFilter === 'wishlist' && (
            <div className="grid grid-cols-2 gap-4">
              {wishlistServices.map(service => (
                <div key={service.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{service.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{service.category}</p>
                    </div>
                    <Heart className="w-5 h-5 text-pink-500 fill-current" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">예상 가격</span>
                      <span className="font-medium">{(service.price / 10000).toFixed(0)}만원</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <TrendingUp className="w-3 h-3 text-green-600" />
                      <span className="text-gray-600">{service.expectedImprovement}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/startup/buildup/catalog')}
                    className="mt-3 w-full py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    자세히 보기
                  </button>
                </div>
              ))}
              {wishlistServices.length === 0 && (
                <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <Heart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 mb-3">관심 서비스가 없습니다</p>
                  <button
                    onClick={() => navigate('/startup/buildup/catalog')}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    서비스 둘러보기 →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Phase Transition Modal */}
    {selectedProject && (
      <PhaseTransitionModal
        isOpen={showPhaseModal}
        onClose={() => {
          setShowPhaseModal(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
        onTransition={handlePhaseTransition}
      />
    )}
    </>
  );
}