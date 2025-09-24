/**
 * Interactive Calendar Center Component
 *
 * 확장된 인터랙티브 캘린더 + 통합 이벤트 센터
 * - 좌측: GrowthCalendarPremium 통합 (60%)
 * - 우측: 3개 탭 통합 이벤트 패널 (40%)
 *   ├ 스마트매칭: comprehensiveEvents 기반
 *   ├ 긴급사항: 마감임박 + 위험상황
 *   └ 할일문서: 프로젝트 문서 + VDR
 * - 드래그&드롭 기반 직관적 일정 관리
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  AlertTriangle,
  FileText,
  Clock,
  Heart,
  ExternalLink,
  X,
  Search
} from 'lucide-react';
import GrowthCalendarPremium from './GrowthCalendarPremium';
import { useDashboardInteraction } from '../../contexts/DashboardInteractionContext';
import { useKPIDiagnosis } from '../../contexts/KPIDiagnosisContext';
import { useBuildupContext } from '../../contexts/BuildupContext';
import { useVDRContext } from '../../contexts/VDRContext';
import { comprehensiveEvents } from '../../data/smartMatching/comprehensiveEvents';
import type { MatchingResult } from '../../types/smartMatching/types';

// 탭 정의
type TabType = 'smart_matching' | 'urgent' | 'todo_docs';

interface Tab {
  id: TabType;
  title: string;
  icon: any;
  badge?: number;
}


interface InteractiveCalendarCenterProps {
  className?: string;
}

const InteractiveCalendarCenter: React.FC<InteractiveCalendarCenterProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<TabType>('smart_matching');
  const [searchQuery, setSearchQuery] = useState('');

  // Contexts
  const { draggedEvent, setDraggedEvent, hoveredDay, setHoveredDay, interestedEvents, dismissedEvents } = useDashboardInteraction();
  const { overallScore, strongestAxis } = useKPIDiagnosis();
  const { cart } = useBuildupContext();
  const { filesUploaded } = useVDRContext();

  // 필터링된 이벤트들
  const filteredEvents = useMemo(() => {
    return comprehensiveEvents
      .filter(event => !dismissedEvents.has(event.event.id))
      .filter(event =>
        searchQuery === '' ||
        event.event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.event.keywords.some(keyword =>
          keyword.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
      .sort((a, b) => {
        // 긴급도 우선, 그 다음 매칭 점수
        if (a.urgencyLevel === 'high' && b.urgencyLevel !== 'high') return -1;
        if (b.urgencyLevel === 'high' && a.urgencyLevel !== 'high') return 1;
        return b.score - a.score;
      });
  }, [searchQuery, dismissedEvents]);

  // 탭별 카운트 업데이트
  const tabCounts = useMemo(() => {
    const urgentCount = filteredEvents.filter(e => e.daysUntilDeadline <= 14).length;
    const todoCount = (cart?.items?.length || 0) + (filesUploaded?.length || 0);

    return {
      smart_matching: filteredEvents.length,
      urgent: urgentCount + (overallScore < 70 ? 1 : 0), // KPI 위험도 포함
      todo_docs: todoCount
    };
  }, [filteredEvents, cart, filesUploaded, overallScore]);

  // TABS 업데이트
  const TABS: Tab[] = [
    {
      id: 'smart_matching',
      title: '스마트매칭',
      icon: Sparkles,
      badge: tabCounts.smart_matching
    },
    {
      id: 'urgent',
      title: '긴급사항',
      icon: AlertTriangle,
      badge: tabCounts.urgent
    },
    {
      id: 'todo_docs',
      title: '할일문서',
      icon: FileText,
      badge: tabCounts.todo_docs
    }
  ];

  return (
    <div className={`bg-white rounded-xl border ${className}`}>
      {/* 헤더 */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold text-gray-900">인터랙티브 캘린더 + 통합 이벤트 센터</h2>
        <p className="text-sm text-gray-600">드래그&드롭으로 이벤트를 캘린더에 추가하고 통합 관리하세요</p>
      </div>

      <div className="flex min-h-[500px]">
        {/* 좌측: 캘린더 영역 (60%) */}
        <div className="flex-1 p-4">
          <div
            className={`h-full rounded-lg transition-colors ${
              draggedEvent ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              if (draggedEvent) {
                setHoveredDay('calendar-area');
              }
            }}
            onDragLeave={() => {
              setHoveredDay(null);
            }}
            onDrop={async (e) => {
              e.preventDefault();
              if (draggedEvent && hoveredDay) {
                try {
                  // hoveredDay는 YYYY-MM-DD 형식의 문자열
                  const targetDate = new Date(hoveredDay);

                  // DashboardInteractionContext의 addEventToCalendar 호출
                  const success = await addEventToCalendar(draggedEvent, targetDate);

                  if (success) {
                    console.log('✅ Event successfully added to calendar:', {
                      event: draggedEvent.title,
                      date: targetDate.toLocaleDateString()
                    });

                    // 캘린더 리프레시 이벤트 발생 (GrowthCalendarPremium이 감지)
                    window.dispatchEvent(new CustomEvent('calendar-refresh'));
                  }
                } catch (error) {
                  console.error('Failed to add event to calendar:', error);
                } finally {
                  // 드래그 상태 초기화
                  setDraggedEvent(null);
                  setHoveredDay(null);
                }
              }
            }}
          >
            <GrowthCalendarPremium />
          </div>
        </div>

        {/* 우측: 통합 이벤트 패널 (40%) */}
        <div className="w-2/5 p-4 border-l flex flex-col">
          {/* 탭 네비게이션 */}
          <div className="flex border-b border-gray-200 mb-4">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.title}</span>
                  {tab.badge && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      isActive
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 탭 컨텐츠 */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {activeTab === 'smart_matching' && (
                  <SmartMatchingTab
                    events={filteredEvents}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    interestedEvents={interestedEvents}
                  />
                )}
                {activeTab === 'urgent' && (
                  <UrgentTab
                    urgentEvents={filteredEvents.filter(e => e.daysUntilDeadline <= 14)}
                    kpiScore={overallScore}
                    strongestAxis={strongestAxis}
                  />
                )}
                {activeTab === 'todo_docs' && (
                  <TodoDocsTab
                    cartItems={cart?.items || []}
                    uploadedFiles={filesUploaded || []}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

// 스마트매칭 탭 컴포넌트
const SmartMatchingTab: React.FC<{
  events: MatchingResult[],
  searchQuery: string,
  onSearchChange: (query: string) => void,
  interestedEvents: Set<string>
}> = React.memo(({ events, searchQuery, onSearchChange, interestedEvents }) => {
  const { setDraggedEvent, markEventInterested, addEventToCalendar } = useDashboardInteraction();

  const handleDragStart = (event: MatchingResult) => (e: React.DragEvent) => {
    const dragData = {
      id: event.event.id,
      title: event.event.title,
      description: event.event.description,
      daysUntilDeadline: event.daysUntilDeadline,
      matchingScore: event.score,
      urgencyLevel: event.urgencyLevel
    };
    setDraggedEvent(dragData);
    e.dataTransfer.effectAllowed = 'copy';
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  const getUrgencyColor = (urgencyLevel: string, daysUntil: number) => {
    if (urgencyLevel === 'high' || daysUntil <= 7) return 'bg-red-100 text-red-700';
    if (urgencyLevel === 'medium' || daysUntil <= 14) return 'bg-orange-100 text-orange-700';
    return 'bg-green-100 text-green-700';
  };

  const getBorderColor = (urgencyLevel: string) => {
    if (urgencyLevel === 'high') return 'border-red-200 bg-red-50';
    if (urgencyLevel === 'medium') return 'border-orange-200 bg-orange-50';
    return 'border-blue-200 bg-blue-50';
  };

  return (
    <div className="space-y-3">
      {/* 검색 입력 */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="이벤트 검색..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 실제 이벤트 목록 */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {events.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">
            {searchQuery ? '검색 결과가 없습니다' : '표시할 이벤트가 없습니다'}
          </div>
        ) : (
          events.slice(0, 10).map((matchingResult) => {
            const event = matchingResult.event;
            const isInterested = interestedEvents.has(event.id);

            return (
              <div
                key={event.id}
                draggable
                onDragStart={handleDragStart(matchingResult)}
                onDragEnd={handleDragEnd}
                className={`p-3 border rounded-lg cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${getBorderColor(matchingResult.urgencyLevel)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2 py-1 rounded ${getUrgencyColor(matchingResult.urgencyLevel, matchingResult.daysUntilDeadline)}`}>
                    D-{matchingResult.daysUntilDeadline}
                  </span>
                  <span className="text-xs text-blue-600 font-medium">
                    매칭도 {matchingResult.score}점
                  </span>
                </div>

                <h4 className="font-bold text-sm mb-1 line-clamp-2">{event.title}</h4>
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {event.description}
                </p>

                {/* 키워드 태그 */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {event.keywords.slice(0, 3).map((keyword) => (
                    <span
                      key={keyword}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => addEventToCalendar({
                      id: event.id,
                      title: event.title,
                      daysUntilDeadline: matchingResult.daysUntilDeadline,
                      matchingScore: matchingResult.score,
                      urgencyLevel: matchingResult.urgencyLevel
                    }, new Date())}
                    className="flex-1 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                  >
                    캘린더 추가
                  </button>
                  <button
                    onClick={() => markEventInterested(event.id)}
                    className={`px-2 py-1 border text-xs rounded hover:bg-gray-50 transition-colors ${
                      isInterested ? 'bg-red-50 border-red-200 text-red-600' : ''
                    }`}
                  >
                    <Heart className={`w-3 h-3 ${isInterested ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {events.length > 0 && (
        <div className="text-center text-gray-400 text-xs py-2">
          ⬅️ 이벤트를 캘린더로 드래그하거나 캘린더 추가 버튼을 클릭하세요
        </div>
      )}
    </div>
  );
});

// 긴급사항 탭 컴포넌트
const UrgentTab: React.FC<{
  urgentEvents: MatchingResult[],
  kpiScore: number,
  strongestAxis: string
}> = React.memo(({ urgentEvents, kpiScore, strongestAxis }) => {
  return (
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {/* KPI 위험 상황 */}
      {kpiScore < 70 && (
        <div className="p-3 border border-orange-200 rounded-lg bg-orange-50">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">KPI 위험</span>
            </div>
          </div>
          <h4 className="font-bold text-sm mb-1">종합 점수 {kpiScore.toFixed(1)}점 - 개선 필요</h4>
          <p className="text-xs text-gray-600 mb-2">
            {strongestAxis}축은 양호하나, 전체적인 균형 점검이 필요합니다
          </p>
          <button className="w-full px-2 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600">
            KPI 진단 보기
          </button>
        </div>
      )}

      {/* 마감임박 이벤트들 */}
      {urgentEvents.map((matchingResult) => {
        const event = matchingResult.event;
        const daysLeft = matchingResult.daysUntilDeadline;

        return (
          <div key={event.id} className="p-3 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-600" />
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                  D-{daysLeft} 마감임박
                </span>
              </div>
              <span className="text-xs text-red-600 font-medium">
                매칭도 {matchingResult.score}점
              </span>
            </div>
            <h4 className="font-bold text-sm mb-1 line-clamp-1">{event.title}</h4>
            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
              {event.description}
            </p>
            <div className="flex gap-2">
              <button className="flex-1 px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600">
                즉시 처리
              </button>
              <button
                onClick={() => window.open(event.originalUrl, '_blank')}
                className="px-2 py-1 border text-xs rounded hover:bg-gray-50"
              >
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}

      {urgentEvents.length === 0 && kpiScore >= 70 && (
        <div className="text-center text-gray-400 text-sm py-8">
          🎉 현재 긴급한 사안이 없습니다!
        </div>
      )}
    </div>
  );
});

// 할일문서 탭 컴포넌트
const TodoDocsTab: React.FC<{
  cartItems: any[],
  uploadedFiles: any[]
}> = React.memo(({ cartItems, uploadedFiles }) => {
  return (
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {/* 프로젝트 할일 (Buildup Cart) */}
      {cartItems.length > 0 && (
        <>
          <div className="text-xs font-medium text-gray-500 mb-2">프로젝트 할일</div>
          {cartItems.slice(0, 5).map((item, index) => (
            <div key={index} className="p-3 border border-purple-200 rounded-lg bg-purple-50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">프로젝트</span>
                </div>
              </div>
              <h4 className="font-bold text-sm mb-1 line-clamp-1">
                {item.title || item.name || `프로젝트 항목 ${index + 1}`}
              </h4>
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                {item.description || '프로젝트 진행 중인 항목입니다'}
              </p>
              <div className="flex gap-2">
                <button className="flex-1 px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600">
                  항목 확인
                </button>
                <button className="px-2 py-1 border text-xs rounded hover:bg-gray-50">
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* VDR 업로드된 파일들 */}
      {uploadedFiles.length > 0 && (
        <>
          <div className="text-xs font-medium text-gray-500 mb-2">VDR 문서</div>
          {uploadedFiles.slice(0, 3).map((file, index) => (
            <div key={index} className="p-3 border border-green-200 rounded-lg bg-green-50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">VDR</span>
                </div>
              </div>
              <h4 className="font-bold text-sm mb-1 line-clamp-1">
                {file.name || `VDR 문서 ${index + 1}`}
              </h4>
              <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                {file.description || '업로드된 실사자료'}
              </p>
              <button className="w-full px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600">
                문서 확인
              </button>
            </div>
          ))}
        </>
      )}

      {/* 빈 상태 */}
      {cartItems.length === 0 && uploadedFiles.length === 0 && (
        <div className="text-center text-gray-400 text-sm py-8">
          📋 현재 처리할 문서가 없습니다
          <br />
          <span className="text-xs">프로젝트나 VDR 업로드를 진행해보세요</span>
        </div>
      )}

      {/* 추가 액션 버튼 */}
      {(cartItems.length > 0 || uploadedFiles.length > 0) && (
        <div className="pt-3 border-t">
          <button className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors">
            모든 문서 보기
          </button>
        </div>
      )}
    </div>
  );
});

export default InteractiveCalendarCenter;