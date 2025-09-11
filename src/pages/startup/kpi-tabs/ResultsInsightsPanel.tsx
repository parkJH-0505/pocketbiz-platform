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
  XCircle,
  BarChart3,
  Zap,
  Calendar,
  Clock,
  Activity
} from 'lucide-react';
import { Card, CardBody } from '../../../components/common/Card';
import { RadarChart } from '../../../components/charts/RadarChart';
import { useKPIDiagnosis } from '../../../contexts/KPIDiagnosisContext';
import { useCluster } from '../../../contexts/ClusterContext';
import { getMonthlyTrend, getAxisChanges } from '../../../utils/diagnosticHistory';
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
  
  // 주간 변화 계산 (이전 진단과 비교)
  const weeklyChange = useMemo(() => {
    if (!previousScores || Object.keys(previousScores).length === 0) return 0;
    const prevAvg = Object.values(previousScores).reduce((sum, score) => sum + score, 0) / 5;
    return prevAvg > 0 ? overallScore - prevAvg : 0;
  }, [overallScore, previousScores]);

  // 월간 트렌드 데이터
  const monthlyTrend = useMemo(() => getMonthlyTrend(), []);
  
  // 축별 변화 데이터
  const axisChanges = useMemo(() => getAxisChanges(), []);

  // 축 정의
  const axes = [
    { key: 'GO', label: 'Growth', color: '#9333ea', description: '성장 지향성', fullName: '성장 지향성' },
    { key: 'EC', label: 'Economics', color: '#10b981', description: '효율성', fullName: '경제성 및 효율성' },
    { key: 'PT', label: 'Product', color: '#f97316', description: '제품력', fullName: '제품 및 기술' },
    { key: 'PF', label: 'Performance', color: '#3b82f6', description: '성과', fullName: '성과 지표' },
    { key: 'TO', label: 'Team & Org', color: '#ef4444', description: '조직', fullName: '팀 및 조직' }
  ];

  // 피어 평균 데이터
  // TODO: 실제 서비스에서는 클러스터별 평균 데이터를 API에서 가져와야 함
  // 현재는 MVP를 위해 하드코딩된 데이터 사용
  // NOTE: 현재 단계에서는 모수가 없어 실제 데이터 마련이 어려움
  // 추후 충분한 진단 데이터가 축적되면 실제 피어 그룹 평균값으로 교체 필요
  const peerAverage = {
    GO: 65,  // 성장 지향성 평균 (하드코딩)
    EC: 62,  // 경제성 평균 (하드코딩)
    PT: 68,  // 제품/기술 평균 (하드코딩)
    PF: 63,  // 성과 평균 (하드코딩)
    TO: 66   // 팀/조직 평균 (하드코딩)
  };

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
    if (nextStage === 'Exit') return 0;
    const threshold = stageThresholds[nextStage] || 80;
    return Math.max(0, threshold - overallScore);
  };

  // Top 3 강점 분석
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
          label: axisInfo?.fullName || axis,
          score: Math.round(score),
          diff: diff > 0 ? `+${Math.round(diff)}` : `${Math.round(diff)}`,
          color: axisInfo?.color || '#666'
        };
      });
  }, [axisScores]);

  // Top 3 약점 분석
  const weaknesses = useMemo(() => {
    return Object.entries(axisScores)
      .filter(([_, score]) => score > 0)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 3)
      .map(([axis, score]) => {
        const axisInfo = axes.find(a => a.key === axis);
        const improvement = Math.min(20, 100 - score); // 최대 20점 개선 가능
        return {
          axis: axis as AxisKey,
          label: axisInfo?.fullName || axis,
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
    value: axisScores[axis.key as AxisKey] || 0,
    fullMark: 100
  }));

  const peerData = axes.map(axis => ({
    axis: axis.label,
    value: peerAverage[axis.key as AxisKey] || 0,
    fullMark: 100
  }));

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
    <div className="space-y-6">
      {/* 상단: 핵심 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 종합 점수 */}
        <Card>
          <CardBody className="text-center">
            <div className="mb-2">
              <Award className="mx-auto text-primary-main" size={32} />
            </div>
            <h3 className="text-sm font-medium text-neutral-gray mb-2">종합 점수</h3>
            <div className="text-5xl font-bold text-primary-main mb-2">
              {Math.round(overallScore)}
              <span className="text-2xl text-neutral-gray">점</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm">
              {weeklyChange > 0 ? (
                <>
                  <TrendingUp className="text-success-main" size={16} />
                  <span className="text-success-main">지난주 대비 +{weeklyChange.toFixed(1)}점</span>
                </>
              ) : weeklyChange < 0 ? (
                <>
                  <TrendingDown className="text-error-main" size={16} />
                  <span className="text-error-main">지난주 대비 {weeklyChange.toFixed(1)}점</span>
                </>
              ) : (
                <span className="text-neutral-gray">변화 없음</span>
              )}
            </div>
          </CardBody>
        </Card>

        {/* 현재 단계 */}
        <Card>
          <CardBody className="text-center">
            <div className="mb-2">
              <BarChart3 className="mx-auto text-secondary-main" size={32} />
            </div>
            <h3 className="text-sm font-medium text-neutral-gray mb-2">현재 단계</h3>
            <div className="text-3xl font-bold text-secondary-main mb-2">
              {cluster.stage}
            </div>
            <div className="text-sm text-neutral-gray">
              {cluster.businessType} / {cluster.industry}
            </div>
          </CardBody>
        </Card>

        {/* 다음 단계까지 */}
        <Card>
          <CardBody className="text-center">
            <div className="mb-2">
              <Target className="mx-auto text-accent-orange" size={32} />
            </div>
            <h3 className="text-sm font-medium text-neutral-gray mb-2">다음 단계까지</h3>
            <div className="text-3xl font-bold text-neutral-dark mb-1">
              {getPointsToNextStage()}점
            </div>
            <div className="text-sm text-neutral-gray">
              {cluster.stage} → {getNextStage()}
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
                compareData={peerData}
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
            
            {/* 축별 변화 표시 (이전 대비) */}
            {Object.keys(axisChanges).length > 0 && (
              <div className="mt-4 pt-4 border-t border-neutral-border">
                <p className="text-sm font-medium text-neutral-gray mb-2">이전 진단 대비 변화</p>
                <div className="grid grid-cols-5 gap-2">
                  {axes.map(axis => {
                    const change = axisChanges[axis.key as AxisKey];
                    return (
                      <div key={axis.key} className="text-center">
                        <div className="text-xs text-neutral-gray mb-1">{axis.label}</div>
                        <div className={`text-sm font-semibold ${
                          change > 0 ? 'text-success-main' : 
                          change < 0 ? 'text-error-main' : 
                          'text-neutral-gray'
                        }`}>
                          {change > 0 ? '+' : ''}{change.toFixed(1)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
                    <div key={item.axis} className="flex items-center justify-between p-3 bg-success-light/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-success-main">#{idx + 1}</span>
                        <div>
                          <p className="font-medium text-neutral-dark">{item.label}</p>
                          <p className="text-sm text-neutral-gray">피어 대비 {item.diff}점</p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold" style={{ color: item.color }}>
                        {item.score}
                      </div>
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
                    <div key={item.axis} className="flex items-center justify-between p-3 bg-accent-orange-light/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-accent-orange">#{idx + 1}</span>
                        <div>
                          <p className="font-medium text-neutral-dark">{item.label}</p>
                          <p className="text-sm text-neutral-gray">개선 가능 {item.improvement}점</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl text-neutral-gray">{item.score}</span>
                        <span className="text-sm text-neutral-gray">→</span>
                        <span className="text-xl font-bold" style={{ color: item.color }}>
                          {item.potential}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 시계열 트렌드 (간단한 버전) */}
      {monthlyTrend.length > 0 && (
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-neutral-dark mb-4 flex items-center gap-2">
              <Activity className="text-primary-main" size={20} />
              성장 트렌드
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {monthlyTrend.map((month, idx) => (
                <div key={month.month} className="text-center p-3 bg-neutral-light rounded-lg">
                  <div className="text-xs text-neutral-gray mb-1">{month.month}</div>
                  <div className="text-xl font-bold text-neutral-dark">{month.score}</div>
                  {month.change !== 0 && (
                    <div className={`text-xs mt-1 flex items-center justify-center gap-1 ${
                      month.change > 0 ? 'text-success-main' : 'text-error-main'
                    }`}>
                      {month.change > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {month.change > 0 ? '+' : ''}{month.change}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {monthlyTrend.length < 2 && (
              <p className="text-sm text-neutral-gray mt-3 text-center">
                * 2회 이상 진단 시 트렌드가 표시됩니다
              </p>
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
  );
};

export default ResultsInsightsPanel;