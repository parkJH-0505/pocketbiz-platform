import React, { useState, useEffect } from 'react';
import {
  Filter,
  Calendar,
  List,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type {
  MatchingResult,
  EventCategory
} from '../../../../types/smartMatching';
// import { mockRecommendations, additionalMockEvents } from '../../../../data/smartMatching/mockEvents';
import {
  extendedEvents,
  calculateRealMatchingScore,
  generateMatchingReasons,
  generateRecommendedActions
} from '../../../../data/smartMatching/extendedEvents';
import { useKPIDiagnosis } from '../../../../contexts/KPIDiagnosisContext';
import EventCard from '../../../../components/smartMatching/EventCard';


// 지원분야 필터 옵션
const supportFieldOptions = [
  '전체',
  'R&D 및 사업화 자금',
  '투자유치',
  '판로·해외진출·글로벌',
  '멘토링·컨설팅·교육',
  '액셀러레이팅',
  '대기업 협업',
  '융자·보증',
  '바우처',
  '공모전'
];

// 카테고리 필터 옵션
const categoryOptions = [
  { value: 'all', label: '전체' },
  { value: 'tips_program', label: 'TIPS/R&D' },
  { value: 'government_support', label: '정부지원사업' },
  { value: 'vc_opportunity', label: 'VC/투자' },
  { value: 'accelerator', label: '액셀러레이터' },
  { value: 'open_innovation', label: '오픈이노베이션' },
  { value: 'loan_guarantee', label: '융자/보증' },
  { value: 'voucher', label: '바우처' },
  { value: 'global', label: '글로벌' },
  { value: 'contest', label: '공모전' }
];

// 카테고리별 색상 매핑
const categoryColors: Record<string, string> = {
  tips_program: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  government_support: 'bg-blue-100 text-blue-800 border-blue-200',
  vc_opportunity: 'bg-purple-100 text-purple-800 border-purple-200',
  accelerator: 'bg-orange-100 text-orange-800 border-orange-200',
  open_innovation: 'bg-green-100 text-green-800 border-green-200',
  loan_guarantee: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  voucher: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  global: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  contest: 'bg-red-100 text-red-800 border-red-200',
  default: 'bg-gray-100 text-gray-800 border-gray-200'
};

// 캘린더 유틸리티 함수들
const getDaysInMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

const getFirstDayOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
};

const formatMonthYear = (date: Date) => {
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
};

const isSameDay = (date1: Date, date2: Date) => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

const AllOpportunities: React.FC = () => {
  const { axisScores } = useKPIDiagnosis();
  const [allEvents, setAllEvents] = useState<MatchingResult[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<MatchingResult[]>([]);
  const [selectedSupportField, setSelectedSupportField] = useState('전체');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'deadline' | 'recent'>('score');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 1)); // 2025년 11월로 시작 (월은 0부터 시작)

  // 사용자 Core5 점수
  const userScores = axisScores && Object.values(axisScores).some(v => v > 0)
    ? axisScores as any
    : { GO: 75, EC: 61, PT: 27, PF: 78, TO: 68 };

  // 전체 이벤트 데이터 로드 (KPI 매칭 점수 계산)
  useEffect(() => {
    const eventsWithScores = extendedEvents.map(event => ({
      ...event,
      score: calculateRealMatchingScore(userScores, event.event),
      matchingReasons: generateMatchingReasons(userScores, event.event),
      recommendedActions: generateRecommendedActions(userScores, event.event)
    }));
    setAllEvents(eventsWithScores);
    setFilteredEvents(eventsWithScores);
  }, [userScores]);

  // 필터링 및 정렬 로직
  useEffect(() => {
    let filtered = allEvents;

    // 지원분야 필터
    if (selectedSupportField !== '전체') {
      filtered = filtered.filter(event => {
        const field = (event.event as any).supportField;
        // 지원분야에 따른 매핑
        if (selectedSupportField === 'R&D 및 사업화 자금') {
          return field === 'R&D 및 사업화 자금' || field === 'rnd';
        }
        if (selectedSupportField === '투자유치') {
          return event.event.category === 'vc_opportunity';
        }
        if (selectedSupportField === '액셀러레이팅') {
          return event.event.category === 'accelerator';
        }
        if (selectedSupportField === '대기업 협업') {
          return event.event.category === 'open_innovation';
        }
        if (selectedSupportField === '융자·보증') {
          return event.event.category === 'loan_guarantee';
        }
        if (selectedSupportField === '바우처') {
          return event.event.category === 'voucher';
        }
        if (selectedSupportField === '공모전') {
          return event.event.category === 'contest';
        }
        return field === selectedSupportField;
      });
    }

    // 카테고리 필터
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event =>
        event.event.category === selectedCategory
      );
    }

    // 키워드 검색
    if (searchKeyword) {
      filtered = filtered.filter(event =>
        event.event.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        event.event.description.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        event.event.keywords.some(keyword =>
          keyword.toLowerCase().includes(searchKeyword.toLowerCase())
        )
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      if (sortBy === 'score') {
        return b.score - a.score; // 매칭 점수 높은 순
      } else if (sortBy === 'deadline') {
        return a.daysUntilDeadline - b.daysUntilDeadline; // 마감 임박 순
      } else {
        // recent: 최신 공고 순
        return new Date((b.event as any).announcementDate).getTime() -
               new Date((a.event as any).announcementDate).getTime();
      }
    });

    setFilteredEvents(filtered);
  }, [allEvents, selectedSupportField, selectedCategory, searchKeyword, sortBy]);


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">전체 기회</h1>
              <p className="text-sm text-gray-500 mt-1">모든 지원 기회를 확인하고 필터링하세요</p>
            </div>
            <div className="flex items-center gap-4">
              {/* 뷰 전환 버튼 */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4" />
                  목록
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
                    viewMode === 'calendar'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  캘린더
                </button>
              </div>

              {viewMode === 'list' && (
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="score">매칭 점수 순</option>
                  <option value="deadline">마감 임박 순</option>
                  <option value="recent">최신 공고 순</option>
                </select>
              )}

              <div className="text-sm text-gray-500">
                총 {filteredEvents.length}개 기회
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* 필터 섹션 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">필터</h3>
            </div>

            <div className="flex items-center gap-4 flex-1 flex-wrap min-w-0">
              {/* 검색 */}
              <div className="flex-1 min-w-[240px]">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="프로그램명, 설명, 키워드..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* 지원분야 필터 */}
              <div className="min-w-[160px]">
                <select
                  value={selectedSupportField}
                  onChange={(e) => setSelectedSupportField(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {supportFieldOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              {/* 카테고리 필터 */}
              <div className="min-w-[140px]">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* 초기화 버튼 */}
              <button
                onClick={() => {
                  setSelectedSupportField('전체');
                  setSelectedCategory('all');
                  setSearchKeyword('');
                }}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                필터 초기화
              </button>
            </div>
          </div>
        </div>

        {/* 컨텐츠 영역 */}
        {viewMode === 'list' ? (
          // 리스트 뷰
          <>
            <div className="space-y-3">
              {filteredEvents.map((result) => {
                const dday = new Date(result.event.applicationEndDate).getTime() - new Date().getTime();
                const ddayCount = Math.ceil(dday / (1000 * 60 * 60 * 24));
                const getDdayText = () => ddayCount > 0 ? `D-${ddayCount}` : '마감';
                const getDdayColor = () => {
                  if (ddayCount <= 0) return 'text-red-600 bg-red-50 border-red-200';
                  if (ddayCount <= 7) return 'text-orange-600 bg-orange-50 border-orange-200';
                  if (ddayCount <= 30) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
                  return 'text-green-600 bg-green-50 border-green-200';
                };

                return (
                  <div key={result.event.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    {/* 헤더: 카테고리, 지원분야, D-Day */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {/* 이벤트 카테고리 (색상 있음) */}
                        <span className={`px-2 py-0.5 text-xs font-medium rounded border ${
                          categoryColors[result.event.category] || categoryColors.default
                        }`}>
                          {categoryOptions.find(cat => cat.value === result.event.category)?.label || '기타'}
                        </span>
                        {/* 지원분야 (회색) */}
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded border border-gray-200">
                          {(result.event as any).supportField || '지원분야 미정'}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${getDdayColor()}`}>
                        {getDdayText()}
                      </span>
                    </div>

                    {/* 메인 콘텐츠 */}
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
                        {result.event.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {result.event.description}
                      </p>
                    </div>

                    {/* 메타 정보 */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        <span>
                          주관: {
                            (result.event as any).hostOrganization ||
                            (result.event as any).vcName ||
                            (result.event as any).acceleratorName ||
                            '미정'
                          }
                        </span>
                        <span>
                          지원금: {
                            (result.event as any).fundingAmount ||
                            (result.event as any).investmentAmount ||
                            (result.event as any).supportAmount ||
                            '미정'
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                          매칭률 {result.score}%
                        </span>
                      </div>
                    </div>

                    {/* 마감일 정보 */}
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        신청기간: {
                          (result.event as any).applicationStartDate
                            ? new Date((result.event as any).applicationStartDate).toLocaleDateString('ko-KR')
                            : '미정'
                        } ~ {new Date(result.event.applicationEndDate).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredEvents.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500">조건에 맞는 기회가 없습니다.</p>
                <button
                  onClick={() => {
                    setSelectedSupportField('전체');
                    setSelectedCategory('all');
                    setSearchKeyword('');
                  }}
                  className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  필터 초기화
                </button>
              </div>
            )}
          </>
        ) : (
          // 캘린더 뷰
          <div className="bg-white rounded-lg border border-gray-200">
            {/* 캘린더 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-semibold text-gray-900">
                {formatMonthYear(currentDate)}
              </h2>

              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* 캘린더 그리드 */}
            <div className="p-6">
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* 캘린더 날짜 그리드 */}
              <div className="grid grid-cols-7 gap-1">
                {(() => {
                  const daysInMonth = getDaysInMonth(currentDate);
                  const firstDay = getFirstDayOfMonth(currentDate);
                  const days = [];

                  // 빈 칸 추가 (월의 첫 번째 날까지)
                  for (let i = 0; i < firstDay; i++) {
                    days.push(<div key={`empty-${i}`} className="h-32"></div>);
                  }

                  // 날짜 추가
                  for (let day = 1; day <= daysInMonth; day++) {
                    const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);

                    // 해당 날짜의 모든 이벤트들 찾기 (공고일, 시작일, 마감일)
                    const eventsOnThisDay = filteredEvents.filter(event => {
                      const announcementDate = (event.event as any).announcementDate;
                      const startDate = event.event.applicationStartDate;
                      const endDate = event.event.applicationEndDate;

                      return (
                        (announcementDate && isSameDay(announcementDate, currentDayDate)) ||
                        (startDate && isSameDay(startDate, currentDayDate)) ||
                        (endDate && isSameDay(endDate, currentDayDate))
                      );
                    });

                    // 이벤트들을 유형별로 분류
                    const eventsByType = eventsOnThisDay.reduce((acc, event) => {
                      const announcementDate = (event.event as any).announcementDate;
                      const startDate = event.event.applicationStartDate;
                      const endDate = event.event.applicationEndDate;

                      if (announcementDate && isSameDay(announcementDate, currentDayDate)) {
                        acc.announcements.push({ ...event, type: 'announcement' });
                      }
                      if (startDate && isSameDay(startDate, currentDayDate)) {
                        acc.starts.push({ ...event, type: 'start' });
                      }
                      if (endDate && isSameDay(endDate, currentDayDate)) {
                        acc.deadlines.push({ ...event, type: 'deadline' });
                      }

                      return acc;
                    }, { announcements: [] as any[], starts: [] as any[], deadlines: [] as any[] });

                    const allDayEvents = [
                      ...eventsByType.announcements,
                      ...eventsByType.starts,
                      ...eventsByType.deadlines
                    ];

                    days.push(
                      <div key={day} className="h-32 border border-gray-100 p-1 overflow-hidden">
                        <div className="text-sm font-medium text-gray-900 mb-1">{day}</div>
                        <div className="space-y-1">
                          {allDayEvents.slice(0, 3).map((eventData, index) => {
                            const typeIndicator =
                              eventData.type === 'announcement' ? '📢' :
                              eventData.type === 'start' ? '🟢' :
                              '🔴';

                            return (
                              <div
                                key={`${eventData.event.id}-${eventData.type}`}
                                className={`text-xs px-1 py-0.5 rounded truncate flex items-center gap-1 ${
                                  categoryColors[eventData.event.category] || categoryColors.default
                                }`}
                                title={`${eventData.event.title} (${
                                  eventData.type === 'announcement' ? '공고일' :
                                  eventData.type === 'start' ? '접수시작' :
                                  '마감일'
                                })`}
                              >
                                <span className="text-xs">{typeIndicator}</span>
                                <span className="truncate">{eventData.event.title}</span>
                              </div>
                            );
                          })}
                          {allDayEvents.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{allDayEvents.length - 3}개 더
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return days;
                })()}
              </div>
            </div>

            {/* 캘린더 하단 범례 */}
            <div className="px-6 pb-6 space-y-3">
              {/* 날짜 유형 범례 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">날짜 유형</h4>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1">
                    <span className="text-sm">📢</span>
                    <span className="text-xs text-gray-600">공고일</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm">🟢</span>
                    <span className="text-xs text-gray-600">접수시작</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm">🔴</span>
                    <span className="text-xs text-gray-600">마감일</span>
                  </div>
                </div>
              </div>

              {/* 카테고리 범례 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">카테고리</h4>
                <div className="flex flex-wrap gap-2">
                  {categoryOptions.filter(cat => cat.value !== 'all').map(category => (
                    <div key={category.value} className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded ${categoryColors[category.value]?.split(' ')[0] || 'bg-gray-100'}`}></div>
                      <span className="text-xs text-gray-600">{category.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllOpportunities;