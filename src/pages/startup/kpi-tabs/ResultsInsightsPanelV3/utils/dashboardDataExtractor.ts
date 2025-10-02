/**
 * Dashboard Data Extractor
 * Page 1 Executive Dashboard를 위한 데이터 추출 유틸
 */

import type { ReportData } from '../types/reportV3UI.types';
import type { RiskAlert } from '@/types/reportV3.types';

export interface DashboardData {
  // 상단 메트릭
  overallScore: number;
  criticalKPIs: number;
  completionRate: number;

  // Critical Alerts (최대 3개)
  criticalAlerts: Array<{
    severity: 'critical' | 'warning';
    message: string;
    icon: string;
  }>;

  // Highlights (최대 3개)
  highlights: Array<{
    type: 'positive' | 'neutral' | 'attention';
    message: string;
    icon: string;
  }>;

  // Axis Scores (5축)
  axisScores: Array<{
    axis: string;
    score: number;
    trend: 'up' | 'down' | 'stable';
    status: 'excellent' | 'good' | 'fair' | 'needs_attention';
  }>;

  // AI Summary
  aiSummary: string | null;

  // Radar Preview Data
  radarData: {
    currentScores: Record<string, number>;
    comparisonScores?: Record<string, number>;
  };
}

/**
 * ReportData에서 Dashboard용 데이터 추출
 */
export function extractDashboardData(reportData: ReportData): DashboardData {
  const { summary, insights, radarData, quickHighlights, criticalAlerts } = reportData;

  // Critical Alerts 추출 (최대 3개)
  const extractedAlerts = (criticalAlerts || [])
    .slice(0, 3)
    .map(alert => ({
      severity: 'critical' as const,
      message: alert,
      icon: '⚠️'
    }));

  // 추가로 insights에서 risk 추출
  const riskInsights = (insights || [])
    .filter(i => i.type === 'risk' && i.priority === 'critical')
    .slice(0, 3 - extractedAlerts.length)
    .map(i => ({
      severity: 'critical' as const,
      message: i.title || i.description || 'Risk detected',
      icon: '🚨'
    }));

  const allAlerts = [...extractedAlerts, ...riskInsights];

  // Highlights 추출 (최대 3개)
  const extractedHighlights = (quickHighlights || [])
    .slice(0, 3)
    .map(highlight => {
      // 텍스트 분석으로 type 추론
      const isPositive = /우수|강점|증가|개선|성공/.test(highlight);
      const isAttention = /주의|낮음|감소|필요|개선/.test(highlight);

      return {
        type: (isPositive ? 'positive' : isAttention ? 'attention' : 'neutral') as const,
        message: highlight,
        icon: isPositive ? '✓' : isAttention ? '→' : '•'
      };
    });

  // RadarEnhancedData를 currentScores/comparisonScores로 변환
  const currentScores: Record<string, number> = {};
  const comparisonScores: Record<string, number> = {};

  if (radarData?.mainData) {
    radarData.mainData.forEach(point => {
      currentScores[point.axisKey] = point.value;
    });
  }

  if (radarData?.comparisonData) {
    radarData.comparisonData.forEach(point => {
      comparisonScores[point.axisKey] = point.value;
    });
  }

  // Axis Scores 추출
  const axisScores = Object.entries(currentScores).map(([axis, score]) => {
    // 트렌드 계산 (비교 데이터가 있으면)
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (comparisonScores[axis] !== undefined) {
      const diff = score - comparisonScores[axis];
      if (diff > 5) trend = 'up';
      else if (diff < -5) trend = 'down';
    }

    // 상태 계산
    let status: 'excellent' | 'good' | 'fair' | 'needs_attention';
    if (score >= 80) status = 'excellent';
    else if (score >= 60) status = 'good';
    else if (score >= 40) status = 'fair';
    else status = 'needs_attention';

    return { axis, score, trend, status };
  });

  return {
    overallScore: summary.overallScore,
    criticalKPIs: summary.criticalKPIs,
    completionRate: summary.completionRate,
    criticalAlerts: allAlerts,
    highlights: extractedHighlights,
    axisScores,
    aiSummary: null, // AI Summary는 별도 생성
    radarData: {
      currentScores,
      comparisonScores
    }
  };
}

/**
 * 메트릭 카드 색상 계산
 */
export function getMetricColor(value: number, type: 'score' | 'completion' | 'count'): {
  text: string;
  bg: string;
  border: string;
} {
  if (type === 'score' || type === 'completion') {
    if (value >= 80) return { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
    if (value >= 60) return { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
    if (value >= 40) return { text: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
  }

  // count type (Critical KPIs)
  if (value === 0) return { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
  if (value <= 2) return { text: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
  return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
}

/**
 * Axis 이름 한글화
 */
export function getAxisDisplayName(axis: string): string {
  const axisNames: Record<string, string> = {
    'customer': '고객',
    'product': '제품',
    'team': '팀',
    'market': '시장',
    'finance': '재무',
    // 영어 그대로도 매핑
    'Customer': '고객',
    'Product': '제품',
    'Team': '팀',
    'Market': '시장',
    'Finance': '재무'
  };

  return axisNames[axis] || axis;
}
