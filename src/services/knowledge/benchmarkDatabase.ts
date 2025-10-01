/**
 * Benchmark Database Service
 *
 * 실제 업계 벤치마크 데이터 관리 및 조회
 * 데이터 출처: SaaS Capital, OpenView, Y Combinator, 500 Startups 등
 */

import type { BenchmarkData } from './clusterKnowledge';

/**
 * 벤치마크 비교 결과
 */
export interface BenchmarkComparison {
  value: number;
  benchmark: BenchmarkData;
  percentile: number; // 0-100, 어느 백분위에 속하는지
  percentileLabel: string; // 'Top 10%', 'Above Average', etc.
  performance: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
  message: string;
}

/**
 * 벤치마크 데이터베이스
 * Phase 1에서는 5개 핵심 클러스터 데이터만 포함
 */
class BenchmarkDatabase {
  private static instance: BenchmarkDatabase;

  private constructor() {}

  public static getInstance(): BenchmarkDatabase {
    if (!BenchmarkDatabase.instance) {
      BenchmarkDatabase.instance = new BenchmarkDatabase();
    }
    return BenchmarkDatabase.instance;
  }

  /**
   * KPI 값을 벤치마크와 비교
   */
  public compareToBenchmark(
    value: number,
    benchmark: BenchmarkData
  ): BenchmarkComparison {
    // 백분위 계산
    const percentile = this.calculatePercentile(value, benchmark);
    const percentileLabel = this.getPercentileLabel(percentile);
    const performance = this.getPerformance(percentile);
    const message = this.generateMessage(value, benchmark, percentile);

    return {
      value,
      benchmark,
      percentile,
      percentileLabel,
      performance,
      message
    };
  }

  /**
   * 값이 벤치마크에서 어느 백분위에 속하는지 계산
   * 선형 보간법 사용
   */
  private calculatePercentile(value: number, benchmark: BenchmarkData): number {
    const { p10, p25, p50, p75, p90 } = benchmark;

    // 값이 범위를 벗어나는 경우
    if (value <= p10) {
      // p10 이하: 0-10 사이로 선형 보간
      const ratio = p10 > 0 ? value / p10 : 0;
      return Math.max(0, ratio * 10);
    }
    if (value >= p90) {
      // p90 이상: 90-100 사이로 선형 보간
      const ratio = value / p90;
      return Math.min(100, 90 + (ratio - 1) * 10);
    }

    // 각 구간별로 선형 보간
    if (value <= p25) {
      // p10 ~ p25 구간: 10-25
      return 10 + ((value - p10) / (p25 - p10)) * 15;
    }
    if (value <= p50) {
      // p25 ~ p50 구간: 25-50
      return 25 + ((value - p25) / (p50 - p25)) * 25;
    }
    if (value <= p75) {
      // p50 ~ p75 구간: 50-75
      return 50 + ((value - p50) / (p75 - p50)) * 25;
    }
    // p75 ~ p90 구간: 75-90
    return 75 + ((value - p75) / (p90 - p75)) * 15;
  }

  /**
   * 백분위를 라벨로 변환
   */
  private getPercentileLabel(percentile: number): string {
    if (percentile >= 90) return 'Top 10%';
    if (percentile >= 75) return 'Top 25%';
    if (percentile >= 50) return 'Above Average';
    if (percentile >= 25) return 'Below Average';
    return 'Bottom 25%';
  }

  /**
   * 백분위를 성과 수준으로 변환
   */
  private getPerformance(
    percentile: number
  ): 'excellent' | 'good' | 'average' | 'below_average' | 'poor' {
    if (percentile >= 90) return 'excellent';
    if (percentile >= 75) return 'good';
    if (percentile >= 40) return 'average';
    if (percentile >= 25) return 'below_average';
    return 'poor';
  }

  /**
   * 사용자 친화적 메시지 생성
   */
  private generateMessage(
    value: number,
    benchmark: BenchmarkData,
    percentile: number
  ): string {
    const formattedValue = this.formatValue(value, benchmark.category);
    const performance = this.getPerformance(percentile);

    switch (performance) {
      case 'excellent':
        return `${formattedValue}는 상위 10% 수준으로 업계 최고 수준입니다. 탁월한 성과입니다.`;
      case 'good':
        return `${formattedValue}는 상위 25% 수준으로 우수합니다. 업계 평균을 크게 상회합니다.`;
      case 'average':
        return `${formattedValue}는 업계 평균 수준입니다. 적절한 성과를 보이고 있습니다.`;
      case 'below_average':
        return `${formattedValue}는 업계 평균 이하입니다. 개선의 여지가 있습니다.`;
      case 'poor':
        return `${formattedValue}는 하위 25% 수준으로 상당한 개선이 필요합니다.`;
    }
  }

  /**
   * 카테고리에 따라 값을 적절한 형식으로 포맷
   */
  private formatValue(value: number, category: string): string {
    // 금액 관련 카테고리
    if (
      category.includes('revenue') ||
      category.includes('mrr') ||
      category.includes('gmv') ||
      category.includes('cac') ||
      category.includes('ltv') ||
      category.includes('arpu') ||
      category.includes('aov')
    ) {
      if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(2)}M`;
      }
      if (value >= 1000) {
        return `$${(value / 1000).toFixed(1)}K`;
      }
      return `$${value.toFixed(0)}`;
    }

    // 백분율 카테고리
    if (
      category.includes('rate') ||
      category.includes('ratio') ||
      category.includes('retention') ||
      category.includes('churn') ||
      category.includes('conversion')
    ) {
      return `${value.toFixed(1)}%`;
    }

    // 사용자 수 카테고리
    if (
      category.includes('users') ||
      category.includes('customers') ||
      category.includes('mau') ||
      category.includes('dau')
    ) {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(2)}M명`;
      }
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K명`;
      }
      return `${value.toFixed(0)}명`;
    }

    // 개월 수
    if (category.includes('month') || category.includes('payback')) {
      return `${value.toFixed(1)}개월`;
    }

    // 기본: 숫자만
    return value >= 1000 ? value.toLocaleString('ko-KR') : value.toFixed(1);
  }

  /**
   * 특정 값이 우수한지 판단 (백분위 75 이상)
   */
  public isExcellent(value: number, benchmark: BenchmarkData): boolean {
    const percentile = this.calculatePercentile(value, benchmark);
    return percentile >= 75;
  }

  /**
   * 특정 값이 평균 이상인지 판단 (백분위 50 이상)
   */
  public isAboveAverage(value: number, benchmark: BenchmarkData): boolean {
    const percentile = this.calculatePercentile(value, benchmark);
    return percentile >= 50;
  }

  /**
   * 특정 값이 개선이 필요한지 판단 (백분위 40 미만)
   */
  public needsImprovement(value: number, benchmark: BenchmarkData): boolean {
    const percentile = this.calculatePercentile(value, benchmark);
    return percentile < 40;
  }

  /**
   * 두 값을 비교하여 차이를 설명
   */
  public compareValues(
    value1: number,
    value2: number,
    category: string
  ): {
    difference: number;
    percentageDiff: number;
    message: string;
  } {
    const difference = value1 - value2;
    const percentageDiff = value2 !== 0 ? (difference / value2) * 100 : 0;

    let message = '';
    const absDiff = Math.abs(percentageDiff);

    if (percentageDiff > 0) {
      if (absDiff > 50) {
        message = `${absDiff.toFixed(0)}% 높습니다 (매우 우수)`;
      } else if (absDiff > 20) {
        message = `${absDiff.toFixed(0)}% 높습니다 (우수)`;
      } else if (absDiff > 5) {
        message = `${absDiff.toFixed(0)}% 높습니다`;
      } else {
        message = `거의 동일합니다`;
      }
    } else {
      if (absDiff > 50) {
        message = `${absDiff.toFixed(0)}% 낮습니다 (상당한 개선 필요)`;
      } else if (absDiff > 20) {
        message = `${absDiff.toFixed(0)}% 낮습니다 (개선 필요)`;
      } else if (absDiff > 5) {
        message = `${absDiff.toFixed(0)}% 낮습니다`;
      } else {
        message = `거의 동일합니다`;
      }
    }

    return {
      difference,
      percentageDiff,
      message
    };
  }

  /**
   * 벤치마크 데이터 유효성 검증
   */
  public validateBenchmark(benchmark: BenchmarkData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 백분위 순서 검증
    if (
      !(
        benchmark.p10 <= benchmark.p25 &&
        benchmark.p25 <= benchmark.p50 &&
        benchmark.p50 <= benchmark.p75 &&
        benchmark.p75 <= benchmark.p90
      )
    ) {
      errors.push('백분위 순서가 올바르지 않습니다 (p10 <= p25 <= p50 <= p75 <= p90)');
    }

    // 음수 값 검증 (대부분의 KPI는 양수여야 함)
    if (
      benchmark.p10 < 0 ||
      benchmark.p25 < 0 ||
      benchmark.p50 < 0 ||
      benchmark.p75 < 0 ||
      benchmark.p90 < 0
    ) {
      errors.push('벤치마크 값은 음수일 수 없습니다');
    }

    // 출처와 날짜 검증
    if (!benchmark.source || benchmark.source.trim() === '') {
      errors.push('벤치마크 데이터 출처가 필요합니다');
    }

    if (!benchmark.lastUpdated || benchmark.lastUpdated.trim() === '') {
      errors.push('벤치마크 데이터 업데이트 날짜가 필요합니다');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 벤치마크 데이터의 신뢰도 점수 계산 (0-100)
   */
  public calculateConfidenceScore(benchmark: BenchmarkData): number {
    let score = 100;

    // 샘플 크기 검증 (더 클수록 신뢰도 높음)
    if (benchmark.sampleSize) {
      if (benchmark.sampleSize < 50) score -= 30;
      else if (benchmark.sampleSize < 200) score -= 15;
      else if (benchmark.sampleSize < 500) score -= 5;
    } else {
      score -= 20; // 샘플 크기 정보 없음
    }

    // 최신성 검증 (2년 이내 데이터가 좋음)
    const lastUpdated = new Date(benchmark.lastUpdated);
    const now = new Date();
    const monthsDiff =
      (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24 * 30);

    if (monthsDiff > 24) score -= 30; // 2년 이상 오래됨
    else if (monthsDiff > 12) score -= 15; // 1년 이상 오래됨
    else if (monthsDiff > 6) score -= 5; // 6개월 이상 오래됨

    // 출처 신뢰도
    const trustedSources = [
      'saas capital',
      'openview',
      'y combinator',
      '500 startups',
      'chartmogul',
      'mixpanel',
      'amplitude'
    ];

    const isFromTrustedSource = trustedSources.some(source =>
      benchmark.source.toLowerCase().includes(source)
    );

    if (!isFromTrustedSource) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 벤치마크 요약 정보 생성
   */
  public getBenchmarkSummary(benchmark: BenchmarkData): {
    median: number;
    average: number;
    range: { min: number; max: number };
    topQuartile: number;
    bottomQuartile: number;
  } {
    // 중앙값 (p50)
    const median = benchmark.p50;

    // 평균 추정 (정확하지는 않지만 근사치)
    const average = (benchmark.p10 + benchmark.p25 + benchmark.p50 + benchmark.p75 + benchmark.p90) / 5;

    // 범위
    const range = {
      min: benchmark.p10,
      max: benchmark.p90
    };

    // 상위/하위 사분위수
    const topQuartile = benchmark.p75;
    const bottomQuartile = benchmark.p25;

    return {
      median,
      average,
      range,
      topQuartile,
      bottomQuartile
    };
  }
}

// 싱글톤 인스턴스 export
export const benchmarkDB = BenchmarkDatabase.getInstance();

/**
 * 편의 함수들
 */

export function compareToBenchmark(
  value: number,
  benchmark: BenchmarkData
): BenchmarkComparison {
  return benchmarkDB.compareToBenchmark(value, benchmark);
}

export function isExcellent(value: number, benchmark: BenchmarkData): boolean {
  return benchmarkDB.isExcellent(value, benchmark);
}

export function isAboveAverage(value: number, benchmark: BenchmarkData): boolean {
  return benchmarkDB.isAboveAverage(value, benchmark);
}

export function needsImprovement(value: number, benchmark: BenchmarkData): boolean {
  return benchmarkDB.needsImprovement(value, benchmark);
}

export function getBenchmarkSummary(benchmark: BenchmarkData) {
  return benchmarkDB.getBenchmarkSummary(benchmark);
}

export function calculateConfidenceScore(benchmark: BenchmarkData): number {
  return benchmarkDB.calculateConfidenceScore(benchmark);
}