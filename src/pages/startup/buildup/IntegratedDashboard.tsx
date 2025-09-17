/**
 * 통합 빌드업 대시보드
 * 프로젝트 대시보드 + 프로젝트 관리를 하나로 통합
 */

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
import type { Project, ProjectPhase } from '../../../types/buildup.types';
import type { CalendarEvent } from '../../../types/calendar.types';
import {
  PHASE_INFO,
  ALL_PHASES,
  calculatePhaseProgress,
  getPhaseIndex
} from '../../../utils/projectPhaseUtils';

type DashboardView = 'overview' | 'projects';
type ProjectFilter = 'all' | 'active' | 'completed' | 'wishlist';

interface TodayTask {
  id: string;
  type: 'meeting' | 'deliverable' | 'review' | 'milestone';
  title: string;
  project: string;
  time?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  action?: string;
}

interface ActivityItem {
  id: string;
  type: 'comment' | 'upload' | 'complete' | 'start';
  user: string;
  project: string;
  description: string;
  time: string;
}

export default function IntegratedDashboard() {
  const navigate = useNavigate();
  const { projects, activeProjects, completedProjects } = useBuildupContext();
  const { todayEvents, thisWeekEvents } = useCalendarContext();
  const { unreadCount } = useChatContext();
  const [view, setView] = useState<DashboardView>('overview');
  const [selectedFilter, setSelectedFilter] = useState<ProjectFilter>('active');

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

  // 오늘의 작업 (캘린더 이벤트 기반)
  const todayTasks: TodayTask[] = React.useMemo(() => {
    return todayEvents.map(event => ({
      id: event.id,
      type: 'meeting' as const,
      title: event.title,
      project: event.projectTitle,
      time: event.time,
      priority: event.priority === 'critical' ? 'high' : event.priority === 'high' ? 'high' : 'medium',
      status: event.status === 'completed' ? 'completed' : 'pending',
      action: '회의 참여'
    }));
  }, [todayEvents]);

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

  const getTaskIcon = (type: TodayTask['type']) => {
    switch (type) {
      case 'meeting': return <Video className="w-4 h-4" />;
      case 'deliverable': return <FileText className="w-4 h-4" />;
      case 'review': return <CheckCircle className="w-4 h-4" />;
      case 'milestone': return <Target className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: TodayTask['priority']) => {
    switch (priority) {
      case 'high': return 'text-accent-red bg-accent-red/10';
      case 'medium': return 'text-accent-orange bg-accent-orange/10';
      case 'low': return 'text-neutral-dark bg-neutral-lightest';
    }
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'comment': return <MessageSquare className="w-4 h-4 text-primary-main" />;
      case 'upload': return <Download className="w-4 h-4 text-secondary-main" />;
      case 'complete': return <CheckCircle className="w-4 h-4 text-accent-green" />;
      case 'start': return <PlayCircle className="w-4 h-4 text-accent-purple" />;
    }
  };

  const getProjectStatusBadge = (project: Project) => {
    const { phaseInfo } = calculateProgress(project);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${phaseInfo.bgColor} ${phaseInfo.textColor}`}>
        {phaseInfo.label}
      </span>
    );
  };

  // 통계 계산
  const stats = {
    totalProjects: projects.length,
    activeProjects: activeProjects.length,
    completedProjects: completedProjects.length,
    todayTasks: todayTasks.length,
    thisWeekMeetings: thisWeekEvents.length,
    unreadMessages: unreadCount
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-darkest">포켓빌드업 대시보드</h1>
          <p className="text-neutral-dark mt-1">프로젝트 진행 현황과 오늘의 할 일을 확인하세요</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-neutral-lightest rounded-lg p-1">
            <button
              onClick={() => setView('overview')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'overview'
                  ? 'bg-white text-primary-main shadow-sm'
                  : 'text-neutral-dark hover:text-neutral-darkest'
              }`}
            >
              대시보드
            </button>
            <button
              onClick={() => setView('projects')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'projects'
                  ? 'bg-white text-primary-main shadow-sm'
                  : 'text-neutral-dark hover:text-neutral-darkest'
              }`}
            >
              프로젝트 관리
            </button>
          </div>
        </div>
      </div>

      {view === 'overview' ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 border border-neutral-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-dark">진행 중인 프로젝트</p>
                  <p className="text-2xl font-bold text-neutral-darkest mt-1">{stats.activeProjects}</p>
                </div>
                <div className="p-3 bg-primary-light rounded-lg">
                  <Briefcase className="w-6 h-6 text-primary-main" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-neutral-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-dark">오늘의 일정</p>
                  <p className="text-2xl font-bold text-neutral-darkest mt-1">{stats.todayTasks}</p>
                </div>
                <div className="p-3 bg-accent-orange/10 rounded-lg">
                  <Calendar className="w-6 h-6 text-accent-orange" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-neutral-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-dark">이번 주 미팅</p>
                  <p className="text-2xl font-bold text-neutral-darkest mt-1">{stats.thisWeekMeetings}</p>
                </div>
                <div className="p-3 bg-secondary-light rounded-lg">
                  <Video className="w-6 h-6 text-secondary-main" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-neutral-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-dark">읽지 않은 메시지</p>
                  <p className="text-2xl font-bold text-neutral-darkest mt-1">{stats.unreadMessages}</p>
                </div>
                <div className="p-3 bg-accent-purple/10 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-accent-purple" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 오늘의 할 일 */}
            <div className="bg-white rounded-xl border border-neutral-border">
              <div className="p-6 border-b border-neutral-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-neutral-darkest">오늘의 할 일</h2>
                  <button
                    onClick={() => navigate('/startup/buildup/calendar')}
                    className="text-sm text-primary-main hover:text-primary-dark font-medium flex items-center gap-1"
                  >
                    전체 보기 <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                {todayTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-accent-green mx-auto mb-3" />
                    <p className="text-neutral-dark">오늘 예정된 일정이 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayTasks.slice(0, 5).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-neutral-lighter hover:bg-neutral-lightest transition-colors"
                      >
                        <div className={`p-2 rounded-lg ${getPriorityColor(task.priority)}`}>
                          {getTaskIcon(task.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-neutral-darkest truncate">{task.title}</p>
                          <p className="text-sm text-neutral-dark">{task.project}</p>
                        </div>
                        {task.time && (
                          <div className="text-sm text-neutral-dark">{task.time}</div>
                        )}
                        <ChevronRight className="w-4 h-4 text-neutral-lighter" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 최근 활동 */}
            <div className="bg-white rounded-xl border border-neutral-border">
              <div className="p-6 border-b border-neutral-border">
                <h2 className="text-lg font-semibold text-neutral-darkest">최근 활동</h2>
              </div>
              <div className="p-6">
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

          {/* 프로젝트 요약 */}
          <div className="bg-white rounded-xl border border-neutral-border">
            <div className="p-6 border-b border-neutral-border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-darkest">진행 중인 프로젝트</h2>
                <button
                  onClick={() => setView('projects')}
                  className="text-sm text-primary-main hover:text-primary-dark font-medium flex items-center gap-1"
                >
                  전체 관리 <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {activeProjects.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-neutral-lighter mx-auto mb-3" />
                  <p className="text-neutral-dark">진행 중인 프로젝트가 없습니다</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeProjects.slice(0, 4).map((project) => {
                    const { progress, phaseInfo } = calculateProgress(project);
                    return (
                      <div
                        key={project.id}
                        onClick={() => navigate(`/startup/buildup/project/${project.id}`)}
                        className="p-4 border border-neutral-lighter rounded-lg hover:border-primary-main/30 hover:bg-primary-light/5 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-medium text-neutral-darkest line-clamp-1">{project.title}</h3>
                          {getProjectStatusBadge(project)}
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-dark">진행률</span>
                            <span className="font-medium text-neutral-darkest">{progress}%</span>
                          </div>
                          <div className="w-full bg-neutral-lightest rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${phaseInfo.bgColor.replace('/10', '')}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        // 프로젝트 관리 뷰
        <div className="space-y-6">
          {/* 필터 및 액션 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex bg-neutral-lightest rounded-lg p-1">
                {[
                  { key: 'active', label: `진행 중 (${activeProjects.length})` },
                  { key: 'completed', label: `완료 (${completedProjects.length})` },
                  { key: 'all', label: `전체 (${projects.length})` }
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setSelectedFilter(filter.key as ProjectFilter)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedFilter === filter.key
                        ? 'bg-white text-primary-main shadow-sm'
                        : 'text-neutral-dark hover:text-neutral-darkest'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => navigate('/startup/buildup/catalog')}
              className="flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Plus className="w-4 h-4" />
              새 프로젝트
            </button>
          </div>

          {/* 프로젝트 목록 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const { progress, phaseInfo } = calculateProgress(project);
              return (
                <div
                  key={project.id}
                  onClick={() => navigate(`/startup/buildup/project/${project.id}`)}
                  className="bg-white rounded-xl border border-neutral-border hover:border-primary-main/30 hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-semibold text-neutral-darkest line-clamp-2 flex-1">
                        {project.title}
                      </h3>
                      {getProjectStatusBadge(project)}
                    </div>

                    {project.description && (
                      <p className="text-sm text-neutral-dark mb-4 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-dark">진행률</span>
                        <span className="font-medium text-neutral-darkest">{progress}%</span>
                      </div>
                      <div className="w-full bg-neutral-lightest rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${phaseInfo.bgColor.replace('/10', '')}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      {project.team?.pm && (
                        <div className="flex items-center gap-2 text-sm text-neutral-dark">
                          <User className="w-4 h-4" />
                          담당 PM: {project.team.pm.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-neutral-lighter mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-darkest mb-2">
                {selectedFilter === 'active' && '진행 중인 프로젝트가 없습니다'}
                {selectedFilter === 'completed' && '완료된 프로젝트가 없습니다'}
                {selectedFilter === 'all' && '프로젝트가 없습니다'}
              </h3>
              <p className="text-neutral-dark mb-6">
                카탈로그에서 새로운 프로젝트를 시작해보세요
              </p>
              <button
                onClick={() => navigate('/startup/buildup/catalog')}
                className="flex items-center gap-2 px-6 py-3 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors mx-auto"
              >
                <Plus className="w-4 h-4" />
                프로젝트 시작하기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}