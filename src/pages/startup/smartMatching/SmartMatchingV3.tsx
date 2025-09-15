import React, { useState, useEffect } from 'react';
import {
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  ExternalLink,
  MessageSquare,
  ShoppingCart,
  Star,
  Building
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend
} from 'recharts';
import type { SmartMatchingEvent, MatchingResult, EventCategory } from '../../../types/smartMatchingV2';
import { categoryRequirements, calculateCompatibility } from '../../../data/eventRequirements';
import type { Core5Requirements } from '../../../data/eventRequirements';
import { useUserProfile } from '../../../contexts/UserProfileContext';
import { getCategoryIcon } from '../../../data/overlayConfigs';

// 축 라벨 매핑
const axisLabels = {
  GO: '성장·운영',
  EC: '경제성·자본',
  PT: '제품·기술력',
  PF: '증빙·딜레디',
  TO: '팀·조직 역량'
};

// 상태 타입
type EventStatus = 'recommended' | 'preparing' | 'insufficient';

const SmartMatchingV3: React.FC = () => {
  const { profile, isLoading } = useUserProfile();
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [recommendations, setRecommendations] = useState<MatchingResult[]>([]);

  // 사용자 Core5 점수
  const userScores: Core5Requirements = profile?.kpiDiagnosis?.core5Scores || {
    GO: 75,
    EC: 61,
    PT: 27,
    PF: 78,
    TO: 68
  };

  // 레이더 차트 데이터 계산 (state가 아닌 computed value로 변경)
  const radarData = React.useMemo(() => {
    return Object.keys(axisLabels).map(axis => ({
      axis: axisLabels[axis as keyof typeof axisLabels],
      user: userScores[axis as keyof Core5Requirements],
      ...Object.fromEntries(
        Array.from(selectedEvents).map(eventId => {
          const event = recommendations.find(r => r.event.id === eventId);
          if (event) {
            const requirements = categoryRequirements[event.event.category].requirements;
            return [eventId, requirements[axis as keyof Core5Requirements]];
          }
          return [eventId, 0];
        })
      )
    }));
  }, [selectedEvents, recommendations]);

  // Mock 데이터 로드
  useEffect(() => {
    loadMockRecommendations();
  }, []);

  const loadMockRecommendations = () => {
    const mockRecommendations: MatchingResult[] = [
      {
        event: {
          id: 'tips-2024-spring',
          category: 'tips_program',
          title: 'TIPS 2024 상반기',
          description: 'AI/IoT 분야 스타트업 지원 프로그램',
          programType: 'TIPS',
          fundingAmount: '최대 5억원',
          programDuration: '12개월',
          hostOrganization: '중소벤처기업부',
          announcementDate: new Date('2024-01-15'),
          applicationStartDate: new Date('2024-02-01'),
          applicationEndDate: new Date('2024-02-28'),
          keywords: ['AI', 'IoT', 'SaaS', '기술혁신'],
          recommendedStages: ['A-4', 'A-5'],
          recommendedSectors: ['S-1', 'S-2'],
          requirementLevel: 'Pre-A 단계',
          evaluationCriteria: ['기술력', '시장성', '팀 역량'],
          supportBenefits: ['R&D 자금', '멘토링', '네트워킹'],
          matchingScore: 92,
          originalUrl: 'https://www.k-startup.go.kr/tips'
        } as any,
        score: 92,
        matchingReasons: ['기술혁신성 우수', 'R&D 역량 충족', '팀 구성 적합'],
        urgencyLevel: 'high',
        daysUntilDeadline: 14,
        recommendedActions: ['사업계획서 업데이트', '재무모델링 준비', '기술 검증 자료 준비']
      },
      {
        event: {
          id: 'vc-demo-2024',
          category: 'vc_opportunity',
          title: 'TechStars Demo Day 2024',
          description: 'Series A 준비 스타트업 대상 투자 유치 기회',
          vcName: 'TechStars Ventures',
          investmentStage: 'Series A',
          investmentAmount: '30-100억원',
          announcementDate: new Date('2024-01-20'),
          applicationStartDate: new Date('2024-02-05'),
          applicationEndDate: new Date('2024-03-05'),
          keywords: ['Series A', 'SaaS', 'B2B', '투자유치'],
          recommendedStages: ['A-4', 'A-5'],
          recommendedSectors: ['S-1'],
          focusAreas: ['Enterprise SaaS', 'AI/ML', 'FinTech'],
          presentationFormat: '10분 피치 + 5분 Q&A',
          selectionProcess: ['서류심사', '1차 피치', '최종 프레젠테이션'],
          matchingScore: 87,
          originalUrl: 'https://techstars.com'
        } as any,
        score: 87,
        matchingReasons: ['성장성 지표 우수', 'SaaS 분야 적합', '투자 규모 매칭'],
        urgencyLevel: 'medium',
        daysUntilDeadline: 35,
        recommendedActions: ['피치덱 준비', '재무 데이터 정리', '고객 레퍼런스 확보']
      },
      {
        event: {
          id: 'gov-support-2024',
          category: 'government_support',
          title: '창업성장기술개발사업',
          description: '기술혁신형 창업기업 R&D 지원',
          supportAmount: '최대 3억원',
          hostOrganization: '중소기업기술정보진흥원',
          governmentDepartment: '중소벤처기업부',
          announcementDate: new Date('2024-01-25'),
          applicationStartDate: new Date('2024-02-10'),
          applicationEndDate: new Date('2024-03-10'),
          keywords: ['R&D', '기술개발', '정부지원'],
          recommendedStages: ['A-3', 'A-4'],
          recommendedSectors: ['S-1', 'S-2'],
          matchingScore: 65,
          originalUrl: 'https://www.smtech.go.kr'
        } as any,
        score: 65,
        matchingReasons: ['서류 준비도 부족', '재무 증빙 미흡'],
        urgencyLevel: 'low',
        daysUntilDeadline: 40,
        recommendedActions: ['재무제표 준비', '사업계획서 보완', '증빙자료 확보']
      }
    ];

    setRecommendations(mockRecommendations);
  };

  // 이벤트 상태 결정
  const getEventStatus = (compatibility: any): EventStatus => {
    if (compatibility.meetCount >= 4) return 'recommended';
    if (compatibility.meetCount >= 2) return 'preparing';
    return 'insufficient';
  };

  // 상태별 스타일
  const getStatusStyle = (status: EventStatus) => {
    switch (status) {
      case 'recommended':
        return {
          badge: 'bg-success-light text-success-main border-success-main',
          icon: CheckCircle,
          text: '추천'
        };
      case 'preparing':
        return {
          badge: 'bg-warning-light text-warning-main border-warning-main',
          icon: AlertCircle,
          text: '준비중'
        };
      case 'insufficient':
        return {
          badge: 'bg-error-light text-error-main border-error-main',
          icon: XCircle,
          text: '미달'
        };
    }
  };

  // 이벤트 카드 클릭 핸들러
  const handleEventClick = (eventId: string) => {
    setSelectedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  // 빌더 상담 신청 핸들러
  const handleConsultation = (eventId: string) => {
    const isSubscribed = profile?.subscription?.isActive || false;
    if (isSubscribed) {
      console.log('무료 상담 신청:', eventId);
    } else {
      console.log('유료 상담 신청:', eventId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-main"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-light">
      {/* 헤더 */}
      <div className="bg-white border-b border-neutral-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-dark">스마트 매칭</h1>
              <p className="text-sm text-neutral-gray mt-1">
                당신의 KPI 점수를 기반으로 최적의 기회를 추천합니다
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-gray">
                선택된 이벤트: {selectedEvents.size}개
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* 왼쪽: 고정 레이더 차트 */}
          <div className="col-span-4">
            <div className="bg-white rounded-lg shadow-default border border-neutral-border p-6 sticky top-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-neutral-dark">5축 적합도 분석</h3>
                <p className="mt-1 text-sm text-neutral-gray">
                  선택한 이벤트와 비교 분석
                </p>
              </div>

              {/* 레이더 차트 */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis
                      dataKey="axis"
                      className="text-neutral-gray"
                      tick={{ fontSize: 12 }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fontSize: 10 }}
                    />

                    {/* 사용자 데이터 */}
                    <Radar
                      name="내 점수"
                      dataKey="user"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />

                    {/* 선택된 이벤트들 */}
                    {Array.from(selectedEvents).map((eventId, index) => {
                      const event = recommendations.find(r => r.event.id === eventId);
                      const colors = ['#ef4444', '#f59e0b', '#10b981'];
                      return (
                        <Radar
                          key={eventId}
                          name={event?.event.title || eventId}
                          dataKey={eventId}
                          stroke={colors[index % colors.length]}
                          fill={colors[index % colors.length]}
                          fillOpacity={0.1}
                          strokeWidth={1.5}
                          strokeDasharray="5 5"
                        />
                      );
                    })}
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* 범례 */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary-main rounded-full" />
                  <span className="text-sm text-neutral-gray">내 점수</span>
                </div>
                {Array.from(selectedEvents).map((eventId, index) => {
                  const event = recommendations.find(r => r.event.id === eventId);
                  const colors = ['#ef4444', '#f59e0b', '#10b981'];
                  return (
                    <div key={eventId} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: colors[index % colors.length] }}
                      />
                      <span className="text-sm text-neutral-gray truncate">
                        {event?.event.title || eventId}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 점수 상세 */}
              <div className="grid grid-cols-5 gap-2 mt-6 pt-6 border-t border-neutral-border">
                {Object.entries(userScores).map(([axis, score]) => (
                  <div key={axis} className="text-center">
                    <p className="text-xs text-neutral-gray mb-1">
                      {axisLabels[axis as keyof typeof axisLabels]}
                    </p>
                    <p className="text-lg font-bold text-neutral-dark">{score}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 오른쪽: 이벤트 카드 리스트 */}
          <div className="col-span-8 space-y-4">
            {recommendations.map((recommendation) => {
              const requirements = categoryRequirements[recommendation.event.category].requirements;
              const compatibility = calculateCompatibility(userScores, requirements);
              const status = getEventStatus(compatibility);
              const statusStyle = getStatusStyle(status);
              const StatusIcon = statusStyle.icon;
              const isSelected = selectedEvents.has(recommendation.event.id);
              const categoryIcon = getCategoryIcon(recommendation.event.category);

              return (
                <div
                  key={recommendation.event.id}
                  className={`
                    bg-white rounded-lg shadow-default border-2 p-6 transition-all cursor-pointer
                    ${isSelected
                      ? 'border-primary-main bg-primary-light bg-opacity-5'
                      : 'border-neutral-border hover:border-primary-light'
                    }
                  `}
                  onClick={() => handleEventClick(recommendation.event.id)}
                >
                  {/* 헤더 */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      {/* 카테고리 아이콘 */}
                      <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">{categoryIcon}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-neutral-dark">
                            {recommendation.event.title}
                          </h3>
                          {/* 상태 배지 */}
                          <span className={`
                            px-2 py-1 rounded-full text-xs font-medium border
                            ${statusStyle.badge}
                          `}>
                            <StatusIcon className="inline w-3 h-3 mr-1" />
                            {statusStyle.text}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-gray mt-1">
                          {(recommendation.event as any).hostOrganization ||
                           (recommendation.event as any).vcName ||
                           (recommendation.event as any).demandOrganization}
                        </p>
                      </div>
                    </div>

                    {/* 마감일 */}
                    <div className="text-right">
                      <div className="flex items-center text-error-main">
                        <Clock className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium">
                          D-{recommendation.daysUntilDeadline}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-gray mt-1">
                        {recommendation.event.applicationEndDate.toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* 기본 정보 */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-neutral-gray mb-1">지원 금액</p>
                      <p className="text-sm font-medium text-neutral-dark">
                        {(recommendation.event as any).fundingAmount ||
                         (recommendation.event as any).investmentAmount ||
                         (recommendation.event as any).supportAmount ||
                         '협의'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-gray mb-1">매칭도</p>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-warning-main mr-1" />
                        <span className="text-sm font-medium text-neutral-dark">
                          {compatibility.overall}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-gray mb-1">충족 축</p>
                      <p className="text-sm font-medium text-neutral-dark">
                        {compatibility.meetCount}/5
                      </p>
                    </div>
                  </div>

                  {/* 5축 충족 현황 (미니) */}
                  <div className="bg-neutral-light rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      {Object.entries(compatibility.details).map(([axis, detail]) => (
                        <div key={axis} className="text-center">
                          <p className="text-neutral-gray mb-1">
                            {axisLabels[axis as keyof typeof axisLabels].slice(0, 3)}
                          </p>
                          <p className={`font-bold ${
                            detail.isMet ? 'text-success-main' : 'text-error-main'
                          }`}>
                            {detail.userScore}/{detail.required}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 액션 버튼들 */}
                  <div className="flex items-center justify-between pt-4 border-t border-neutral-border">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open((recommendation.event as any).originalUrl || '#', '_blank');
                        }}
                        className="px-3 py-1.5 text-sm text-primary-main border border-primary-main rounded-lg hover:bg-primary-light transition-colors flex items-center"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        원문 보기
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConsultation(recommendation.event.id);
                        }}
                        className="px-3 py-1.5 text-sm text-white bg-primary-main rounded-lg hover:bg-primary-dark transition-colors flex items-center"
                      >
                        <MessageSquare className="w-3 h-3 mr-1" />
                        빌더 상담
                        {profile?.subscription?.isActive && (
                          <span className="ml-1 text-xs">(무료)</span>
                        )}
                      </button>
                    </div>

                    {/* 부족한 축에 대한 프로젝트 추천 */}
                    {status !== 'recommended' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('프로젝트 추천:', recommendation.event.id);
                        }}
                        className="px-3 py-1.5 text-sm text-neutral-dark border border-neutral-border rounded-lg hover:bg-neutral-light transition-colors flex items-center"
                      >
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        맞춤 프로젝트
                        <span className="ml-1 text-xs text-primary-main">
                          {5 - compatibility.meetCount}개 축 보완
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartMatchingV3;