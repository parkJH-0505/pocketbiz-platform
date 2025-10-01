/**
 * DataAnalysisEngine
 * Phase 2C: 고급 데이터 분석 엔진
 *
 * 기능:
 * 1. KPI 간 상관관계 분석 (ARPU, Burn Multiple, CAC Payback 등)
 * 2. 위험 신호 자동 탐지 (클러스터별 + 범용)
 * 3. 트렌드 분석 (향후)
 */

import type {
  ProcessedKPIData,
  NumericProcessedValue,
  CorrelationInsight,
  RiskAlert,
  DataAnalysisResult,
  ClusterConfig
} from '@/types/reportV3.types';

class DataAnalysisEngine {
  /**
   * 전체 분석 실행
   */
  analyze(
    processedData: ProcessedKPIData[],
    cluster: ClusterConfig
  ): DataAnalysisResult {
    const correlations = this.analyzeCorrelations(processedData, cluster);
    const risks = this.detectRisks(processedData, cluster);

    return {
      correlations,
      risks,
      generatedAt: new Date()
    };
  }

  /**
   * KPI 간 상관관계 분석
   * 파생 지표 계산 및 해석
   */
  analyzeCorrelations(
    processedData: ProcessedKPIData[],
    cluster: ClusterConfig
  ): CorrelationInsight[] {
    const insights: CorrelationInsight[] = [];

    // 1. ARPU 계산 (사용자당 평균 매출)
    const arpuInsight = this.calculateARPU(processedData, cluster);
    if (arpuInsight) insights.push(arpuInsight);

    // 2. Burn Multiple 계산 (자본 효율성)
    const burnMultipleInsight = this.calculateBurnMultiple(processedData, cluster);
    if (burnMultipleInsight) insights.push(burnMultipleInsight);

    // 3. CAC Payback Period 계산 (고객 확보 비용 회수 기간)
    const cacPaybackInsight = this.calculateCACPayback(processedData, cluster);
    if (cacPaybackInsight) insights.push(cacPaybackInsight);

    // 4. Growth Efficiency 계산 (성장 효율성)
    const growthEfficiencyInsight = this.calculateGrowthEfficiency(processedData, cluster);
    if (growthEfficiencyInsight) insights.push(growthEfficiencyInsight);

    // 5. LTV/CAC 비율 계산 (Unit Economics)
    const unitEconomicsInsight = this.calculateUnitEconomics(processedData, cluster);
    if (unitEconomicsInsight) insights.push(unitEconomicsInsight);

    return insights;
  }

  /**
   * 1. ARPU (Average Revenue Per User) 계산
   * ARPU = MRR / MAU
   */
  private calculateARPU(
    processedData: ProcessedKPIData[],
    cluster: ClusterConfig
  ): CorrelationInsight | null {
    // MAU 또는 활성 사용자 KPI 찾기
    const mauKPI = this.findKPIByKeywords(processedData, [
      'mau',
      '월간 활성',
      '활성 사용자',
      'monthly active',
      '사용자 수'
    ]);

    // MRR 또는 월 매출 KPI 찾기
    const mrrKPI = this.findKPIByKeywords(processedData, [
      'mrr',
      '월 매출',
      '월간 매출',
      'monthly revenue',
      'recurring revenue'
    ]);

    if (!mauKPI || !mrrKPI) return null;

    const mau = this.getNumericValue(mauKPI);
    const mrr = this.getNumericValue(mrrKPI);

    if (mau === null || mrr === null || mau === 0) return null;

    const arpu = mrr / mau;

    // 클러스터별 목표 ARPU
    const targetARPU = this.getTargetARPU(cluster);
    const score = Math.min(100, (arpu / targetARPU) * 100);

    return {
      type: 'derived_metric',
      title: '사용자당 평균 매출 (ARPU)',
      description: this.formatCurrency(arpu),
      interpretation: this.interpretARPU(arpu, targetARPU, cluster),
      priority: score < 50 ? 'high' : score < 75 ? 'medium' : 'low',
      affectedKPIs: [mauKPI.kpi.kpi_id, mrrKPI.kpi.kpi_id],
      score
    };
  }

  /**
   * 2. Burn Multiple 계산
   * Burn Multiple = Burn Rate / Net New ARR
   * (낮을수록 좋음 - 자본 효율이 높음)
   */
  private calculateBurnMultiple(
    processedData: ProcessedKPIData[],
    cluster: ClusterConfig
  ): CorrelationInsight | null {
    const burnRateKPI = this.findKPIByKeywords(processedData, [
      'burn',
      'burn rate',
      '번 레이트',
      '소진율',
      '월 소진'
    ]);

    const arrKPI = this.findKPIByKeywords(processedData, [
      'arr',
      'annual recurring',
      '연간 매출',
      'mrr 성장'
    ]);

    if (!burnRateKPI || !arrKPI) return null;

    const burnRate = this.getNumericValue(burnRateKPI);
    const netNewARR = this.getNumericValue(arrKPI);

    if (burnRate === null || netNewARR === null || netNewARR === 0) return null;

    const burnMultiple = burnRate / netNewARR;

    // Burn Multiple 평가 (낮을수록 좋음)
    let score: number;
    let priority: 'critical' | 'high' | 'medium' | 'low';

    if (burnMultiple < 1.5) {
      score = 90;
      priority = 'low';
    } else if (burnMultiple < 3) {
      score = 70;
      priority = 'medium';
    } else {
      score = 40;
      priority = 'high';
    }

    return {
      type: 'derived_metric',
      title: 'Burn Multiple (자본 효율성)',
      description: `${burnMultiple.toFixed(2)}x`,
      interpretation: this.interpretBurnMultiple(burnMultiple),
      priority,
      affectedKPIs: [burnRateKPI.kpi.kpi_id, arrKPI.kpi.kpi_id],
      score
    };
  }

  /**
   * 3. CAC Payback Period 계산
   * CAC Payback = CAC / ARPU (월 단위)
   */
  private calculateCACPayback(
    processedData: ProcessedKPIData[],
    cluster: ClusterConfig
  ): CorrelationInsight | null {
    const cacKPI = this.findKPIByKeywords(processedData, [
      'cac',
      '고객 확보 비용',
      'customer acquisition cost',
      '획득 비용'
    ]);

    const arpuKPI = this.findKPIByKeywords(processedData, [
      'arpu',
      '사용자당 매출',
      'average revenue per user'
    ]);

    if (!cacKPI || !arpuKPI) return null;

    const cac = this.getNumericValue(cacKPI);
    const arpu = this.getNumericValue(arpuKPI);

    if (cac === null || arpu === null || arpu === 0) return null;

    const paybackMonths = cac / arpu;

    // CAC Payback 평가
    let score: number;
    let priority: 'critical' | 'high' | 'medium' | 'low';

    if (paybackMonths <= 12) {
      score = 90;
      priority = 'low';
    } else if (paybackMonths <= 18) {
      score = 70;
      priority = 'medium';
    } else if (paybackMonths <= 24) {
      score = 50;
      priority = 'high';
    } else {
      score = 30;
      priority = 'critical';
    }

    return {
      type: 'derived_metric',
      title: 'CAC Payback Period (회수 기간)',
      description: `${paybackMonths.toFixed(1)}개월`,
      interpretation: this.interpretCACPayback(paybackMonths),
      priority,
      affectedKPIs: [cacKPI.kpi.kpi_id, arpuKPI.kpi.kpi_id],
      score
    };
  }

  /**
   * 4. Growth Efficiency 계산
   * Growth Efficiency = 성장률 / Burn Rate
   */
  private calculateGrowthEfficiency(
    processedData: ProcessedKPIData[],
    cluster: ClusterConfig
  ): CorrelationInsight | null {
    const growthRateKPI = this.findKPIByKeywords(processedData, [
      '성장률',
      'growth rate',
      '증가율',
      '성장'
    ]);

    const burnRateKPI = this.findKPIByKeywords(processedData, [
      'burn',
      'burn rate',
      '번 레이트',
      '소진'
    ]);

    if (!growthRateKPI || !burnRateKPI) return null;

    const growthRate = this.getNumericValue(growthRateKPI);
    const burnRate = this.getNumericValue(burnRateKPI);

    if (growthRate === null || burnRate === null || burnRate === 0) return null;

    const efficiency = (growthRate / burnRate) * 100;

    // Growth Efficiency 평가
    let score: number;
    let priority: 'critical' | 'high' | 'medium' | 'low';

    if (efficiency > 2) {
      score = 90;
      priority = 'low';
    } else if (efficiency > 1) {
      score = 70;
      priority = 'medium';
    } else if (efficiency > 0.5) {
      score = 40;
      priority = 'high';
    } else {
      score = 20;
      priority = 'critical';
    }

    return {
      type: 'correlation',
      title: 'Growth Efficiency (성장 효율성)',
      description: `성장률 ${growthRate.toFixed(0)}% / Burn $${(burnRate / 1000).toFixed(0)}K`,
      interpretation: this.interpretGrowthEfficiency(efficiency),
      priority,
      affectedKPIs: [growthRateKPI.kpi.kpi_id, burnRateKPI.kpi.kpi_id],
      score
    };
  }

  /**
   * 5. Unit Economics (LTV/CAC 비율) 계산
   */
  private calculateUnitEconomics(
    processedData: ProcessedKPIData[],
    cluster: ClusterConfig
  ): CorrelationInsight | null {
    const cacKPI = this.findKPIByKeywords(processedData, [
      'cac',
      '고객 확보 비용',
      'customer acquisition cost'
    ]);

    const ltvKPI = this.findKPIByKeywords(processedData, [
      'ltv',
      'lifetime value',
      '고객 생애 가치',
      '생애가치'
    ]);

    if (!cacKPI || !ltvKPI) return null;

    const cac = this.getNumericValue(cacKPI);
    const ltv = this.getNumericValue(ltvKPI);

    if (cac === null || ltv === null || cac === 0) return null;

    const ratio = ltv / cac;

    // LTV/CAC 비율 평가 (3:1 이상이 권장)
    let score: number;
    let priority: 'critical' | 'high' | 'medium' | 'low';

    if (ratio >= 3) {
      score = 90;
      priority = 'low';
    } else if (ratio >= 2) {
      score = 60;
      priority = 'medium';
    } else if (ratio >= 1) {
      score = 30;
      priority = 'high';
    } else {
      score = 10;
      priority = 'critical';
    }

    return {
      type: 'unit_economics',
      title: 'LTV/CAC 비율 (Unit Economics)',
      description: `${ratio.toFixed(1)}:1`,
      interpretation: this.interpretUnitEconomics(ratio),
      priority,
      affectedKPIs: [cacKPI.kpi.kpi_id, ltvKPI.kpi.kpi_id],
      score
    };
  }

  /**
   * 위험 신호 탐지
   */
  detectRisks(
    processedData: ProcessedKPIData[],
    cluster: ClusterConfig
  ): RiskAlert[] {
    const risks: RiskAlert[] = [];

    // 범용 위험 패턴 탐지
    risks.push(...this.detectUniversalRisks(processedData, cluster));

    return risks;
  }

  /**
   * 범용 위험 탐지 (모든 클러스터 공통)
   */
  private detectUniversalRisks(
    processedData: ProcessedKPIData[],
    cluster: ClusterConfig
  ): RiskAlert[] {
    const risks: RiskAlert[] = [];

    // 1. 고위험 KPI 다수 발견
    const highRiskKPIs = processedData.filter(
      (d) => d.insights.riskLevel === 'high'
    );

    if (highRiskKPIs.length >= 3) {
      risks.push({
        severity: 'critical',
        title: '다수의 고위험 지표 발견',
        description: `${highRiskKPIs.length}개의 KPI가 고위험 상태입니다. 전반적인 비즈니스 건강도 점검이 필요합니다.`,
        affectedKPIs: highRiskKPIs.map((d) => d.kpi.kpi_id),
        suggestedActions: [
          '가장 중요한 3개 지표에 집중',
          '주간 모니터링 및 개선 계획 수립',
          '필요 시 외부 멘토/어드바이저 자문'
        ],
        detectedBy: 'Universal Risk Detector'
      });
    }

    // 2. Critical KPI 점수 낮음
    const criticalKPIs = processedData.filter((d) => d.weight.level === 'x3');
    const lowScoreCritical = criticalKPIs.filter(
      (d) => (d.processedValue.normalizedScore || 0) < 50
    );

    if (lowScoreCritical.length > 0) {
      risks.push({
        severity: 'critical',
        title: '핵심 지표 부진',
        description: `x3 가중치의 핵심 지표 ${lowScoreCritical.length}개가 50점 미만입니다. 즉각적인 대응이 필요합니다.`,
        affectedKPIs: lowScoreCritical.map((d) => d.kpi.kpi_id),
        suggestedActions: [
          '핵심 지표부터 우선 개선',
          '다른 작업은 잠시 보류하고 집중',
          '주간 진도 체크 및 조정'
        ],
        detectedBy: 'Universal Risk Detector'
      });
    }

    // 3. 조직 안정성 위험 (Team & Org 축이 매우 낮을 때)
    const teamKPIs = processedData.filter((kpi) => kpi.kpi.axis === 'TO');
    if (teamKPIs.length > 0) {
      const teamScore =
        teamKPIs.reduce(
          (sum, kpi) => sum + (kpi.processedValue.normalizedScore || 0),
          0
        ) / teamKPIs.length;

      if (teamScore < 40) {
        risks.push({
          severity: 'warning',
          title: '조직 역량 부족',
          description: `Team & Org 점수 ${teamScore.toFixed(
            0
          )}점으로 심각한 수준입니다. 조직 역량 강화가 필요합니다.`,
          affectedKPIs: teamKPIs.map((kpi) => kpi.kpi.kpi_id),
          suggestedActions: [
            '핵심 인재 즉시 채용',
            '기존 팀원 이탈 방지 대책',
            '성과관리 시스템 구축',
            '조직문화 개선 프로그램'
          ],
          detectedBy: 'Universal Risk Detector'
        });
      }
    }

    // 4. Unit Economics 위험 (LTV/CAC < 2)
    const unitEconomicsInsight = this.calculateUnitEconomics(processedData, cluster);
    if (unitEconomicsInsight && unitEconomicsInsight.score < 60) {
      const ratio = parseFloat(unitEconomicsInsight.description.split(':')[0]);

      risks.push({
        severity: ratio < 1 ? 'critical' : 'warning',
        title: 'Unit Economics 위험',
        description: `LTV/CAC 비율이 ${ratio.toFixed(
          1
        )}:1로 권장 기준(3:1) 미달입니다.`,
        affectedKPIs: unitEconomicsInsight.affectedKPIs,
        suggestedActions: [
          'CAC 감소 전략 수립 (마케팅 효율화)',
          'LTV 증대 방안 모색 (Upsell, Cross-sell, Churn 감소)',
          'Unit Economics 개선 전까지 확장 보류'
        ],
        detectedBy: 'Unit Economics Analyzer'
      });
    }

    return risks;
  }

  // ========== 헬퍼 함수 ==========

  /**
   * 키워드로 KPI 찾기
   */
  private findKPIByKeywords(
    data: ProcessedKPIData[],
    keywords: string[]
  ): ProcessedKPIData | undefined {
    return data.find((item) => {
      const searchText = `${item.kpi.name} ${item.kpi.question}`.toLowerCase();
      return keywords.some((keyword) =>
        searchText.includes(keyword.toLowerCase())
      );
    });
  }

  /**
   * 숫자형 값 추출
   */
  private getNumericValue(item: ProcessedKPIData): number | null {
    if (item.processedValue.type === 'numeric') {
      return (item.processedValue as NumericProcessedValue).rawValue;
    }
    return null;
  }

  /**
   * 클러스터별 목표 ARPU 반환
   */
  private getTargetARPU(cluster: ClusterConfig): number {
    const sector = cluster.sector;

    if (sector === 'S-1') return 50000; // B2B SaaS: $50
    if (sector === 'S-2') return 10000; // B2C: $10
    if (sector === 'S-3') return 30000; // 이커머스: $30
    if (sector === 'S-4') return 80000; // 핀테크: $80
    if (sector === 'S-5') return 100000; // 헬스케어: $100

    return 50000; // 기본값
  }

  /**
   * 통화 포맷팅
   */
  private formatCurrency(amount: number): string {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M원`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K원`;
    }
    return `${amount.toFixed(0)}원`;
  }

  // ========== 해석 함수 ==========

  private interpretARPU(arpu: number, target: number, cluster: ClusterConfig): string {
    if (arpu >= target) {
      return `${this.formatCurrency(arpu)}는 건강한 수준입니다. 효과적인 수익화가 이루어지고 있습니다.`;
    } else if (arpu >= target * 0.7) {
      return `${this.formatCurrency(arpu)}는 양호하나 개선 여지가 있습니다. 목표는 ${this.formatCurrency(
        target
      )} 이상입니다.`;
    } else {
      return `${this.formatCurrency(arpu)}는 개선이 필요합니다. 목표 ${this.formatCurrency(
        target
      )}를 위해 Upsell 전략과 프리미엄 기능 강화를 검토하세요.`;
    }
  }

  private interpretBurnMultiple(burnMultiple: number): string {
    if (burnMultiple < 1.5) {
      return `Burn Multiple ${burnMultiple.toFixed(
        2
      )}는 매우 효율적입니다. 자본 효율이 높아 공격적 투자가 가능합니다.`;
    } else if (burnMultiple < 3) {
      return `Burn Multiple ${burnMultiple.toFixed(
        2
      )}는 적절한 수준입니다. 지속 가능한 성장이 가능하나 효율화 여지가 있습니다.`;
    } else {
      return `Burn Multiple ${burnMultiple.toFixed(
        2
      )}는 높습니다. 비용 효율성 개선이 필요하며, 성장 대비 자본 소진이 과도합니다.`;
    }
  }

  private interpretCACPayback(paybackMonths: number): string {
    if (paybackMonths <= 12) {
      return `${paybackMonths.toFixed(
        1
      )}개월은 우수한 회수 기간입니다. 고객 확보 비용이 빠르게 회수되고 있습니다.`;
    } else if (paybackMonths <= 18) {
      return `${paybackMonths.toFixed(
        1
      )}개월은 양호한 수준입니다. 12개월 이내로 단축하면 더욱 건강한 구조가 됩니다.`;
    } else {
      return `${paybackMonths.toFixed(
        1
      )}개월은 길다고 볼 수 있습니다. 12개월 이내가 이상적이며, CAC 절감 또는 ARPU 증대가 필요합니다.`;
    }
  }

  private interpretGrowthEfficiency(efficiency: number): string {
    if (efficiency > 2) {
      return '매우 효율적으로 성장하고 있습니다. 적은 자본으로 높은 성장을 달성하고 있어 투자자들이 선호하는 구조입니다.';
    } else if (efficiency > 1) {
      return '적절한 성장 효율성을 보이고 있습니다. 성장과 자본 소진의 균형이 맞춰져 있으나, 더 효율적인 성장 여지가 있습니다.';
    } else {
      return '성장 대비 비용이 높습니다. 효율성 개선이 필요하며, 마케팅/세일즈 프로세스 최적화를 검토하세요.';
    }
  }

  private interpretUnitEconomics(ratio: number): string {
    if (ratio >= 3) {
      return `우수한 Unit Economics입니다 (권장: 3:1 이상). LTV가 CAC의 ${ratio.toFixed(
        1
      )}배로, 공격적 마케팅 투자가 가능합니다.`;
    } else if (ratio >= 2) {
      return `양호한 수준이나 개선 여지가 있습니다. LTV/CAC 비율 ${ratio.toFixed(
        1
      )}:1을 3:1 이상으로 개선하면 더욱 건강한 구조가 됩니다.`;
    } else {
      return `⚠️ 지속가능하지 않은 구조입니다. LTV/CAC 비율 ${ratio.toFixed(
        1
      )}:1은 권장 기준(3:1)에 크게 미달하며, Unit Economics 개선이 최우선 과제입니다.`;
    }
  }
}

// 싱글톤 인스턴스
export const dataAnalysisEngine = new DataAnalysisEngine();