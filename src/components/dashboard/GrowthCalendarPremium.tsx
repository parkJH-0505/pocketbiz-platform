/**
 * Growth Calendar Premium Component
 *
 * 스타트업 대표를 위한 프리미엄 성장 캘린더
 * - 드래그 앤 드롭
 * - AI 추천 시간대
 * - 실시간 진행률
 * - 미니 대시보드
 * - 퀵 액션
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  Clock,
  TrendingUp,
  Award,
  Target,
  Sparkles,
  Activity,
  BarChart3,
  Zap,
  AlertCircle,
  Brain,
  ArrowRight,
  ArrowUp,
  Users,
  DollarSign,
  Briefcase,
  Rocket,
  Flag,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Edit3,
  Trash2,
  Copy,
  Share2,
  Bell,
  BellOff,
  Timer,
  RefreshCw,
  TrendingDown,
  Download,
  FileText
} from 'lucide-react';
import { format, addDays, startOfWeek, isToday, isSameDay, differenceInMinutes } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useDashboard } from '../../contexts/DashboardContext';
import { useKPIDiagnosis } from '../../contexts/KPIDiagnosisContext';
import { useScheduleContext } from '../../contexts/ScheduleContext';

// 이벤트 상태 타입
type EventStatus = 'not-started' | 'in-progress' | 'completed' | 'cancelled';
type ViewMode = 'week' | 'day' | 'agenda' | 'metrics';

// 이벤트 카테고리별 설정
const EVENT_CATEGORIES = {
  kpi: {
    label: 'KPI 체크',
    icon: BarChart3,
    color: 'blue',
    gradient: 'from-blue-400 to-blue-600'
  },
  funding: {
    label: '자금 조달',
    icon: DollarSign,
    color: 'green',
    gradient: 'from-green-400 to-emerald-600'
  },
  team: {
    label: '팀 빌딩',
    icon: Users,
    color: 'purple',
    gradient: 'from-purple-400 to-violet-600'
  },
  product: {
    label: '제품 개발',
    icon: Rocket,
    color: 'orange',
    gradient: 'from-orange-400 to-red-500'
  },
  meeting: {
    label: '미팅',
    icon: Briefcase,
    color: 'gray',
    gradient: 'from-gray-400 to-gray-600'
  },
  learning: {
    label: '학습',
    icon: Brain,
    color: 'indigo',
    gradient: 'from-indigo-400 to-blue-600'
  }
};

const GrowthCalendarPremium: React.FC = () => {
  const { weeklySchedule, currentWeek, navigateWeek, markEventCompleted } = useDashboard();
  const { axisScores, overallScore, progress, previousScores } = useKPIDiagnosis();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [timeTracking, setTimeTracking] = useState<Record<string, number>>({});
  const [quickAddType, setQuickAddType] = useState<string>('kpi');

  // 주간 날짜 생성
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // 실시간 KPI 메트릭 (이전 점수와 비교하여 트렌드 계산)
  const realTimeMetrics = {
    go: {
      value: `${axisScores.GO.toFixed(1)}`,
      trend: axisScores.GO > previousScores.GO ? 'up' : axisScores.GO < previousScores.GO ? 'down' : 'neutral',
      label: 'GO축',
      change: axisScores.GO - previousScores.GO
    },
    ec: {
      value: `${axisScores.EC.toFixed(1)}`,
      trend: axisScores.EC > previousScores.EC ? 'up' : axisScores.EC < previousScores.EC ? 'down' : 'neutral',
      label: 'EC축',
      change: axisScores.EC - previousScores.EC
    },
    pt: {
      value: `${axisScores.PT.toFixed(1)}`,
      trend: axisScores.PT > previousScores.PT ? 'up' : axisScores.PT < previousScores.PT ? 'down' : 'neutral',
      label: 'PT축',
      change: axisScores.PT - previousScores.PT
    },
    pf: {
      value: `${axisScores.PF.toFixed(1)}`,
      trend: axisScores.PF > previousScores.PF ? 'up' : axisScores.PF < previousScores.PF ? 'down' : 'neutral',
      label: 'PF축',
      change: axisScores.PF - previousScores.PF
    },
    to: {
      value: `${axisScores.TO.toFixed(1)}`,
      trend: axisScores.TO > previousScores.TO ? 'up' : axisScores.TO < previousScores.TO ? 'down' : 'neutral',
      label: 'TO축',
      change: axisScores.TO - previousScores.TO
    },
    overall: {
      value: `${overallScore.toFixed(1)}`,
      trend: overallScore > Object.values(previousScores).reduce((sum, score) => sum + score, 0) / 5 ? 'up' : 'down',
      label: '종합점수',
      change: overallScore - Object.values(previousScores).reduce((sum, score) => sum + score, 0) / 5
    }
  };

  // KPI 기반 추천
  const aiRecommendations = {
    bestTimeToday: '오전 10:00-12:00',
    productivityScore: Math.round(overallScore),
    suggestion: progress.percentage < 100
      ? `KPI 진단을 ${100 - progress.percentage}% 더 완료하면 정확한 성장 인사이트를 제공받을 수 있습니다`
      : '모든 KPI 진단이 완료되었습니다. 상세 분석 결과를 확인해보세요'
  };

  // 실시간 메트릭 계산
  const metrics = useMemo(() => {
    const total = weeklySchedule.length;
    const completed = weeklySchedule.filter(e => e.isCompleted).length;
    const inProgress = Object.keys(timeTracking).length;
    const overdue = weeklySchedule.filter(e =>
      !e.isCompleted && new Date(e.date) < new Date()
    ).length;

    return {
      total,
      completed,
      inProgress,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      onTrackRate: total > 0 ? Math.round(((total - overdue) / total) * 100) : 100
    };
  }, [weeklySchedule, timeTracking]);

  // 타이머 시작/중지
  const toggleTimer = (eventId: string) => {
    if (timeTracking[eventId]) {
      // 중지
      const newTracking = { ...timeTracking };
      delete newTracking[eventId];
      setTimeTracking(newTracking);
    } else {
      // 시작
      setTimeTracking({
        ...timeTracking,
        [eventId]: Date.now()
      });
    }
  };

  // 경과 시간 계산
  const getElapsedTime = (eventId: string) => {
    if (!timeTracking[eventId]) return '00:00';
    const minutes = Math.floor((Date.now() - timeTracking[eventId]) / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 py-5 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">성장 캘린더</h2>
              <p className="text-gray-600 text-sm mt-0.5">전문가 대시보드</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>AI 인사이트</span>
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>리포트</span>
            </button>
          </div>
        </div>

        {/* AI 추천 인사이트 */}
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-start space-x-2">
            <Brain className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">오늘의 추천</p>
              <p className="text-xs text-gray-600 mt-1">
                {aiRecommendations.suggestion}
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* 네비게이션 & 퀵 액션 */}
      <div className="px-6 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-lg text-gray-900">
              {format(weekStart, 'yyyy년 M월 d일', { locale: ko })} - {format(addDays(weekStart, 6), 'M월 d일', { locale: ko })}
            </h3>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {/* 보기 모드 전환 */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              {(['week', 'day', 'agenda', 'metrics'] as ViewMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                    viewMode === mode
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {mode === 'week' && '주간'}
                  {mode === 'day' && '일간'}
                  {mode === 'agenda' && '아젠다'}
                  {mode === 'metrics' && '메트릭'}
                </button>
              ))}
            </div>

            <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 퀵 카테고리 필터 */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {Object.entries(EVENT_CATEGORIES).map(([key, category]) => {
            const Icon = category.icon;
            return (
              <button
                key={key}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                <Icon className="w-4 h-4" />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 메인 캘린더 뷰 */}
      {viewMode === 'week' && (
        <div className="p-6">
          <div className="grid grid-cols-7 gap-3">
            {weekDates.map((date, index) => {
              const dayEvents = weeklySchedule.filter(event =>
                isSameDay(new Date(event.date), date)
              );
              const isCurrentDay = isToday(date);
              const dayOfWeek = format(date, 'EEE', { locale: ko });

              return (
                <motion.div
                  key={index}
                  className={`min-h-[160px] rounded-lg border transition-all overflow-hidden ${
                    isCurrentDay
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  whileHover={{ scale: 1.01 }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {/* 드롭 핸들러 */}}
                >
                  {/* 날짜 헤더 */}
                  <div className={`px-3 py-2 border-b ${isCurrentDay ? 'bg-blue-100 border-blue-200' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-bold ${isCurrentDay ? 'text-blue-700' : 'text-gray-900'}`}>
                          {format(date, 'd')}
                        </span>
                        <span className={`text-xs ${isCurrentDay ? 'text-blue-600' : 'text-gray-500'}`}>
                          {dayOfWeek}
                        </span>
                      </div>
                      {isCurrentDay && (
                        <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                          오늘
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 이벤트 목록 */}
                  <div className="p-2 space-y-1.5 max-h-[120px] overflow-y-auto">
                    <AnimatePresence>
                      {dayEvents.slice(0, 3).map((event) => {
                        const category = EVENT_CATEGORIES[event.type as keyof typeof EVENT_CATEGORIES] || EVENT_CATEGORIES.meeting;
                        const Icon = category.icon;
                        const isTracking = timeTracking[event.id];

                        return (
                          <motion.div
                            key={event.id}
                            layout
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="p-1.5 rounded bg-blue-50 text-blue-700 border border-blue-100 cursor-pointer group relative hover:bg-blue-100 transition-colors"
                            draggable
                            onDragStart={() => setIsDragging(true)}
                            onDragEnd={() => setIsDragging(false)}
                            onClick={() => setSelectedEvent(event.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1.5 flex-1">
                                <Icon className="w-3 h-3" />
                                <span className="text-xs font-medium truncate">
                                  {event.title}
                                </span>
                              </div>

                              {/* 상태 아이콘 */}
                              <div className="flex items-center space-x-1">
                                {isTracking && (
                                  <div className="text-xs bg-blue-200 px-1 py-0.5 rounded">
                                    {getElapsedTime(event.id)}
                                  </div>
                                )}

                                {event.isCompleted ? (
                                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                                ) : isTracking ? (
                                  <PauseCircle
                                    className="w-3 h-3 text-yellow-600 cursor-pointer hover:text-yellow-700"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleTimer(event.id);
                                    }}
                                  />
                                ) : (
                                  <PlayCircle
                                    className="w-3 h-3 text-gray-400 cursor-pointer hover:text-green-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleTimer(event.id);
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {dayEvents.length > 3 && (
                      <span className="text-xs text-gray-500 pl-2">+{dayEvents.length - 3}개 더</span>
                    )}

                    {dayEvents.length === 0 && (
                      <div className="text-center py-3 text-gray-400">
                        <Plus className="w-4 h-4 mx-auto mb-1" />
                        <p className="text-xs">일정 추가</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* 메트릭 뷰 */}
      {viewMode === 'metrics' && (
        <div className="p-6">
          <div className="grid grid-cols-3 gap-6">
            {/* 주간 진행률 차트 */}
            <div className="col-span-2 bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">주간 진행률</h3>
              <div className="space-y-3">
                {weekDates.map((date, index) => {
                  const dayEvents = weeklySchedule.filter(e => isSameDay(new Date(e.date), date));
                  const completed = dayEvents.filter(e => e.isCompleted).length;
                  const total = dayEvents.length;
                  const percentage = total > 0 ? (completed / total) * 100 : 0;

                  return (
                    <div key={index} className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-700 w-20">
                        {format(date, 'EEE', { locale: ko })}
                      </span>
                      <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                        <motion.div
                          className="h-full bg-blue-600 rounded-full flex items-center justify-end pr-2"
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        >
                          {percentage > 20 && (
                            <span className="text-xs text-white font-medium">
                              {Math.round(percentage)}%
                            </span>
                          )}
                        </motion.div>
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {completed}/{total}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 카테고리별 분포 */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">카테고리 분포</h3>
              <div className="space-y-3">
                {Object.entries(EVENT_CATEGORIES).slice(0, 4).map(([key, category]) => {
                  const Icon = category.icon;
                  const count = weeklySchedule.filter(e => e.type === key).length;

                  return (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-gray-700">{category.label}</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">{count}</span>
                    </div>
                  );
                })}
              </div>

              {/* KPI 진단 목표 */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700">KPI 진단</span>
                  <span className="text-sm font-bold text-blue-600">{progress.completed}/{progress.total}</span>
                </div>
                <div className="w-full bg-blue-100 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progress.percentage}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 빠른 추가 플로팅 패널 */}
      {showQuickAdd && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute bottom-20 right-6 bg-white rounded-xl shadow-lg border border-gray-200 p-4 w-80 z-50"
        >
          <h3 className="font-bold text-gray-900 mb-3">빠른 일정 추가</h3>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {Object.entries(EVENT_CATEGORIES).map(([type, cat]) => (
              <button
                key={type}
                className={`p-3 rounded-lg border transition-all ${
                  quickAddType === type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setQuickAddType(type)}
              >
                <cat.icon className={`w-5 h-5 ${
                  quickAddType === type ? 'text-blue-600' : 'text-gray-500'
                }`} />
                <span className="text-xs text-gray-700 block mt-1">{cat.label}</span>
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="일정 제목 입력..."
            className="w-full p-2 border border-gray-200 rounded-lg text-sm mb-2"
          />
          <button className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            추가하기
          </button>
        </motion.div>
      )}

      {/* 하단 인사이트 바 */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">KPI 진단 진행률</p>
                <p className="text-xs text-gray-600">{progress.percentage}% 완료 ({progress.completed}/{progress.total} 항목)</p>
              </div>
            </div>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>주간 리포트 보기</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GrowthCalendarPremium;