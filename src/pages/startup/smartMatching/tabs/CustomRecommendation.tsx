import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  ShoppingCart
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import type {
  MatchingResult,
  EventCategory,
  Core5Requirements,
  EventStatus
} from '../../../../types/smartMatching';
import {
  categoryRequirements,
  calculateCompatibility
} from '../../../../data/smartMatching/eventRequirements';
// import { mockRecommendations } from '../../../../data/smartMatching/mockEvents';
import {
  extendedEvents,
  calculateRealMatchingScore,
  generateMatchingReasons,
  generateRecommendedActions
} from '../../../../data/smartMatching/extendedEvents';
import { useKPIDiagnosis } from '../../../../contexts/KPIDiagnosisContext';
// BuildupContext 추가 - 실제 카탈로그 데이터 연동
import { useBuildupContext } from '../../../../contexts/BuildupContext';
import type { BuildupService, AxisKey as BuildupAxisKey } from '../../../../types/buildup.types';
import EventCard from '../../../../components/smartMatching/EventCard';
import {
  getTheOneCandidate,
  calculateDday,
  getPreparationMessage,
  getTheOneType
} from '../../../../utils/dateUtils';

// 축 라벨 매핑
const axisLabels = {
  GO: '성장·운영',
  EC: '경제성·자본',
  PT: '제품·기술력',
  PF: '증빙·딜레디',
  TO: '팀·조직 역량'
};

// 축 짧은 라벨
const axisShortLabels = {
  GO: '성장·',
  EC: '경제·',
  PT: '제품·',
  PF: '증빙·',
  TO: '팀·조'
};

// 카테고리별 정보를 통합하는 유틸 함수들

// 커스텀 Tooltip 컴포넌트
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 backdrop-blur p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-sm text-gray-900 mb-2">{data.axis}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <span className="text-xs text-gray-700">내 점수: <span className="font-bold text-blue-600">{Math.round(data.user)}점</span></span>
          </div>
          {data.requirement && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-xs text-gray-700">요구 점수: <span className="font-bold text-red-600">{Math.round(data.requirement)}점</span></span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const CustomRecommendation: React.FC = () => {
  const { axisScores } = useKPIDiagnosis();
  const { services, addToCart } = useBuildupContext();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<MatchingResult[]>([]);
  const [buildupRecommendations, setBuildupRecommendations] = useState<BuildupService[]>([]);
  const [theOneCandidate, setTheOneCandidate] = useState<MatchingResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatEventData, setChatEventData] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<Array<{
    id: string;
    type: 'user' | 'builder';
    content: string;
    timestamp: Date;
  }>>([]);

  // 사용자 Core5 점수 (KPI Context에서 가져오거나 기본값)
  const userScores: Core5Requirements = axisScores && Object.values(axisScores).some(v => v > 0)
    ? axisScores as Core5Requirements
    : {
        GO: 75,
        EC: 61,
        PT: 27,
        PF: 78,
        TO: 68
      };

  // 레이더 차트 데이터 계산
  const radarData = React.useMemo(() => {
    console.log('🔍 Radar chart data calculation:', {
      selectedEvent,
      recommendationsCount: recommendations.length,
      recommendationIds: recommendations.map(r => r.event.id)
    });

    const data = Object.keys(axisLabels).map(axis => {
      const baseData: any = {
        axis: axisLabels[axis as keyof typeof axisLabels],
        user: userScores[axis as keyof Core5Requirements]
      };

      if (selectedEvent) {
        const event = recommendations.find(r => r.event.id === selectedEvent);
        console.log('🎯 Finding event:', {
          selectedEvent,
          foundEvent: !!event,
          eventCategory: event?.event.category
        });

        if (event && event.event.category && categoryRequirements[event.event.category]) {
          const categoryData = categoryRequirements[event.event.category];
          console.log(`🏷️ Category data for ${event.event.category}:`, categoryData);
          if (categoryData && categoryData.requirements) {
            const requirements = categoryData.requirements;
            baseData.requirement = requirements[axis as keyof Core5Requirements];
            console.log(`📊 Adding requirement for ${axis}:`, baseData.requirement);
          }
        } else {
          console.log(`❌ Missing data:`, {
            hasEvent: !!event,
            category: event?.event.category,
            hasCategoryData: event?.event.category ? !!categoryRequirements[event.event.category] : false,
            availableCategories: Object.keys(categoryRequirements)
          });
        }
      }

      return baseData;
    });

    console.log('📈 Final radar data:', data);
    return data;
  }, [selectedEvent, userScores, recommendations]);

  // KPI 기반 매칭으로 이벤트 정렬 및 필터링
  useEffect(() => {
    console.log('🔄 Processing recommendations...', {
      extendedEventsCount: extendedEvents.length,
      userScores,
      isLoading
    });

    setIsLoading(true);

    try {
      // 모든 이벤트에 실제 매칭 점수 계산
      const eventsWithScores = extendedEvents.map(event => {
        try {
          const score = calculateRealMatchingScore(userScores, event.event);
          const matchingReasons = generateMatchingReasons(userScores, event.event);
          const recommendedActions = generateRecommendedActions(userScores, event.event);

          return {
            ...event,
            score,
            matchingReasons,
            recommendedActions
          };
        } catch (error) {
          console.error('❌ Error calculating score for event:', event.event.id, error);
          // 에러 발생 시 기본값 사용
          return {
            ...event,
            score: 75, // 기본 점수
            matchingReasons: ['기본 매칭'],
            recommendedActions: ['준비 진행']
          };
        }
      });

      console.log('✅ Events with scores calculated:', eventsWithScores.length);

      // 매칭 점수로 정렬 (60점 이상만 추천 - 기준 완화)
      const recommendedEvents = eventsWithScores
        .filter(event => {
          const isValid = event.score >= 60;
          if (!isValid) {
            console.log(`❌ Filtered out: ${event.event.title} (Score: ${event.score})`);
          }
          return isValid;
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 10); // 상위 10개만 맞춤 추천에 표시

      console.log('🎯 Final recommendations:', {
        count: recommendedEvents.length,
        titles: recommendedEvents.map(r => r.event.title)
      });

      // Force re-render by setting recommendations
      setRecommendations([]);
      setTimeout(() => {
        setRecommendations(recommendedEvents);
        setIsLoading(false);
      }, 50);

      // THE ONE 후보 선별 (21일 이상 남은 이벤트 중 최고 점수)
      const candidate = getTheOneCandidate(recommendedEvents);
      console.log('👑 THE ONE candidate:', candidate?.event.title || 'None');
      setTheOneCandidate(candidate);

      // 첫 번째 이벤트 또는 THE ONE 후보 자동 선택
      if (candidate) {
        setSelectedEvent(candidate.event.id);
      } else if (recommendedEvents.length > 0) {
        setSelectedEvent(recommendedEvents[0].event.id);
      } else {
        console.log('⚠️ No events to select');
      }
    } catch (error) {
      console.error('❌ Error in useEffect:', error);
      // 완전 실패 시 더미 데이터 사용
      const dummyEvents = extendedEvents.slice(0, 5).map(event => ({
        ...event,
        score: 75,
        matchingReasons: ['더미 매칭'],
        recommendedActions: ['더미 액션']
      }));
      setRecommendations(dummyEvents);
      setIsLoading(false);
    }
  }, [userScores]);

  // 선택된 이벤트에 따른 빌드업 추천 계산 - 실제 카탈로그 데이터 사용
  useEffect(() => {
    if (selectedEvent && services.length > 0) {
      const event = recommendations.find(r => r.event.id === selectedEvent);
      if (event && event.event.category) {
        const requirements = categoryRequirements[event.event.category]?.requirements || {};

        // 1단계: 가장 부족한 상위 2개 축 찾기
        const topDeficientAxes = Object.entries(requirements)
          .map(([axis, required]) => {
            const userScore = userScores[axis as keyof Core5Requirements];
            const gap = required - userScore;
            return { axis: axis as BuildupAxisKey, gap };
          })
          .filter(item => item.gap >= 5) // 갭이 5점 이상인 축만
          .sort((a, b) => b.gap - a.gap) // 갭이 큰 순으로 정렬
          .slice(0, 2); // 상위 2개 축만

        // 2단계: 각 부족한 축에 대해 최적의 서비스 1개씩 찾기
        const recommended: BuildupService[] = [];

        for (const deficientAxis of topDeficientAxes) {
          const bestServiceForAxis = services
            .map(service => {
              // KPI 개선 점수가 있는 서비스만
              if (!service.benefits?.kpi_improvement) return null;

              const improvement = service.benefits.kpi_improvement[deficientAxis.axis] || 0;

              // 이 축을 개선할 수 있는 서비스인지 확인
              if (improvement <= 0) return null;

              return {
                service,
                axis: deficientAxis.axis,
                gap: deficientAxis.gap,
                improvement,
                effectiveness: Math.min(improvement / deficientAxis.gap, 1)
              };
            })
            .filter(Boolean)
            .sort((a, b) => {
              // 1차: 개선 점수가 높은 순
              // 2차: 효율성이 높은 순
              const improvementDiff = b!.improvement - a!.improvement;
              if (Math.abs(improvementDiff) > 2) return improvementDiff;
              return b!.effectiveness - a!.effectiveness;
            })[0]; // 가장 좋은 서비스 1개만

          if (bestServiceForAxis && !recommended.find(s => s.service_id === bestServiceForAxis.service.service_id)) {
            recommended.push(bestServiceForAxis.service);
          }
        }

        setBuildupRecommendations(recommended);
      }
    } else {
      setBuildupRecommendations([]);
    }
  }, [selectedEvent, userScores, recommendations, services]);

  // 이벤트 상담 핸들러
  const handleEventConsultation = (event: any) => {
    setChatEventData(event);
    setShowChatModal(true);

    // 초기 빌더 메시지 추가
    setMessages([{
      id: 'welcome-' + Date.now(),
      type: 'builder',
      content: `안녕하세요! 스마트매칭 빌더입니다 🙋‍♀️\n\n**${event.title}** 이벤트에 대해 상담 도와드리겠습니다.\n\n어떤 부분이 궁금하신가요?`,
      timestamp: new Date()
    }]);
  };

  // 메시지 전송 핸들러
  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;

    const userMessage = {
      id: 'user-' + Date.now(),
      type: 'user' as const,
      content: chatMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setChatMessage('');

    // 빌더 자동 응답 (2초 후)
    setTimeout(() => {
      const responses = [
        "좋은 질문이네요! 해당 이벤트는 매우 경쟁이 치열하니 미리 준비하시는 것이 좋겠습니다.",
        "이 분야에 대한 경험이 있으시다면 더 유리할 것 같은데, 어떤 배경을 가지고 계신가요?",
        "지원서류 준비에 도움이 필요하시면 포켓빌드업 서비스를 확인해보세요!",
        "해당 기관의 과거 선정 기준을 보면, 이런 부분들을 중점적으로 평가합니다.",
        "더 구체적인 상담을 원하시면 빌드업 프로젝트로 연결해드릴 수 있어요."
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      setMessages(prev => [...prev, {
        id: 'builder-' + Date.now(),
        type: 'builder',
        content: randomResponse,
        timestamp: new Date()
      }]);
    }, 2000);
  };


  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">스마트 매칭</h1>
              <p className="text-sm text-gray-500 mt-1">당신의 KPI 점수를 기반으로 최적의 기회를 추천합니다</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                {selectedEvent ? '이벤트를 선택하여 비교 분석' : '이벤트를 선택하세요'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-8">
          {/* 왼쪽: 레이더 차트 (고정) */}
          <div className="col-span-5">
            <div className="sticky top-6 space-y-6">
              <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-xl shadow-lg border border-gray-200/80 p-8">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Core5 권장수준 비교</h3>

                  {/* 범례 */}
                  <div className="flex items-center gap-5 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-indigo-600 rounded-full shadow-sm"></div>
                      <span className="text-xs font-medium text-gray-700">내 점수</span>
                    </div>
                    {selectedEvent && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-600 rounded-full shadow-sm"></div>
                        <span className="text-xs font-medium text-gray-700">요구 점수</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-80 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                    <PolarGrid
                      gridType="polygon"
                      stroke="#d1d5db"
                      strokeWidth={1.5}
                      radialLines={true}
                    />
                    <PolarAngleAxis
                      dataKey="axis"
                      tick={{ fontSize: 13, fontWeight: 500 }}
                      className="text-gray-700"
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fontSize: 11 }}
                      tickCount={5}
                      stroke="#9ca3af"
                    />

                    {/* Tooltip 추가 */}
                    <Tooltip content={<CustomTooltip />} />

                    {/* 사용자 데이터 (파란색) */}
                    <Radar
                      name="내 점수"
                      dataKey="user"
                      stroke="#4f46e5"
                      fill="#4f46e5"
                      fillOpacity={0.45}
                      strokeWidth={3}
                    />

                    {/* 요구사항 데이터 (빨간색) - 선택시만 표시 */}
                    {selectedEvent && (
                      <Radar
                        name="요구 점수"
                        dataKey="requirement"
                        stroke="#dc2626"
                        fill="#dc2626"
                        fillOpacity={0.25}
                        strokeWidth={2.5}
                        strokeDasharray="5 3"
                      />
                    )}
                  </RadarChart>
                </ResponsiveContainer>

                </div>
              </div>

              {/* 빌드업 추천 섹션 - 이벤트 선택시만 표시 */}
              {selectedEvent && buildupRecommendations.length > 0 && (
                <div className="relative overflow-hidden">
                  {/* 그라데이션 배경 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-xl" />

                  {/* 내부 콘텐츠 */}
                  <div className="relative bg-white/95 backdrop-blur rounded-xl shadow-lg border border-white/20 p-3">
                    {/* 헤더 섹션 */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">🎯</span>
                        <h4 className="text-base font-bold text-gray-900">
                          맞춤 빌드업 처방전
                        </h4>
                      </div>
                      <p className="text-xs text-gray-600">
                        선택한 기회에 최적화된 역량 강화 솔루션
                      </p>
                    </div>

                    {/* 진단 섭션 - 감정적 메시지 */}
                    {(() => {
                      const event = recommendations.find(r => r.event.id === selectedEvent);
                      const requirements = event?.event.category ? (categoryRequirements[event.event.category]?.requirements || {}) : {};
                      const totalGap = Object.entries(requirements)
                        .reduce((sum, [axis, required]) => {
                          const userScore = userScores[axis as keyof Core5Requirements];
                          return sum + Math.max(0, required - userScore);
                        }, 0);

                      return totalGap > 0 ? (
                        <div className="mb-3 flex items-center gap-2 text-amber-700 text-xs">
                          <span>⚠️</span>
                          <span className="font-medium">총 {Math.round(totalGap)}점 갭 • 전략적 준비 필요</span>
                        </div>
                      ) : null;
                    })()}

                    {/* 추천 서비스 표시 - 모두 표시 */}
                    {buildupRecommendations.length > 0 && (
                      <div className="space-y-2">
                        {buildupRecommendations.map((service, index) => {
                      // 이벤트 요구사항 가져오기
                      const event = recommendations.find(r => r.event.id === selectedEvent);
                      const requirements = event?.event.category ? (categoryRequirements[event.event.category]?.requirements || {}) : {};

                      // 실제 부족한 축 중에서 이 서비스가 가장 효과적인 축 찾기
                      const bestAxisForGap = Object.entries(requirements)
                        .map(([axis, required]) => {
                          const userScore = userScores[axis as keyof Core5Requirements];
                          const gap = required - userScore;
                          const improvement = service.benefits.kpi_improvement[axis as BuildupAxisKey] || 0;

                          if (gap >= 5 && improvement > 0) {
                            return {
                              axis: axis as BuildupAxisKey,
                              gap,
                              improvement,
                              effectiveness: Math.min(improvement / gap, 1)
                            };
                          }
                          return null;
                        })
                        .filter(Boolean)
                        .reduce((best, current) =>
                          current!.effectiveness > best!.effectiveness ? current : best,
                          { axis: 'GO' as BuildupAxisKey, gap: 0, improvement: 0, effectiveness: 0 }
                        );

                      return (
                        <div
                          key={service.service_id}
                          className="relative group"
                        >
                          <div className="p-4 bg-gradient-to-br from-white to-blue-50/20 rounded-lg border border-blue-200/50 hover:shadow-lg hover:border-blue-400 transition-all">
                            {/* 서비스 제목과 설명 */}
                            <div className="mb-3">
                              <h3 className="text-lg font-bold text-gray-900 mb-1">
                                {service.name}
                              </h3>
                              <p className="text-sm text-gray-600 mb-3">
                                {service.description && service.description.length > 50
                                  ? service.description.substring(0, 50) + '...'
                                  : service.description || '전문 컨설팅을 통해 역량을 체계적으로 개선합니다'}
                              </p>

                              {/* 갭 정보와 가격 */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="px-3 py-1 bg-red-50 border border-red-200 rounded-md">
                                    <span className="text-xs font-medium text-red-700">
                                      {axisLabels[bestAxisForGap.axis as keyof typeof axisLabels]} {Math.round(Math.max(0, bestAxisForGap.gap))}점 부족
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {service.price.discounted && service.price.discounted < service.price.original ? (
                                    <>
                                      <span className="text-xs text-gray-500 line-through">
                                        {service.price.original.toLocaleString()}원
                                      </span>
                                      <div className="text-lg font-bold text-blue-600">
                                        {service.price.discounted.toLocaleString()}원
                                      </div>
                                    </>
                                  ) : (
                                    <div className="text-lg font-bold text-gray-900">
                                      {service.price.original.toLocaleString()}원
                                    </div>
                                  )}
                                  <span className="text-xs text-gray-500">
                                    {service.duration?.display || '8주'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* CTA 버튼 - 시스템 색상 */}
                            <button
                              onClick={() => addToCart(service)}
                              className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold text-sm shadow-sm hover:shadow-md"
                            >
                              지금 시작하기 →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                      </div>
                    )}

                    {/* 하단 액션 영역 - 간소화 */}
                    <div className="mt-4 space-y-3">
                      {/* 번들 할인 제안 - 간소화 */}
                      {buildupRecommendations.length >= 2 && (
                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-base">🎁</span>
                              <span className="font-semibold text-purple-900 text-sm">번들 특가 20% OFF</span>
                            </div>
                            <button
                              onClick={() => {
                                const services = buildupRecommendations.slice(0, 2);
                                services.forEach((service, index) => {
                                  setTimeout(() => {
                                    addToCart(service);
                                  }, index * 100);
                                });
                              }}
                              className="px-3 py-1.5 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700 transition-colors"
                            >
                              번들 담기
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 긴급성/시간 제한 메시지 - 간소화 */}
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="flex items-center gap-2">
                          <span className="text-amber-600">⏰</span>
                          <div className="flex-1">
                            {(() => {
                              const event = recommendations.find(r => r.event.id === selectedEvent);
                              if (event) {
                                const dday = calculateDday(event.event.applicationEndDate);
                                return (
                                  <p className="text-xs text-amber-800">
                                    <span className="font-semibold">D-{dday}일 남음</span> • {Math.ceil(dday * 0.7)}일 전 시작 권장
                                  </p>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽: 이벤트 카드 리스트 */}
          <div className="col-span-7 space-y-6">
            {/* Debug info */}
            <div className="text-xs text-gray-400 p-2 bg-gray-100 rounded">
              Debug: Loading: {isLoading ? 'true' : 'false'}, Recommendations: {recommendations.length}, UserScores: {JSON.stringify(userScores)}
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">이벤트 매칭 중...</p>
                </div>
              </div>
            )}

            {/* No recommendations */}
            {!isLoading && recommendations.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">매칭되는 이벤트가 없습니다.</p>
              </div>
            )}

            {/* THE ONE 후보가 없을 때 안내 메시지 */}
            {!isLoading && !theOneCandidate && recommendations.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-red-700">
                  <span className="text-sm font-medium">⚠️ 준비 시간이 충분한 기회가 없습니다</span>
                </div>
                <p className="text-sm text-red-600 mt-1">
                  모든 기회가 7일 이내 마감입니다. 기존 자료로 빠르게 지원하거나 전체 기회에서 더 찾아보세요.
                </p>
              </div>
            )}

            {/* Event cards */}
            {!isLoading && recommendations.map((rec, index) => {
              console.log('🎨 Rendering event card:', {
                id: rec.event.id,
                title: rec.event.title,
                index
              });
              const compatibility = calculateCompatibility(
                userScores,
                categoryRequirements[rec.event.category]?.requirements || {
                  GO: 50,
                  EC: 50,
                  PT: 50,
                  PF: 50,
                  TO: 50
                }
              );
              const isSelected = selectedEvent === rec.event.id;
              const isTheOne = theOneCandidate?.event.id === rec.event.id; // THE ONE 후보와 일치하는지 확인

              // THE ONE일 때 준비 정보 계산
              const dday = isTheOne ? calculateDday(rec.event.applicationEndDate) : 0;
              const theOneType = isTheOne ? getTheOneType(dday) : null;
              const preparationMsg = isTheOne ? getPreparationMessage(dday) : '';

              return (
                <div key={rec.event.id} className={isTheOne ? "relative" : ""}>
                  {/* THE ONE 라벨 */}
                  {isTheOne && theOneType && (
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
                          theOneType.type === 'excellent'
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                            : theOneType.type === 'good'
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                            : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                        }`}>
                          <span className="text-base">{theOneType.icon}</span>
                          {theOneType.label}
                        </div>
                        <span className="text-sm text-gray-600">D-{dday}일 남음</span>
                      </div>
                    </div>
                  )}

                  {/* THE ONE 준비 메시지 */}
                  {isTheOne && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800 font-medium mb-1">🎯 준비 가이드</p>
                      <p className="text-sm text-blue-700">{preparationMsg}</p>
                    </div>
                  )}

                  <div className={isTheOne ? "transform scale-[1.02] transition-transform" : ""}>
                    <EventCard
                      result={rec}
                      onSelect={() => {
                        console.log('🖱️ Event selected:', {
                          eventId: rec.event.id,
                          eventTitle: rec.event.title,
                          eventCategory: rec.event.category
                        });
                        setSelectedEvent(rec.event.id);
                      }}
                      isSelected={isSelected}
                      showStatus={true}
                      compatibility={{
                        meetCount: compatibility.meetCount,
                        status: compatibility.meetCount >= 4 ? 'recommended' :
                                compatibility.meetCount >= 2 ? 'preparing' : 'insufficient'
                      }}
                      isTheOne={isTheOne}
                      onBuilderConsult={() => handleEventConsultation(rec.event)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 우측 슬라이드 채팅 모달 - ChatSideModal 스타일 */}
      {showChatModal && chatEventData && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity"
            onClick={() => setShowChatModal(false)}
          />

          {/* Chat Panel */}
          <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-200"
               style={{
                 borderRadius: '20px',
                 boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)'
               }}>

            {/* Header with gradient */}
            <div className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-lg">💬</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">빌더 상담</h3>
                    <p className="text-xs text-blue-100 truncate">{chatEventData.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                    title="최소화"
                  >
                    <span className="w-4 h-4 block">−</span>
                  </button>
                  <button
                    onClick={() => setShowChatModal(false)}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                    title="닫기"
                  >
                    <span className="w-4 h-4 block">✕</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Event Info Section */}
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-600">📋</span>
                <span className="text-sm font-medium text-blue-900">이벤트 정보</span>
              </div>
              <div className="space-y-1 text-xs text-blue-800">
                <div className="flex justify-between">
                  <span className="text-blue-600">이벤트:</span>
                  <span className="font-medium truncate ml-2">{chatEventData.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">마감:</span>
                  <span className="font-medium">{new Date(chatEventData.applicationEndDate).toLocaleDateString('ko-KR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">주관:</span>
                  <span className="font-medium truncate ml-2">{chatEventData.hostOrganization || chatEventData.vcName || '미정'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">지원:</span>
                  <span className="font-medium truncate ml-2">{chatEventData.fundingAmount || chatEventData.investmentAmount || '미정'}</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" style={{ height: 'calc(100% - 200px)' }}>
              {messages.map((message) => (
                <div key={message.id} className="flex items-start gap-3">
                  {message.type === 'builder' ? (
                    <>
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
                        빌
                      </div>
                      <div className="flex-1">
                        <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border">
                          <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-line">
                            {message.content}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-1">
                          {message.timestamp.toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-1"></div>
                      <div className="flex-1">
                        <div className="bg-blue-600 rounded-2xl rounded-br-sm px-4 py-3 shadow-sm ml-auto max-w-xs">
                          <p className="text-sm text-white leading-relaxed whitespace-pre-line">
                            {message.content}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 text-right mr-1">
                          {message.timestamp.toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
                        나
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && chatMessage.trim()) {
                      handleSendMessage();
                    }
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="text-sm">📤</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center">
                💡 실제 빌더 연결은 프로젝트 구매 후 가능합니다
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomRecommendation;