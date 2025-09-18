/**
 * CalendarHeader - 캘린더 헤더 컴포넌트
 * 날짜 네비게이션, 뷰 토글, 액션 버튼들을 포함
 */

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  ExternalLink,
  AlertCircle,
  Filter
} from 'lucide-react';
import type { CalendarEvent } from '../../types/calendar.types';

export interface CalendarHeaderProps {
  // 날짜 관련
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToToday: () => void;

  // 뷰 관련
  view: 'month' | 'week' | 'list';
  onViewChange: (view: 'month' | 'week' | 'list') => void;

  // 액션 관련
  onSyncData: () => void;
  onAddSchedule: () => void;
  onExportCalendar: (format: 'google' | 'ics') => void;

  // 데이터 관련
  filteredEvents: CalendarEvent[];
  overdueEvents: CalendarEvent[];

  // 내보내기 메뉴 상태
  showExportMenu: boolean;
  onToggleExportMenu: (show: boolean) => void;

  // 커스터마이제이션
  title?: string;
  className?: string;

  // 로딩 상태
  isLoading?: boolean;

  // 🔥 Sprint 3 Phase 2: 단계 필터 관련
  showPhaseFilter?: boolean;
  onTogglePhaseFilter?: () => void;
  activePhaseCount?: number;
}

export default function CalendarHeader({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onGoToToday,
  view,
  onViewChange,
  onSyncData,
  onAddSchedule,
  onExportCalendar,
  filteredEvents,
  overdueEvents,
  showExportMenu,
  onToggleExportMenu,
  title = '빌드업 캘린더',
  className = '',
  isLoading = false,
  showPhaseFilter = false,
  onTogglePhaseFilter,
  activePhaseCount = 0
}: CalendarHeaderProps) {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        {/* 왼쪽: 제목 & 날짜 네비게이션 */}
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrevMonth}
              className="p-2 hover:bg-gray-50 focus:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h3 className="text-lg font-medium text-gray-900 min-w-[120px] text-center">
              {currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
            </h3>
            <button
              onClick={onNextMonth}
              className="p-2 hover:bg-gray-50 focus:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <button
            onClick={onGoToToday}
            className="px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 focus:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-colors"
          >
            오늘
          </button>
        </div>

        {/* 오른쪽: 뷰 토글 & 액션 버튼들 */}
        <div className="flex items-center gap-3">
          {/* 🔥 Sprint 3 Phase 2: 필터 버튼 */}
          {onTogglePhaseFilter && (
            <button
              onClick={onTogglePhaseFilter}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                showPhaseFilter
                  ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">단계 필터</span>
              {activePhaseCount > 0 && (
                <span className="px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  {activePhaseCount}
                </span>
              )}
            </button>
          )}

          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => onViewChange('month')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === 'month'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              월
            </button>
            <button
              onClick={() => onViewChange('week')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === 'week'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              주
            </button>
            <button
              onClick={() => onViewChange('list')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              목록
            </button>
          </div>

          {/* Actions */}
          <button
            onClick={onSyncData}
            disabled={isLoading}
            className={`p-2 hover:bg-gray-50 focus:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-colors ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="동기화"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => onToggleExportMenu(!showExportMenu)}
              className="p-2 hover:bg-gray-50 focus:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-colors"
              title="내보내기"
            >
              <Download className="w-4 h-4 text-gray-600" />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button
                  onClick={() => onExportCalendar('google')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Google Calendar
                </button>
                <button
                  onClick={() => onExportCalendar('ics')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  ICS 파일 다운로드
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onAddSchedule}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            일정 추가
          </button>
        </div>
      </div>

      {/* 미팅 타입별 범례 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="text-sm text-gray-900">
            총 <span className="font-semibold">{filteredEvents.length}</span>개 일정
          </div>
          {overdueEvents.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="font-semibold">{overdueEvents.length}</span>개 지연
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span className="text-gray-900">PM 정기미팅</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
            <span className="text-gray-900">포켓멘토 세션</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            <span className="text-gray-900">프로젝트 미팅</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-gray-900">포켓 웨비나</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
            <span className="text-gray-900">외부 미팅</span>
          </div>
        </div>
      </div>
    </div>
  );
}