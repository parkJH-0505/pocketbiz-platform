/**
 * 결과 & 인사이트 패널 - 리팩토링 버전
 * 디자인 시스템과 일관성 있는 구조로 재구성
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
  Activity,
  Save,
  ChevronDown,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardBody } from '../../../components/common/Card';
import { RadarChart } from '../../../components/charts/RadarChart';
import { useKPIDiagnosis } from '../../../contexts/KPIDiagnosisContext';
import { useCluster } from '../../../contexts/ClusterContext';
import {
  getMonthlyTrend,
  getAxisChanges,
  saveDiagnosticSnapshot,
  getHistory
} from '../../../utils/diagnosticHistory';
import {
  getPeerData,
  calculatePercentile,
  submitAnonymousDiagnostic,
  type PeerData
} from '../../../utils/peerAnalytics';
import {
  detectRisks,
  getTopRisks,
  getRiskSummary,
  getRiskColor
} from '../../../utils/riskDetection';
import type { AxisKey } from '../../../types';

// 컴포넌트 분리: 저장 헤더
const SaveHeader = ({
  progress,
  isSaving,
  saveMessage,
  onSave
}: {
  progress: any;
  isSaving: boolean;
  saveMessage: string | null;
  onSave: () => void;
}) => (
  <div className="flex justify-between items-center mb-6">
    <h2 className="text-2xl font-bold text-gray-900">진단 결과 리포트</h2>
    <div className="flex items-center gap-4">
      <AnimatePresence>
        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              saveMessage.includes('오류')
                ? 'bg-red-50 text-red-700'
                : 'bg-green-50 text-green-700'
            }`}
          >
            {saveMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={onSave}
        disabled={isSaving || progress?.percentage < 50}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
          isSaving || progress?.percentage < 50
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md hover:shadow-lg'
        }`}
      >
        <Save size={18} />
        {isSaving ? '저장 중...' : '진단 결과 저장'}
      </motion.button>
    </div>
  </div>
);

// 컴포넌트 분리: 핵심 지표 카드
const KeyMetricCard = ({
  icon: Icon,
  iconColor,
  title,
  value,
  unit,
  subtitle,
  trend
}: {
  icon: any;
  iconColor: string;
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  trend?: { value: number; isPositive: boolean };
}) => (
  <Card className="h-full">
    <CardBody className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Icon className={iconColor} size={24} />
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900">
                {value}
              </span>
              {unit && (
                <span className="text-sm text-gray-600">{unit}</span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
        </div>

        {trend && (
          <div className="flex items-center gap-1 text-sm">
            {trend.isPositive ? (
              <TrendingUp className="text-green-600" size={16} />
            ) : (
              <TrendingDown className="text-red-600" size={16} />
            )}
            <span className={trend.isPositive ? 'text-green-600' : 'text-red-600'}>
              {trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </CardBody>
  </Card>
);

// 컴포넌트 분리: 위험 알림 카드
const RiskAlertCard = ({ risks, riskSummary }: { risks: any[]; riskSummary: string }) => {
  const topRisks = useMemo(() => getTopRisks(risks, 3), [risks]);

  if (topRisks.length === 0) return null;

  return (
    <Card className="border-l-4 border-red-500">
      <CardBody className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="text-red-500" size={20} />
          <h3 className="font-semibold text-red-800">위험 신호 감지</h3>
          <span className="text-sm text-red-600 ml-auto">{riskSummary}</span>
        </div>

        <div className="space-y-3">
          {topRisks.map((risk, idx) => (
            <div
              key={risk.id}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: getRiskColor(risk.level) }}
              >
                {idx + 1}
              </div>

              <div className="flex-1">
                <h4 className="font-medium text-gray-900 text-sm">
                  {risk.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {risk.message}
                </p>
                <p className="text-xs text-blue-600 font-medium mt-2">
                  💡 {risk.recommendation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};

// 컴포넌트 분리: 축별 분석 아이템
const AxisAnalysisItem = ({
  rank,
  label,
  score,
  comparison,
  color,
  type = 'strength'
}: {
  rank: number;
  label: string;
  score: number;
  comparison: string;
  color: string;
  type?: 'strength' | 'weakness';
}) => (
  <div className={`flex items-center justify-between p-4 rounded-lg ${
    type === 'strength' ? 'bg-green-50' : 'bg-orange-50'
  }`}>
    <div className="flex items-center gap-3">
      <span className={`text-lg font-bold ${
        type === 'strength' ? 'text-green-600' : 'text-orange-600'
      }`}>
        #{rank}
      </span>
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-600">{comparison}</p>
      </div>
    </div>
    <div className="text-2xl font-bold" style={{ color }}>
      {score}
    </div>
  </div>
);

// 메인 컴포넌트
const ResultsInsightsPanelRefactored = () => {
  const { cluster } = useCluster();
  const {
    axisScores,
    overallScore,
    previousScores,
    progress,
    responses
  } = useKPIDiagnosis();

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [peerData, setPeerData] = useState<PeerData | null>(null);
  const [isLoadingPeer, setIsLoadingPeer] = useState(true);

  // 축 정의 - 디자인 시스템과 일관성 있게
  const axes = [
    { key: 'GO' as AxisKey, label: 'Growth & Ops', color: '#9333ea', description: '성장·운영' },
    { key: 'EC' as AxisKey, label: 'Economics', color: '#10b981', description: '경제성·자본' },
    { key: 'PT' as AxisKey, label: 'Product & Tech', color: '#f97316', description: '제품·기술력' },
    { key: 'PF' as AxisKey, label: 'Proof', color: '#3b82f6', description: '증빙·딜레디' },
    { key: 'TO' as AxisKey, label: 'Team & Org', color: '#ef4444', description: '팀·조직 역량' }
  ];

  // 주간 변화 계산
  const weeklyChange = useMemo(() => {
    if (!previousScores || Object.keys(previousScores).length === 0) return 0;
    const prevAvg = Object.values(previousScores).reduce((sum, score) => sum + score, 0) / 5;
    return prevAvg > 0 ? overallScore - prevAvg : 0;
  }, [overallScore, previousScores]);

  // 월간 트렌드 및 위험 감지
  const monthlyTrend = useMemo(() => getMonthlyTrend(), []);
  const risks = useMemo(() =>
    detectRisks(axisScores, overallScore, previousScores, monthlyTrend),
    [axisScores, overallScore, previousScores, monthlyTrend]
  );
  const riskSummary = useMemo(() => getRiskSummary(risks), [risks]);

  // 피어 데이터 로드
  useEffect(() => {
    const loadPeerData = async () => {
      setIsLoadingPeer(true);
      try {
        const data = await getPeerData(cluster);
        setPeerData(data);
      } catch (error) {
        console.error('피어 데이터 로드 실패:', error);
        setPeerData(null);
      } finally {
        setIsLoadingPeer(false);
      }
    };

    if (cluster) {
      loadPeerData();
    }
  }, [cluster]);

  // 피어 평균
  const peerAverage = useMemo(() => {
    if (peerData) return peerData.averages;
    return { GO: 65, EC: 62, PT: 68, PF: 63, TO: 66 };
  }, [peerData]);

  // 강점/약점 분석
  const strengths = useMemo(() => {
    return Object.entries(axisScores)
      .filter(([_, score]) => score > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([axis, score]) => {
        const axisInfo = axes.find(a => a.key === axis);
        const diff = score - peerAverage[axis as AxisKey];
        return {
          axis: axis as AxisKey,
          label: axisInfo?.description || axis,
          score: Math.round(score),
          diff: diff > 0 ? `+${Math.round(diff)}` : `${Math.round(diff)}`,
          color: axisInfo?.color || '#666'
        };
      });
  }, [axisScores, peerAverage]);

  const weaknesses = useMemo(() => {
    return Object.entries(axisScores)
      .filter(([_, score]) => score > 0)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 3)
      .map(([axis, score]) => {
        const axisInfo = axes.find(a => a.key === axis);
        const improvement = Math.min(20, 100 - score);
        return {
          axis: axis as AxisKey,
          label: axisInfo?.description || axis,
          score: Math.round(score),
          potential: Math.round(score + improvement),
          improvement: `+${improvement}`,
          color: axisInfo?.color || '#666'
        };
      });
  }, [axisScores]);

  // 레이더 차트 데이터
  const radarData = axes.map(axis => ({
    axis: axis.label,
    value: axisScores[axis.key] || 0,
    fullMark: 100
  }));

  const peerRadarData = axes.map(axis => ({
    axis: axis.label,
    value: peerAverage[axis.key] || 0,
    fullMark: 100
  }));

  // 진단 결과 저장
  const handleSaveDiagnostic = () => {
    const history = getHistory();
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
      saveDiagnosticSnapshot(
        cluster,
        axisScores,
        overallScore,
        responses,
        progress?.percentage || 0
      );

      setSaveMessage('진단 결과가 성공적으로 저장되었습니다!');
      submitAnonymousDiagnostic(cluster, axisScores, overallScore);

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

  // 다음 단계 정보
  const getNextStage = () => {
    const currentStageNum = parseInt(cluster.stage.split('-')[1]);
    if (currentStageNum >= 5) return 'Exit';
    return `A-${currentStageNum + 1}`;
  };

  const getPointsToNextStage = () => {
    const stageThresholds: Record<string, number> = {
      'A-1': 60, 'A-2': 70, 'A-3': 75, 'A-4': 80, 'A-5': 85
    };
    const nextStage = getNextStage();
    if (nextStage === 'Exit') return '0.0';
    const threshold = stageThresholds[nextStage] || 80;
    const pointsNeeded = Math.max(0, threshold - overallScore);
    return pointsNeeded.toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* 저장 헤더 */}
      <SaveHeader
        progress={progress}
        isSaving={isSaving}
        saveMessage={saveMessage}
        onSave={handleSaveDiagnostic}
      />

      {/* 진도율 경고 */}
      {progress?.percentage < 50 && (
        <Card className="border-l-4 border-yellow-500">
          <CardBody className="p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ 진단 완료율이 50% 미만입니다. 더 정확한 결과를 위해 추가 진단을 완료해주세요.
            </p>
          </CardBody>
        </Card>
      )}

      {/* 위험 알림 */}
      {progress?.percentage >= 50 && (
        <RiskAlertCard risks={risks} riskSummary={riskSummary} />
      )}

      {/* 핵심 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KeyMetricCard
          icon={Award}
          iconColor="text-purple-600"
          title="종합 점수"
          value={Math.round(overallScore)}
          unit="점"
          trend={weeklyChange !== 0 ? {
            value: weeklyChange,
            isPositive: weeklyChange > 0
          } : undefined}
        />

        <KeyMetricCard
          icon={BarChart3}
          iconColor="text-blue-600"
          title="현재 단계"
          value={cluster.stage}
          subtitle="스타트업 / 일반"
        />

        <KeyMetricCard
          icon={Target}
          iconColor="text-orange-600"
          title="다음 단계까지"
          value={getPointsToNextStage()}
          unit="점"
          subtitle={`${cluster.stage} → ${getNextStage()}`}
        />
      </div>

      {/* 시각화 & 분석 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 레이더 차트 */}
        <Card>
          <CardBody className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">5축 평가 결과</h3>
            <div className="h-80">
              <RadarChart
                data={radarData}
                compareData={peerRadarData}
                showComparison={true}
              />
            </div>

            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                <span className="text-sm text-gray-600">우리 회사</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full opacity-50"></div>
                <span className="text-sm text-gray-600">피어 평균</span>
              </div>
            </div>

            {peerData && (
              <div className="flex justify-center mt-3">
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
          </CardBody>
        </Card>

        {/* 강점/약점 분석 */}
        <Card>
          <CardBody className="p-6">
            <div className="space-y-6">
              {/* 강점 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="text-green-600" size={20} />
                  강점 TOP 3
                </h3>
                <div className="space-y-2">
                  {strengths.map((item, idx) => (
                    <AxisAnalysisItem
                      key={item.axis}
                      rank={idx + 1}
                      label={item.label}
                      score={item.score}
                      comparison={`피어 대비 ${item.diff}점`}
                      color={item.color}
                      type="strength"
                    />
                  ))}
                </div>
              </div>

              {/* 약점 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="text-orange-600" size={20} />
                  개선 필요 TOP 3
                </h3>
                <div className="space-y-2">
                  {weaknesses.map((item, idx) => (
                    <AxisAnalysisItem
                      key={item.axis}
                      rank={idx + 1}
                      label={item.label}
                      score={item.score}
                      comparison={`개선 가능 ${item.improvement}점`}
                      color={item.color}
                      type="weakness"
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 트렌드 분석 */}
      {monthlyTrend.length > 0 && (
        <Card>
          <CardBody className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="text-purple-600" size={20} />
              성장 트렌드
            </h3>

            {monthlyTrend.length >= 2 ? (
              <div className="space-y-4">
                {/* 간단한 라인 차트 구현 */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">평균 점수</p>
                    <p className="text-lg font-bold text-gray-900">
                      {(monthlyTrend.reduce((sum, m) => sum + m.score, 0) / monthlyTrend.length).toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">최고 점수</p>
                    <p className="text-lg font-bold text-green-600">
                      {Math.max(...monthlyTrend.map(m => m.score))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">이전 대비</p>
                    <p className={`text-lg font-bold ${
                      monthlyTrend[monthlyTrend.length - 1].change > 0 ? 'text-green-600' :
                      monthlyTrend[monthlyTrend.length - 1].change < 0 ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {monthlyTrend[monthlyTrend.length - 1].change > 0 ? '+' : ''}
                      {monthlyTrend[monthlyTrend.length - 1].change.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-3xl font-bold text-gray-900 mb-2">{monthlyTrend[0].score}점</p>
                <p className="text-sm text-gray-600">첫 진단 완료</p>
                <p className="text-xs text-gray-500 mt-2">
                  📊 2회 이상 진단 시 성장 트렌드가 표시됩니다
                </p>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* 개선 잠재력 */}
      <Card>
        <CardBody className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="text-purple-600" size={20} />
            축별 개선 잠재력 (Quick Win 우선순위)
          </h3>

          <div className="space-y-3">
            {axes.map(axis => {
              const currentScore = axisScores[axis.key] || 0;
              const potential = Math.min(currentScore + 25, 100);
              const improvement = potential - currentScore;

              return (
                <div key={axis.key} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-8 rounded-full"
                        style={{ backgroundColor: axis.color }}
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">{axis.description}</h4>
                        <p className="text-sm text-gray-600">
                          예상 기간: {currentScore < 50 ? '3개월' : currentScore < 70 ? '2개월' : '1개월'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">개선 가능</p>
                      <p className="text-2xl font-bold text-purple-600">+{improvement}점</p>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>현재: {Math.round(currentScore)}점</span>
                      <span>목표: {Math.round(potential)}점</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${currentScore}%`,
                          backgroundColor: axis.color
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default ResultsInsightsPanelRefactored;