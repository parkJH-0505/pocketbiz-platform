import React from 'react';
import {
  ExternalLink,
  Info,
  MessageSquare
} from 'lucide-react';
import type { MatchingResult } from '../../types/smartMatching';
import { calculateDday, getDdayColorClass } from '../../utils/dateUtils';

// 카테고리 라벨 매핑
const categoryLabels: Record<string, string> = {
  government_support: '정부지원사업',
  tips_program: 'TIPS/DIPS/RIPS',
  vc_opportunity: '투자 프로그램',
  accelerator: '액셀러레이터',
  open_innovation: '오픈이노베이션',
  loan_program: '융자 프로그램',
  loan_guarantee: '융자·보증',
  voucher: '바우처',
  global: '글로벌',
  contest: '공모전',
  bidding: '입찰',
  batch_program: '배치 프로그램',
  conference: '컨퍼런스',
  seminar: '세미나'
};

// 유틸 함수들
const getOrganizer = (event: any) => {
  return event.hostOrganization ||
         event.vcName ||
         event.acceleratorName ||
         event.demandOrganization ||
         '미정';
};

const getSupportAmount = (event: any) => {
  return event.fundingAmount ||
         event.investmentAmount ||
         event.supportAmount ||
         '미정';
};

const getDuration = (event: any) => {
  return event.programDuration ||
         event.executionPeriod ||
         event.collaborationPeriod ||
         '미정';
};

const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
};

// calculateDday 함수는 dateUtils로 이동됨

interface EventCardProps {
  result: MatchingResult;
  onSelect?: () => void;
  isSelected?: boolean;
  showStatus?: boolean;
  isTheOne?: boolean;
  compact?: boolean;
  compatibility?: {
    meetCount: number;
    status: 'recommended' | 'preparing' | 'insufficient';
  };
  onBuilderConsult?: () => void;
}

const EventCard: React.FC<EventCardProps> = ({
  result,
  onSelect,
  isSelected = false,
  showStatus = false,
  isTheOne = false,
  compact = false,
  compatibility,
  onBuilderConsult
}) => {
  const { event } = result;
  const dday = calculateDday(event.applicationEndDate);
  const supportField = (event as any).supportField || '미분류';

  // D-Day 색상 결정 (유틸 함수 사용)
  const ddayColorClass = getDdayColorClass(dday);

  // 상태 스타일
  const getStatusStyle = () => {
    if (!compatibility) return null;

    switch (compatibility.status) {
      case 'recommended':
        return {
          text: '추천',
          color: 'text-emerald-700',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200'
        };
      case 'preparing':
        return {
          text: '준비중',
          color: 'text-amber-700',
          bg: 'bg-amber-50',
          border: 'border-amber-200'
        };
      case 'insufficient':
        return {
          text: '미달',
          color: 'text-red-700',
          bg: 'bg-red-50',
          border: 'border-red-200'
        };
      default:
        return null;
    }
  };

  const statusStyle = getStatusStyle();

  return (
    <div
      className={`
        bg-white rounded-lg border transition-all duration-200
        ${isTheOne
          ? 'border-blue-500 shadow-xl ring-1 ring-blue-200 bg-gradient-to-br from-white to-blue-50'
          : isSelected
            ? 'border-blue-500 shadow-lg ring-2 ring-blue-100'
            : 'border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
        }
        ${onSelect ? 'cursor-pointer' : ''}
      `}
      onClick={onSelect}
    >
      <div className="flex">
        {/* 왼쪽: 메인 콘텐츠 영역 */}
        <div className="flex-1 p-5">
          {/* 헤더 그룹 */}
          <div className="mb-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 flex-1">
                {event.title}
              </h3>
              <div className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${ddayColorClass}`}>
                {dday > 0 ? `D-${dday}` : '마감'}
              </div>
            </div>
          </div>

          {/* 본문 그룹 */}
          <div className="mb-4 pb-4 border-b border-gray-100">
            <p className="text-sm text-gray-700 line-clamp-2 mb-2">
              {event.description}
            </p>
            <p className="text-xs text-gray-500">
              신청: {event.applicationStartDate ? formatDate(event.applicationStartDate) : '미정'} ~ {formatDate(event.applicationEndDate)}
            </p>
          </div>

          {/* 메타 그룹 */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {/* 키워드 */}
              {event.keywords && event.keywords.length > 0 && (
                <div className="flex items-center gap-1">
                  {event.keywords.slice(0, 2).map((keyword, index) => (
                    <span
                      key={index}
                      className="text-xs text-gray-500"
                    >
                      #{keyword}
                    </span>
                  ))}
                </div>
              )}

              {/* 구분선 */}
              {event.keywords && event.keywords.length > 0 && showStatus && (
                <span className="text-gray-300">|</span>
              )}

              {/* 상태 표시 */}
              {showStatus && statusStyle && compatibility && (
                <div className="relative group">
                  <div className="flex items-center gap-1">
                    <div className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyle.bg} ${statusStyle.color}`}>
                      {statusStyle.text}
                    </div>
                    <Info className="w-3 h-3 text-gray-400 cursor-help" />
                  </div>

                  {/* 호버 툴팁 */}
                  <div className="absolute bottom-full left-0 mb-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    <p className="font-semibold mb-2">📊 상태 계산 방식</p>
                    <p className="mb-2 text-gray-300">
                      귀하의 KPI 5개 축 점수와 이 프로그램의 요구 점수를 비교합니다
                    </p>
                    <div className="bg-gray-800 p-2 rounded mb-2">
                      <p className="font-semibold mb-1">판정 기준</p>
                      <ul className="space-y-1">
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0"></span>
                          <span><strong>추천</strong>: 5개 축 중 4개 이상 충족</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-amber-400 rounded-full flex-shrink-0"></span>
                          <span><strong>준비중</strong>: 5개 축 중 2~3개 충족</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0"></span>
                          <span><strong>미달</strong>: 5개 축 중 1개 이하 충족</span>
                        </li>
                      </ul>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                      <span className="text-gray-400">현재 상태:</span>
                      <span className="font-bold">
                        {compatibility.meetCount}/5개 축 충족
                      </span>
                    </div>
                    <div className="absolute -bottom-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 액션 버튼 섹션 */}
          <div className="flex items-center gap-2 pt-4">
            <button
              className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
              onClick={(e) => {
                e.stopPropagation();
                // 원문 보기 로직
              }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              원문 보기
            </button>
            <button
              className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
              onClick={(e) => {
                e.stopPropagation();
                onBuilderConsult?.();
              }}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              빌더 상담
            </button>
          </div>
        </div>

        {/* 오른쪽: 상세 스펙 섹션 */}
        <div className="w-64 bg-gray-50 border-l border-gray-200 p-4">
          <div className="mb-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              상세 정보
            </h4>
          </div>

          <div className="space-y-3">
            {/* 카테고리 */}
            <div>
              <p className="text-xs text-gray-500 mb-1">카테고리</p>
              <p className="text-sm font-medium text-gray-900">
                {categoryLabels[event.category]}
              </p>
            </div>

            {/* 지원분야 */}
            <div>
              <p className="text-xs text-gray-500 mb-1">지원분야</p>
              <p className="text-sm font-medium text-gray-900">
                {supportField}
              </p>
            </div>

            {/* 주관기관 */}
            <div>
              <p className="text-xs text-gray-500 mb-1">주관기관</p>
              <p className="text-sm font-medium text-gray-900">
                {getOrganizer(event)}
              </p>
            </div>

            {/* 지원 규모 */}
            <div>
              <p className="text-xs text-gray-500 mb-1">지원 규모</p>
              <p className="text-sm font-medium text-gray-900">
                {getSupportAmount(event)}
              </p>
            </div>

            {/* 수행 기간 */}
            <div>
              <p className="text-xs text-gray-500 mb-1">수행 기간</p>
              <p className="text-sm font-medium text-gray-900">
                {getDuration(event)}
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default EventCard;