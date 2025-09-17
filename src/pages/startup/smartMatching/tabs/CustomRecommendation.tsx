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
  ResponsiveContainer
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
import { mockRecommendations } from '../../../../data/smartMatching/mockEvents';
import { useKPIDiagnosis } from '../../../../contexts/KPIDiagnosisContext';
import {
  getRecommendedProjects,
  type ProjectRecommendation
} from '../../../../data/axisProjectMapping';
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

const CustomRecommendation: React.FC = () => {
  const { axisScores } = useKPIDiagnosis();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<MatchingResult[]>([]);
  const [buildupRecommendations, setBuildupRecommendations] = useState<ProjectRecommendation[]>([]);
  const [theOneCandidate, setTheOneCandidate] = useState<MatchingResult | null>(null);

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
    const data = Object.keys(axisLabels).map(axis => {
      const baseData: any = {
        axis: axisLabels[axis as keyof typeof axisLabels],
        user: userScores[axis as keyof Core5Requirements]
      };

      if (selectedEvent) {
        const event = recommendations.find(r => r.event.id === selectedEvent);
        if (event && event.event.category) {
          const requirements = categoryRequirements[event.event.category].requirements;
          baseData.requirement = requirements[axis as keyof Core5Requirements];
        }
      }

      return baseData;
    });
    return data;
  }, [selectedEvent, userScores.GO, userScores.EC, userScores.PT, userScores.PF, userScores.TO]);

  // Mock 데이터 로드 및 THE ONE 후보 선별
  useEffect(() => {
    setRecommendations(mockRecommendations);

    // THE ONE 후보 선별 (21일 이상 남은 이벤트)
    const candidate = getTheOneCandidate(mockRecommendations);
    setTheOneCandidate(candidate);

    // 첫 번째 이벤트 또는 THE ONE 후보 자동 선택
    if (candidate) {
      setSelectedEvent(candidate.event.id);
    } else if (mockRecommendations.length > 0) {
      setSelectedEvent(mockRecommendations[0].event.id);
    }
  }, []);

  // 선택된 이벤트에 따른 빌드업 추천 계산
  useEffect(() => {
    if (selectedEvent) {
      const event = recommendations.find(r => r.event.id === selectedEvent);
      if (event && event.event.category) {
        const requirements = categoryRequirements[event.event.category].requirements;
        const recommended = getRecommendedProjects(
          userScores,
          requirements,
          event.event.category,
          2
        );
        setBuildupRecommendations(recommended);
      }
    } else {
      setBuildupRecommendations([]);
    }
  }, [selectedEvent, userScores.GO, userScores.EC, userScores.PT, userScores.PF, userScores.TO]);


  return (
    <div className="min-h-screen bg-gray-50">
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
        <div className="grid grid-cols-12 gap-6">
          {/* 왼쪽: 레이더 차트 (고정) */}
          <div className="col-span-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900">5축 적합도 분석</h3>
                <p className="mt-1 text-sm text-gray-500">선택한 이벤트와 비교 분석</p>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid
                      gridType="polygon"
                      stroke="#e5e7eb"
                      radialLines={true}
                    />
                    <PolarAngleAxis
                      dataKey="axis"
                      tick={{ fontSize: 12 }}
                      className="text-gray-500"
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fontSize: 10 }}
                      tickCount={5}
                    />

                    {/* 사용자 데이터 (파란색) */}
                    <Radar
                      name="내 점수"
                      dataKey="user"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />

                    {/* 요구사항 데이터 (빨간색) - 선택시만 표시 */}
                    {selectedEvent && (
                      <Radar
                        name="요구 점수"
                        dataKey="requirement"
                        stroke="#ef4444"
                        fill="#ef4444"
                        fillOpacity={0.15}
                        strokeWidth={2}
                        strokeDasharray="5 3"
                      />
                    )}
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* 레전드 */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <span className="text-sm text-gray-500">내 점수</span>
                </div>
                {selectedEvent && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-500">요구 점수</span>
                  </div>
                )}
              </div>

              {/* 점수 표시 */}
              <div className="grid grid-cols-5 gap-2 mt-6 pt-6 border-t">
                {Object.entries(axisLabels).map(([key, label]) => (
                  <div key={key} className="text-center">
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className="text-lg font-bold text-gray-900">
                      {Math.round(userScores[key as keyof Core5Requirements])}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 빌드업 추천 섹션 - 이벤트 선택시만 표시 */}
            {selectedEvent && buildupRecommendations.length > 0 && (
              <div className="mt-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    추천 빌드업 서비스
                  </h4>
                  <div className="space-y-3">
                    {buildupRecommendations.slice(0, 2).map((recommendation, index) => (
                      <div
                        key={`${recommendation.axis}-${index}`}
                        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                            {axisLabels[recommendation.axis as keyof typeof axisLabels]}
                          </span>
                          <span className="text-xs text-gray-500">
                            갭 {recommendation.gap}점
                          </span>
                        </div>
                        <div className="space-y-2">
                          {recommendation.services.map((service) => (
                            <div key={service.service_id} className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {service.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  +{service.improvement_score}점 개선 • {service.price.toLocaleString()}원
                                </p>
                              </div>
                              <button className="px-3 py-1.5 text-xs text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                                <ShoppingCart className="w-3 h-3 mr-1" />
                                담기
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {buildupRecommendations.length > 2 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                        더 많은 빌드업 서비스 보기 ({buildupRecommendations.length - 2}개)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 오른쪽: 이벤트 카드 리스트 */}
          <div className="col-span-8 space-y-6">
            {/* THE ONE 후보가 없을 때 안내 메시지 */}
            {!theOneCandidate && recommendations.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-red-700">
                  <span className="text-sm font-medium">⚠️ 준비 시간이 충분한 기회가 없습니다</span>
                </div>
                <p className="text-sm text-red-600 mt-1">
                  모든 기회가 7일 이내 마감입니다. 기존 자료로 빠르게 지원하거나 전체 기회에서 더 찾아보세요.
                </p>
              </div>
            )}

            {recommendations.map((rec, index) => {
              const compatibility = calculateCompatibility(userScores, rec.event.category);
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
                      onSelect={() => setSelectedEvent(rec.event.id)}
                      isSelected={isSelected}
                      showStatus={true}
                      compatibility={{
                        meetCount: compatibility.meetCount,
                        status: compatibility.meetCount >= 4 ? 'recommended' :
                                compatibility.meetCount >= 2 ? 'preparing' : 'insufficient'
                      }}
                      isTheOne={isTheOne}
                    />
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

export default CustomRecommendation;