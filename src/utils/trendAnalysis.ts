/**
 * 트렌드 분석 유틸리티
 * 진단 점수 변화의 원인 분석
 */

import type { AxisKey, KPIDefinition } from '../types';
import { analyzeAxisContributions } from './scoreAnalysis';

export interface TrendChange {
  axis: AxisKey;
  previousScore: number;
  currentScore: number;
  change: number;
  changePercent: number;
  causes: string[];
  improvedKPIs: KPIChange[];
  declinedKPIs: KPIChange[];
  recommendation: string;
}

export interface KPIChange {
  kpiId: string;
  kpiName: string;
  previousScore: number;
  currentScore: number;
  change: number;
}

/**
 * 트렌드 변화 원인 분석
 * 이전 진단과 현재 진단 비교
 */
export const analyzeTrendChanges = (
  currentScores: Record<AxisKey, number>,
  previousScores: Record<AxisKey, number>,
  currentResponses: Record<string, any>,
  previousResponses: Record<string, any>,
  kpis: KPIDefinition[]
): TrendChange[] => {
  const changes: TrendChange[] = [];
  const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

  axes.forEach(axis => {
    const current = currentScores[axis] || 0;
    const previous = previousScores[axis] || 0;
    const change = current - previous;
    const changePercent = previous > 0 ? (change / previous) * 100 : 0;

    if (Math.abs(change) > 0.1) {  // 0.1점 이상 변화가 있을 때만 분석
      const axisKPIs = kpis.filter(kpi => kpi.axis === axis);

      // KPI별 변화 분석
      const kpiChanges = analyzeKPIChanges(
        axisKPIs,
        currentResponses,
        previousResponses
      );

      // 원인 분석
      const causes = generateTrendCauses(
        axis,
        change,
        kpiChanges.improved,
        kpiChanges.declined
      );

      // 추천 사항
      const recommendation = generateRecommendation(
        axis,
        change,
        current,
        kpiChanges
      );

      changes.push({
        axis,
        previousScore: previous,
        currentScore: current,
        change,
        changePercent,
        causes,
        improvedKPIs: kpiChanges.improved,
        declinedKPIs: kpiChanges.declined,
        recommendation
      });
    }
  });

  return changes.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
};

/**
 * KPI별 변화 분석
 */
const analyzeKPIChanges = (
  kpis: KPIDefinition[],
  currentResponses: Record<string, any>,
  previousResponses: Record<string, any>
): { improved: KPIChange[], declined: KPIChange[] } => {
  const improved: KPIChange[] = [];
  const declined: KPIChange[] = [];

  kpis.forEach(kpi => {
    const kpiId = kpi.kpi_id || kpi.id;
    const currentResponse = currentResponses[kpiId];
    const previousResponse = previousResponses[kpiId];

    if (currentResponse && previousResponse) {
      const currentScore = calculateKPIScore(currentResponse, kpi);
      const previousScore = calculateKPIScore(previousResponse, kpi);
      const change = currentScore - previousScore;

      if (Math.abs(change) > 5) {  // 5점 이상 변화
        const kpiChange: KPIChange = {
          kpiId,
          kpiName: kpi.name || kpi.title || kpi.question.slice(0, 30),
          previousScore,
          currentScore,
          change
        };

        if (change > 0) {
          improved.push(kpiChange);
        } else {
          declined.push(kpiChange);
        }
      }
    }
  });

  // 변화량 크기로 정렬
  improved.sort((a, b) => b.change - a.change);
  declined.sort((a, b) => a.change - b.change);

  return { improved, declined };
};

/**
 * 개별 KPI 점수 계산 (scoreAnalysis에서 가져옴)
 */
const calculateKPIScore = (response: any, kpi: KPIDefinition): number => {
  const value = response.raw;

  if (response.status === 'na' || response.status === 'invalid') {
    return 0;
  }

  if (!isNaN(value) && value !== '') {
    const numValue = parseFloat(value);

    if (kpi.unit === '%' || kpi.scale === 'percentage') {
      return Math.min(100, Math.max(0, numValue));
    }

    if (kpi.unit === '원' || kpi.unit === '만원' || kpi.scale === 'currency') {
      const target = kpi.target || 1000000000;
      return Math.min(100, (numValue / target) * 100);
    }

    if (kpi.scale === 'count' || kpi.unit === '명' || kpi.unit === '개') {
      const target = kpi.target || 100;
      return Math.min(100, (numValue / target) * 100);
    }

    return Math.min(100, Math.max(0, numValue));
  }

  if (typeof value === 'string' && value.length > 0) {
    return 50;
  }

  if (value === true || value === 'yes' || value === 'Yes') {
    return 100;
  }
  if (value === false || value === 'no' || value === 'No') {
    return 0;
  }

  return 0;
};

/**
 * 트렌드 변화 원인 생성
 */
const generateTrendCauses = (
  axis: AxisKey,
  change: number,
  improved: KPIChange[],
  declined: KPIChange[]
): string[] => {
  const causes: string[] = [];

  if (change > 0) {
    // 개선 원인
    if (improved.length > 0) {
      const topImproved = improved.slice(0, 2);
      causes.push(
        `${topImproved.map(k => k.kpiName).join(', ')} 개선 (+${
          Math.round(topImproved.reduce((sum, k) => sum + k.change, 0) / topImproved.length)
        }점)`
      );
    }

    if (improved.length > 3) {
      causes.push(`전반적인 ${getAxisName(axis)} 역량 강화`);
    }
  } else {
    // 하락 원인
    if (declined.length > 0) {
      const topDeclined = declined.slice(0, 2);
      causes.push(
        `${topDeclined.map(k => k.kpiName).join(', ')} 하락 (${
          Math.round(topDeclined.reduce((sum, k) => sum + k.change, 0) / topDeclined.length)
        }점)`
      );
    }

    if (declined.length > 3) {
      causes.push(`${getAxisName(axis)} 관리 부족`);
    }
  }

  // 변화 없는 경우
  if (causes.length === 0) {
    if (Math.abs(change) < 1) {
      causes.push('안정적 유지');
    } else {
      causes.push('전반적 변화');
    }
  }

  return causes;
};

/**
 * 추천 사항 생성
 */
const generateRecommendation = (
  axis: AxisKey,
  change: number,
  currentScore: number,
  kpiChanges: { improved: KPIChange[], declined: KPIChange[] }
): string => {
  // 큰 개선
  if (change > 10) {
    return '우수한 개선! 현재 전략 유지 및 확대 적용 권장';
  }

  // 소폭 개선
  if (change > 0) {
    if (currentScore < 60) {
      return '개선 중이나 추가 노력 필요';
    }
    return '지속적 개선 유지';
  }

  // 큰 하락
  if (change < -10) {
    if (kpiChanges.declined.length > 0) {
      return `${kpiChanges.declined[0].kpiName} 긴급 점검 필요`;
    }
    return '즉각적인 원인 분석 및 대응 필요';
  }

  // 소폭 하락
  if (change < 0) {
    return '하락 추세 모니터링 및 예방 조치 권장';
  }

  // 변화 없음
  if (currentScore > 80) {
    return '우수 수준 유지';
  } else if (currentScore > 60) {
    return '안정적이나 개선 여지 있음';
  } else {
    return '정체 상태, 혁신적 접근 필요';
  }
};

/**
 * 축 이름 반환
 */
const getAxisName = (axis: AxisKey): string => {
  const names: Record<AxisKey, string> = {
    GO: '성장/운영',
    EC: '경제성',
    PT: '제품/기술',
    PF: '검증',
    TO: '팀/조직'
  };
  return names[axis] || axis;
};

/**
 * 주요 변화 포인트 추출
 * 대시보드에 표시할 핵심 변화
 */
export const getKeyTrendInsights = (
  changes: TrendChange[]
): {
  biggestImprovement: TrendChange | null;
  biggestDecline: TrendChange | null;
  overallTrend: 'improving' | 'declining' | 'stable';
  keyMessage: string;
} => {
  if (changes.length === 0) {
    return {
      biggestImprovement: null,
      biggestDecline: null,
      overallTrend: 'stable',
      keyMessage: '첫 진단 완료. 다음 진단 시 성장 추이를 확인할 수 있습니다.'
    };
  }

  const improvements = changes.filter(c => c.change > 0);
  const declines = changes.filter(c => c.change < 0);

  const biggestImprovement = improvements.length > 0
    ? improvements.reduce((max, c) => c.change > max.change ? c : max)
    : null;

  const biggestDecline = declines.length > 0
    ? declines.reduce((min, c) => c.change < min.change ? c : min)
    : null;

  const totalChange = changes.reduce((sum, c) => sum + c.change, 0);

  let overallTrend: 'improving' | 'declining' | 'stable';
  let keyMessage: string;

  if (totalChange > 5) {
    overallTrend = 'improving';
    keyMessage = `전체적으로 ${Math.round(totalChange / 5)}점 상승! ${
      biggestImprovement ? getAxisName(biggestImprovement.axis) + ' 영역 특히 우수' : ''
    }`;
  } else if (totalChange < -5) {
    overallTrend = 'declining';
    keyMessage = `주의: ${Math.abs(Math.round(totalChange / 5))}점 하락. ${
      biggestDecline ? getAxisName(biggestDecline.axis) + ' 집중 관리 필요' : ''
    }`;
  } else {
    overallTrend = 'stable';
    keyMessage = '전반적으로 안정적 수준 유지 중';
  }

  return {
    biggestImprovement,
    biggestDecline,
    overallTrend,
    keyMessage
  };
};