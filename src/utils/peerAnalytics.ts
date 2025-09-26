/**
 * 피어 그룹 분석 유틸리티
 * KPI 진단 결과를 익명화하여 수집하고 피어 평균을 계산
 */

import type { ClusterInfo, AxisKey } from '../types';

// 피어 데이터 타입 정의
export interface PeerData {
  averages: Record<AxisKey, number>;
  median: Record<AxisKey, number>;
  percentile25: Record<AxisKey, number>;
  percentile75: Record<AxisKey, number>;
  sampleSize: number;
  lastUpdated: string;
  isRealData: boolean;
}

// 익명화된 진단 데이터
interface AnonymousDiagnostic {
  id: string;
  timestamp: string;
  cluster: {
    industry: string;
    stage: string;
    size?: string;
  };
  scores: Record<AxisKey, number>;
  overall: number;
}

// 폴백 피어 평균 (샘플 데이터)
const FALLBACK_PEER_AVERAGES: Record<AxisKey, number> = {
  GO: 65,  // Growth & Ops
  EC: 62,  // Economics
  PT: 68,  // Product & Tech
  PF: 63,  // Proof
  TO: 66   // Team & Org
};

// 캐시 키 생성
const getCacheKey = (cluster: ClusterInfo): string => {
  return `peer_data_${cluster.industry}_${cluster.stage}`;
};

// 캐시 유효성 체크 (1시간)
const isCacheValid = (timestamp: string): boolean => {
  const hourInMs = 60 * 60 * 1000;
  return Date.now() - new Date(timestamp).getTime() < hourInMs;
};

/**
 * 피어 데이터 가져오기
 * 1. 캐시 확인
 * 2. 로컬 스토리지에서 유사 진단 검색
 * 3. 부족시 폴백 데이터 사용
 */
export const getPeerData = async (cluster: ClusterInfo): Promise<PeerData> => {
  const cacheKey = getCacheKey(cluster);

  // 1. 캐시 확인
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const data = JSON.parse(cached) as PeerData;
      if (isCacheValid(data.lastUpdated)) {
        console.log('📊 캐시된 피어 데이터 사용:', data.sampleSize, '개 샘플');
        return data;
      }
    }
  } catch (error) {
    console.warn('캐시 로드 실패:', error);
  }

  // 2. 로컬 스토리지에서 익명 진단 데이터 수집
  const diagnostics = collectAnonymousDiagnostics(cluster);

  if (diagnostics.length >= 10) {  // 최소 10개 이상일 때만 실제 데이터로 간주
    const peerData = calculatePeerStatistics(diagnostics);

    // 캐시 저장
    try {
      localStorage.setItem(cacheKey, JSON.stringify(peerData));
    } catch (error) {
      console.warn('캐시 저장 실패:', error);
    }

    console.log('📊 실제 피어 데이터 계산:', peerData.sampleSize, '개 샘플');
    return peerData;
  }

  // 3. 샘플 부족시 폴백 데이터 사용
  console.log('📊 샘플 부족, 참고용 데이터 사용');
  return createFallbackPeerData(cluster);
};

/**
 * 익명 진단 데이터 수집
 * localStorage에서 유사 클러스터의 진단 기록 검색
 */
const collectAnonymousDiagnostics = (targetCluster: ClusterInfo): AnonymousDiagnostic[] => {
  const diagnostics: AnonymousDiagnostic[] = [];

  // 진단 히스토리에서 수집 (diagnostic_history 키)
  try {
    const historyKey = 'diagnostic_history';
    const history = localStorage.getItem(historyKey);

    if (history) {
      const entries = JSON.parse(history);

      // 동일 클러스터 필터링
      const relevantEntries = entries.filter((entry: any) => {
        // 같은 업종과 단계
        return entry.cluster?.industry === targetCluster.industry &&
               entry.cluster?.stage === targetCluster.stage;
      });

      // 익명화하여 수집
      relevantEntries.forEach((entry: any) => {
        if (entry.axisScores) {
          diagnostics.push({
            id: generateAnonymousId(),
            timestamp: entry.timestamp || new Date().toISOString(),
            cluster: {
              industry: entry.cluster.industry,
              stage: entry.cluster.stage,
              size: entry.cluster.size
            },
            scores: entry.axisScores,
            overall: entry.overallScore || calculateOverall(entry.axisScores)
          });
        }
      });
    }
  } catch (error) {
    console.error('진단 데이터 수집 실패:', error);
  }

  // 추가로 다른 사용자의 데이터도 수집 (멀티 유저 환경 대비)
  // TODO: 실제 서비스에서는 서버 API 호출로 대체

  return diagnostics;
};

/**
 * 피어 통계 계산
 */
const calculatePeerStatistics = (diagnostics: AnonymousDiagnostic[]): PeerData => {
  const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
  const result: PeerData = {
    averages: {} as Record<AxisKey, number>,
    median: {} as Record<AxisKey, number>,
    percentile25: {} as Record<AxisKey, number>,
    percentile75: {} as Record<AxisKey, number>,
    sampleSize: diagnostics.length,
    lastUpdated: new Date().toISOString(),
    isRealData: true
  };

  axes.forEach(axis => {
    const scores = diagnostics
      .map(d => d.scores[axis])
      .filter(score => score !== undefined && score !== null)
      .sort((a, b) => a - b);

    if (scores.length > 0) {
      // 평균
      result.averages[axis] = scores.reduce((sum, s) => sum + s, 0) / scores.length;

      // 중앙값
      const midIdx = Math.floor(scores.length / 2);
      result.median[axis] = scores.length % 2 === 0
        ? (scores[midIdx - 1] + scores[midIdx]) / 2
        : scores[midIdx];

      // 사분위수
      const q1Idx = Math.floor(scores.length * 0.25);
      const q3Idx = Math.floor(scores.length * 0.75);
      result.percentile25[axis] = scores[q1Idx];
      result.percentile75[axis] = scores[q3Idx];
    } else {
      // 데이터 없을 경우 폴백값 사용
      result.averages[axis] = FALLBACK_PEER_AVERAGES[axis];
      result.median[axis] = FALLBACK_PEER_AVERAGES[axis];
      result.percentile25[axis] = FALLBACK_PEER_AVERAGES[axis] - 10;
      result.percentile75[axis] = FALLBACK_PEER_AVERAGES[axis] + 10;
    }
  });

  return result;
};

/**
 * 폴백 피어 데이터 생성
 * 샘플이 부족할 때 사용하는 참고용 데이터
 */
const createFallbackPeerData = (cluster: ClusterInfo): PeerData => {
  const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
  const result: PeerData = {
    averages: {} as Record<AxisKey, number>,
    median: {} as Record<AxisKey, number>,
    percentile25: {} as Record<AxisKey, number>,
    percentile75: {} as Record<AxisKey, number>,
    sampleSize: 0,
    lastUpdated: new Date().toISOString(),
    isRealData: false
  };

  // 단계별 조정값 (높은 단계일수록 평균이 높음)
  const stageMultiplier = {
    'A-1': 0.9,
    'A-2': 1.0,
    'A-3': 1.1,
    'A-4': 1.2,
    'A-5': 1.3
  }[cluster.stage] || 1.0;

  axes.forEach(axis => {
    const baseScore = FALLBACK_PEER_AVERAGES[axis];
    const adjusted = Math.round(baseScore * stageMultiplier);

    result.averages[axis] = adjusted;
    result.median[axis] = adjusted;
    result.percentile25[axis] = adjusted - 12;
    result.percentile75[axis] = adjusted + 12;
  });

  return result;
};

/**
 * 백분위 계산
 * 내 점수가 피어 그룹에서 상위 몇 %인지
 */
export const calculatePercentile = (
  myScore: number,
  peerData: PeerData
): number => {
  if (!peerData.isRealData) {
    // 폴백 데이터일 경우 간단한 추정
    const avgScore = Object.values(peerData.averages).reduce((sum, s) => sum + s, 0) / 5;
    const diff = myScore - avgScore;
    const percentile = 50 + (diff * 2); // 1점당 2% 차이로 추정
    return Math.max(1, Math.min(99, Math.round(percentile)));
  }

  // 실제 데이터가 있을 경우 정확한 계산
  const overallScores = Object.values(peerData.median);
  const avgMedian = overallScores.reduce((sum, s) => sum + s, 0) / overallScores.length;

  if (myScore < peerData.percentile25.GO) return 75; // 하위 25%
  if (myScore < avgMedian) return 50; // 하위 50%
  if (myScore < peerData.percentile75.GO) return 25; // 상위 25%
  return 10; // 상위 10%
};

/**
 * 익명 ID 생성
 */
const generateAnonymousId = (): string => {
  return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 전체 점수 계산
 */
const calculateOverall = (axisScores: Record<AxisKey, number>): number => {
  const scores = Object.values(axisScores);
  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
};

/**
 * 진단 데이터 제출 (익명)
 * 사용자가 진단을 완료할 때마다 호출
 */
export const submitAnonymousDiagnostic = (
  cluster: ClusterInfo,
  axisScores: Record<AxisKey, number>,
  overallScore: number
): void => {
  try {
    // 익명 진단 데이터 생성
    const diagnostic: AnonymousDiagnostic = {
      id: generateAnonymousId(),
      timestamp: new Date().toISOString(),
      cluster: {
        industry: cluster.industry,
        stage: cluster.stage,
        size: cluster.teamSize
      },
      scores: axisScores,
      overall: overallScore
    };

    // 로컬 스토리지에 추가 (임시 - 실제는 서버로)
    const key = 'anonymous_diagnostics';
    const existing = localStorage.getItem(key);
    const diagnostics = existing ? JSON.parse(existing) : [];
    diagnostics.push(diagnostic);

    // 최대 1000개까지만 보관
    if (diagnostics.length > 1000) {
      diagnostics.shift();
    }

    localStorage.setItem(key, JSON.stringify(diagnostics));

    // 캐시 무효화 (새 데이터 반영)
    const cacheKey = getCacheKey(cluster);
    localStorage.removeItem(cacheKey);

    console.log('✅ 익명 진단 데이터 제출 완료');
  } catch (error) {
    console.error('진단 데이터 제출 실패:', error);
  }
};