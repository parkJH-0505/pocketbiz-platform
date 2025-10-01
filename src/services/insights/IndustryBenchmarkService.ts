/**
 * Industry Benchmark Service
 * 업계 벤치마크 비교 분석 서비스
 */

import { ProcessedKPIData, AxisKey } from '@/types/reportV3.types';
import { getCacheManager } from '@/utils/cacheManager';

/**
 * 업계 분류
 */
export enum Industry {
  STARTUP = 'startup',
  MANUFACTURING = 'manufacturing',
  RETAIL = 'retail',
  FINANCE = 'finance',
  HEALTHCARE = 'healthcare',
  EDUCATION = 'education',
  SERVICE = 'service',
  TECHNOLOGY = 'technology',
  ECOMMERCE = 'ecommerce',
  LOGISTICS = 'logistics'
}

/**
 * 기업 규모
 */
export enum CompanySize {
  MICRO = 'micro',       // < 10명
  SMALL = 'small',       // 10-50명
  MEDIUM = 'medium',     // 50-250명
  LARGE = 'large',       // 250-1000명
  ENTERPRISE = 'enterprise' // > 1000명
}

/**
 * 성장 단계
 */
export enum GrowthStage {
  SEED = 'seed',
  EARLY = 'early',
  GROWTH = 'growth',
  EXPANSION = 'expansion',
  MATURE = 'mature'
}

/**
 * 벤치마크 데이터 인터페이스
 */
export interface BenchmarkData {
  industry: Industry;
  companySize: CompanySize;
  stage: GrowthStage;
  metrics: {
    axis: AxisKey;
    kpiName: string;
    percentiles: {
      p10: number;  // 하위 10%
      p25: number;  // 하위 25%
      p50: number;  // 중앙값
      p75: number;  // 상위 25%
      p90: number;  // 상위 10%
      p95: number;  // 상위 5%
    };
    average: number;
    stdDev: number;
    sampleSize: number;
    lastUpdated: Date;
  }[];
  industryTrends: {
    trend: string;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
    affectedKPIs: string[];
  }[];
  bestPractices: {
    title: string;
    description: string;
    applicableKPIs: string[];
    expectedImprovement: string;
  }[];
}

/**
 * 벤치마크 비교 결과
 */
export interface BenchmarkComparison {
  kpiId: string;
  kpiName: string;
  axis: AxisKey;
  currentScore: number;
  benchmarks: {
    industry: number;
    percentile: number;
    gap: number;
    status: 'above' | 'at' | 'below';
    recommendation: string;
  };
  peerComparison: {
    peerAverage: number;
    topPerformer: number;
    bottomPerformer: number;
    yourRank: number;
    totalPeers: number;
  };
  historicalTrend?: {
    previousScore: number;
    change: number;
    changePercent: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  insights: string[];
  improvementPotential: {
    targetScore: number;
    estimatedEffort: 'low' | 'medium' | 'high';
    expectedTimeframe: string;
    suggestedActions: string[];
  };
}

/**
 * 업계 벤치마크 서비스 클래스
 */
export class IndustryBenchmarkService {
  private benchmarkDatabase: Map<string, BenchmarkData>;
  private cache = getCacheManager();

  constructor() {
    this.benchmarkDatabase = this.initializeBenchmarkDatabase();
  }

  /**
   * 벤치마크 데이터베이스 초기화
   */
  private initializeBenchmarkDatabase(): Map<string, BenchmarkData> {
    const database = new Map<string, BenchmarkData>();

    // 스타트업 벤치마크
    database.set('startup_small_early', {
      industry: Industry.STARTUP,
      companySize: CompanySize.SMALL,
      stage: GrowthStage.EARLY,
      metrics: [
        {
          axis: 'GO' as AxisKey,
          kpiName: '목표 달성률',
          percentiles: {
            p10: 35, p25: 45, p50: 60, p75: 75, p90: 85, p95: 92
          },
          average: 62,
          stdDev: 18,
          sampleSize: 500,
          lastUpdated: new Date()
        },
        {
          axis: 'EC' as AxisKey,
          kpiName: '고객 만족도',
          percentiles: {
            p10: 40, p25: 50, p50: 65, p75: 78, p90: 87, p95: 94
          },
          average: 66,
          stdDev: 16,
          sampleSize: 500,
          lastUpdated: new Date()
        },
        {
          axis: 'PT' as AxisKey,
          kpiName: '프로세스 효율성',
          percentiles: {
            p10: 30, p25: 42, p50: 58, p75: 72, p90: 83, p95: 90
          },
          average: 59,
          stdDev: 19,
          sampleSize: 500,
          lastUpdated: new Date()
        },
        {
          axis: 'PF' as AxisKey,
          kpiName: '성과 지표',
          percentiles: {
            p10: 38, p25: 48, p50: 63, p75: 76, p90: 86, p95: 93
          },
          average: 64,
          stdDev: 17,
          sampleSize: 500,
          lastUpdated: new Date()
        },
        {
          axis: 'TO' as AxisKey,
          kpiName: '팀 역량',
          percentiles: {
            p10: 42, p25: 52, p50: 67, p75: 79, p90: 88, p95: 94
          },
          average: 68,
          stdDev: 15,
          sampleSize: 500,
          lastUpdated: new Date()
        }
      ],
      industryTrends: [
        {
          trend: 'AI/ML 도입 가속화',
          impact: 'positive',
          description: '자동화 및 데이터 기반 의사결정 강화',
          affectedKPIs: ['프로세스 효율성', '성과 지표']
        },
        {
          trend: '원격 근무 확산',
          impact: 'neutral',
          description: '유연한 근무환경 제공하나 협업 도전과제 존재',
          affectedKPIs: ['팀 역량', '프로세스 효율성']
        }
      ],
      bestPractices: [
        {
          title: 'OKR 도입',
          description: '목표와 핵심 결과 지표를 통한 명확한 방향성 제시',
          applicableKPIs: ['목표 달성률', '성과 지표'],
          expectedImprovement: '15-25%'
        },
        {
          title: '애자일 방법론',
          description: '빠른 반복과 지속적 개선',
          applicableKPIs: ['프로세스 효율성', '고객 만족도'],
          expectedImprovement: '20-30%'
        }
      ]
    });

    // 제조업 벤치마크
    database.set('manufacturing_medium_growth', {
      industry: Industry.MANUFACTURING,
      companySize: CompanySize.MEDIUM,
      stage: GrowthStage.GROWTH,
      metrics: [
        {
          axis: 'GO' as AxisKey,
          kpiName: '생산 목표 달성',
          percentiles: {
            p10: 45, p25: 58, p50: 72, p75: 84, p90: 92, p95: 96
          },
          average: 73,
          stdDev: 15,
          sampleSize: 300,
          lastUpdated: new Date()
        },
        {
          axis: 'PT' as AxisKey,
          kpiName: '생산 효율성',
          percentiles: {
            p10: 50, p25: 62, p50: 75, p75: 86, p90: 93, p95: 97
          },
          average: 76,
          stdDev: 14,
          sampleSize: 300,
          lastUpdated: new Date()
        }
      ],
      industryTrends: [
        {
          trend: '스마트 팩토리 전환',
          impact: 'positive',
          description: 'IoT와 자동화를 통한 생산성 향상',
          affectedKPIs: ['생산 효율성', '품질 지표']
        }
      ],
      bestPractices: [
        {
          title: '린 제조 시스템',
          description: '낭비 제거와 지속적 개선',
          applicableKPIs: ['생산 효율성'],
          expectedImprovement: '25-35%'
        }
      ]
    });

    // 서비스업 벤치마크
    database.set('service_small_growth', {
      industry: Industry.SERVICE,
      companySize: CompanySize.SMALL,
      stage: GrowthStage.GROWTH,
      metrics: [
        {
          axis: 'EC' as AxisKey,
          kpiName: '서비스 품질',
          percentiles: {
            p10: 48, p25: 60, p50: 74, p75: 85, p90: 92, p95: 96
          },
          average: 75,
          stdDev: 13,
          sampleSize: 400,
          lastUpdated: new Date()
        },
        {
          axis: 'TO' as AxisKey,
          kpiName: '직원 역량',
          percentiles: {
            p10: 45, p25: 57, p50: 70, p75: 82, p90: 90, p95: 95
          },
          average: 71,
          stdDev: 14,
          sampleSize: 400,
          lastUpdated: new Date()
        }
      ],
      industryTrends: [
        {
          trend: '고객 경험 중심 전환',
          impact: 'positive',
          description: '개인화된 서비스 제공',
          affectedKPIs: ['서비스 품질', '고객 만족도']
        }
      ],
      bestPractices: [
        {
          title: '고객 여정 매핑',
          description: '전체 고객 경험 최적화',
          applicableKPIs: ['서비스 품질', '고객 만족도'],
          expectedImprovement: '20-30%'
        }
      ]
    });

    return database;
  }

  /**
   * 벤치마크 비교 수행
   */
  async compareToBenchmark(
    data: ProcessedKPIData[],
    context: {
      industry: Industry;
      companySize: CompanySize;
      stage: GrowthStage;
    }
  ): Promise<BenchmarkComparison[]> {
    const comparisons: BenchmarkComparison[] = [];

    // 캐시 확인
    const cacheKey = this.cache.generateStaticKey('benchmark_comparison', context);
    const cached = this.cache.get<BenchmarkComparison[]>(cacheKey);
    if (cached) return cached;

    // 적절한 벤치마크 데이터 찾기
    const benchmarkKey = `${context.industry}_${context.companySize}_${context.stage}`;
    let benchmarkData = this.benchmarkDatabase.get(benchmarkKey);

    // 정확한 매치가 없으면 가장 유사한 벤치마크 찾기
    if (!benchmarkData) {
      benchmarkData = this.findClosestBenchmark(context);
    }

    if (!benchmarkData) {
      console.warn('No benchmark data found for context:', context);
      return comparisons;
    }

    // 각 KPI에 대해 비교 수행
    data.forEach(kpiData => {
      const benchmarkMetric = benchmarkData!.metrics.find(
        m => m.axis === kpiData.axis
      );

      if (benchmarkMetric) {
        const comparison = this.createComparison(
          kpiData,
          benchmarkMetric,
          benchmarkData!
        );
        comparisons.push(comparison);
      }
    });

    // 캐시 저장
    this.cache.set(cacheKey, comparisons, {
      ttlMinutes: 60,
      persistent: true
    });

    return comparisons;
  }

  /**
   * 비교 결과 생성
   */
  private createComparison(
    kpiData: ProcessedKPIData,
    benchmarkMetric: BenchmarkData['metrics'][0],
    benchmarkData: BenchmarkData
  ): BenchmarkComparison {
    const currentScore = kpiData.score || 0;
    const percentile = this.calculatePercentile(currentScore, benchmarkMetric.percentiles);
    const gap = currentScore - benchmarkMetric.average;

    return {
      kpiId: kpiData.kpiId,
      kpiName: kpiData.name,
      axis: kpiData.axis as AxisKey,
      currentScore,
      benchmarks: {
        industry: benchmarkMetric.average,
        percentile,
        gap,
        status: gap > 5 ? 'above' : gap < -5 ? 'below' : 'at',
        recommendation: this.generateBenchmarkRecommendation(
          currentScore,
          percentile,
          benchmarkMetric
        )
      },
      peerComparison: {
        peerAverage: benchmarkMetric.average,
        topPerformer: benchmarkMetric.percentiles.p90,
        bottomPerformer: benchmarkMetric.percentiles.p10,
        yourRank: Math.round((100 - percentile) * benchmarkMetric.sampleSize / 100),
        totalPeers: benchmarkMetric.sampleSize
      },
      historicalTrend: kpiData.previousScore ? {
        previousScore: kpiData.previousScore,
        change: currentScore - kpiData.previousScore,
        changePercent: ((currentScore - kpiData.previousScore) / kpiData.previousScore) * 100,
        trend: currentScore > kpiData.previousScore ? 'improving' :
               currentScore < kpiData.previousScore ? 'declining' : 'stable'
      } : undefined,
      insights: this.generateBenchmarkInsights(
        currentScore,
        percentile,
        benchmarkMetric,
        benchmarkData
      ),
      improvementPotential: {
        targetScore: benchmarkMetric.percentiles.p75,
        estimatedEffort: percentile < 25 ? 'high' : percentile < 50 ? 'medium' : 'low',
        expectedTimeframe: percentile < 25 ? '6-12개월' : percentile < 50 ? '3-6개월' : '1-3개월',
        suggestedActions: this.generateImprovementActions(
          currentScore,
          percentile,
          benchmarkMetric,
          benchmarkData
        )
      }
    };
  }

  /**
   * 백분위 계산
   */
  private calculatePercentile(
    score: number,
    percentiles: BenchmarkData['metrics'][0]['percentiles']
  ): number {
    if (score <= percentiles.p10) return 10;
    if (score <= percentiles.p25) return 10 + (score - percentiles.p10) / (percentiles.p25 - percentiles.p10) * 15;
    if (score <= percentiles.p50) return 25 + (score - percentiles.p25) / (percentiles.p50 - percentiles.p25) * 25;
    if (score <= percentiles.p75) return 50 + (score - percentiles.p50) / (percentiles.p75 - percentiles.p50) * 25;
    if (score <= percentiles.p90) return 75 + (score - percentiles.p75) / (percentiles.p90 - percentiles.p75) * 15;
    if (score <= percentiles.p95) return 90 + (score - percentiles.p90) / (percentiles.p95 - percentiles.p90) * 5;
    return 95;
  }

  /**
   * 벤치마크 기반 추천 생성
   */
  private generateBenchmarkRecommendation(
    currentScore: number,
    percentile: number,
    benchmarkMetric: BenchmarkData['metrics'][0]
  ): string {
    if (percentile >= 90) {
      return '업계 최고 수준을 유지하고 있습니다. 현재 전략을 지속하며 혁신적 접근을 시도하세요.';
    } else if (percentile >= 75) {
      return '상위 그룹에 속합니다. 업계 리더와의 격차를 줄이기 위한 차별화 전략이 필요합니다.';
    } else if (percentile >= 50) {
      return '평균 수준입니다. 벤치마크 분석을 통해 개선 영역을 식별하고 집중하세요.';
    } else if (percentile >= 25) {
      return '평균 이하입니다. 우선순위가 높은 개선 과제를 선정하여 단계적 개선이 필요합니다.';
    } else {
      return '즉각적인 개선이 필요합니다. 근본 원인 분석과 전면적인 개선 계획 수립이 시급합니다.';
    }
  }

  /**
   * 벤치마크 인사이트 생성
   */
  private generateBenchmarkInsights(
    currentScore: number,
    percentile: number,
    benchmarkMetric: BenchmarkData['metrics'][0],
    benchmarkData: BenchmarkData
  ): string[] {
    const insights: string[] = [];

    // 포지션 인사이트
    insights.push(
      `${benchmarkData.industry} 업계 ${benchmarkMetric.sampleSize}개 기업 중 ` +
      `상위 ${(100 - percentile).toFixed(0)}%에 위치합니다.`
    );

    // 격차 인사이트
    const topGap = benchmarkMetric.percentiles.p90 - currentScore;
    if (topGap > 0) {
      insights.push(
        `상위 10% 기업과 ${topGap.toFixed(0)}점 격차가 있습니다.`
      );
    }

    // 트렌드 인사이트
    const relevantTrend = benchmarkData.industryTrends.find(
      t => t.affectedKPIs.includes(benchmarkMetric.kpiName)
    );
    if (relevantTrend) {
      insights.push(
        `업계 트렌드 '${relevantTrend.trend}'가 ` +
        `${relevantTrend.impact === 'positive' ? '긍정적' : '부정적'} 영향을 미치고 있습니다.`
      );
    }

    // 개선 잠재력
    if (percentile < 75) {
      const improvementPotential = benchmarkMetric.percentiles.p75 - currentScore;
      insights.push(
        `상위 25% 수준 도달 시 ${improvementPotential.toFixed(0)}점 개선 가능합니다.`
      );
    }

    return insights;
  }

  /**
   * 개선 액션 생성
   */
  private generateImprovementActions(
    currentScore: number,
    percentile: number,
    benchmarkMetric: BenchmarkData['metrics'][0],
    benchmarkData: BenchmarkData
  ): string[] {
    const actions: string[] = [];

    // 적용 가능한 베스트 프랙티스 찾기
    const applicablePractices = benchmarkData.bestPractices.filter(
      bp => bp.applicableKPIs.includes(benchmarkMetric.kpiName)
    );

    applicablePractices.forEach(practice => {
      actions.push(
        `${practice.title}: ${practice.description} ` +
        `(예상 개선: ${practice.expectedImprovement})`
      );
    });

    // 백분위별 일반 액션
    if (percentile < 25) {
      actions.push('긴급 개선 TF 구성 및 집중 개선 프로그램 실행');
      actions.push('외부 전문가 컨설팅 또는 벤치마킹 투어 검토');
    } else if (percentile < 50) {
      actions.push('상위 수행 기업 사례 연구 및 적용');
      actions.push('개선 목표 설정 및 액션 플랜 수립');
    } else if (percentile < 75) {
      actions.push('지속적 개선 프로세스 구축');
      actions.push('혁신적 접근 방법 테스트');
    }

    return actions;
  }

  /**
   * 가장 유사한 벤치마크 찾기
   */
  private findClosestBenchmark(
    context: {
      industry: Industry;
      companySize: CompanySize;
      stage: GrowthStage;
    }
  ): BenchmarkData | null {
    // 업계 우선 매칭
    for (const [key, data] of this.benchmarkDatabase) {
      if (data.industry === context.industry) {
        return data;
      }
    }

    // 규모 우선 매칭
    for (const [key, data] of this.benchmarkDatabase) {
      if (data.companySize === context.companySize) {
        return data;
      }
    }

    // 첫 번째 데이터 반환 (폴백)
    return this.benchmarkDatabase.values().next().value || null;
  }

  /**
   * 업계 트렌드 분석
   */
  analyzeIndustryTrends(
    industry: Industry
  ): Array<{
    trend: string;
    impact: string;
    recommendations: string[];
  }> {
    const trends: Array<{
      trend: string;
      impact: string;
      recommendations: string[];
    }> = [];

    // 업계별 벤치마크 데이터에서 트렌드 수집
    for (const [key, data] of this.benchmarkDatabase) {
      if (data.industry === industry) {
        data.industryTrends.forEach(trend => {
          trends.push({
            trend: trend.trend,
            impact: trend.description,
            recommendations: [
              `${trend.trend}에 대한 대응 전략 수립`,
              `영향받는 KPI (${trend.affectedKPIs.join(', ')}) 모니터링 강화`,
              trend.impact === 'positive'
                ? '기회 활용을 위한 투자 확대'
                : '리스크 완화 방안 마련'
            ]
          });
        });
      }
    }

    return trends;
  }

  /**
   * 경쟁력 지수 계산
   */
  calculateCompetitivenessIndex(
    comparisons: BenchmarkComparison[]
  ): {
    overall: number;
    byAxis: Record<AxisKey, number>;
    strengths: string[];
    weaknesses: string[];
  } {
    const axisSummary: Record<string, { sum: number; count: number }> = {};
    let overallSum = 0;
    let overallCount = 0;

    comparisons.forEach(comp => {
      const index = comp.benchmarks.percentile;

      if (!axisSummary[comp.axis]) {
        axisSummary[comp.axis] = { sum: 0, count: 0 };
      }

      axisSummary[comp.axis].sum += index;
      axisSummary[comp.axis].count++;

      overallSum += index;
      overallCount++;
    });

    const byAxis: Record<AxisKey, number> = {} as Record<AxisKey, number>;
    Object.entries(axisSummary).forEach(([axis, summary]) => {
      byAxis[axis as AxisKey] = summary.sum / summary.count;
    });

    const strengths = Object.entries(byAxis)
      .filter(([_, index]) => index >= 75)
      .map(([axis]) => `${axis}: 업계 상위 25%`);

    const weaknesses = Object.entries(byAxis)
      .filter(([_, index]) => index < 50)
      .map(([axis]) => `${axis}: 업계 평균 이하`);

    return {
      overall: overallSum / overallCount,
      byAxis,
      strengths,
      weaknesses
    };
  }
}

// 싱글톤 인스턴스
let serviceInstance: IndustryBenchmarkService | null = null;

export function getBenchmarkService(): IndustryBenchmarkService {
  if (!serviceInstance) {
    serviceInstance = new IndustryBenchmarkService();
  }
  return serviceInstance;
}