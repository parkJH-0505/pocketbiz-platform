/**
 * 진단 결과 히스토리 관리 유틸리티
 * localStorage를 활용한 데이터 영속성 구현
 */

import type { AxisKey } from '../types';

export interface DiagnosticSnapshot {
  id: string;
  timestamp: Date;
  week: number;
  month: number;
  year: number;
  cluster: {
    sector: string;
    stage: string;
  };
  scores: {
    overall: number;
    axes: Record<AxisKey, number>;
  };
  responses: Record<string, any>;
  completionRate: number;
}

export interface WeeklyChange {
  week: number;
  change: number;
  percentChange: number;
}

export interface MonthlyTrend {
  month: string;
  score: number;
  change: number;
}

const STORAGE_KEY = 'pocketbiz_diagnostic_history';
const MAX_HISTORY_ITEMS = 52; // 1년치 주간 데이터

/**
 * 진단 결과 스냅샷 저장
 */
export function saveDiagnosticSnapshot(
  cluster: { sector: string; stage: string },
  axisScores: Record<AxisKey, number>,
  overallScore: number,
  responses: Record<string, any>,
  completionRate: number
): DiagnosticSnapshot {
  const now = new Date();
  const snapshot: DiagnosticSnapshot = {
    id: `snapshot_${now.getTime()}`,
    timestamp: now,
    week: getWeekNumber(now),
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    cluster,
    scores: {
      overall: overallScore,
      axes: axisScores
    },
    responses,
    completionRate
  };

  // 기존 히스토리 가져오기
  const history = getHistory();
  
  // 새 스냅샷 추가 (최신순)
  history.unshift(snapshot);
  
  // 최대 개수 제한
  if (history.length > MAX_HISTORY_ITEMS) {
    history.pop();
  }
  
  // 저장
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  
  return snapshot;
}

/**
 * 전체 히스토리 가져오기
 */
export function getHistory(): DiagnosticSnapshot[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const history = JSON.parse(data);
    // Date 객체로 변환
    return history.map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp)
    }));
  } catch (error) {
    console.error('Failed to load diagnostic history:', error);
    return [];
  }
}

/**
 * 가장 최근 스냅샷 가져오기
 */
export function getLatestSnapshot(): DiagnosticSnapshot | null {
  const history = getHistory();
  return history[0] || null;
}

/**
 * 이전 스냅샷 가져오기 (비교용)
 */
export function getPreviousSnapshot(): DiagnosticSnapshot | null {
  const history = getHistory();
  return history[1] || null;
}

/**
 * 주간 변화 계산
 */
export function getWeeklyChange(): WeeklyChange | null {
  const latest = getLatestSnapshot();
  const previous = getPreviousSnapshot();
  
  if (!latest || !previous) return null;
  
  const change = latest.scores.overall - previous.scores.overall;
  const percentChange = previous.scores.overall > 0 
    ? (change / previous.scores.overall) * 100 
    : 0;
  
  return {
    week: latest.week,
    change: Math.round(change * 10) / 10,
    percentChange: Math.round(percentChange * 10) / 10
  };
}

/**
 * 진단 트렌드 데이터 생성 (각 진단을 독립적으로 표시)
 */
export function getMonthlyTrend(): MonthlyTrend[] {
  const history = getHistory();
  
  // 최근 12개 진단만 표시 (너무 많으면 그래프가 복잡해짐)
  const recentHistory = history.slice(0, 12).reverse(); // 오래된 것부터 순서대로
  
  const trends: MonthlyTrend[] = [];
  let previousScore = 0;
  
  recentHistory.forEach((snapshot, index) => {
    const date = new Date(snapshot.timestamp);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`; // M/D 형식
    const change = previousScore > 0 ? snapshot.scores.overall - previousScore : 0;
    
    trends.push({
      month: dateStr, // 월/일로 표시
      score: Math.round(snapshot.scores.overall * 10) / 10,
      change: Math.round(change * 10) / 10
    });
    
    previousScore = snapshot.scores.overall;
  });
  
  return trends;
}

/**
 * 축별 변화 추적
 */
export function getAxisChanges(): Record<AxisKey, number> {
  const latest = getLatestSnapshot();
  const previous = getPreviousSnapshot();
  
  if (!latest || !previous) {
    return {
      GO: 0,
      EC: 0,
      PT: 0,
      PF: 0,
      TO: 0
    };
  }
  
  const changes: Record<AxisKey, number> = {} as any;
  const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
  
  axes.forEach(axis => {
    changes[axis] = Math.round(
      (latest.scores.axes[axis] - previous.scores.axes[axis]) * 10
    ) / 10;
  });
  
  return changes;
}

/**
 * 진단 완료 횟수
 */
export function getDiagnosticCount(): number {
  return getHistory().length;
}

/**
 * 평균 완료율
 */
export function getAverageCompletionRate(): number {
  const history = getHistory();
  if (history.length === 0) return 0;
  
  const totalRate = history.reduce((sum, snapshot) => 
    sum + snapshot.completionRate, 0
  );
  
  return Math.round(totalRate / history.length);
}

/**
 * 히스토리 초기화 (테스트용)
 */
export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// 헬퍼 함수들
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function formatMonth(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', 
                     '7월', '8월', '9월', '10월', '11월', '12월'];
  return `${monthNames[parseInt(month) - 1]}`;
}