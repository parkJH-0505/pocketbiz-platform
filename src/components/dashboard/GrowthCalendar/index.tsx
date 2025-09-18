/**
 * GrowthCalendar Component
 *
 * 주간 단위 성장 일정을 표시하는 캘린더
 * - 주간 뷰 중심 (월요일~일요일)
 * - 호버 시 상세 정보 표시
 * - 부드러운 리마인더
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { startOfWeek, addDays, format, isSameDay, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

// 임시 Mock 데이터
const mockWeeklySchedule = [
  {
    id: 'event-001',
    date: new Date(),
    type: 'checkup' as const,
    title: 'KPI 현황 체크',
    description: '기술역량(PT) 영역 집중 업데이트',
    estimatedTime: '15분',
    tone: '지난 주 대비 어떤 변화가 있었는지 확인해볼까요?',
    priority: 'high' as const,
    isCompleted: false
  },
  {
    id: 'event-002',
    date: addDays(new Date(), 2),
    type: 'opportunity' as const,
    title: '딥테크 스타트업 지원사업',
    description: '매칭률 92% • 정부지원사업',
    estimatedTime: '30분',
    tone: '괜찮은 기회 같은데, 시간 될 때 한번 보세요',
    priority: 'medium' as const,
    isCompleted: false,
    metadata: {
      matchRate: 92
    }
  }
];

const GrowthCalendar: React.FC = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);

  // 주간 날짜 생성
  const weekDays = useMemo(() => {
    const startDate = startOfWeek(currentWeek, { weekStartsOn: 1 }); // 월요일 시작
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(startDate, i);
      return {
        date,
        dateString: format(date, 'yyyy-MM-dd'),
        dayName: format(date, 'EEE', { locale: ko }),
        dayNumber: format(date, 'd'),
        isToday: isToday(date),
        events: mockWeeklySchedule.filter(event =>
          isSameDay(event.date, date)
        )
      };
    });
  }, [currentWeek]);

  // 주간 네비게이션
  const navigateWeek = (direction: 'prev' | 'next') => {
    const days = direction === 'next' ? 7 : -7;
    setCurrentWeek(prev => addDays(prev, days));
  };

  // 오늘 이벤트 강조
  const todaysEvents = mockWeeklySchedule.filter(event =>
    isToday(event.date)
  );

  // 이벤트 아이콘
  const getEventIcon = (type: string) => {
    const icons = {
      checkup: '💊',
      opportunity: '💰',
      planning: '📝',
      reminder: '🔔',
      celebration: '🎉'
    };
    return icons[type] || '📌';
  };

  // 이벤트 색상
  const getEventTypeColor = (type: string) => {
    const colors = {
      checkup: 'bg-green-200',
      opportunity: 'bg-yellow-200',
      planning: 'bg-blue-200',
      reminder: 'bg-purple-200',
      celebration: 'bg-pink-200'
    };
    return colors[type] || 'bg-gray-200';
  };

  // 주간 메시지 생성
  const generateWeeklyMessage = (eventCount: number) => {
    if (eventCount === 0) {
      return "이번 주는 여유롭게 기존 작업에 집중하세요 ✨";
    } else if (eventCount <= 2) {
      return "적당한 일정이네요. 무리하지 말고 천천히 진행하세요 🌱";
    } else {
      return "알찬 한 주가 될 것 같아요. 하나씩 차근차근 해보세요 💪";
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm" data-tour="growth-calendar">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            이번 주 성장 일정
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            차근차근 진행하세요
          </p>
        </div>

        {/* 주간 네비게이션 */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center min-w-[120px]">
            <div className="font-semibold text-gray-900">
              {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'M월 d일')} - {format(addDays(startOfWeek(currentWeek, { weekStartsOn: 1 }), 6), 'd일')}
            </div>
            <div className="text-sm text-gray-500">
              {format(currentWeek, 'yyyy년')}
            </div>
          </div>

          <button
            onClick={() => navigateWeek('next')}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 주간 그리드 */}
      <div className="grid grid-cols-7 gap-3 mb-6">
        {weekDays.map(day => {
          const hasEvents = day.events.length > 0;
          const primaryEvent = day.events[0];

          return (
            <motion.div
              key={day.dateString}
              className={`
                relative p-3 rounded-lg border transition-all duration-200
                ${day.isToday
                  ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100'
                  : 'bg-gray-50 border-gray-200'
                }
                ${hasEvents ? 'hover:bg-gray-100 cursor-pointer' : ''}
              `}
              whileHover={hasEvents ? { scale: 1.02 } : {}}
              onMouseEnter={() => primaryEvent && setHoveredEvent(primaryEvent.id)}
              onMouseLeave={() => setHoveredEvent(null)}
            >
              {/* 날짜 헤더 */}
              <div className="text-center mb-2">
                <div className="text-xs text-gray-500 font-medium">
                  {day.dayName}
                </div>
                <div className={`
                  text-lg font-semibold
                  ${day.isToday ? 'text-blue-600' : 'text-gray-900'}
                `}>
                  {day.dayNumber}
                </div>
              </div>

              {/* 이벤트 표시 */}
              {hasEvents && (
                <div className="space-y-1">
                  <div className={`
                    w-full h-2 rounded-full
                    ${getEventTypeColor(primaryEvent.type)}
                  `} />

                  {day.events.length > 1 && (
                    <div className="text-xs text-gray-400 text-center">
                      +{day.events.length - 1}개 더
                    </div>
                  )}
                </div>
              )}

              {/* 오늘 표시 */}
              {day.isToday && (
                <div className="absolute -top-1 -right-1">
                  <motion.div
                    className="w-3 h-3 bg-blue-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              )}

              {/* 호버 툴팁 (간단한 버전) */}
              {primaryEvent && hoveredEvent === primaryEvent.id && (
                <motion.div
                  className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span>{getEventIcon(primaryEvent.type)}</span>
                    <span className="font-semibold">{primaryEvent.title}</span>
                  </div>
                  <p className="text-gray-300 mb-2">{primaryEvent.description}</p>
                  <div className="flex justify-between items-center">
                    <span>예상 시간: {primaryEvent.estimatedTime}</span>
                    {primaryEvent.metadata?.matchRate && (
                      <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">
                        매칭률 {primaryEvent.metadata.matchRate}%
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-blue-300 italic">
                    "{primaryEvent.tone}"
                  </div>
                  {/* 말풍선 꼬리 */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* 오늘 이벤트 강조 */}
      {todaysEvents.length > 0 && (
        <motion.div
          className="bg-blue-50 p-4 rounded-lg border border-blue-200"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <span>📌</span>
            오늘 추천 일정
          </h4>
          {todaysEvents.map(event => (
            <div key={event.id} className="flex items-center gap-3 text-sm">
              <span className="text-lg">{getEventIcon(event.type)}</span>
              <div className="flex-1">
                <span className="font-medium text-blue-800">{event.title}</span>
                <span className="text-blue-600 ml-2">• {event.estimatedTime}</span>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* 주간 메시지 */}
      <motion.div
        className="text-center text-gray-600 text-sm mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {generateWeeklyMessage(mockWeeklySchedule.length)}
      </motion.div>
    </div>
  );
};

export default GrowthCalendar;