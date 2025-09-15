import React from 'react';
import { X, Calendar, Building, DollarSign, Clock, Target, Users, ExternalLink, Star, BarChart3 } from 'lucide-react';
import type { SmartMatchingEvent } from '../../../types/smartMatchingV2';
import { getOverlayConfig, getCategoryIcon } from '../../../data/overlayConfigs';
import { categoryRequirements, calculateCompatibility } from '../../../data/eventRequirements';
import type { Core5Requirements } from '../../../data/eventRequirements';
import RadarChart from '../../../components/RadarChart';
import { useUserProfile } from '../../../contexts/UserProfileContext';

interface EventOverlayProps {
  event: SmartMatchingEvent;
  onClose: () => void;
}

const EventOverlay: React.FC<EventOverlayProps> = ({ event, onClose }) => {
  const config = getOverlayConfig(event.category);
  const categoryIcon = getCategoryIcon(event.category);
  const { profile } = useUserProfile();

  // 사용자 KPI 점수 가져오기 (모의 데이터 또는 실제 데이터)
  const userScores: Core5Requirements = profile?.kpiDiagnosis?.core5Scores || {
    GO: 65, // 성장성 및 운영
    EC: 60, // 수익성
    PT: 70, // 제품 및 기술
    PF: 55, // 재무 및 인력
    TO: 75  // 팀 및 조직
  };

  // 이벤트 카테고리별 요구사항 가져오기
  const eventRequirements = categoryRequirements[event.category];
  const requirements = eventRequirements.requirements;

  // 적합도 계산
  const compatibility = calculateCompatibility(userScores, requirements);

  const getDaysUntilDeadline = (endDate: Date): number => {
    const today = new Date();
    const timeDiff = endDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderPrimaryFields = () => {
    const fields = [];

    // 공통 필드들
    if (config.primaryFields.includes('applicationEndDate')) {
      fields.push(
        <div key="deadline" className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <p className="font-medium text-red-900">마감일</p>
              <p className="text-sm text-red-700">{formatDate(event.applicationEndDate)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-red-600">D-{getDaysUntilDeadline(event.applicationEndDate)}</p>
            <p className="text-sm text-red-600">남음</p>
          </div>
        </div>
      );
    }

    if (config.primaryFields.includes('matchingScore') && event.matchingScore) {
      fields.push(
        <div key="score" className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <Star className="w-5 h-5 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-blue-900">적합도</p>
              <p className="text-sm text-blue-700">현재 상황 기준</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-600">{event.matchingScore}점</p>
            <p className="text-sm text-blue-600">매우 적합</p>
          </div>
        </div>
      );
    }

    // 카테고리별 특화 필드들
    switch (event.category) {
      case 'tips_program':
        const tipsEvent = event as any;
        fields.push(
          <div key="funding" className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center mb-2">
              <DollarSign className="w-5 h-5 text-green-600 mr-2" />
              <p className="font-medium text-green-900">지원 금액</p>
            </div>
            <p className="text-lg font-semibold text-green-800">{tipsEvent.fundingAmount}</p>
            <p className="text-sm text-green-600">R&D 자금 지원 + 멘토링</p>
          </div>
        );
        fields.push(
          <div key="duration" className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center mb-2">
              <Calendar className="w-5 h-5 text-purple-600 mr-2" />
              <p className="font-medium text-purple-900">사업 기간</p>
            </div>
            <p className="text-lg font-semibold text-purple-800">{tipsEvent.programDuration}</p>
            <p className="text-sm text-purple-600">{tipsEvent.programType} 프로그램</p>
          </div>
        );
        break;

      case 'vc_opportunity':
        const vcEvent = event as any;
        fields.push(
          <div key="vc-amount" className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="flex items-center mb-2">
              <DollarSign className="w-5 h-5 text-indigo-600 mr-2" />
              <p className="font-medium text-indigo-900">투자 규모</p>
            </div>
            <p className="text-lg font-semibold text-indigo-800">{vcEvent.investmentAmount}</p>
            <p className="text-sm text-indigo-600">{vcEvent.investmentStage} 라운드</p>
          </div>
        );
        fields.push(
          <div key="vc-name" className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center mb-2">
              <Building className="w-5 h-5 text-orange-600 mr-2" />
              <p className="font-medium text-orange-900">투자사</p>
            </div>
            <p className="text-lg font-semibold text-orange-800">{vcEvent.vcName}</p>
            <p className="text-sm text-orange-600">전문 투자기관</p>
          </div>
        );
        break;

      case 'open_innovation':
        const openEvent = event as any;
        fields.push(
          <div key="demand-org" className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
            <div className="flex items-center mb-2">
              <Building className="w-5 h-5 text-cyan-600 mr-2" />
              <p className="font-medium text-cyan-900">수요 기관</p>
            </div>
            <p className="text-lg font-semibold text-cyan-800">{openEvent.demandOrganization}</p>
            <p className="text-sm text-cyan-600">대기업 파트너십</p>
          </div>
        );
        fields.push(
          <div key="collaboration" className="p-4 bg-teal-50 rounded-lg border border-teal-200">
            <div className="flex items-center mb-2">
              <Target className="w-5 h-5 text-teal-600 mr-2" />
              <p className="font-medium text-teal-900">협업 내용</p>
            </div>
            <p className="text-lg font-semibold text-teal-800">{openEvent.recruitmentField}</p>
            <p className="text-sm text-teal-600">{openEvent.collaborationPeriod} 협업</p>
          </div>
        );
        break;

      case 'government_support':
        const govEvent = event as any;
        fields.push(
          <div key="support-amount" className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-center mb-2">
              <DollarSign className="w-5 h-5 text-emerald-600 mr-2" />
              <p className="font-medium text-emerald-900">지원 내용</p>
            </div>
            <p className="text-lg font-semibold text-emerald-800">{govEvent.supportAmount}</p>
            <p className="text-sm text-emerald-600">정부지원사업</p>
          </div>
        );
        fields.push(
          <div key="host-org" className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center mb-2">
              <Building className="w-5 h-5 text-blue-600 mr-2" />
              <p className="font-medium text-blue-900">주관 기관</p>
            </div>
            <p className="text-lg font-semibold text-blue-800">{govEvent.hostOrganization}</p>
            <p className="text-sm text-blue-600">{govEvent.governmentDepartment}</p>
          </div>
        );
        break;
    }

    return fields;
  };

  const renderRecommendedActions = () => {
    // 카테고리별 추천 액션
    const actions = {
      tips_program: [
        '📄 사업계획서 최신화',
        '💰 재무모델링 정교화',
        '🔬 기술검증 자료 준비',
        '👥 멘토 섭외'
      ],
      vc_opportunity: [
        '📊 피치덱 준비',
        '📈 트랙션 데이터 정리',
        '💼 고객 레퍼런스 확보',
        '👨‍💼 팀 소개서 작성'
      ],
      open_innovation: [
        '🔧 기술 데모 준비',
        '📋 협업 제안서 작성',
        '🤝 파트너십 전략 수립',
        '📞 사전 미팅 요청'
      ],
      government_support: [
        '📑 지원서류 준비',
        '🏢 사업자등록 확인',
        '📊 재무제표 준비',
        '📋 신청조건 체크'
      ],
      accelerator: [
        '💡 아이디어 피치 준비',
        '👥 팀 역량 정리',
        '📈 비즈니스 모델 검증',
        '🎯 성장 계획 수립'
      ]
    };

    const categoryActions = actions[event.category] || actions.government_support;

    return (
      <div className="space-y-3">
        {categoryActions.map((action, index) => (
          <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-xs font-bold text-blue-600">{index + 1}</span>
            </div>
            <span className="text-gray-700">{action}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-xl ${config.iconColor} bg-opacity-10 flex items-center justify-center`}>
                  <span className="text-2xl">{categoryIcon}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{event.title}</h2>
                  <p className="text-gray-600">{config.title}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8">
            {/* KPI 적합도 분석 - 레이더 차트 */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center mb-4">
                <BarChart3 className="w-6 h-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">KPI 적합도 분석</h3>
                <div className="ml-auto">
                  <span className="text-2xl font-bold text-blue-600">{compatibility.overall}%</span>
                  <span className="text-sm text-gray-600 ml-2">종합 적합도</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 레이더 차트 */}
                <div className="flex items-center justify-center">
                  <RadarChart
                    userScores={userScores}
                    requirements={requirements}
                    size={280}
                    showLabels={true}
                    showValues={true}
                    userColor="#3B82F6"
                    requirementColor="#EF4444"
                  />
                </div>

                {/* 축별 상세 분석 */}
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">축별 충족 현황</p>
                    {Object.entries(compatibility.details).map(([axis, detail]) => {
                      const axisLabels = {
                        GO: '성장·운영',
                        EC: '수익성',
                        PT: '제품·기술',
                        PF: '재무·인력',
                        TO: '팀·조직'
                      };
                      return (
                        <div key={axis} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <span className="text-sm text-gray-600">{axisLabels[axis as keyof typeof axisLabels]}</span>
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-medium ${detail.isMet ? 'text-green-600' : 'text-red-600'}`}>
                              {detail.userScore} / {detail.required}
                            </span>
                            {detail.isMet ? (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">충족</span>
                            ) : (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">미달</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-700 mb-1">📊 분석 결과</p>
                    <p className="text-sm text-blue-900">
                      5개 축 중 <span className="font-bold">{compatibility.meetCount}개</span>가 요구 수준을 충족합니다.
                      {compatibility.meetCount >= 4 ? ' 지원 가능성이 높습니다!' :
                       compatibility.meetCount >= 3 ? ' 준비 후 지원을 고려해보세요.' :
                       ' 더 많은 준비가 필요합니다.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 핵심 포커스 영역 */}
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-sm font-medium text-gray-700 mb-2">이 프로그램의 핵심 평가 영역</p>
                <div className="flex flex-wrap gap-2">
                  {eventRequirements.focusAreas.map((area, index) => (
                    <span key={index} className="px-3 py-1 bg-white text-blue-700 rounded-full text-sm font-medium border border-blue-300">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Primary Fields */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">핵심 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderPrimaryFields()}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">프로그램 소개</h3>
              <p className="text-gray-700 leading-relaxed">{event.description}</p>
            </div>

            {/* Keywords */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">관련 키워드</h3>
              <div className="flex flex-wrap gap-2">
                {event.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* Recommended Actions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">지금 준비해야 할 것</h3>
              {renderRecommendedActions()}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <p>마감까지 <span className="font-semibold">D-{getDaysUntilDeadline(event.applicationEndDate)}</span></p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  나중에 하기
                </button>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                  {config.actionButtonText}
                  <ExternalLink className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventOverlay;