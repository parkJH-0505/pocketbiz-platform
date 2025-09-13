import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock,
  AlertCircle,
  CheckCircle,
  Calendar,
  TrendingUp,
  ChevronRight,
  FileText,
  Users,
  MessageSquare,
  Target,
  Briefcase,
  AlertTriangle,
  Bell,
  Video,
  Plus,
  ArrowUpRight,
  Sparkles,
  Filter,
  MoreVertical,
  Activity,
  Zap,
  User,
  ArrowRight
} from 'lucide-react';
import { useBuildupContext } from '../../../contexts/BuildupContext';
import type { Project } from '../../../types/buildup.types';

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

export default function BuildupDashboard() {
  const navigate = useNavigate();
  const { projects, activeProjects } = useBuildupContext();
  const [selectedPriority, setSelectedPriority] = useState<'all' | 'urgent' | 'normal'>('all');

  // 오늘의 작업 데이터
  const todayTasks: TodayTask[] = [
    {
      id: '1',
      type: 'meeting',
      title: 'MVP 개발 중간점검',
      project: 'MVP 개발',
      time: '10:00',
      priority: 'high',
      status: 'pending',
      action: '회의 참여'
    },
    {
      id: '2',
      type: 'deliverable',
      title: 'IR Deck 초안 제출',
      project: 'IR 덱 컨설팅',
      time: '14:00',
      priority: 'high',
      status: 'pending',
      action: '파일 업로드'
    },
    {
      id: '3',
      type: 'review',
      title: '디자인 시안 피드백',
      project: 'UI/UX 개선',
      priority: 'medium',
      status: 'in_progress',
      action: '검토하기'
    },
    {
      id: '4',
      type: 'milestone',
      title: '1차 개발 완료',
      project: 'MVP 개발',
      priority: 'high',
      status: 'pending',
      action: '확인하기'
    }
  ];

  // 최근 활동 데이터
  const recentActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'upload',
      user: '김개발 PM',
      project: 'MVP 개발',
      description: '기능명세서 v2.0 업로드',
      time: '10분 전'
    },
    {
      id: '2',
      type: 'comment',
      user: '이디자인 PM',
      project: 'UI/UX 개선',
      description: '디자인 시안에 피드백 추가',
      time: '30분 전'
    },
    {
      id: '3',
      type: 'complete',
      user: '박기획 PM',
      project: 'IR 덱 컨설팅',
      description: '시장조사 단계 완료',
      time: '1시간 전'
    },
    {
      id: '4',
      type: 'start',
      user: '최개발 PM',
      project: '웹사이트 리뉴얼',
      description: '프로젝트 킥오프',
      time: '2시간 전'
    }
  ];

  // 긴급도에 따른 프로젝트 필터링
  const getFilteredProjects = () => {
    let filtered = [...activeProjects];
    
    if (selectedPriority === 'urgent') {
      filtered = filtered.filter(p => {
        const daysRemaining = p.timeline.next_milestone ? 
          Math.ceil((new Date(p.timeline.next_milestone.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 999;
        return daysRemaining <= 3;
      });
    } else if (selectedPriority === 'normal') {
      filtered = filtered.filter(p => {
        const daysRemaining = p.timeline.next_milestone ? 
          Math.ceil((new Date(p.timeline.next_milestone.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 999;
        return daysRemaining > 3;
      });
    }
    
    return filtered.slice(0, 6);
  };

  const filteredProjects = getFilteredProjects();

  // 긴급 프로젝트 수 계산
  const urgentCount = activeProjects.filter(p => {
    const daysRemaining = p.timeline.next_milestone ? 
      Math.ceil((new Date(p.timeline.next_milestone.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 999;
    return daysRemaining <= 3;
  }).length;

  // 이번 주 완료 예정 수 계산
  const weeklyDueCount = activeProjects.filter(p => 
    p.timeline.next_milestone && 
    new Date(p.timeline.next_milestone.due_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  ).length;

  // 평균 진행률 계산
  const avgProgress = Math.round(
    activeProjects.reduce((sum, p) => sum + p.progress.overall, 0) / (activeProjects.length || 1)
  );

  const getTaskIcon = (type: TodayTask['type']) => {
    switch(type) {
      case 'meeting': return <Video className="w-4 h-4" />;
      case 'deliverable': return <FileText className="w-4 h-4" />;
      case 'review': return <MessageSquare className="w-4 h-4" />;
      case 'milestone': return <Target className="w-4 h-4" />;
    }
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch(type) {
      case 'upload': return <FileText className="w-3 h-3" />;
      case 'comment': return <MessageSquare className="w-3 h-3" />;
      case 'complete': return <CheckCircle className="w-3 h-3" />;
      case 'start': return <Zap className="w-3 h-3" />;
    }
  };

  const getPriorityColor = (priority: TodayTask['priority']) => {
    switch(priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">프로젝트 대시보드</h1>
              <p className="text-sm text-gray-600 mt-1">
                {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/startup/buildup/catalog')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                새 프로젝트
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Bell className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-gray-500">전체</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{activeProjects.length}</p>
            <p className="text-sm text-gray-600 mt-1">진행중인 프로젝트</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-xs font-medium text-gray-500">이번 주</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{weeklyDueCount}</p>
            <p className="text-sm text-gray-600 mt-1">완료 예정</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-xs font-medium text-gray-500">긴급</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{urgentCount}</p>
            <p className="text-sm text-gray-600 mt-1">주의 필요</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-xs font-medium text-gray-500">평균</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{avgProgress}%</p>
            <p className="text-sm text-gray-600 mt-1">진행률</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Today's Focus - Left Column */}
          <div className="col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 h-full">
              <div className="p-5 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  다가오는 빌드업 일정
                </h2>
              </div>
              
              <div className="p-5 space-y-4 max-h-[500px] overflow-y-auto">
                {todayTasks.map((task) => (
                  <div 
                    key={task.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getPriorityColor(task.priority)}`}>
                        {getTaskIcon(task.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{task.project}</p>
                        {task.time && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-600">
                            <Clock className="w-3 h-3" />
                            {task.time}
                          </div>
                        )}
                      </div>
                      {task.action && (
                        <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                          {task.action}
                        </button>
                      )}
                    </div>
                    {task.status === 'in_progress' && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-xs text-orange-600">
                          <AlertCircle className="w-3 h-3" />
                          진행 중
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {todayTasks.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">오늘 예정된 작업이 없습니다</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Projects - Right Column */}
          <div className="col-span-2">
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">진행중인 프로젝트</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedPriority('all')}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                      selectedPriority === 'all' 
                        ? 'bg-gray-900 text-white' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    전체
                  </button>
                  <button
                    onClick={() => setSelectedPriority('urgent')}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                      selectedPriority === 'urgent' 
                        ? 'bg-red-600 text-white' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    긴급
                  </button>
                  <button
                    onClick={() => setSelectedPriority('normal')}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                      selectedPriority === 'normal' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    일반
                  </button>
                </div>
              </div>

              <div className="p-5">
                {filteredProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">진행중인 프로젝트가 없습니다</p>
                    <button 
                      onClick={() => navigate('/startup/buildup/catalog')}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      서비스 둘러보기 →
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {filteredProjects.map((project) => {
                      const daysRemaining = project.timeline.next_milestone ? 
                        Math.ceil((new Date(project.timeline.next_milestone.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
                      
                      return (
                        <div
                          key={project.id}
                          className="border border-gray-200 rounded-lg hover:shadow-lg transition-all group"
                        >
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors cursor-pointer"
                                    onClick={() => navigate(`/startup/buildup/projects/${project.id}`)}>
                                  {project.title}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">{project.category}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {daysRemaining !== null && daysRemaining <= 3 && (
                                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                                    D-{daysRemaining}
                                  </span>
                                )}
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // TODO: Show project menu
                                  }}
                                  className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreVertical className="w-4 h-4 text-gray-500" />
                                </button>
                              </div>
                            </div>

                            {/* Progress */}
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-600">진행률</span>
                                <span className="text-xs font-semibold text-gray-900">{project.progress.overall}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all ${
                                    project.progress.overall >= 80 ? 'bg-green-500' :
                                    project.progress.overall >= 50 ? 'bg-blue-500' :
                                    'bg-yellow-500'
                                  }`}
                                  style={{ width: `${project.progress.overall}%` }}
                                />
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <Target className="w-3 h-3" />
                                <span>{project.progress.milestones_completed}/{project.progress.milestones_total} 마일스톤</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <FileText className="w-3 h-3" />
                                <span>{project.progress.deliverables_submitted}/{project.progress.deliverables_total} 산출물</span>
                              </div>
                            </div>

                            {/* Next Milestone */}
                            {project.timeline.next_milestone && (
                              <div className="p-2 bg-gray-50 rounded-lg mb-3">
                                <div className="flex items-center gap-2 text-xs">
                                  <Clock className="w-3 h-3 text-gray-500" />
                                  <span className="text-gray-600">다음:</span>
                                  <span className="font-medium text-gray-900 truncate">{project.timeline.next_milestone.name}</span>
                                </div>
                              </div>
                            )}

                            {/* Team & Communication */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                              <div className="flex items-center gap-2">
                                {project.team?.pm && (
                                  <div className="flex items-center gap-1">
                                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                      <span className="text-[10px] text-white font-medium">
                                        {project.team.pm.name[0]}
                                      </span>
                                    </div>
                                    <span className="text-xs text-gray-600">{project.team.pm.name}</span>
                                  </div>
                                )}
                                {project.communication.unread_messages > 0 && (
                                  <div className="flex items-center gap-1 px-2 py-0.5 bg-red-100 rounded-full">
                                    <MessageSquare className="w-3 h-3 text-red-600" />
                                    <span className="text-xs text-red-600 font-medium">{project.communication.unread_messages}</span>
                                  </div>
                                )}
                              </div>
                              <button 
                                onClick={() => navigate(`/startup/buildup/projects/${project.id}`)}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                              >
                                상세보기
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Quick Actions Bar - Appears on Hover */}
                          <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <button className="p-1.5 hover:bg-white rounded text-gray-600 hover:text-blue-600 transition-colors">
                                  <FileText className="w-3.5 h-3.5" />
                                </button>
                                <button className="p-1.5 hover:bg-white rounded text-gray-600 hover:text-blue-600 transition-colors">
                                  <Users className="w-3.5 h-3.5" />
                                </button>
                                <button className="p-1.5 hover:bg-white rounded text-gray-600 hover:text-blue-600 transition-colors">
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                                <button className="p-1.5 hover:bg-white rounded text-gray-600 hover:text-blue-600 transition-colors">
                                  <Calendar className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <span className="text-xs text-gray-500">빠른 작업</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-600" />
              최근 업데이트된 활동
            </h2>
            <button className="text-sm text-gray-600 hover:text-gray-900">
              전체보기
            </button>
          </div>
          
          <div className="p-5">
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="relative">
                    <div className={`p-2 rounded-full ${
                      activity.type === 'complete' ? 'bg-green-100 text-green-600' :
                      activity.type === 'upload' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'comment' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    {index < recentActivities.length - 1 && (
                      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gray-200"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.user}</span>
                      {' '}
                      <span className="text-gray-600">{activity.description}</span>
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">{activity.project}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-400">{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}