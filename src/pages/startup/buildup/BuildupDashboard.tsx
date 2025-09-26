/**
 * 통합 빌드업 대시보드
 * 프로젝트 대시보드 + 프로젝트 관리를 하나로 통합
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ChatSideModal from '../../../components/chat/ChatSideModal';
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
  Plus,
  Heart,
  Download,
  PlayCircle,
  Star,
  Zap,
  ArrowRight,
  Activity,
  Bell,
  Video,
  Briefcase,
  Filter,
  MoreVertical,
  User,
  Sparkles
} from 'lucide-react';
import { useBuildupContext } from '../../../contexts/BuildupContext';
import { useCalendarContext } from '../../../contexts/CalendarContext';
import { useChatContext } from '../../../contexts/ChatContext';
import { useUserProfile } from '../../../contexts/UserProfileContext';
import { useScheduleContext } from '../../../contexts/ScheduleContext';
import { useProjectChatIntegration } from '../../../hooks/useProjectChatIntegration';
import type { Project, ProjectPhase } from '../../../types/buildup.types';
import type { CalendarEvent } from '../../../types/calendar.types';
import {
  PHASE_INFO,
  ALL_PHASES,
  calculatePhaseProgress,
  getPhaseIndex
} from '../../../utils/projectPhaseUtils';
import PhaseTransitionControls from '../../../components/phaseTransition/PhaseTransitionControls';

// Phase 색상 매핑 (ProjectPhaseIndicator와 동일)
const PHASE_COLORS: Record<ProjectPhase, {
  textColor: string;
  bgColor: string;
}> = {
  contract_pending: {
    textColor: 'text-gray-700',
    bgColor: 'bg-gray-100'
  },
  contract_signed: {
    textColor: 'text-green-700',
    bgColor: 'bg-green-100'
  },
  planning: {
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-100'
  },
  design: {
    textColor: 'text-indigo-700',
    bgColor: 'bg-indigo-100'
  },
  execution: {
    textColor: 'text-purple-700',
    bgColor: 'bg-purple-100'
  },
  review: {
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-100'
  },
  completed: {
    textColor: 'text-green-700',
    bgColor: 'bg-green-100'
  }
};

type DashboardView = 'overview' | 'projects';
type ProjectFilter = 'all' | 'active' | 'completed' | 'wishlist';

interface ActivityItem {
  id: string;
  type: 'comment' | 'upload' | 'complete' | 'start';
  user: string;
  project: string;
  description: string;
  time: string;
}

export default function BuildupDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    projects,
    activeProjects,
    completedProjects,
    getProjectProgress
  } = useBuildupContext();
  const { todayEvents, thisWeekEvents } = useCalendarContext();
  const { buildupMeetings } = useScheduleContext();
  const { getUnreadCountByProject, createChatRoomForProject, totalUnreadCount } = useChatContext();
  const { profile } = useUserProfile();
  useProjectChatIntegration();
  const [view, setView] = useState<DashboardView>('overview');
  const [selectedFilter, setSelectedFilter] = useState<ProjectFilter>('active');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [selectedChatProject, setSelectedChatProject] = useState<Project | null>(null);

  // 결제 완료 후 성공 메시지 처리
  useEffect(() => {
    if (location.state?.orderComplete) {
      setShowSuccessMessage(true);
      // 3초 후 메시지 자동 숨김
      setTimeout(() => setShowSuccessMessage(false), 3000);
      // 브라우저 히스토리에서 state 제거
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // 강화된 프로젝트 계산 사용
  const calculateProgress = (project: Project) => {
    return getProjectProgress(project);
  };

  // 실제 ScheduleContext에서 프로젝트별 다음 미팅 가져오기
  const getNextProjectMeeting = React.useCallback((projectId: string) => {
    return buildupMeetings
      .filter(m => m.projectId === projectId && new Date(m.startDateTime) > new Date())
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())[0];
  }, [buildupMeetings]);

  // 실제 활동 시간 계산 (프로젝트 단계 변경, 미팅 생성 등 기반)
  const getLastActivityTime = React.useCallback((project: Project) => {
    const activities = [];

    // 단계 변경 시간
    if (project.timeline?.phase_updated_at) {
      activities.push(new Date(project.timeline.phase_updated_at));
    }

    // 최근 미팅 생성 시간
    const projectMeetings = buildupMeetings.filter(m => m.projectId === project.id);
    if (projectMeetings.length > 0) {
      const latestMeeting = projectMeetings.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];
      if (latestMeeting.createdAt) {
        activities.push(new Date(latestMeeting.createdAt));
      }
    }

    // 프로젝트 생성 시간
    if (project.contract?.signed_date) {
      activities.push(new Date(project.contract.signed_date));
    }

    // 가장 최근 활동 시간 반환
    return activities.length > 0 ? activities.sort((a, b) => b.getTime() - a.getTime())[0] : new Date();
  }, [buildupMeetings]);

  // 필터링된 프로젝트
  const filteredProjects = React.useMemo(() => {
    switch (selectedFilter) {
      case 'active':
        return activeProjects;
      case 'completed':
        return completedProjects;
      case 'wishlist':
        return projects.filter(p => p.status === 'wishlist');
      default:
        return projects;
    }
  }, [selectedFilter, projects, activeProjects, completedProjects]);

  // 다가오는 일정 (프로젝트 미팅 기반)
  const upcomingSchedules = React.useMemo(() => {
    const schedules: Array<{
      id: string;
      type: 'meeting' | 'milestone' | 'deadline';
      title: string;
      project: string;
      date: Date;
      location?: string;
    }> = [];

    // 모든 프로젝트의 미팅 수집
    activeProjects.forEach(project => {
      if (project.meetings) {
        project.meetings.forEach(meeting => {
          const meetingDate = new Date(meeting.date);
          // 향후 2주 이내 미팅만 표시
          if (meetingDate.getTime() > Date.now() &&
              meetingDate.getTime() < Date.now() + 14 * 24 * 60 * 60 * 1000) {
            schedules.push({
              id: `${project.id}-${meeting.id}`,
              type: 'meeting',
              title: meeting.title,
              project: project.title,
              date: meetingDate,
              location: meeting.location
            });
          }
        });
      }
    });

    // 날짜순 정렬
    return schedules.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [activeProjects]);

  // 최근 활동 데이터 (Mock)
  const recentActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'comment',
      user: '김철수 PM',
      project: 'MVP 개발',
      description: '1차 개발 완료 검토가 필요합니다.',
      time: '2시간 전'
    },
    {
      id: '2',
      type: 'upload',
      user: '박디자이너',
      project: 'UI/UX 개선',
      description: '최종 디자인 시안을 업로드했습니다.',
      time: '4시간 전'
    },
    {
      id: '3',
      type: 'complete',
      user: '이개발자',
      project: 'MVP 개발',
      description: '백엔드 API 개발을 완료했습니다.',
      time: '6시간 전'
    }
  ];

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'comment': return <MessageSquare className="w-4 h-4 text-primary-main" />;
      case 'upload': return <Download className="w-4 h-4 text-secondary-main" />;
      case 'complete': return <CheckCircle className="w-4 h-4 text-accent-green" />;
      case 'start': return <PlayCircle className="w-4 h-4 text-accent-purple" />;
    }
  };

  // 통계 계산
  const stats = {
    totalProjects: projects.length,
    activeProjects: activeProjects.length,
    completedProjects: completedProjects.length,
    upcomingSchedules: upcomingSchedules.length,
    thisWeekMeetings: thisWeekEvents.length,
    unreadMessages: totalUnreadCount || 0
  };

  return (
    <div className="space-y-6">
      {/* 결제 완료 성공 메시지 */}
      {showSuccessMessage && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3 animate-pulse">
          <div className="flex-shrink-0">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-green-800 font-semibold">프로젝트 생성 완료! 🎉</h3>
            <p className="text-green-700 text-sm mt-1">{location.state?.message}</p>
          </div>
        </div>
      )}

      {/* Phase Transition Controls - 관리자 전용 */}
      <PhaseTransitionControls />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-darkest">포켓빌드업 대시보드</h1>
          <p className="text-neutral-dark mt-1">프로젝트 진행 현황과 오늘의 할 일을 확인하세요</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 다가오는 일정 */}
            <div className="bg-white rounded-xl border border-neutral-border">
              <div className="p-6 border-b border-neutral-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-neutral-darkest flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary-main" />
                    다가오는 일정
                  </h2>
                  <span className="text-sm text-neutral-dark bg-neutral-lightest px-2 py-1 rounded-full">
                    {upcomingSchedules.length}개
                  </span>
                </div>
              </div>
              <div className="p-6">
                {upcomingSchedules.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-accent-green mx-auto mb-3" />
                    <p className="text-neutral-dark">향후 2주 내 예정된 일정이 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingSchedules.slice(0, 5).map((schedule) => {
                      const isToday = schedule.date.toDateString() === new Date().toDateString();
                      const isTomorrow = schedule.date.toDateString() ===
                        new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();

                      const dateLabel = isToday ? '오늘' :
                                       isTomorrow ? '내일' :
                                       schedule.date.toLocaleDateString('ko-KR', {
                                         month: 'numeric',
                                         day: 'numeric',
                                         weekday: 'short'
                                       });

                      return (
                        <div
                          key={schedule.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-neutral-lighter bg-white hover:bg-neutral-lightest transition-colors cursor-pointer"
                        >
                          <div className="p-2 rounded-lg bg-primary-light">
                            <Video className="w-4 h-4 text-primary-main" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-neutral-darkest truncate">{schedule.title}</p>
                            <p className="text-sm text-neutral-dark">{schedule.project}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-neutral-darkest">{dateLabel}</div>
                            <div className="text-xs text-neutral-dark">
                              {schedule.date.toLocaleTimeString('ko-KR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {upcomingSchedules.length > 5 && (
                      <button
                        onClick={() => navigate('/startup/buildup/calendar')}
                        className="w-full py-2 text-sm text-primary-main hover:text-primary-dark font-medium flex items-center justify-center gap-1 mt-3"
                      >
                        {upcomingSchedules.length - 5}개 더 보기 <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 활동 및 통계 */}
            <div className="bg-white rounded-xl border border-neutral-border">
              <div className="p-6 border-b border-neutral-border">
                <h2 className="text-lg font-semibold text-neutral-darkest">활동 및 통계</h2>
              </div>
              <div className="p-6">
                {/* 프로젝트 현황 */}
                <h3 className="text-sm font-medium text-neutral-dark mb-3">프로젝트 현황</h3>
                <div className="grid grid-cols-2 gap-3 mb-6 pb-6 border-b border-neutral-lighter">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-light rounded-lg">
                      <Briefcase className="w-4 h-4 text-primary-main" />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-dark">진행중</p>
                      <p className="text-lg font-bold text-neutral-darkest">{stats.activeProjects}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent-orange/10 rounded-lg">
                      <Calendar className="w-4 h-4 text-accent-orange" />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-dark">다가오는 일정</p>
                      <p className="text-lg font-bold text-neutral-darkest">{stats.upcomingSchedules}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary-light rounded-lg">
                      <Video className="w-4 h-4 text-secondary-main" />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-dark">이번주 미팅</p>
                      <p className="text-lg font-bold text-neutral-darkest">{stats.thisWeekMeetings}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent-purple/10 rounded-lg">
                      <MessageSquare className="w-4 h-4 text-accent-purple" />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-dark">새 메시지</p>
                      <p className="text-lg font-bold text-neutral-darkest">{stats.unreadMessages}</p>
                    </div>
                  </div>
                </div>

                {/* 최근 활동 */}
                <h3 className="text-sm font-medium text-neutral-dark mb-3">최근 활동</h3>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="p-2 bg-neutral-lightest rounded-lg">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-neutral-darkest">
                          <span className="font-medium">{activity.user}</span>님이{' '}
                          <span className="font-medium text-primary-main">{activity.project}</span>에서
                        </p>
                        <p className="text-sm text-neutral-dark mt-1">{activity.description}</p>
                        <p className="text-xs text-neutral-lighter mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
      </div>

      {/* 프로젝트 관리 */}
      <div className="bg-white rounded-xl border border-neutral-border">
        <div className="p-6 border-b border-neutral-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-darkest">프로젝트 관리</h2>
            <div className="flex items-center gap-2">
              <div className="flex bg-neutral-lightest rounded-lg p-1">
                {[
                  { key: 'active', label: `진행 중 (${activeProjects.length})` },
                  { key: 'completed', label: `완료 (${completedProjects.length})` },
                  { key: 'all', label: `전체 (${projects.length})` }
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setSelectedFilter(filter.key as ProjectFilter)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      selectedFilter === filter.key
                        ? 'bg-white text-primary-main shadow-sm'
                        : 'text-neutral-dark hover:text-neutral-darkest'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => navigate('/startup/buildup/catalog')}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary-main text-white text-sm rounded-lg hover:bg-primary-dark transition-colors"
              >
                <Plus className="w-4 h-4" />
                새 프로젝트
              </button>
            </div>
          </div>
        </div>
        <div className="p-6">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-neutral-lighter mx-auto mb-3" />
              <p className="text-neutral-dark">프로젝트가 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProjects.map((project) => {
                const progress = calculateProgress(project);
                const phase = project.phase || 'contract_pending';
                const phaseInfo = PHASE_INFO[phase];
                const phaseColors = PHASE_COLORS[phase] || PHASE_COLORS.contract_pending;

                return (
                  <div
                    key={project.id}
                    onClick={() => navigate(`/startup/buildup/project/${project.id}`)}
                    className="group relative bg-gradient-to-br from-white to-neutral-lightest/30 rounded-2xl border border-neutral-lighter/50 hover:border-primary-main/40 hover:shadow-xl hover:shadow-primary-main/5 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-sm"
                  >
                    {/* 상단 헤더 - 브랜딩 강화 */}
                    <div className="relative p-6 pb-4">
                      {/* 배경 패턴 */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary-light/20 to-transparent rounded-bl-full" />

                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-neutral-darkest line-clamp-2 leading-tight">
                                {project.title}
                              </h3>
                            </div>

                            {/* 프로젝트 메타 정보 */}
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary-main" />
                                <span className="font-medium text-neutral-darkest">{project.category}</span>
                              </div>

                              {/* 실제 사용자 프로필에서 회사명 가져오기 */}
                              {profile?.basicInfo?.companyName && (
                                <div className="flex items-center gap-2 text-neutral-dark">
                                  <User className="w-4 h-4" />
                                  <span>{profile.basicInfo.companyName}</span>
                                </div>
                              )}

                              {/* 워크스트림 개수 */}
                              {project.workstreams && project.workstreams.length > 0 && (
                                <div className="flex items-center gap-2 text-neutral-dark">
                                  <Briefcase className="w-4 h-4" />
                                  <span>{project.workstreams.length}개 작업그룹</span>
                                </div>
                              )}

                              {/* 대기중인 산출물 개수 */}
                              {project.deliverables && (
                                <div className="flex items-center gap-2 text-neutral-dark">
                                  <FileText className="w-4 h-4" />
                                  <span>{project.deliverables.filter(d => d.status !== 'approved').length}개 대기</span>
                                </div>
                              )}

                              {/* 고위험 이슈 경고 */}
                              {project.risks && project.risks.filter(r => r.level === 'high' || r.level === 'critical').length > 0 && (
                                <div className="flex items-center gap-2 text-red-600">
                                  <AlertCircle className="w-4 h-4" />
                                  <span>{project.risks.filter(r => r.level === 'high' || r.level === 'critical').length}개 위험</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* D-Day & 가치 표시 - 실제 ScheduleContext 데이터 사용 */}
                          <div className="text-right">
                            {(() => {
                              const nextMeeting = getNextProjectMeeting(project.id);
                              if (!nextMeeting) return null;

                              const daysUntil = Math.ceil(
                                (new Date(nextMeeting.startDateTime).getTime() - Date.now()) /
                                (1000 * 60 * 60 * 24)
                              );

                              return (
                                <div className="px-4 py-2 bg-gradient-to-r from-primary-main to-secondary-main text-white rounded-xl mb-2 shadow-lg">
                                  <div className="text-sm font-bold">
                                    D-{daysUntil}
                                  </div>
                                  <div className="text-xs opacity-90">다음 미팅</div>
                                </div>
                              );
                            })()}

                          </div>
                        </div>

                        {/* 7단계 진행 표시 - 고급스럽게 */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-neutral-darkest">프로젝트 진행도</span>
                          </div>

                          <div className="relative pb-8">
                            {/* 배경 트랙 */}
                            <div className="flex items-center gap-1">
                              {ALL_PHASES.map((p, idx) => {
                                const currentIdx = getPhaseIndex(phase);
                                const phaseIdx = getPhaseIndex(p);
                                const isPassed = phaseIdx <= currentIdx;
                                const isCurrent = phaseIdx === currentIdx;
                                const phaseData = PHASE_INFO[p];
                                const currentPhaseColors = PHASE_COLORS[p] || PHASE_COLORS.contract_pending;

                                return (
                                  <div key={p} className="group/phase relative flex-1">
                                    <div className="relative">
                                      <div
                                        className={`h-2 transition-all duration-500 ${
                                          idx === 0 ? 'rounded-l-xl' : ''
                                        } ${
                                          idx === ALL_PHASES.length - 1 ? 'rounded-r-xl' : ''
                                        } ${
                                          isPassed
                                            ? isCurrent
                                              ? 'bg-gradient-to-r from-primary-main to-secondary-main shadow-lg'
                                              : 'bg-primary-main/80'
                                            : 'bg-neutral-lighter'
                                        }`}
                                      />

                                      {/* 현재 단계 인디케이터 */}
                                      {isCurrent && (
                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                          <div className="w-4 h-4 bg-white rounded-full border-2 border-primary-main shadow-lg">
                                            <div className="w-full h-full bg-gradient-to-br from-primary-main to-secondary-main rounded-full scale-50" />
                                          </div>
                                        </div>
                                      )}

                                      {/* 현재 단계 색상 배지 - 프로그레스 바 위에 위치 */}
                                      {isCurrent && (
                                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10">
                                          <div className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${currentPhaseColors.textColor} ${currentPhaseColors.bgColor} shadow-lg border-2 border-white`}>
                                            {phaseData.label}
                                          </div>
                                          {/* 화살표 */}
                                          <div
                                            className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent"
                                            style={{
                                              borderTopColor: p === 'contract_pending' ? '#f3f4f6' :
                                                             p === 'contract_signed' ? '#dcfce7' :
                                                             p === 'planning' ? '#dbeafe' :
                                                             p === 'design' ? '#e0e7ff' :
                                                             p === 'execution' ? '#f3e8ff' :
                                                             p === 'review' ? '#fed7aa' :
                                                             '#dcfce7'
                                            }}
                                          ></div>
                                        </div>
                                      )}
                                    </div>

                                    {/* 호버 툴팁 - 개선된 버전 */}
                                    <div className="opacity-0 group-hover/phase:opacity-100 absolute -top-20 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 pointer-events-none">
                                      <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-2xl border border-gray-700 whitespace-nowrap">
                                        <div className="text-sm font-semibold">{phaseData.label}</div>
                                        <div className="text-xs opacity-80 mt-1">{phaseData.description}</div>
                                        {/* 화살표 */}
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 중간 섹션 - PM & 미팅 정보 */}
                    <div className="px-6 pb-4">
                      <div className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50">
                        {/* PM 정보 - 실제 UserProfile assignedBuilder 사용 */}
                        {(() => {
                          const assignedBuilder = profile?.basicInfo?.assignedBuilder;
                          const pmInfo = assignedBuilder || {
                            name: '담당 PM 배정 중',
                            company: '포켓컴퍼니',
                            role: 'PM',
                            specialties: ['고객 지원', '프로젝트 관리']
                          };

                          return (
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-main to-secondary-main rounded-xl flex items-center justify-center shadow-lg">
                                  <span className="text-sm font-bold text-white">
                                    {pmInfo.name.substring(0, 2)}
                                  </span>
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent-green rounded-full border-2 border-white" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-neutral-darkest">
                                  {pmInfo.name}
                                </div>
                                <div className="text-xs text-neutral-dark">
                                  {(pmInfo.specialties || ['프로젝트 관리', '고객 지원']).slice(0, 2).join(' • ')}
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* 다음 미팅 정보 - 실제 ScheduleContext 데이터 사용 */}
                        {(() => {
                          const nextMeeting = getNextProjectMeeting(project.id);
                          if (!nextMeeting) return null;

                          return (
                            <div className="text-right">
                              <div className="text-xs text-neutral-dark mb-1">다음 미팅</div>
                              <div className="text-sm font-bold text-neutral-darkest">
                                {nextMeeting.title}
                              </div>
                              <div className="text-xs text-primary-main font-medium">
                                {new Date(nextMeeting.startDateTime).toLocaleDateString('ko-KR', {
                                  month: 'short',
                                  day: 'numeric',
                                  weekday: 'short'
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* 하단 액션 영역 */}
                    <div className="px-6 pb-6">
                      <div className="flex items-center justify-between">
                        {/* 최근 활동 - 실제 프로젝트 활동 기반 */}
                        <div className="flex items-center gap-2 text-xs text-neutral-dark">
                          {(() => {
                            const lastActivity = getLastActivityTime(project);
                            const now = new Date();
                            const diffHours = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60));

                            return (
                              <>
                                <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse" />
                                <span>
                                  {(() => {
                                    if (diffHours < 1) return '방금 업데이트됨';
                                    if (diffHours < 24) return `${diffHours}시간 전 업데이트`;
                                    const diffDays = Math.floor(diffHours / 24);
                                    if (diffDays < 7) return `${diffDays}일 전 업데이트`;
                                    return `${Math.floor(diffDays / 7)}주 전 업데이트`;
                                  })()}
                                </span>
                              </>
                            );
                          })()}
                        </div>

                        {/* 액션 버튼 - 항상 표시하되 고급스럽게 */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // 프로젝트 채팅방 생성 및 모달 열기
                              createChatRoomForProject(project);
                              setSelectedChatProject(project);
                            }}
                            className="relative p-2 bg-white/80 hover:bg-primary-light rounded-lg transition-all duration-200 hover:scale-110 shadow-lg border border-white/50"
                            title="메시지"
                          >
                            <MessageSquare className="w-4 h-4 text-primary-main" />
                            {getUnreadCountByProject(project.id) > 0 && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {getUnreadCountByProject(project.id)}
                              </span>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/startup/buildup/calendar');
                            }}
                            className="p-2 bg-white/80 hover:bg-secondary-light rounded-lg transition-all duration-200 hover:scale-110 shadow-lg border border-white/50"
                            title="일정"
                          >
                            <Calendar className="w-4 h-4 text-secondary-main" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 호버 시 글로우 효과 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-main/5 to-secondary-main/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 채팅 사이드 모달 */}
      {selectedChatProject && (
        <ChatSideModal
          projectId={selectedChatProject.id}
          projectTitle={selectedChatProject.title}
          onClose={() => setSelectedChatProject(null)}
        />
      )}
    </div>
  );
}
