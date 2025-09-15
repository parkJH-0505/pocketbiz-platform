import React, { useState, useEffect } from 'react';
import { Bell, Filter, Star, Clock, ExternalLink } from 'lucide-react';
import type { SmartMatchingEvent, MatchingResult, EventCategory } from '../../../types/smartMatchingV2';
import { getOverlayConfig, getRecommendedCategories, getCategoryIcon } from '../../../data/overlayConfigs';
import { useUserProfile } from '../../../contexts/UserProfileContext';
import EventOverlay from './EventOverlay';

const SmartMatchingV2: React.FC = () => {
  const [recommendations, setRecommendations] = useState<MatchingResult[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SmartMatchingEvent | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeCategories, setActiveCategories] = useState<EventCategory[]>([]);

  // 사용자 프로필에서 실제 클러스터 정보 가져오기
  const { profile, isLoading } = useUserProfile();

  // 기본값 설정 (프로필이 없을 경우)
  const userStage = profile?.cluster.stage || 'A-2';
  const userSector = profile?.cluster.sector || 'S-1';
  const userStageLabel = profile?.cluster.stageLabel || '창업 직전·막 창업';
  const userSectorLabel = profile?.cluster.sectorLabel || 'IT·플랫폼/SaaS';

  // 추천 카테고리 가져오기
  useEffect(() => {
    const recommendedCategories = getRecommendedCategories(userStage, userSector);
    setActiveCategories(recommendedCategories);

    // Mock 추천 데이터 로드
    loadMockRecommendations();
  }, [userStage, userSector]);

  const loadMockRecommendations = () => {
    // Mock 데이터 - 실제로는 매칭 엔진에서 가져올 예정
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
          announcementDate: new Date('2024-01-15'),
          applicationStartDate: new Date('2024-02-01'),
          applicationEndDate: new Date('2024-02-28'),
          keywords: ['AI', 'IoT', 'SaaS', '기술혁신'],
          recommendedStages: ['A-4', 'A-5'],
          recommendedSectors: ['S-1', 'S-2'],
          requirementLevel: 'Pre-A 단계',
          evaluationCriteria: ['기술력', '시장성', '팀 역량'],
          supportBenefits: ['R&D 자금', '멘토링', '네트워킹'],
          matchingScore: 92
        } as any,
        score: 92,
        matchingReasons: [
          'A-4 단계에 최적화된 프로그램',
          'IT/SaaS 섹터 우대',
          '현재 KPI 점수 충족'
        ],
        urgencyLevel: 'high',
        daysUntilDeadline: 28,
        recommendedActions: [
          '사업계획서 업데이트',
          '재무모델링 준비',
          '기술 검증 자료 준비'
        ]
      },
      {
        event: {
          id: 'vc-demo-day-2024',
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
          matchingScore: 87
        } as any,
        score: 87,
        matchingReasons: [
          'Series A 준비 단계 타겟',
          'SaaS 분야 전문 VC',
          '투자 규모 적합'
        ],
        urgencyLevel: 'medium',
        daysUntilDeadline: 35,
        recommendedActions: [
          '피치덱 준비',
          '재무 데이터 정리',
          '고객 레퍼런스 확보'
        ]
      },
      {
        event: {
          id: 'samsung-open-innovation',
          category: 'open_innovation',
          title: '삼성전자 C-Lab 오픈이노베이션',
          description: '스마트 디바이스 연동 기술 파트너 모집',
          demandOrganization: '삼성전자',
          recruitmentField: 'IoT/스마트홈',
          collaborationContent: 'SmartThings 플랫폼 연동 솔루션 개발',
          collaborationPeriod: '6개월',
          announcementDate: new Date('2024-01-25'),
          applicationStartDate: new Date('2024-02-10'),
          applicationEndDate: new Date('2024-03-10'),
          keywords: ['IoT', 'SmartThings', '삼성', '파트너십'],
          recommendedStages: ['A-3', 'A-4'],
          recommendedSectors: ['S-1', 'S-2'],
          selectionCount: 5,
          applicationConditions: ['IoT 솔루션 보유', '개발 역량 입증'],
          matchingScore: 78
        } as any,
        score: 78,
        matchingReasons: [
          'IoT 기술 보유 기업 우대',
          '대기업 파트너십 기회',
          '시장 검증 가능'
        ],
        urgencyLevel: 'low',
        daysUntilDeadline: 40,
        recommendedActions: [
          '기술 시연 자료 준비',
          'SmartThings 플랫폼 연구',
          '레퍼런스 프로젝트 준비'
        ]
      }
    ];

    setRecommendations(mockRecommendations);
  };

  const getDaysUntilDeadline = (endDate: Date): number => {
    const today = new Date();
    const timeDiff = endDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  };

  const getUrgencyColor = (urgency: string): string => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyText = (urgency: string): string => {
    switch (urgency) {
      case 'high': return '긴급';
      case 'medium': return '보통';
      case 'low': return '여유';
      default: return '확인필요';
    }
  };

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">스마트 매칭</h1>
              <p className="text-gray-600 mt-1">당신을 위한 맞춤형 기회 추천</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Filter className="w-4 h-4 mr-2" />
                필터
              </button>
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                <Bell className="w-4 h-4 mr-2" />
                알림 설정
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* User Context */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-900 font-medium">
                {userStageLabel} · {userSectorLabel}
              </p>
              <p className="text-blue-700 text-sm">당신의 성장단계에 맞는 {recommendations.length}개 기회를 찾았습니다</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">{recommendations.length}</p>
              <p className="text-sm text-blue-600">추천 기회</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="space-y-6">
          {recommendations.map((recommendation) => {
            const config = getOverlayConfig(recommendation.event.category);
            const categoryIcon = getCategoryIcon(recommendation.event.category);

            return (
              <div
                key={recommendation.event.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedEvent(recommendation.event)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg ${config.iconColor} bg-opacity-10 flex items-center justify-center`}>
                      <span className="text-xl">{categoryIcon}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{recommendation.event.title}</h3>
                      <p className="text-sm text-gray-600">{config.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getUrgencyColor(recommendation.urgencyLevel)}`}>
                      {getUrgencyText(recommendation.urgencyLevel)}
                    </span>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      D-{recommendation.daysUntilDeadline}
                    </div>
                  </div>
                </div>

                {/* Content Preview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">매칭도</p>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="font-semibold text-gray-900">{recommendation.score}점</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">주요 혜택</p>
                    <p className="text-sm text-gray-900">
                      {recommendation.event.category === 'tips_program' && (recommendation.event as any).fundingAmount}
                      {recommendation.event.category === 'vc_opportunity' && (recommendation.event as any).investmentAmount}
                      {recommendation.event.category === 'government_support' && (recommendation.event as any).supportAmount}
                      {recommendation.event.category === 'open_innovation' && (recommendation.event as any).collaborationContent}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">매칭 이유</p>
                    <p className="text-sm text-gray-900">{recommendation.matchingReasons[0]}</p>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {recommendation.event.keywords.slice(0, 3).map((keyword, index) => (
                      <span key={index} className="bg-gray-100 px-2 py-1 rounded">
                        {keyword}
                      </span>
                    ))}
                  </div>
                  <button className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
                    자세히 보기
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More */}
        {recommendations.length > 0 && (
          <div className="text-center mt-8">
            <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              더 많은 기회 보기
            </button>
          </div>
        )}
      </div>

      {/* Event Overlay */}
      {selectedEvent && (
        <EventOverlay
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};

export default SmartMatchingV2;