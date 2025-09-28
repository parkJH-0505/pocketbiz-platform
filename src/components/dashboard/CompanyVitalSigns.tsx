/**
 * Company Vital Signs Component (v2.0)
 *
 * 포켓비즈 KPI 생체신호 대시보드 - 간소화된 핵심 정보 패널
 *
 * 주요 기능:
 * - 실시간 KPI 건강 상태 모니터링
 * - 동적 맞춤형 개선 제안 (NBA)
 * - 클러스터별 벤치마킹
 * - 원클릭 액션 연결
 *
 * @version 2.0.0
 * @author PocketBiz Team
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCw,
  Activity,
  Clock,
  AlertTriangle,
  MapPin,
  ChevronDown,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useKPIDiagnosis } from '../../contexts/KPIDiagnosisContext';
import { useBuildupContext } from '../../contexts/BuildupContext';
import { useCluster } from '../../contexts/ClusterContext';
import { useNavigate } from 'react-router-dom';
import type { AxisKey } from '../../types';
import type { BuildupService } from '../../types/buildup.types';

interface CompanyVitalSignsProps {
  className?: string;
}

// 축별 라벨 매핑 (사용자 친화적)
const AXIS_LABELS: Record<AxisKey, string> = {
  GO: '사업목표',
  EC: '효율역량',
  PT: '제품기술',
  PF: '성과실적',
  TO: '팀조직'
};

// 섹터 라벨 매핑
const SECTOR_LABELS: Record<string, string> = {
  'S1': 'IT·플랫폼/SaaS',
  'S2': '제조·하드웨어·산업기술',
  'S3': '브랜드·커머스(D2C)',
  'S4': '바이오·헬스케어',
  'S5': '크리에이티브·미디어·서비스'
};

// 성장단계 라벨 매핑
const STAGE_LABELS: Record<string, string> = {
  'A1': '예비창업자',
  'A2': '초기 창업',
  'A3': 'PMF 검증',
  'A4': 'Pre-A',
  'A5': 'Series A+'
};

// 동적 상태 판단 함수들
const getHealthStatus = (score: number): { label: string; color: string; bgColor: string; message: string } => {
  if (score >= 85) return {
    label: '매우 우수',
    color: 'text-green-600',
    bgColor: 'bg-green-500',
    message: '투자 유치 준비 완료 수준입니다'
  };
  if (score >= 75) return {
    label: '양호',
    color: 'text-green-600',
    bgColor: 'bg-green-500',
    message: '꾸준한 성장세를 유지하고 있습니다'
  };
  if (score >= 60) return {
    label: '보통',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-500',
    message: '몇 가지 개선점이 필요합니다'
  };
  return {
    label: '위험',
    color: 'text-red-600',
    bgColor: 'bg-red-500',
    message: '즉시 집중 개선이 필요합니다'
  };
};

// 축별 맞춤 경고 메시지
const getAxisWarningMessage = (axis: AxisKey, stage: string): string => {
  const messages: Record<AxisKey, Record<string, string>> = {
    GO: {
      A1: '시장 규모와 성장 전략을 명확히 해야 합니다',
      A2: '고객 검증과 시장 확대 전략이 필요합니다',
      A3: '스케일업을 위한 확장 전략이 부족합니다',
      A4: '글로벌 진출 전략이 필요합니다',
      A5: 'IPO 준비를 위한 전략이 필요합니다'
    },
    EC: {
      A1: '초기 자금 조달 계획이 필요합니다',
      A2: '런웨이 관리와 수익 모델 검증이 시급합니다',
      A3: '유닛 이코노믹스 개선이 필요합니다',
      A4: '수익성 개선과 효율화가 필요합니다',
      A5: '지속가능한 수익 구조 확립이 필요합니다'
    },
    PT: {
      A1: 'MVP 개발이 시급합니다',
      A2: '제품 완성도를 높여야 합니다',
      A3: '기술 차별화가 필요합니다',
      A4: '기술 고도화와 특허 확보가 필요합니다',
      A5: '차세대 기술 개발이 필요합니다'
    },
    PF: {
      A1: '시장 적합성 검증이 필요합니다',
      A2: '초기 고객 확보가 시급합니다',
      A3: '고객 만족도 개선이 필요합니다',
      A4: '시장 점유율 확대가 필요합니다',
      A5: '시장 리더십 확보가 필요합니다'
    },
    TO: {
      A1: '핵심 팀 구성이 필요합니다',
      A2: '조직 체계 구축이 필요합니다',
      A3: '전문 인력 확보가 필요합니다',
      A4: '조직 문화 확립이 필요합니다',
      A5: '글로벌 인재 확보가 필요합니다'
    }
  };
  return messages[axis]?.[stage] || '개선이 필요한 영역입니다';
};

// 진단 상태 체크
const getAssessmentStatus = (lastDate: string | null) => {
  if (!lastDate) return {
    status: 'never',
    message: '첫 KPI 진단을 진행해주세요',
    urgent: true,
    daysAgo: null
  };

  const daysSince = Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));

  if (daysSince === 0) return {
    status: 'today',
    message: '오늘',
    urgent: false,
    daysAgo: 0
  };
  if (daysSince < 7) return {
    status: 'fresh',
    message: `${daysSince}일 전`,
    urgent: false,
    daysAgo: daysSince
  };
  if (daysSince < 30) return {
    status: 'good',
    message: `${daysSince}일 전`,
    urgent: false,
    daysAgo: daysSince,
    nextCheck: 30 - daysSince
  };
  return {
    status: 'outdated',
    message: `${daysSince}일 전`,
    urgent: true,
    daysAgo: daysSince
  };
};

const CompanyVitalSigns: React.FC<CompanyVitalSignsProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [lastAssessmentDate, setLastAssessmentDate] = useState<string | null>(null);

  // Context 데이터 가져오기
  const { axisScores, overallScore, previousScores, progress } = useKPIDiagnosis();
  const { getRecommendedServices, services } = useBuildupContext();
  const { cluster } = useCluster();

  // localStorage에서 마지막 진단일 가져오기
  useEffect(() => {
    const storedDate = localStorage.getItem('lastKPIAssessmentDate');
    setLastAssessmentDate(storedDate);
  }, []);

  // 가장 취약한 축 찾기
  const weakestAxis = useMemo(() => {
    if (!axisScores || Object.keys(axisScores).length === 0) {
      return { axis: 'GO' as AxisKey, score: 0 };
    }

    const axes = Object.entries(axisScores) as [AxisKey, number][];
    return axes.reduce((min, [axis, score]) =>
      score < min.score ? { axis, score } : min,
      { axis: axes[0][0], score: axes[0][1] }
    );
  }, [axisScores]);

  // 전체 점수 변화 계산
  const overallChange = useMemo(() => {
    const currentAvg = overallScore || 0;
    const previousAvg = Object.values(previousScores).reduce((sum, score) => sum + (score || 0), 0) / 5;
    return currentAvg - previousAvg;
  }, [overallScore, previousScores]);

  // 점수 변화 계산
  const scoreChanges = useMemo(() => {
    const changes: Record<AxisKey, number> = {} as Record<AxisKey, number>;
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

    axes.forEach(axis => {
      const current = axisScores[axis] || 0;
      const previous = previousScores[axis] || 0;
      changes[axis] = current - previous;
    });

    return changes;
  }, [axisScores, previousScores]);

  // NBA 추천 서비스 가져오기
  const recommendedService = useMemo(() => {
    if (!weakestAxis || weakestAxis.score >= 70) return null;
    if (!axisScores || Object.keys(axisScores).length === 0) return null;

    try {
      const recommendations = getRecommendedServices(axisScores);
      if (!recommendations || recommendations.length === 0) return null;

      // 가장 효과적인 서비스 선택 (취약 축 타겟 + 개선도 높은 순)
      const targetedServices = recommendations.filter((service: BuildupService) => {
        // 방어 코드: target_axis가 없는 경우 처리
        if (!service.target_axis || !Array.isArray(service.target_axis)) {
          return false;
        }
        return service.target_axis.includes(weakestAxis.axis);
      });

      return targetedServices[0] || recommendations[0];
    } catch (error) {
      console.error('NBA 추천 서비스 가져오기 오류:', error);
      return null;
    }
  }, [weakestAxis, axisScores, getRecommendedServices]);

  // 진단 상태 정보
  const assessmentStatus = useMemo(() => {
    return getAssessmentStatus(lastAssessmentDate);
  }, [lastAssessmentDate]);

  // 건강 상태 정보
  const healthStatus = useMemo(() => {
    return getHealthStatus(overallScore || 0);
  }, [overallScore]);

  // 섹터와 스테이지 라벨 가져오기
  const getSectorLabel = useCallback((sector: string): string => {
    return SECTOR_LABELS[sector] || sector;
  }, []);

  const getStageLabel = useCallback((stage: string): string => {
    return STAGE_LABELS[stage] || stage;
  }, []);

  // 클러스터별 동적 벤치마크 (추후 실제 데이터로 대체)
  const getClusterBenchmark = useCallback((sector: string, stage: string) => {
    // 임시 벤치마크 데이터 - 실제로는 API나 Context에서 가져와야 함
    const benchmarks: Record<string, Record<AxisKey, number>> = {
      'S1_A1': { GO: 45, EC: 40, PT: 35, PF: 30, TO: 50 },
      'S1_A2': { GO: 60, EC: 55, PT: 65, PF: 45, TO: 60 },
      'S1_A3': { GO: 75, EC: 70, PT: 80, PF: 65, TO: 70 },
      // 기본값
      'default': { GO: 70, EC: 70, PT: 70, PF: 70, TO: 70 }
    };
    const key = `${sector}_${stage}`;
    return benchmarks[key] || benchmarks['default'];
  }, []);

  const clusterBenchmark = useMemo(() => {
    if (!cluster?.sector || !cluster?.stage) return null;
    return getClusterBenchmark(cluster.sector, cluster.stage);
  }, [cluster, getClusterBenchmark]);

  return (
    <div className={`${className} max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100`}>

      {/* 섹션 1: 종합 건강 체크 */}
      <div className={`p-4 rounded-xl mb-4 bg-gradient-to-r ${
        healthStatus.bgColor === 'bg-green-500' ? 'from-green-50 to-emerald-50' :
        healthStatus.bgColor === 'bg-yellow-500' ? 'from-yellow-50 to-amber-50' :
        'from-red-50 to-pink-50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 상태 인디케이터 */}
            <div className="relative">
              <div className={`w-12 h-12 rounded-full ${healthStatus.bgColor} flex items-center justify-center shadow-lg`}>
                <span className="text-white font-bold text-lg">
                  {Math.round(overallScore || 0)}
                </span>
              </div>
              {overallChange !== 0 && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-md">
                  {overallChange >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-600" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-600" />
                  )}
                </div>
              )}
            </div>

            <div>
              <h3 className={`font-bold text-gray-900`}>
                {healthStatus.label}
              </h3>
              <p className="text-sm text-gray-600">
                지난달 대비 {overallChange >= 0 ? '+' : ''}{Math.round(overallChange)}점
              </p>
            </div>
          </div>

          {/* 업데이트 알림 */}
          {assessmentStatus && (
            <div className="text-right">
              <p className="text-xs text-gray-500">마지막 진단</p>
              <p className="text-sm font-medium text-gray-700">
                {assessmentStatus.message}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 섹션 2: 핵심 이슈 & NBA */}
      <div className="space-y-4 mb-4">
        {/* 현재 위치 - 실제 클러스터 데이터 */}
        {cluster && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
            <MapPin className="w-4 h-4 text-blue-600" />
            <div className="flex items-center gap-3">
              <div>
                <span className="text-xs text-gray-600">섹터</span>
                <p className="text-sm font-bold">{getSectorLabel(cluster.sector)}</p>
              </div>
              <div className="h-4 w-px bg-blue-300" />
              <div>
                <span className="text-xs text-gray-600">성장단계</span>
                <p className="text-sm font-bold">{getStageLabel(cluster.stage)}</p>
              </div>
            </div>
          </div>
        )}

        {/* 취약 축 경고 */}
        {weakestAxis && weakestAxis.score < 70 && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-gray-900">
                  {AXIS_LABELS[weakestAxis.axis]} 개선 시급
                </h4>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-2xl font-bold text-red-600">
                    {Math.round(weakestAxis.score)}점
                  </span>
                  {clusterBenchmark && (
                    <span className="text-sm text-gray-600">
                      동종업계 평균 대비 -{(clusterBenchmark[weakestAxis.axis] - weakestAxis.score).toFixed(0)}점
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 mt-2">
                  {getAxisWarningMessage(weakestAxis.axis, cluster?.stage || 'A2')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* NBA 추천 */}
        {recommendedService && (
          <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                💊 맞춤 처방
              </span>
              {recommendedService.is_hot && (
                <span className="text-xs text-red-600 font-medium">
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  HOT
                </span>
              )}
            </div>

            <h4 className="font-bold text-gray-900 mb-2">{recommendedService.name}</h4>
            <p className="text-sm text-gray-600 mb-3">{recommendedService.subtitle}</p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-white/70 rounded-lg p-2">
                <p className="text-xs text-gray-600">예상 개선</p>
                <p className="text-sm font-bold text-green-600">
                  {recommendedService.target_axis && recommendedService.target_axis[0]
                    ? `${AXIS_LABELS[recommendedService.target_axis[0]]} +${recommendedService.expected_improvement || 0}점`
                    : `+${recommendedService.expected_improvement || 0}점 개선`}
                </p>
              </div>
              <div className="bg-white/70 rounded-lg p-2">
                <p className="text-xs text-gray-600">투자 비용</p>
                <p className="text-sm font-bold text-gray-900">
                  {((recommendedService.base_price || 0) / 10000).toFixed(0)}만원
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
              <span>⏱️ {recommendedService.duration?.display || `${recommendedService.duration?.weeks || 4}주`} 소요</span>
              <span>✅ 평점 {(recommendedService.avg_rating || 4.5).toFixed(1)}점 ({recommendedService.review_count || 0}개)</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/startup/buildup/catalog?service=${recommendedService.service_id}`)}
                className="flex-1 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                지금 신청하기
              </button>
              <button
                onClick={() => navigate('/startup/buildup/catalog')}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                다른 옵션
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 섹션 3: 5축 상세 점수 (Collapsible) */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
        <button
          onClick={() => setExpandedSection(expandedSection === '5axis' ? null : '5axis')}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-gray-600" />
            5축 점수 상세
          </h3>
          <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${
            expandedSection === '5axis' ? 'rotate-180' : ''
          }`} />
        </button>

        {expandedSection === '5axis' && (
          <div className="p-4 border-t border-gray-200 space-y-3">
            {(['GO', 'EC', 'PT', 'PF', 'TO'] as AxisKey[]).map(axis => {
              const score = axisScores[axis] || 0;
              const change = scoreChanges[axis] || 0;
              const benchmark = clusterBenchmark?.[axis] || 70;
              const gapFromBenchmark = score - benchmark;

              return (
                <div key={axis} className="flex items-center gap-3">
                  {/* 축 라벨 */}
                  <span className="w-24 text-sm font-medium text-gray-700">
                    {AXIS_LABELS[axis]}
                  </span>

                  {/* 프로그레스 바 */}
                  <div className="flex-1 relative">
                    <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-700 ${
                          score >= 75 ? 'bg-green-500' :
                          score >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(score, 100)}%` }}
                      />
                    </div>
                    {/* 벤치마크 라인 */}
                    {clusterBenchmark && (
                      <div
                        className="absolute top-0 h-6 w-0.5 bg-gray-800 opacity-40"
                        style={{ left: `${benchmark}%` }}
                        title={`동종업계 평균: ${benchmark}점`}
                      />
                    )}
                  </div>

                  {/* 점수 */}
                  <span className="w-12 text-sm font-bold text-right">
                    {score.toFixed(0)}
                  </span>

                  {/* 변화량 */}
                  <span className={`w-14 text-xs text-right ${
                    change > 0 ? 'text-green-600' :
                    change < 0 ? 'text-red-600' :
                    'text-gray-400'
                  }`}>
                    {change > 0 ? '+' : ''}{Math.round(change)}
                  </span>

                  {/* 벤치마크 겝 */}
                  {clusterBenchmark && (
                    <span className={`w-14 text-xs text-right ${
                      gapFromBenchmark >= 0 ? 'text-blue-600' : 'text-orange-600'
                    }`}>
                      {gapFromBenchmark >= 0 ? '+' : ''}{gapFromBenchmark.toFixed(0)}
                    </span>
                  )}
                </div>
              );
            })}

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                * 벤치마크: {cluster ? `${getSectorLabel(cluster.sector)} × ${getStageLabel(cluster.stage)}` : '동종업계'} 평균
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 섹션 4: KPI 관리 */}
      <div className="space-y-3">
        {/* 진단 상태 카드 */}
        <div className={`p-3 rounded-lg flex items-center justify-between ${
          assessmentStatus.urgent ? 'bg-amber-50' : 'bg-gray-50'
        }`}>
          <div className="flex items-center gap-3">
            <Clock className={`w-5 h-5 ${
              assessmentStatus.urgent ? 'text-amber-600' : 'text-gray-600'
            }`} />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {assessmentStatus.daysAgo && assessmentStatus.daysAgo > 30 ? '정기 진단 필요' : '진단 상태 양호'}
              </p>
              <p className="text-xs text-gray-600">권장 주기: 월 1회</p>
            </div>
          </div>
          {assessmentStatus.nextCheck && (
            <span className="text-sm font-bold text-amber-600">
              D-{assessmentStatus.nextCheck}
            </span>
          )}
        </div>

        {/* 액션 버튼들 */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate('/startup/kpi?tab=assess')}
            className="flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            KPI 업데이트
          </button>
          <button
            onClick={() => navigate('/startup/kpi?tab=results')}
            className="flex items-center justify-center gap-2 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            결과 분석
          </button>
        </div>

        {/* 빠른 지표 확인 */}
        {!weakestAxis && overallScore >= 85 && (
          <div className="mt-3 p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <ArrowRight className="w-4 h-4" />
              <span className="text-sm font-medium">
                모든 지표가 우수합니다. 시리즈 A 투자 유치를 고려해보세요!
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyVitalSigns;