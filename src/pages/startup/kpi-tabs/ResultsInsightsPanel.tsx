/**
 * 결과 & 인사이트 통합 패널
 * ResultsPanel + AnalysisPanel + BenchmarkPanel 통합
 * Created: 2025-01-11
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Zap,
  Activity,
  Sparkles,
  Save,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardBody } from '../../../components/common/Card';
import { RadarChart } from '../../../components/charts/RadarChart';
import { useKPIDiagnosis } from '../../../contexts/KPIDiagnosisContext';
import { useCluster } from '../../../contexts/ClusterContext';
import { getMonthlyTrend, getAxisChanges, saveDiagnosticSnapshot, getHistory } from '../../../utils/diagnosticHistory';
import { getPeerData, calculatePercentile, submitAnonymousDiagnostic, type PeerData } from '../../../utils/peerAnalytics';
import { detectRisks, getTopRisks, getRiskSummary, getRiskColor } from '../../../utils/riskDetection';
import type { AxisKey } from '../../../types';

const ResultsInsightsPanel = () => {
  const { cluster } = useCluster();
  const {
    axisScores,
    overallScore,
    previousScores,
    progress,
    responses
  } = useKPIDiagnosis();

  const [showTooltip, setShowTooltip] = useState(true);
  const [isLaunching, setIsLaunching] = useState(false);
  const [targetPosition, setTargetPosition] = useState({ top: 120, left: window.innerWidth / 2 + 200 });
  const [showSmoke, setShowSmoke] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [peerData, setPeerData] = useState<PeerData | null>(null);
  const [isLoadingPeer, setIsLoadingPeer] = useState(true);
  const [expandedStrength, setExpandedStrength] = useState<string | null>(null);
  const [expandedWeakness, setExpandedWeakness] = useState<string | null>(null);
  
  // 주간 변화 계산 (이전 진단과 비교)
  const weeklyChange = useMemo(() => {
    if (!previousScores || Object.keys(previousScores).length === 0) return 0;
    const prevAvg = Object.values(previousScores).reduce((sum, score) => sum + score, 0) / 5;
    return prevAvg > 0 ? overallScore - prevAvg : 0;
  }, [overallScore, previousScores]);

  // 월간 트렌드 데이터
  const monthlyTrend = useMemo(() => {
    const trend = getMonthlyTrend();
    console.log('트렌드 데이터:', trend);
    return trend;
  }, [saveMessage]); // saveMessage가 변경될 때(저장 후) 업데이트
  
  // 축별 변화 데이터
  const axisChanges = useMemo(() => getAxisChanges(), []);

  // 트렌드 변화 원인 분석
  const trendChanges = useMemo(() => {
    if (!previousScores || Object.keys(previousScores).length === 0) {
      return [];
    }

    // 이전 진단 데이터 가져오기 (가장 최근 것)
    const history = getHistory();
    const previousDiagnostic = history.length > 1 ? history[history.length - 2] : null;

    // kpis가 정의되지 않았으므로 빈 배열 반환
    // TODO: analyzeTrendChanges 함수가 필요한 경우 적절한 kpis 데이터 구조 정의 필요
    return [];
  }, [axisScores, previousScores, responses]);

  // 핵심 트렌드 인사이트
  const trendInsights = useMemo(() => {
    // getKeyTrendInsights 함수가 정의되지 않았으므로 기본값 반환
    // TODO: 트렌드 인사이트 분석 로직 구현 필요
    return {
      keyMessage: null,
      overallTrend: 'stable' as 'improving' | 'declining' | 'stable',
      biggestImprovement: null,
      biggestDecline: null
    };
  }, [trendChanges]);

  // 위험 감지
  const risks = useMemo(() => {
    return detectRisks(axisScores, overallScore, previousScores, monthlyTrend);
  }, [axisScores, overallScore, previousScores, monthlyTrend]);

  const topRisks = useMemo(() => getTopRisks(risks, 3), [risks]);
  const riskSummary = useMemo(() => getRiskSummary(risks), [risks]);

  // 피어 데이터 로드
  useEffect(() => {
    const loadPeerData = async () => {
      setIsLoadingPeer(true);
      try {
        const data = await getPeerData(cluster);
        setPeerData(data);
        console.log('📊 피어 데이터 로드:', data.isRealData ? '실제 데이터' : '참고용 데이터', data.sampleSize + '개');
      } catch (error) {
        console.error('피어 데이터 로드 실패:', error);
        // 에러 시 폴백 데이터 사용
        setPeerData(null);
      } finally {
        setIsLoadingPeer(false);
      }
    };

    if (cluster) {
      loadPeerData();
    }
  }, [cluster]);

  // 디버깅: axisScores 확인
  useEffect(() => {
    console.log('ResultsInsightsPanel - axisScores:', axisScores);
    console.log('ResultsInsightsPanel - overallScore:', overallScore);
    console.log('ResultsInsightsPanel - responses:', responses);
    console.log('ResultsInsightsPanel - progress:', progress);

    // localStorage 확인
    const savedResponses = localStorage.getItem('pocketbiz_kpi_responses');
    console.log('localStorage responses:', savedResponses ? JSON.parse(savedResponses) : 'No saved responses');
  }, [axisScores, overallScore, responses, progress]);

  // 축 정의
  const axes = [
    { key: 'GO', label: 'Growth & Ops', color: '#9333ea', description: '성장·운영', fullName: '성장·운영' },
    { key: 'EC', label: 'Economics', color: '#10b981', description: '경제성·자본', fullName: '경제성·자본' },
    { key: 'PT', label: 'Product & Tech', color: '#f97316', description: '제품·기술력', fullName: '제품·기술력' },
    { key: 'PF', label: 'Proof', color: '#3b82f6', description: '증빙·딜레디', fullName: '증빙·딜레디' },
    { key: 'TO', label: 'Team & Org', color: '#ef4444', description: '팀·조직 역량', fullName: '팀·조직 역량' }
  ];

  // 축 라벨 헬퍼 함수
  const getAxisLabel = (axis: AxisKey): string => {
    const found = axes.find(a => a.key === axis);
    return found ? found.fullName : axis;
  };

  // 피어 평균 데이터 (실제 또는 폴백)
  const peerAverage = useMemo(() => {
    if (peerData) {
      return peerData.averages;
    }
    // 폴백 데이터
    return {
      GO: 65,
      EC: 62,
      PT: 68,
      PF: 63,
      TO: 66
    };
  }, [peerData]);

  // 다음 단계 정보
  const getNextStage = () => {
    const currentStageNum = parseInt(cluster.stage.split('-')[1]);
    if (currentStageNum >= 5) return 'Exit';
    return `A-${currentStageNum + 1}`;
  };

  // 다음 단계까지 필요한 점수
  const getPointsToNextStage = () => {
    const stageThresholds: Record<string, number> = {
      'A-1': 60,
      'A-2': 70,
      'A-3': 75,
      'A-4': 80,
      'A-5': 85
    };
    const nextStage = getNextStage();
    if (nextStage === 'Exit') return '0.0';
    const threshold = stageThresholds[nextStage] || 80;
    const pointsNeeded = Math.max(0, threshold - overallScore);
    return pointsNeeded.toFixed(1);
  };

  // Top 3 강점 분석 with KPI breakdown
  const strengths = useMemo(() => {
    return Object.entries(axisScores)
      .filter(([_, score]) => score > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([axis, score]) => {
        const axisInfo = axes.find(a => a.key === axis);
        const diff = score - peerAverage[axis as AxisKey];

        // KPI 분석 추가
        const axisKPIs: any[] = [];
        const breakdown = null;
        const reasons: any[] = [];

        return {
          axis: axis as AxisKey,
          label: axisInfo?.fullName || axis,
          score: Math.round(score),
          diff: diff > 0 ? `+${Math.round(diff)}` : `${Math.round(diff)}`,
          color: axisInfo?.color || '#666',
          breakdown,
          reasons,
          topKPIs: breakdown ? breakdown.topContributors.slice(0, 3) : []
        };
      });
  }, [axisScores, responses]);

  // Top 3 약점 분석 with KPI breakdown
  const weaknesses = useMemo(() => {
    return Object.entries(axisScores)
      .filter(([_, score]) => score > 0)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 3)
      .map(([axis, score]) => {
        const axisInfo = axes.find(a => a.key === axis);
        const improvement = Math.min(20, 100 - score); // 최대 20점 개선 가능

        // KPI 분석 추가
        const axisKPIs: any[] = [];
        const breakdown = null;
        const reasons: any[] = [];

        return {
          axis: axis as AxisKey,
          label: axisInfo?.fullName || axis,
          score: Math.round(score),
          potential: Math.round(score + improvement),
          improvement: `+${improvement}`,
          color: axisInfo?.color || '#666',
          breakdown,
          reasons,
          bottomKPIs: breakdown ? breakdown.bottomContributors.slice(0, 3) : []
        };
      });
  }, [axisScores, responses]);

  // 레이더 차트 데이터
  const radarData = axes.map(axis => ({
    axis: axis.label,
    value: axisScores[axis.key as AxisKey] || 0,
    fullMark: 100
  }));

  const peerRadarData = axes.map(axis => ({
    axis: axis.label,
    value: peerAverage[axis.key as AxisKey] || 0,
    fullMark: 100
  }));

  // 진단 결과 저장 함수
  const handleSaveDiagnostic = () => {
    // 이미 오늘 저장한 진단이 있는지 확인
    const history = getHistory();
    console.log('현재 저장된 진단 개수:', history.length);
    console.log('히스토리:', history);
    
    const today = new Date().toDateString();
    const todayCount = history.filter(h => 
      new Date(h.timestamp).toDateString() === today
    ).length;
    
    if (todayCount > 0) {
      const confirmSave = window.confirm(
        `오늘 이미 ${todayCount}개의 진단 결과가 저장되어 있습니다.\n새로운 진단으로 저장하시겠습니까?`
      );
      if (!confirmSave) return;
    }
    
    setIsSaving(true);
    
    try {
      // 진단 결과 저장 (고유한 타임스탬프로 구분)
      saveDiagnosticSnapshot(
        cluster,
        axisScores,
        overallScore,
        responses,
        progress?.percentage || 0
      );
      
      setSaveMessage('진단 결과가 성공적으로 저장되었습니다!');

      // 익명 진단 데이터 제출 (피어 분석용)
      submitAnonymousDiagnostic(cluster, axisScores, overallScore);

      // 3초 후 메시지 제거
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (error) {
      console.error('진단 저장 실패:', error);
      setSaveMessage('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 개선 잠재력 계산
  const improvementPotential = useMemo(() => {
    return axes.map(axis => {
      const currentScore = axisScores[axis.key as AxisKey] || 0;
      const maxPotential = Math.min(currentScore + 25, 100); // 최대 25점 개선
      const effortLevel = currentScore < 50 ? 'High' : currentScore < 70 ? 'Medium' : 'Low';
      const timeframe = effortLevel === 'High' ? '3개월' : effortLevel === 'Medium' ? '2개월' : '1개월';
      
      return {
        axis: axis.key as AxisKey,
        label: axis.fullName,
        current: Math.round(currentScore),
        potential: Math.round(maxPotential),
        improvement: Math.round(maxPotential - currentScore),
        effortLevel,
        timeframe,
        color: axis.color
      };
    }).sort((a, b) => b.improvement - a.improvement);
  }, [axisScores]);

  return (
    <>
    <div className="space-y-6">
      {/* 저장 버튼 및 메시지 */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-neutral-dark">진단 결과 리포트</h2>
        <div className="flex items-center gap-4">
          {/* 저장 메시지 */}
          <AnimatePresence>
            {saveMessage && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  saveMessage.includes('오류') 
                    ? 'bg-error-light text-error-main' 
                    : 'bg-success-light text-success-main'
                }`}
              >
                {saveMessage}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* 저장 버튼 */}
          <motion.button
            onClick={handleSaveDiagnostic}
            disabled={isSaving || progress?.percentage < 50}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              isSaving || progress?.percentage < 50
                ? 'bg-neutral-light text-neutral-gray cursor-not-allowed'
                : 'bg-primary-main text-white hover:bg-primary-dark shadow-md hover:shadow-lg'
            }`}
          >
            <Save size={18} />
            {isSaving ? '저장 중...' : '진단 결과 저장'}
          </motion.button>
        </div>
      </div>
      
      {/* 진도율이 낮을 때 경고 메시지 */}
      {progress?.percentage < 50 && (
        <div className="bg-warning-light border border-warning-main rounded-lg p-4">
          <p className="text-sm text-warning-dark">
            ⚠️ 진단 완료율이 50% 미만입니다. 더 정확한 결과를 위해 추가 진단을 완료해주세요.
          </p>
        </div>
      )}

      {/* 위험 알림 시스템 */}
      {topRisks.length > 0 && progress?.percentage >= 50 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="text-red-500" size={20} />
            <h3 className="font-semibold text-red-800">위험 신호 감지</h3>
            <span className="text-sm text-red-600 ml-auto">{riskSummary}</span>
          </div>

          <div className="space-y-2">
            {topRisks.map((risk, idx) => (
              <div
                key={risk.id}
                className="flex items-start gap-3 p-3 bg-white rounded-lg border-l-4"
                style={{ borderLeftColor: getRiskColor(risk.level) }}
              >
                <div className="flex-shrink-0">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: getRiskColor(risk.level) }}
                  >
                    {idx + 1}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-neutral-dark text-sm">
                      {risk.title}
                    </h4>
                    {risk.axis && (
                      <span className="px-2 py-1 text-xs bg-neutral-light rounded-full text-neutral-gray">
                        {getAxisLabel(risk.axis)}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-neutral-gray mb-2">
                    {risk.message}
                  </p>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-blue-600 font-medium">
                      💡 {risk.recommendation}
                    </p>

                    {risk.metric && (
                      <div className="flex items-center gap-1 text-xs text-neutral-gray">
                        <span>{Math.round(risk.metric.current)}</span>
                        {risk.metric.trend === 'worsening' && (
                          <>
                            <TrendingDown size={12} className="text-red-500" />
                            <span className="text-red-500">
                              {Math.round(risk.metric.threshold)}
                            </span>
                          </>
                        )}
                        {!risk.metric.trend && (
                          <>
                            <span className="text-neutral-gray">/</span>
                            <span className="font-medium">
                              {Math.round(risk.metric.threshold)}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {risks.length > 3 && (
            <div className="mt-3 text-center">
              <span className="text-sm text-neutral-gray">
                +{risks.length - 3}개 추가 위험 요소 발견
              </span>
            </div>
          )}
        </div>
      )}

      {/* 상단: 핵심 지표 - 컴팩트 디자인 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 종합 점수 - 상대적 위치 추가 */}
        <Card>
          <CardBody className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <Award className="text-primary-main" size={24} />
                <div>
                  <p className="text-xs text-neutral-gray">종합 점수</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-primary-main">
                      {Math.round(overallScore)}
                    </span>
                    <span className="text-sm text-neutral-gray">점</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    {weeklyChange > 0 ? (
                      <>
                        <TrendingUp className="text-success-main" size={12} />
                        <span className="text-success-main">+{weeklyChange.toFixed(1)}</span>
                      </>
                    ) : weeklyChange < 0 ? (
                      <>
                        <TrendingDown className="text-error-main" size={12} />
                        <span className="text-error-main">{weeklyChange.toFixed(1)}</span>
                      </>
                    ) : (
                      <span className="text-neutral-gray">-</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 상대적 위치 표시 */}
              {peerData && (
                <div className="text-right">
                  <p className="text-xs text-neutral-gray mb-1">내 위치</p>
                  <div className="text-lg font-bold text-blue-600">
                    상위 {calculatePercentile(overallScore, peerData)}%
                  </div>
                  <div className="text-xs text-neutral-gray">
                    {peerData.sampleSize > 0 ? `${peerData.sampleSize}개 기업 중` : '비교 그룹'}
                  </div>
                </div>
              )}
            </div>

            {/* 미니 분포 막대 */}
            {peerData && (
              <div className="mt-3 relative">
                <div className="h-2 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-full relative">
                  <div
                    className="absolute w-3 h-3 bg-primary-main rounded-full border-2 border-white shadow-md"
                    style={{
                      left: `${Math.min(95, Math.max(5, (overallScore / 100) * 100))}%`,
                      top: '-2px'
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-neutral-gray mt-1">
                  <span>0</span>
                  <span>{Math.round(peerData.median.GO || 65)}</span>
                  <span>100</span>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* 현재 단계 */}
        <Card>
          <CardBody className="text-center p-4">
            <div className="flex items-center justify-center gap-3">
              <BarChart3 className="text-secondary-main" size={24} />
              <div className="text-left">
                <p className="text-xs text-neutral-gray">현재 단계</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-secondary-main">
                    {cluster.stage}
                  </span>
                </div>
                <p className="text-xs text-neutral-gray">
                  스타트업 / 일반
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 다음 단계까지 */}
        <Card>
          <CardBody className="text-center p-4">
            <div className="flex items-center justify-center gap-3">
              <Target className="text-accent-orange" size={24} />
              <div className="text-left">
                <p className="text-xs text-neutral-gray">다음 단계까지</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-neutral-dark">
                    {getPointsToNextStage()}
                  </span>
                  <span className="text-sm text-neutral-gray">점</span>
                </div>
                <p className="text-xs text-neutral-gray">
                  {cluster.stage} → {getNextStage()}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 중단: 시각화 & 포지셔닝 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 레이더 차트 */}
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-neutral-dark mb-4">5축 평가 결과</h3>
            <div className="h-80">
              <RadarChart
                data={radarData}
                compareData={peerRadarData}
                showComparison={true}
              />
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary-main rounded-full"></div>
                <span className="text-sm text-neutral-gray">우리 회사</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-neutral-gray rounded-full opacity-50"></div>
                <span className="text-sm text-neutral-gray">피어 평균</span>
              </div>
            </div>

            {/* 데이터 신뢰도 표시 */}
            {peerData && (
              <div className="flex justify-center mt-2">
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs ${
                  peerData.isRealData
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {peerData.isRealData ? (
                    <>
                      <CheckCircle size={12} />
                      실제 {peerData.sampleSize}개 기업 데이터 기반
                    </>
                  ) : (
                    <>
                      <AlertCircle size={12} />
                      참고용 평균값 (데이터 수집중)
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* 축별 점수 및 변화 표시 */}
            <div className="mt-4 pt-4 border-t border-neutral-border">
              <p className="text-sm font-medium text-neutral-gray mb-2">
                {Object.keys(axisChanges).length > 0 ? '이전 진단 대비 변화' : '현재 점수'}
              </p>
              <div className="grid grid-cols-5 gap-2">
                {axes.map(axis => {
                  // 기본값 설정 - responses가 비어있을 때 샘플 데이터 표시
                  const defaultScores = {
                    GO: 75.3,
                    EC: 68.9,
                    PT: 82.1,
                    PF: 71.5,
                    TO: 77.6
                  };

                  const currentScore = axisScores[axis.key as AxisKey] || defaultScores[axis.key as AxisKey] || 0;
                  const change = axisChanges[axis.key as AxisKey] || 0;
                  const hasChange = Object.keys(axisChanges).length > 0;

                  return (
                    <div key={axis.key} className="text-center">
                      <div className="text-xs text-neutral-gray mb-1">{axis.label}</div>
                      <div className={`text-sm font-semibold ${
                        hasChange ? (
                          change > 0 ? 'text-success-main' :
                          change < 0 ? 'text-error-main' :
                          'text-neutral-gray'
                        ) : 'text-primary-main'
                      }`}>
                        {hasChange
                          ? `${change > 0 ? '+' : ''}${change.toFixed(1)}`
                          : currentScore.toFixed(1)
                        }
                      </div>
                      {!hasChange && (
                        <div className="text-xs text-neutral-gray mt-0.5">점</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Top 3 강점/약점 */}
        <Card>
          <CardBody>
            <div className="space-y-6">
              {/* 강점 */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-dark mb-3 flex items-center gap-2">
                  <CheckCircle className="text-success-main" size={20} />
                  강점 TOP 3
                </h3>
                <div className="space-y-2">
                  {strengths.map((item, idx) => (
                    <div key={item.axis}>
                      <div
                        className="flex items-center justify-between p-3 bg-success-light/20 rounded-lg cursor-pointer hover:bg-success-light/30 transition-colors"
                        onClick={() => setExpandedStrength(expandedStrength === item.axis ? null : item.axis)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-success-main">#{idx + 1}</span>
                          <div className="flex-1">
                            <p className="font-medium text-neutral-dark">{item.label}</p>
                            <p className="text-sm text-neutral-gray">피어 대비 {item.diff}점</p>
                            {item.reasons.length > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <CheckCircle size={12} className="text-success-main" />
                                <span className="text-xs text-success-dark">{item.reasons[0]}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-2xl font-bold" style={{ color: item.color }}>
                            {item.score}
                          </div>
                          <motion.div
                            animate={{ rotate: expandedStrength === item.axis ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown size={16} className="text-neutral-gray" />
                          </motion.div>
                        </div>
                      </div>

                      {/* KPI 세부 분석 */}
                      <AnimatePresence>
                        {expandedStrength === item.axis && item.topKPIs.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 p-3 bg-white rounded-lg border border-success-light">
                              <p className="text-sm font-semibold text-neutral-dark mb-2">
                                주요 기여 KPI
                              </p>
                              <div className="space-y-2">
                                {item.topKPIs.map((kpi, kpiIdx) => (
                                  <div key={kpi.kpiId} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      <div className="w-1 h-1 rounded-full bg-success-main" />
                                      <span className="text-neutral-dark">{kpi.kpiName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-20 h-2 bg-neutral-light rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-gradient-to-r from-success-light to-success-main"
                                          style={{ width: `${kpi.score}%` }}
                                        />
                                      </div>
                                      <span className="font-medium text-success-dark w-10 text-right">
                                        {kpi.score}점
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {item.reasons.length > 1 && (
                                <div className="mt-2 pt-2 border-t border-neutral-border">
                                  <p className="text-xs text-neutral-gray">
                                    {item.reasons.slice(1).join(' / ')}
                                  </p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

              {/* 약점 */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-dark mb-3 flex items-center gap-2">
                  <AlertCircle className="text-accent-orange" size={20} />
                  개선 필요 TOP 3
                </h3>
                <div className="space-y-2">
                  {weaknesses.map((item, idx) => (
                    <div key={item.axis}>
                      <div
                        className="flex items-center justify-between p-3 bg-accent-orange-light/20 rounded-lg cursor-pointer hover:bg-accent-orange-light/30 transition-colors"
                        onClick={() => setExpandedWeakness(expandedWeakness === item.axis ? null : item.axis)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-accent-orange">#{idx + 1}</span>
                          <div className="flex-1">
                            <p className="font-medium text-neutral-dark">{item.label}</p>
                            <p className="text-sm text-neutral-gray">개선 가능 {item.improvement}점</p>
                            {item.reasons.length > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <AlertCircle size={12} className="text-accent-orange" />
                                <span className="text-xs text-accent-orange-dark">{item.reasons[0]}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl text-neutral-gray">{item.score}</span>
                            <span className="text-sm text-neutral-gray">→</span>
                            <span className="text-xl font-bold" style={{ color: item.color }}>
                              {item.potential}
                            </span>
                          </div>
                          <motion.div
                            animate={{ rotate: expandedWeakness === item.axis ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown size={16} className="text-neutral-gray" />
                          </motion.div>
                        </div>
                      </div>

                      {/* KPI 세부 분석 */}
                      <AnimatePresence>
                        {expandedWeakness === item.axis && item.bottomKPIs.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 p-3 bg-white rounded-lg border border-accent-orange-light">
                              <p className="text-sm font-semibold text-neutral-dark mb-2">
                                개선 필요 KPI
                              </p>
                              <div className="space-y-2">
                                {item.bottomKPIs.map((kpi, kpiIdx) => (
                                  <div key={kpi.kpiId} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      <div className="w-1 h-1 rounded-full bg-accent-orange" />
                                      <span className="text-neutral-dark">{kpi.kpiName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-20 h-2 bg-neutral-light rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-gradient-to-r from-accent-orange-light to-accent-orange"
                                          style={{ width: `${kpi.score}%` }}
                                        />
                                      </div>
                                      <span className="font-medium text-accent-orange-dark w-10 text-right">
                                        {kpi.score}점
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {item.reasons.length > 1 && (
                                <div className="mt-2 pt-2 border-t border-neutral-border">
                                  <p className="text-xs text-neutral-gray">
                                    {item.reasons.slice(1).join(' / ')}
                                  </p>
                                </div>
                              )}
                              <div className="mt-2 pt-2 border-t border-neutral-border">
                                <p className="text-xs font-medium text-accent-orange-dark">
                                  💡 개선 시 예상 효과: +{item.breakdown ? Math.round(item.breakdown.averageScore * 0.2) : 10}점
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 시계열 트렌드 (라인 차트) */}
      {monthlyTrend.length > 0 && (
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-neutral-dark mb-4 flex items-center gap-2">
              <Activity className="text-primary-main" size={20} />
              성장 트렌드
            </h3>
            
            {monthlyTrend.length >= 2 ? (
              <div className="relative">
                {/* 라인 차트 영역 */}
                <div className="relative h-48 mb-4">
                  {/* Y축 가이드라인 */}
                  <div className="absolute inset-0 flex flex-col justify-between">
                    {[100, 75, 50, 25, 0].map(value => (
                      <div key={value} className="flex items-center">
                        <span className="text-xs text-neutral-gray w-8">{value}</span>
                        <div className="flex-1 border-b border-neutral-border opacity-30"></div>
                      </div>
                    ))}
                  </div>
                  
                  {/* SVG 라인 차트 */}
                  <svg className="absolute inset-0 w-full h-full" style={{ marginLeft: '32px' }}>
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    
                    {/* 영역 채우기 */}
                    <path
                      d={`
                        M ${monthlyTrend.map((month, idx) => {
                          const x = (idx / (monthlyTrend.length - 1)) * 90 + 5;
                          const y = 95 - (month.score * 0.9);
                          return `${x},${y}`;
                        }).join(' L ')}
                        L 95,95 L 5,95 Z
                      `}
                      fill="url(#trendGradient)"
                    />
                    
                    {/* 메인 라인 */}
                    <polyline
                      points={monthlyTrend.map((month, idx) => {
                        const x = (idx / (monthlyTrend.length - 1)) * 90 + 5;
                        const y = 95 - (month.score * 0.9);
                        return `${x},${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="rgb(59, 130, 246)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    
                    {/* 데이터 포인트 */}
                    {monthlyTrend.map((month, idx) => {
                      const x = (idx / (monthlyTrend.length - 1)) * 90 + 5;
                      const y = 95 - (month.score * 0.9);
                      const isLatest = idx === monthlyTrend.length - 1;
                      
                      return (
                        <g key={month.month}>
                          <circle
                            cx={x}
                            cy={y}
                            r={isLatest ? "6" : "4"}
                            fill="white"
                            stroke="rgb(59, 130, 246)"
                            strokeWidth="2"
                          />
                          {isLatest && (
                            <circle
                              cx={x}
                              cy={y}
                              r="10"
                              fill="none"
                              stroke="rgb(59, 130, 246)"
                              strokeWidth="1"
                              opacity="0.5"
                            >
                              <animate
                                attributeName="r"
                                values="10;15;10"
                                dur="2s"
                                repeatCount="indefinite"
                              />
                              <animate
                                attributeName="opacity"
                                values="0.5;0.2;0.5"
                                dur="2s"
                                repeatCount="indefinite"
                              />
                            </circle>
                          )}
                          <text
                            x={x}
                            y={y - 3}
                            textAnchor="middle"
                            className="text-xs font-bold fill-neutral-dark"
                          >
                            {month.score}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
                
                {/* X축 레이블 */}
                <div className="flex justify-between px-8 mb-4">
                  {monthlyTrend.map((month) => (
                    <div key={month.month} className="text-center">
                      <div className="text-xs text-neutral-gray">{month.month}</div>
                      {month.change !== 0 && (
                        <div className={`text-xs mt-1 flex items-center justify-center gap-1 ${
                          month.change > 0 ? 'text-success-main' : 'text-error-main'
                        }`}>
                          {month.change > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {month.change > 0 ? '+' : ''}{month.change.toFixed(1)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* 통계 요약 */}
                <div className="pt-4 border-t border-neutral-border">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-xs text-neutral-gray mb-1">평균 점수</div>
                      <div className="text-lg font-bold text-neutral-dark">
                        {(monthlyTrend.reduce((sum, m) => sum + m.score, 0) / monthlyTrend.length).toFixed(1)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-neutral-gray mb-1">최고 점수</div>
                      <div className="text-lg font-bold text-success-main">
                        {Math.max(...monthlyTrend.map(m => m.score))}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-neutral-gray mb-1">이전 대비</div>
                      <div className={`text-lg font-bold ${
                        monthlyTrend[monthlyTrend.length - 1].change > 0 ? 'text-success-main' :
                        monthlyTrend[monthlyTrend.length - 1].change < 0 ? 'text-error-main' :
                        'text-neutral-gray'
                      }`}>
                        {monthlyTrend[monthlyTrend.length - 1].change > 0 ? '+' : ''}
                        {monthlyTrend[monthlyTrend.length - 1].change.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* 트렌드 변화 원인 분석 */}
                  {trendInsights.keyMessage && (
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity size={16} className={`${
                          trendInsights.overallTrend === 'improving' ? 'text-success-main' :
                          trendInsights.overallTrend === 'declining' ? 'text-error-main' :
                          'text-neutral-gray'
                        }`} />
                        <span className="text-sm font-semibold text-neutral-dark">
                          트렌드 분석
                        </span>
                      </div>
                      <p className="text-sm text-neutral-dark mb-2">
                        {trendInsights.keyMessage}
                      </p>

                      {/* 주요 변화 상세 */}
                      <div className="space-y-1 mt-2">
                        {trendInsights.biggestImprovement && (
                          <div className="flex items-center gap-2 text-xs">
                            <TrendingUp size={12} className="text-success-main" />
                            <span className="text-success-dark">
                              {getAxisLabel(trendInsights.biggestImprovement.axis)}:
                              {' '}{trendInsights.biggestImprovement.causes.join(', ')}
                            </span>
                          </div>
                        )}
                        {trendInsights.biggestDecline && (
                          <div className="flex items-center gap-2 text-xs">
                            <TrendingDown size={12} className="text-error-main" />
                            <span className="text-error-dark">
                              {getAxisLabel(trendInsights.biggestDecline.axis)}:
                              {' '}{trendInsights.biggestDecline.causes.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="text-center p-6 bg-neutral-light rounded-lg">
                  <div className="text-sm text-neutral-gray mb-2">첫 진단 완료</div>
                  <div className="text-3xl font-bold text-neutral-dark mb-1">{monthlyTrend[0].score}점</div>
                  <div className="text-xs text-neutral-gray">{monthlyTrend[0].month}</div>
                </div>
                <p className="text-sm text-neutral-gray mt-4 text-center">
                  📊 2회 이상 진단 시 성장 트렌드 그래프가 표시됩니다
                </p>
              </>
            )}
          </CardBody>
        </Card>
      )}

      {/* 하단: 개선 잠재력 분석 */}
      <Card>
        <CardBody>
          <h3 className="text-lg font-semibold text-neutral-dark mb-4 flex items-center gap-2">
            <Zap className="text-accent-purple" size={20} />
            축별 개선 잠재력 (Quick Win 우선순위)
          </h3>
          <div className="space-y-3">
            {improvementPotential.slice(0, 3).map((item) => (
              <div key={item.axis} className="border border-neutral-border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-2 h-8 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <h4 className="font-semibold text-neutral-dark">{item.label}</h4>
                      <p className="text-sm text-neutral-gray">
                        난이도: {item.effortLevel === 'Low' ? '⭐' : item.effortLevel === 'Medium' ? '⭐⭐' : '⭐⭐⭐'} 
                        <span className="ml-2">예상 기간: {item.timeframe}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-neutral-gray">개선 가능</div>
                    <div className="text-2xl font-bold text-primary-main">+{item.improvement}점</div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="relative">
                  <div className="flex justify-between text-xs text-neutral-gray mb-1">
                    <span>현재: {item.current}점</span>
                    <span>목표: {item.potential}점</span>
                  </div>
                  <div className="w-full bg-neutral-light rounded-full h-3 overflow-hidden">
                    <div className="relative h-full">
                      {/* Current Score */}
                      <div 
                        className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${item.current}%`,
                          backgroundColor: item.color,
                          opacity: 0.7
                        }}
                      />
                      {/* Potential Score */}
                      <div 
                        className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${item.potential}%`,
                          backgroundColor: item.color,
                          opacity: 0.3
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
    
    {/* 플로팅 액션플랜 버튼과 말풍선 */}
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", bounce: 0.4 }}
      className="fixed bottom-8 right-8 z-50"
    >
      {/* 말풍선 */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            className="absolute -top-28 -left-24"
            transition={{ type: "spring", bounce: 0.3 }}
          >
            <div className="relative">
              {/* 말풍선 본체 */}
              <div className="relative bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl px-4 py-2.5 border border-blue-200 whitespace-nowrap">
                <div className="flex flex-col gap-0.5 items-center">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles size={14} className="text-yellow-500" />
                    </motion.div>
                    <span className="font-bold text-gray-800 text-xs">성장을 위해 필요한</span>
                  </div>
                  <span className="text-gray-700 text-xs">놓쳐선 안 될 개선점들</span>
                  <span className="text-primary-main font-semibold text-xs">지금 확인해보세요!</span>
                </div>
                
                {/* 닫기 버튼 */}
                <button
                  onClick={() => setShowTooltip(false)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-500 text-white rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors leading-none"
                  style={{ fontSize: '10px' }}
                >
                  ×
                </button>
              </div>
              
              {/* 말풍선 꼬리 - 오른쪽 아래를 가리킴 */}
              <div className="absolute -bottom-1.5 right-4">
                <svg width="16" height="8" viewBox="0 0 16 8">
                  <path d="M 0 0 L 8 8 L 16 0 Z" fill="rgb(239, 246, 255)" stroke="rgb(191, 219, 254)" strokeWidth="1"/>
                </svg>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 원형 로켓 버튼 */}
      <motion.button
        onClick={() => {
          if (isLaunching) return;
          
          console.log('현재 window 크기:', window.innerWidth, window.innerHeight);
          
          // 액션플랜 탭 버튼의 실제 위치 찾기
          const actionTabButton = Array.from(document.querySelectorAll('button')).find(
            btn => btn.textContent?.includes('액션플랜')
          );
          
          if (actionTabButton) {
            const rect = actionTabButton.getBoundingClientRect();
            console.log('액션플랜 탭 위치:', rect);
            // 로켓 중심(w-32 h-32 = 128px)이 버튼 중앙에 도착하도록 조정
            // 로켓 이미지의 절반 크기(64px)를 빼서 중심점 맞추기
            setTargetPosition({
              top: rect.top + rect.height / 2 - 64,
              left: rect.left + rect.width / 2 - 64
            });
          } else {
          }
          
          setIsLaunching(true);
          setShowTooltip(false);
          
          // 4초 후 연기 효과 시작
          setTimeout(() => {
            setShowSmoke(true);
          }, 4000);
          
          // 5초 후 페이지 전환 (연기가 걷힐 때)
          setTimeout(() => {
            const searchParams = new URLSearchParams(window.location.search);
            searchParams.set('tab', 'action');
            window.history.pushState({}, '', `${window.location.pathname}?${searchParams}`);
            window.dispatchEvent(new PopStateEvent('popstate'));
            setIsLaunching(false);
            setShowSmoke(false);
          }, 5000);
        }}
        whileHover={!isLaunching ? { scale: 1.1 } : {}}
        whileTap={!isLaunching ? { scale: 0.9 } : {}}
        className={`
          w-20 h-20 rounded-full
          bg-gradient-to-br ${
            overallScore < 70 
              ? 'from-orange-400 to-orange-600' 
              : overallScore < 85 
                ? 'from-blue-400 to-blue-600'
                : 'from-green-400 to-green-600'
          }
          text-white shadow-2xl transition-all duration-300
          hover:shadow-3xl
          flex items-center justify-center
          relative overflow-visible
        `}
        style={!isLaunching ? {
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
        } : {}}
      >
        {/* 로켓 이미지 */}
        {!isLaunching ? (
          <motion.div
            className="relative z-10"
            animate={{
              y: [0, -3, 0, -2, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <img 
              src="/pocketbiz-platform/rocket.png" 
              alt="Rocket"
              className="w-14 h-14 object-contain"
            />
          </motion.div>
        ) : null}
        
        {/* 점수 기반 긴급도 표시 */}
        {overallScore < 70 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-6 h-6 rounded-full animate-pulse flex items-center justify-center font-bold">
            !
          </div>
        )}
        
        {/* 반짝이는 별 효과 */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${30 + i * 20}%`,
                top: `${30 + i * 15}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            />
          ))}
        </div>
      </motion.button>
      
      {/* 호버 시 나타나는 텍스트 */}
      {!isLaunching && (
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 pointer-events-none"
        >
          <span className="text-xs text-gray-600 font-medium whitespace-nowrap">액션플랜 보기</span>
        </motion.div>
      )}
      
      {/* 발사되는 로켓 - 액션플랜 탭으로 날아감 */}
      {isLaunching && (
        <>
        {/* 디버깅: 로켓 위치 확인 */}
        <div style={{
          position: 'fixed',
          bottom: '150px',
          right: '10px',
          background: 'black',
          color: 'white',
          padding: '10px',
          zIndex: 9999,
          fontSize: '12px'
        }}>
          Target: {targetPosition.left}, {targetPosition.top}
        </div>
        
        {/* 실제 로켓 애니메이션 - 2차 곡선 경로 */}
        <motion.div
          className="fixed pointer-events-none"
          style={{ 
            zIndex: 100,
            left: 0,
            top: 0
          }}
          initial={{ 
            x: window.innerWidth - 100,
            y: window.innerHeight - 100
          }}
          animate={{
            // 매우 많은 포인트로 부드러운 2차 곡선 생성
            x: Array.from({length: 50}, (_, i) => {
              const t = i / 49;
              const startX = window.innerWidth - 100;
              const endX = targetPosition.left;
              // 부드러운 베지어 곡선: 점진적으로 가속
              const eased = t * t * (3 - 2 * t); // smoothstep function
              return startX + (endX - startX) * eased;
            }),
            y: Array.from({length: 50}, (_, i) => {
              const t = i / 49;
              const startY = window.innerHeight - 100;
              const endY = targetPosition.top;
              // 포물선 경로: 화면 내에서 움직이도록 높이 조절
              const maxHeight = Math.min(200, startY - 100); // 화면 내에서만
              return startY + (endY - startY) * t - maxHeight * 4 * t * (1 - t);
            })
          }}
          transition={{
            duration: 4.5,
            times: Array.from({length: 50}, (_, i) => {
              const t = i / 49;
              // 로켓 가속 곡선: 느리게 시작 -> 점차 가속
              return Math.pow(t, 0.7);
            }),
            ease: "linear", // 각 포인트 사이는 선형으로
            type: "tween"
          }}
        >
          {/* 로켓 회전을 위한 컨테이너 */}
          <motion.div
            className="relative"
            animate={{
              // 진행 방향을 따라가는 동적 회전 (머리가 항상 진행 방향을 향함)
              rotate: Array.from({length: 50}, (_, i) => {
                if (i === 0) return -90; // 시작은 위를 향함
                
                const t = i / 49;
                const tNext = Math.min((i + 1) / 49, 1);
                
                // 현재 위치
                const startX = window.innerWidth - 100;
                const startY = window.innerHeight - 100;
                const endX = targetPosition.left;
                const endY = targetPosition.top;
                
                // 현재 시점의 x, y
                const eased = t * t * (3 - 2 * t);
                const x = startX + (endX - startX) * eased;
                const maxHeight = Math.min(200, startY - 100);
                const y = startY + (endY - startY) * t - maxHeight * 4 * t * (1 - t);
                
                // 다음 시점의 x, y
                const easedNext = tNext * tNext * (3 - 2 * tNext);
                const xNext = startX + (endX - startX) * easedNext;
                const yNext = startY + (endY - startY) * tNext - maxHeight * 4 * tNext * (1 - tNext);
                
                // 진행 방향 각도 계산 (라디안을 도로 변환)
                const angle = Math.atan2(yNext - y, xNext - x) * 180 / Math.PI;
                
                // 로켓 이미지가 위를 향하고 있으므로 90도 보정
                return angle + 90;
              }),
              scale: Array.from({length: 50}, (_, i) => {
                const t = i / 49;
                // 크기도 점진적으로 변화
                return 1 + 0.2 * Math.sin(t * Math.PI);
              })
            }}
            transition={{
              duration: 4.5,
              times: Array.from({length: 50}, (_, i) => {
                const t = i / 49;
                return Math.pow(t, 0.7);
              }),
              ease: "linear"
            }}
            style={{
              transformOrigin: 'center center' // 로켓 중심으로 회전
            }}
          >
            <img 
              src="/pocketbiz-platform/rocket.png" 
              alt="Launching Rocket"
              className="w-32 h-32 object-contain"
              style={{ 
                filter: 'drop-shadow(0 0 30px rgba(255, 100, 0, 1)) brightness(1.2)'
              }}
            />
            
            {/* 로켓 추진 불꽃 - 지속적으로 활활 타오름 */}
            <motion.div
              className="absolute -bottom-6 left-1/2 -translate-x-1/2"
              animate={{
                scaleY: [1, 1.8, 1.3, 2, 1.5, 1.2],
                scaleX: [1, 0.8, 1.1, 0.7, 0.9, 0.8],
                opacity: [1, 0.95, 1, 0.9, 0.85, 0.95]
              }}
              transition={{
                duration: 0.15,
                repeat: Infinity,  // 무한 반복
                ease: "linear"
              }}
            >
              {/* 3층 화염 구조 */}
              <div className="relative">
                {/* 외부 화염 */}
                <motion.div 
                  className="absolute w-10 h-16 -left-3 bg-gradient-to-t from-red-600 via-orange-500 to-yellow-400 rounded-full blur-lg opacity-80"
                  animate={{
                    scaleY: [1, 1.2, 1.1, 1.3, 1],
                    scaleX: [1, 0.9, 1.1, 0.8, 1]
                  }}
                  transition={{
                    duration: 0.2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                {/* 중간 화염 */}
                <motion.div 
                  className="absolute w-6 h-12 -left-1 top-2 bg-gradient-to-t from-orange-400 via-yellow-300 to-white rounded-full blur-md opacity-90"
                  animate={{
                    scaleY: [1, 1.3, 1.1, 1.4, 1],
                    scaleX: [1, 0.8, 1.2, 0.9, 1],
                    opacity: [0.9, 1, 0.85, 1, 0.9]
                  }}
                  transition={{
                    duration: 0.18,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.05
                  }}
                />
                {/* 코어 화염 */}
                <motion.div 
                  className="absolute w-3 h-8 left-0.5 top-4 bg-gradient-to-t from-blue-400 to-white rounded-full blur-sm"
                  animate={{
                    scaleY: [1, 1.4, 1.2, 1.5, 1],
                    opacity: [1, 0.9, 1, 0.85, 1]
                  }}
                  transition={{
                    duration: 0.12,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.08
                  }}
                />
              </div>
            </motion.div>
            
            {/* 추진 연기 트레일 */}
            <motion.div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 0.5, 0.3, 0.1] }}
              transition={{ duration: 2.5 }}
            >
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-6 h-6 bg-gray-400 rounded-full"
                  animate={{
                    y: [0, 20 + i * 10],
                    x: [(i - 2) * 5, (i - 2) * 15],
                    scale: [0.5, 1 + i * 0.3],
                    opacity: [0.6, 0]
                  }}
                  transition={{
                    duration: 0.8,
                    delay: i * 0.1,
                    repeat: 3,
                    ease: "easeOut"
                  }}
                  style={{ filter: 'blur(2px)' }}
                />
              ))}
            </motion.div>
          </motion.div>
          
          {/* 속도선 효과 */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0.8, 0.4, 0] }}
            transition={{ duration: 2.5 }}
          >
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent"
                style={{
                  width: `${40 + i * 20}px`,
                  top: `${35 + i * 5}px`,
                  left: '-50px',
                  opacity: 0.6 - i * 0.2
                }}
              />
            ))}
          </motion.div>
        </motion.div>
        </>
      )}
      
      {/* 로켓 발사 연기 효과 */}
      {isLaunching && (
        <>
          {/* 대형 연기 구름들 */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={`smoke-${i}`}
              className="absolute rounded-full"
              initial={{ 
                x: 0, 
                y: 0,
                width: 30,
                height: 30
              }}
              animate={{
                x: (i % 2 === 0 ? 1 : -1) * (30 + i * 15),
                y: [0, 30, 60, 90, 120],
                width: [30, 60, 90, 120, 150],
                height: [30, 60, 90, 120, 150],
                opacity: [0.9, 0.7, 0.5, 0.3, 0]
              }}
              transition={{
                duration: 2,
                delay: i * 0.08,
                ease: "easeOut"
              }}
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                background: `radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(200,200,200,0.7) 50%, rgba(150,150,150,0.5) 100%)`,
                filter: 'blur(3px)',
                boxShadow: '0 0 20px rgba(255,255,255,0.5)'
              }}
            />
          ))}
          
          {/* 화염 분사 효과 */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 1, 0.8, 0],
              scale: [0, 2, 1.8, 1.5, 0],
              y: [0, 20, 40, 60, 80]
            }}
            transition={{
              duration: 2,
              ease: "easeOut"
            }}
          >
            <div className="relative">
              {/* 외부 화염 - 빨간색 */}
              <motion.div 
                className="absolute w-16 h-24 rounded-full"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(255,100,0,0.9) 0%, rgba(255,50,0,0.7) 40%, rgba(255,0,0,0.4) 70%, transparent 100%)',
                  filter: 'blur(4px)',
                  boxShadow: '0 0 40px rgba(255,100,0,0.8)'
                }}
                animate={{
                  scaleY: [1, 1.3, 1.1, 1.4, 1],
                  scaleX: [1, 0.8, 1.1, 0.9, 1]
                }}
                transition={{
                  duration: 0.3,
                  repeat: 6,
                  ease: "easeInOut"
                }}
              />
              {/* 중간 화염 - 주황색 */}
              <motion.div 
                className="absolute w-10 h-16 rounded-full left-3 top-2"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(255,200,0,0.9) 0%, rgba(255,150,0,0.7) 50%, transparent 100%)',
                  filter: 'blur(2px)',
                  boxShadow: '0 0 30px rgba(255,200,0,0.9)'
                }}
                animate={{
                  scaleY: [1, 1.4, 1.2, 1.5, 1],
                  scaleX: [1, 0.9, 1.2, 0.8, 1]
                }}
                transition={{
                  duration: 0.25,
                  repeat: 7,
                  ease: "easeInOut"
                }}
              />
              {/* 중심 화염 - 파란색/흰색 */}
              <motion.div 
                className="absolute w-4 h-8 rounded-full left-6 top-4"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(150,200,255,0.8) 50%, transparent 100%)',
                  filter: 'blur(1px)',
                  boxShadow: '0 0 20px rgba(150,200,255,1)'
                }}
                animate={{
                  scaleY: [1, 1.5, 1.3, 1.6, 1],
                  opacity: [1, 0.9, 1, 0.8, 1]
                }}
                transition={{
                  duration: 0.2,
                  repeat: 10,
                  ease: "easeInOut"
                }}
              />
            </div>
          </motion.div>
          
          {/* 불꽃 파티클 효과 */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full"
              initial={{
                x: 0,
                y: 0,
                opacity: 1
              }}
              animate={{
                x: (Math.random() - 0.5) * 200,
                y: [0, Math.random() * 100 + 50],
                opacity: [1, 1, 0],
                scale: [1, 1.5, 0]
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.02,
                ease: "easeOut"
              }}
              style={{
                left: '50%',
                top: '50%',
                boxShadow: '0 0 6px rgba(255,200,0,1)'
              }}
            />
          ))}
          
          {/* 발사 텍스트 및 카운트다운 효과 */}
          <motion.div
            className="absolute -top-24 left-1/2 -translate-x-1/2 pointer-events-none"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0, 1.5, 1.3, 0],
              y: [0, -20, -40, -60]
            }}
            transition={{
              duration: 2,
              ease: "easeOut"
            }}
          >
            <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500"
                 style={{ textShadow: '0 0 30px rgba(255,100,0,0.8)' }}>
              LAUNCH!
            </div>
          </motion.div>
          
          {/* 충격파 효과 */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            initial={{ width: 0, height: 0, opacity: 0 }}
            animate={{
              width: [0, 150, 300],
              height: [0, 150, 300],
              opacity: [0, 0.5, 0]
            }}
            transition={{
              duration: 1,
              ease: "easeOut"
            }}
            style={{
              border: '2px solid rgba(255,255,255,0.6)',
              borderRadius: '50%',
              boxShadow: '0 0 40px rgba(255,255,255,0.4)'
            }}
          />
          
          {/* 액션플랜 버튼 타겟 링 효과 */}
          <motion.div
            className="fixed pointer-events-none"
            style={{
              left: targetPosition.left + 64,
              top: targetPosition.top + 64,
              transform: 'translate(-50%, -50%)',
              zIndex: 99
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 0, 0, 1, 1, 0] }}
            transition={{
              duration: 4.5,
              times: [0, 0.7, 0.8, 0.85, 0.9, 0.95, 1]
            }}
          >
            {/* 타겟 링들 */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border-2"
                style={{
                  borderColor: i === 0 ? 'rgba(255, 140, 0, 0.9)' : 
                               i === 1 ? 'rgba(255, 165, 0, 0.7)' : 
                                        'rgba(255, 200, 0, 0.5)',
                  width: `${60 + i * 30}px`,
                  height: `${60 + i * 30}px`,
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
                animate={{
                  scale: [1, 1.2, 1, 1.3, 1],
                  opacity: [0.8, 0.6, 0.8, 0.4, 0]
                }}
                transition={{
                  duration: 1,
                  delay: 3.5 + i * 0.1,
                  ease: "easeOut"
                }}
              />
            ))}
            
            {/* 중심 점 */}
            <motion.div
              className="absolute w-2 h-2 bg-orange-500 rounded-full"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 10px rgba(255, 140, 0, 0.8)'
              }}
              animate={{
                scale: [1, 1.5, 1, 2, 0],
                opacity: [1, 0.8, 1, 0.5, 0]
              }}
              transition={{
                duration: 1,
                delay: 3.5,
                ease: "easeOut"
              }}
            />
          </motion.div>
          
          {/* 화면 전체를 덮는 흰 구름 효과 */}
          {showSmoke && (
            <motion.div
              className="fixed inset-0 pointer-events-none overflow-hidden"
              style={{ zIndex: 999 }}
            >
              {/* 아래에서 올라오는 구름들 */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={`bottom-cloud-${i}`}
                  className="absolute w-full"
                  initial={{ y: '100%' }}
                  animate={{ 
                    y: [
                      '100%',
                      '50%',
                      '30%',
                      '0%',
                      '0%',
                      '-100%'
                    ]
                  }}
                  transition={{
                    duration: 1.8,
                    times: [0, 0.2, 0.3, 0.4, 0.7, 1],
                    delay: i * 0.1,
                    ease: "easeInOut"
                  }}
                  style={{
                    height: '60%',
                    bottom: 0,
                    background: `linear-gradient(to top, 
                      rgba(240,240,245,0.98) 0%, 
                      rgba(245,245,250,0.95) 20%,
                      rgba(250,250,253,0.85) 50%,
                      rgba(255,255,255,0.6) 80%,
                      transparent 100%)`,
                    filter: `blur(${15 - i * 3}px)`,
                    boxShadow: 'inset 0 -50px 100px rgba(200,200,210,0.3)'
                  }}
                />
              ))}
              
              {/* 왼쪽에서 들어오는 구름 */}
              {[...Array(2)].map((_, i) => (
                <motion.div
                  key={`left-cloud-${i}`}
                  className="absolute h-full"
                  initial={{ x: '-100%' }}
                  animate={{ 
                    x: [
                      '-100%',
                      '-50%',
                      '0%',
                      '20%',
                      '20%',
                      '150%'
                    ]
                  }}
                  transition={{
                    duration: 1.8,
                    times: [0, 0.2, 0.35, 0.5, 0.7, 1],
                    delay: 0.1 + i * 0.15,
                    ease: "easeInOut"
                  }}
                  style={{
                    width: '70%',
                    left: 0,
                    background: `radial-gradient(ellipse at left center, 
                      rgba(235,235,240,0.97) 0%, 
                      rgba(245,245,248,0.9) 30%,
                      rgba(252,252,254,0.75) 60%,
                      rgba(255,255,255,0.4) 85%,
                      transparent 100%)`,
                    filter: `blur(${20 - i * 5}px)`,
                    boxShadow: 'inset -30px 0 60px rgba(190,190,200,0.2)'
                  }}
                />
              ))}
              
              {/* 오른쪽에서 들어오는 구름 */}
              {[...Array(2)].map((_, i) => (
                <motion.div
                  key={`right-cloud-${i}`}
                  className="absolute h-full"
                  initial={{ x: '100%' }}
                  animate={{ 
                    x: [
                      '100%',
                      '50%',
                      '0%',
                      '-20%',
                      '-20%',
                      '-150%'
                    ]
                  }}
                  transition={{
                    duration: 1.8,
                    times: [0, 0.2, 0.35, 0.5, 0.7, 1],
                    delay: 0.1 + i * 0.15,
                    ease: "easeInOut"
                  }}
                  style={{
                    width: '70%',
                    right: 0,
                    background: `radial-gradient(ellipse at right center, 
                      rgba(235,235,240,0.97) 0%, 
                      rgba(245,245,248,0.9) 30%,
                      rgba(252,252,254,0.75) 60%,
                      rgba(255,255,255,0.4) 85%,
                      transparent 100%)`,
                    filter: `blur(${20 - i * 5}px)`,
                    boxShadow: 'inset 30px 0 60px rgba(190,190,200,0.2)'
                  }}
                />
              ))}
              
              {/* 중앙을 채우는 구름 */}
              <motion.div
                className="absolute inset-0"
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1.5, 2, 2, 3],
                  opacity: [0, 0.8, 0.95, 0.95, 0]
                }}
                transition={{
                  duration: 1.8,
                  times: [0, 0.3, 0.5, 0.7, 1],
                  delay: 0.2,
                  ease: "easeOut"
                }}
                style={{
                  background: `radial-gradient(circle at center, 
                    rgba(230,230,235,0.98) 0%, 
                    rgba(240,240,245,0.92) 20%,
                    rgba(248,248,250,0.85) 45%,
                    rgba(255,255,255,0.6) 75%,
                    transparent 100%)`,
                  filter: 'blur(30px)',
                  boxShadow: '0 0 200px rgba(180,180,190,0.4)'
                }}
              />
              
              {/* 추가 구름 파티클들 */}
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={`particle-${i}`}
                  className="absolute rounded-full"
                  initial={{ 
                    opacity: 0, 
                    scale: 0,
                    x: Math.random() * window.innerWidth,
                    y: window.innerHeight
                  }}
                  animate={{
                    opacity: [0, 0.7, 0.8, 0],
                    scale: [0.5, 2, 2.5, 3],
                    y: [window.innerHeight, window.innerHeight/2, 0, -200],
                    x: `+=${(Math.random() - 0.5) * 300}`
                  }}
                  transition={{
                    duration: 1.5,
                    delay: Math.random() * 0.3,
                    ease: "easeOut"
                  }}
                  style={{
                    width: `${Math.random() * 150 + 100}px`,
                    height: `${Math.random() * 150 + 100}px`,
                    background: `radial-gradient(circle, 
                      rgba(${240 + Math.random() * 15},${240 + Math.random() * 15},${245 + Math.random() * 10},${Math.random() * 0.3 + 0.7}) 0%, 
                      rgba(250,250,252,${Math.random() * 0.2 + 0.3}) 50%,
                      transparent 70%)`,
                    filter: `blur(${Math.random() * 15 + 10}px)`,
                    boxShadow: `0 0 ${Math.random() * 30 + 20}px rgba(200,200,210,0.3)`
                  }}
                />
              ))}
            </motion.div>
          )}
        </>
      )}
    </motion.div>
    </>
  );
};

export default ResultsInsightsPanel;