/**
 * History Data Tracking System
 * 히스토리 데이터 추적 및 트렌드 분석 시스템
 */

import type { AxisKey } from '../types';

// 히스토리 데이터 포인트
interface DataPoint {
  timestamp: Date;
  scores: Record<AxisKey, number>;
  overall: number;
  source: 'manual' | 'auto_sync' | 'simulation' | 'import';
  metadata?: {
    trigger?: string;
    quality?: number;
    confidence?: number;
    changes?: any[];
  };
}

// 히스토리 통계
interface HistoryStats {
  dataPoints: number;
  timeSpan: {
    start: Date;
    end: Date;
    days: number;
  };
  trends: Record<AxisKey, {
    direction: 'up' | 'down' | 'stable';
    strength: number; // 0-1
    avgChange: number;
    maxValue: number;
    minValue: number;
  }>;
  patterns: {
    seasonal: boolean;
    cyclic: boolean;
    volatile: boolean;
    stable: boolean;
  };
}

// 히스토리 분석 결과
interface HistoryAnalysis {
  summary: {
    totalChanges: number;
    significantChanges: number;
    averageScore: number;
    volatilityIndex: number;
  };
  insights: {
    type: 'trend' | 'pattern' | 'anomaly' | 'milestone';
    message: string;
    confidence: number;
    axis?: AxisKey;
  }[];
  forecasting: {
    nextPeriod: Record<AxisKey, number>;
    confidence: number;
    factors: string[];
  };
}

// 저장소 설정
interface StorageConfig {
  maxDataPoints: number;
  retentionDays: number;
  compressionEnabled: boolean;
  backupEnabled: boolean;
}

// 히스토리 트래커 클래스
export class HistoryTracker {
  private data: DataPoint[] = [];
  private config: StorageConfig;
  private storageKey = 'v2_history_data';

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = {
      maxDataPoints: 1000,
      retentionDays: 365,
      compressionEnabled: true,
      backupEnabled: true,
      ...config
    };

    this.loadFromStorage();
    this.setupCleanupSchedule();
  }

  // 데이터 포인트 추가
  addDataPoint(
    scores: Record<AxisKey, number>,
    overall: number,
    source: DataPoint['source'] = 'manual',
    metadata?: DataPoint['metadata']
  ): void {
    const dataPoint: DataPoint = {
      timestamp: new Date(),
      scores,
      overall,
      source,
      metadata
    };

    this.data.push(dataPoint);

    // 최대 데이터 포인트 수 제한
    if (this.data.length > this.config.maxDataPoints) {
      this.data = this.data.slice(-this.config.maxDataPoints);
    }

    this.saveToStorage();

    console.log('📊 History data point added:', {
      timestamp: dataPoint.timestamp,
      overall: dataPoint.overall,
      source: dataPoint.source
    });
  }

  // 히스토리 데이터 조회
  getHistory(
    options: {
      limit?: number;
      days?: number;
      axis?: AxisKey;
      source?: DataPoint['source'];
    } = {}
  ): DataPoint[] {
    let filtered = [...this.data];

    // 날짜 필터링
    if (options.days) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - options.days);
      filtered = filtered.filter(dp => dp.timestamp >= cutoff);
    }

    // 소스 필터링
    if (options.source) {
      filtered = filtered.filter(dp => dp.source === options.source);
    }

    // 최신순 정렬
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // 제한
    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  // 히스토리 통계 계산
  getStats(days: number = 30): HistoryStats {
    const recentData = this.getHistory({ days });

    if (recentData.length === 0) {
      return this.getEmptyStats();
    }

    const sortedData = recentData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // 시간 범위
    const start = sortedData[0].timestamp;
    const end = sortedData[sortedData.length - 1].timestamp;
    const daySpan = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // 축별 트렌드 계산
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    const trends = {} as HistoryStats['trends'];

    axes.forEach(axis => {
      const values = sortedData.map(dp => dp.scores[axis]).filter(v => v !== undefined);

      if (values.length < 2) {
        trends[axis] = {
          direction: 'stable',
          strength: 0,
          avgChange: 0,
          maxValue: values[0] || 0,
          minValue: values[0] || 0
        };
        return;
      }

      const firstValue = values[0];
      const lastValue = values[values.length - 1];
      const totalChange = lastValue - firstValue;
      const avgChange = values.length > 1 ? totalChange / (values.length - 1) : 0;

      // 트렌드 방향과 강도 계산
      const direction = Math.abs(avgChange) < 0.5 ? 'stable' :
                      avgChange > 0 ? 'up' : 'down';

      const strength = Math.min(1, Math.abs(avgChange) / 10); // 0-1 범위로 정규화

      trends[axis] = {
        direction,
        strength,
        avgChange,
        maxValue: Math.max(...values),
        minValue: Math.min(...values)
      };
    });

    // 패턴 분석
    const patterns = this.analyzePatterns(sortedData);

    return {
      dataPoints: recentData.length,
      timeSpan: {
        start,
        end,
        days: daySpan
      },
      trends,
      patterns
    };
  }

  // 히스토리 분석
  analyzeHistory(days: number = 30): HistoryAnalysis {
    const stats = this.getStats(days);
    const recentData = this.getHistory({ days });

    // 요약 통계
    const allScores = recentData.map(dp => dp.overall);
    const averageScore = allScores.reduce((sum, score) => sum + score, 0) / allScores.length || 0;

    const changes = recentData.slice(1).map((dp, i) => {
      return Math.abs(dp.overall - recentData[i].overall);
    });

    const totalChanges = changes.length;
    const significantChanges = changes.filter(change => change > 5).length;

    // 변동성 지수 계산 (표준편차 기반)
    const variance = allScores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / allScores.length;
    const volatilityIndex = Math.sqrt(variance) / Math.max(averageScore, 1) * 100;

    const summary = {
      totalChanges,
      significantChanges,
      averageScore: Math.round(averageScore * 10) / 10,
      volatilityIndex: Math.round(volatilityIndex * 10) / 10
    };

    // 인사이트 생성
    const insights = this.generateHistoryInsights(stats, summary);

    // 예측
    const forecasting = this.generateForecast(recentData);

    return {
      summary,
      insights,
      forecasting
    };
  }

  // 데이터 내보내기
  exportData(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.data, null, 2);
    }

    // CSV 형식
    const headers = ['timestamp', 'overall', 'GO', 'EC', 'PT', 'PF', 'TO', 'source'];
    const rows = this.data.map(dp => [
      dp.timestamp.toISOString(),
      dp.overall,
      dp.scores.GO,
      dp.scores.EC,
      dp.scores.PT,
      dp.scores.PF,
      dp.scores.TO,
      dp.source
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  // 데이터 가져오기
  importData(data: string, format: 'json' | 'csv' = 'json'): boolean {
    try {
      let importedData: DataPoint[];

      if (format === 'json') {
        importedData = JSON.parse(data).map((dp: any) => ({
          ...dp,
          timestamp: new Date(dp.timestamp)
        }));
      } else {
        // CSV 파싱 (간단한 구현)
        const lines = data.split('\n');
        const headers = lines[0].split(',');

        importedData = lines.slice(1).map(line => {
          const values = line.split(',');
          return {
            timestamp: new Date(values[0]),
            overall: parseFloat(values[1]),
            scores: {
              GO: parseFloat(values[2]),
              EC: parseFloat(values[3]),
              PT: parseFloat(values[4]),
              PF: parseFloat(values[5]),
              TO: parseFloat(values[6])
            },
            source: values[7] as DataPoint['source'] || 'import'
          };
        });
      }

      // 중복 제거 및 병합
      const existingTimestamps = new Set(this.data.map(dp => dp.timestamp.getTime()));
      const newData = importedData.filter(dp => !existingTimestamps.has(dp.timestamp.getTime()));

      this.data.push(...newData);
      this.data.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      this.saveToStorage();

      console.log(`📥 Imported ${newData.length} new data points`);
      return true;

    } catch (error) {
      console.error('❌ Data import failed:', error);
      return false;
    }
  }

  // 데이터 정리
  cleanup(): void {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.config.retentionDays);

    const beforeCount = this.data.length;
    this.data = this.data.filter(dp => dp.timestamp >= cutoff);
    const afterCount = this.data.length;

    if (beforeCount !== afterCount) {
      this.saveToStorage();
      console.log(`🧹 Cleaned up ${beforeCount - afterCount} old data points`);
    }
  }

  // 백업 생성
  createBackup(): string {
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      config: this.config,
      data: this.data
    };

    return JSON.stringify(backup, null, 2);
  }

  // 프라이빗 메서드들

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.data = parsed.map((dp: any) => ({
          ...dp,
          timestamp: new Date(dp.timestamp)
        }));
        console.log(`📂 Loaded ${this.data.length} history data points`);
      }
    } catch (error) {
      console.warn('Failed to load history data:', error);
      this.data = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (error) {
      console.error('Failed to save history data:', error);
    }
  }

  private setupCleanupSchedule(): void {
    // 24시간마다 정리 작업 실행
    setInterval(() => {
      this.cleanup();
    }, 24 * 60 * 60 * 1000);
  }

  private analyzePatterns(data: DataPoint[]): HistoryStats['patterns'] {
    if (data.length < 7) {
      return { seasonal: false, cyclic: false, volatile: false, stable: true };
    }

    // 변동성 계산
    const changes = data.slice(1).map((dp, i) => Math.abs(dp.overall - data[i].overall));
    const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
    const volatile = avgChange > 3;

    // 안정성 계산
    const stable = avgChange < 1;

    // 주기적 패턴은 더 복잡한 분석이 필요하므로 기본값 반환
    return {
      seasonal: false,
      cyclic: false,
      volatile,
      stable
    };
  }

  private generateHistoryInsights(stats: HistoryStats, summary: HistoryAnalysis['summary']): HistoryAnalysis['insights'] {
    const insights: HistoryAnalysis['insights'] = [];

    // 전반적인 트렌드
    if (summary.averageScore > 75) {
      insights.push({
        type: 'milestone',
        message: '전반적으로 높은 성과를 유지하고 있습니다',
        confidence: 0.9
      });
    }

    // 변동성
    if (summary.volatilityIndex > 15) {
      insights.push({
        type: 'pattern',
        message: '점수 변동성이 높습니다. 안정화 방안 검토가 필요합니다',
        confidence: 0.8
      });
    }

    // 축별 트렌드
    Object.entries(stats.trends).forEach(([axis, trend]) => {
      if (trend.direction !== 'stable' && trend.strength > 0.6) {
        insights.push({
          type: 'trend',
          message: `${this.getAxisName(axis as AxisKey)} 영역이 ${trend.direction === 'up' ? '상승' : '하락'} 추세입니다`,
          confidence: trend.strength,
          axis: axis as AxisKey
        });
      }
    });

    return insights.slice(0, 5); // 최대 5개
  }

  private generateForecast(data: DataPoint[]): HistoryAnalysis['forecasting'] {
    if (data.length < 3) {
      return {
        nextPeriod: { GO: 0, EC: 0, PT: 0, PF: 0, TO: 0 },
        confidence: 0,
        factors: ['insufficient data']
      };
    }

    // 간단한 선형 트렌드 예측
    const sortedData = data.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const recentData = sortedData.slice(-5); // 최근 5개 포인트 사용

    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    const nextPeriod = {} as Record<AxisKey, number>;

    axes.forEach(axis => {
      const values = recentData.map(dp => dp.scores[axis]);
      const trend = values.length > 1 ? (values[values.length - 1] - values[0]) / (values.length - 1) : 0;
      const currentValue = values[values.length - 1];

      nextPeriod[axis] = Math.max(0, Math.min(100, currentValue + trend));
    });

    return {
      nextPeriod,
      confidence: Math.min(0.8, recentData.length / 10),
      factors: ['recent trend analysis', 'linear extrapolation']
    };
  }

  private getAxisName(axis: AxisKey): string {
    const names = {
      GO: '성장·운영',
      EC: '경제성·자본',
      PT: '제품·기술력',
      PF: '증빙·딜레디',
      TO: '팀·조직'
    };
    return names[axis] || axis;
  }

  private getEmptyStats(): HistoryStats {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    const emptyTrends = axes.reduce((acc, axis) => {
      acc[axis] = {
        direction: 'stable' as const,
        strength: 0,
        avgChange: 0,
        maxValue: 0,
        minValue: 0
      };
      return acc;
    }, {} as HistoryStats['trends']);

    return {
      dataPoints: 0,
      timeSpan: {
        start: new Date(),
        end: new Date(),
        days: 0
      },
      trends: emptyTrends,
      patterns: {
        seasonal: false,
        cyclic: false,
        volatile: false,
        stable: true
      }
    };
  }
}

// 글로벌 히스토리 트래커 인스턴스
export const globalHistoryTracker = new HistoryTracker({
  maxDataPoints: 500,
  retentionDays: 180,
  compressionEnabled: true,
  backupEnabled: true
});

// 타입 exports
export type { DataPoint, HistoryStats, HistoryAnalysis, StorageConfig };