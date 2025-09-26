/**
 * 결과 & 인사이트 패널 - 클린 레이아웃 버전
 * 다른 탭들과 일관된 구조로 정리
 */

import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  AlertCircle,
  CheckCircle,
  Activity,
  Save,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardBody } from '../../../components/common/Card';
import { RadarChart } from '../../../components/charts/RadarChart';
import { useKPIDiagnosis } from '../../../contexts/KPIDiagnosisContext';
import { useCluster } from '../../../contexts/ClusterContext';
import {
  getMonthlyTrend,
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
  getRiskSummary
} from '../../../utils/riskDetection';
import type { AxisKey } from '../../../types';

const ResultsInsightsPanelClean = () => {
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

  // 축 정의
  const axes = [
    { key: 'GO' as AxisKey, label: 'Growth & Ops', color: 'bg-purple-500', description: '성장·운영' },
    { key: 'EC' as AxisKey, label: 'Economics', color: 'bg-green-500', description: '경제성·자본' },
    { key: 'PT' as AxisKey, label: 'Product & Tech', color: 'bg-orange-500', description: '제품·기술력' },
    { key: 'PF' as AxisKey, label: 'Proof', color: 'bg-blue-500', description: '증빙·딜레디' },
    { key: 'TO' as AxisKey, label: 'Team & Org', color: 'bg-red-500', description: '팀·조직 역량' }
  ];

  // 주간 변화
  const weeklyChange = useMemo(() => {
    if (!previousScores || Object.keys(previousScores).length === 0) return 0;
    const prevAvg = Object.values(previousScores).reduce((sum, score) => sum + score, 0) / 5;
    return prevAvg > 0 ? overallScore - prevAvg : 0;
  }, [overallScore, previousScores]);

  // 트렌드 및 위험
  const monthlyTrend = useMemo(() => getMonthlyTrend(), []);
  const risks = useMemo(() =>
    detectRisks(axisScores, overallScore, previousScores, monthlyTrend),
    [axisScores, overallScore, previousScores, monthlyTrend]
  );
  const topRisks = useMemo(() => getTopRisks(risks, 3), [risks]);

  // 피어 데이터
  useEffect(() => {
    const loadPeerData = async () => {
      try {
        const data = await getPeerData(cluster);
        setPeerData(data);
      } catch (error) {
        console.error('피어 데이터 로드 실패:', error);
      }
    };
    if (cluster) loadPeerData();
  }, [cluster]);

  // 피어 평균
  const peerAverage = useMemo(() => {
    if (peerData) return peerData.averages;
    return { GO: 65, EC: 62, PT: 68, PF: 63, TO: 66 };
  }, [peerData]);

  // 강점/약점
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
          color: axisInfo?.color || 'bg-gray-500'
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
          improvement: `+${improvement}`,
          color: axisInfo?.color || 'bg-gray-500'
        };
      });
  }, [axisScores]);

  // 차트 데이터
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

  // 저장 함수
  const handleSave = () => {
    setIsSaving(true);
    try {
      saveDiagnosticSnapshot(
        cluster,
        axisScores,
        overallScore,
        responses,
        progress?.percentage || 0
      );
      setSaveMessage('저장 완료!');
      submitAnonymousDiagnostic(cluster, axisScores, overallScore);
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage('저장 실패');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 영역 - 단순화 */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">진단 결과</h2>
        <button
          onClick={handleSave}
          disabled={isSaving || progress?.percentage < 50}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium ${
            isSaving || progress?.percentage < 50
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          <Save size={18} />
          {isSaving ? '저장 중...' : '결과 저장'}
        </button>
      </div>

      {/* 저장 메시지 */}
      <AnimatePresence>
        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-lg ${
              saveMessage.includes('실패')
                ? 'bg-red-50 text-red-700'
                : 'bg-green-50 text-green-700'
            }`}
          >
            {saveMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 경고 메시지 */}
      {progress?.percentage < 50 && (
        <Card className="border-l-4 border-yellow-500">
          <CardBody className="p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ 진단 완료율이 50% 미만입니다. 추가 진단을 완료해주세요.
            </p>
          </CardBody>
        </Card>
      )}

      {/* 위험 알림 */}
      {topRisks.length > 0 && (
        <Card className="border-l-4 border-red-500">
          <CardBody className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="text-red-500" size={20} />
              <h3 className="font-semibold text-red-800">위험 신호</h3>
            </div>
            <div className="space-y-2">
              {topRisks.map((risk, idx) => (
                <div key={risk.id} className="p-3 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-sm">{risk.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{risk.message}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* 핵심 지표 카드 - 그리드 레이아웃 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center gap-3">
              <Award className="text-purple-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">종합 점수</p>
                <p className="text-2xl font-bold">{Math.round(overallScore)}점</p>
                {weeklyChange !== 0 && (
                  <p className={`text-sm ${weeklyChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {weeklyChange > 0 ? '+' : ''}{weeklyChange.toFixed(1)}
                  </p>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <div className="flex items-center gap-3">
              <Target className="text-blue-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">현재 단계</p>
                <p className="text-2xl font-bold">{cluster.stage}</p>
                <p className="text-sm text-gray-500">스타트업</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <div className="flex items-center gap-3">
              <Activity className="text-orange-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">상위</p>
                <p className="text-2xl font-bold">
                  {peerData ? calculatePercentile(overallScore, peerData) : '-'}%
                </p>
                <p className="text-sm text-gray-500">피어 그룹</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 메인 콘텐츠 - 2열 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 레이더 차트 */}
        <Card>
          <CardBody className="p-6">
            <h3 className="text-lg font-semibold mb-4">5축 평가</h3>
            <div className="h-80">
              <RadarChart
                data={radarData}
                compareData={peerRadarData}
                showComparison={true}
              />
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <span className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 bg-purple-600 rounded-full"></span>
                우리 회사
              </span>
              <span className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                피어 평균
              </span>
            </div>
          </CardBody>
        </Card>

        {/* 강점/약점 */}
        <Card>
          <CardBody className="p-6">
            <div className="space-y-6">
              {/* 강점 */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="text-green-600" size={20} />
                  강점 TOP 3
                </h3>
                <div className="space-y-2">
                  {strengths.map((item, idx) => (
                    <div key={item.axis} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-gray-600">피어 대비 {item.diff}점</p>
                      </div>
                      <span className={`text-2xl font-bold ${item.color.replace('bg-', 'text-')}`}>
                        {item.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 약점 */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="text-orange-600" size={20} />
                  개선 필요 TOP 3
                </h3>
                <div className="space-y-2">
                  {weaknesses.map((item, idx) => (
                    <div key={item.axis} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-gray-600">개선 가능 {item.improvement}점</p>
                      </div>
                      <span className={`text-2xl font-bold ${item.color.replace('bg-', 'text-')}`}>
                        {item.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 개선 잠재력 - 전체 너비 */}
      <Card>
        <CardBody className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="text-purple-600" size={20} />
            축별 개선 잠재력
          </h3>
          <div className="space-y-3">
            {axes.map(axis => {
              const score = axisScores[axis.key] || 0;
              const potential = Math.min(score + 25, 100);

              return (
                <div key={axis.key} className="flex items-center gap-4">
                  <div className="w-32">
                    <p className="font-medium">{axis.description}</p>
                  </div>
                  <div className="flex-1">
                    <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${axis.color} transition-all duration-500`}
                        style={{ width: `${score}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-between px-3">
                        <span className="text-sm text-white font-medium">{Math.round(score)}</span>
                        <span className="text-sm text-gray-700">→ {Math.round(potential)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right w-20">
                    <p className="text-sm font-medium text-purple-600">
                      +{Math.round(potential - score)}점
                    </p>
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

export default ResultsInsightsPanelClean;