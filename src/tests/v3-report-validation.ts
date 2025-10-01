/**
 * V3 Report 시스템 검증 스크립트
 * Phase 3.3: 핵심 시나리오 테스트
 *
 * 이 스크립트는 V3 Report의 주요 기능들을 체계적으로 검증합니다.
 */

import type {
  ReportDataV3,
  ExecutiveSummary,
  RiskAlert,
  CorrelationInsight,
  ProcessedDiagnosisResult
} from '@/types/reportV3.types';

/**
 * 테스트 시나리오 1: 완벽한 스타트업 (고득점)
 */
export function createHighScoreScenario(): ReportDataV3 {
  const mockProcessedData: ProcessedDiagnosisResult[] = [
    {
      id: 'kpi-1',
      kpiName: 'Monthly Recurring Revenue',
      category: 'Finance',
      currentValue: 50000,
      targetValue: 40000,
      unit: 'USD',
      score: 90,
      weight: 3, // Critical
      trend: 'increasing',
      gap: 10000,
      gapPercentage: 25,
      interpretation: '목표 대비 25% 초과 달성',
      priority: 'low',
      suggestedActions: ['현재 성장 궤도 유지', 'ARR 목표 재조정 고려']
    },
    {
      id: 'kpi-2',
      kpiName: 'Customer Acquisition Cost',
      category: 'Growth',
      currentValue: 80,
      targetValue: 100,
      unit: 'USD',
      score: 85,
      weight: 3, // Critical
      trend: 'stable',
      gap: 20,
      gapPercentage: 20,
      interpretation: '목표 대비 효율적인 획득 비용',
      priority: 'low',
      suggestedActions: ['현재 마케팅 채널 유지']
    },
    {
      id: 'kpi-3',
      kpiName: 'Active Users',
      category: 'Product',
      currentValue: 5000,
      targetValue: 4500,
      unit: 'users',
      score: 88,
      weight: 2, // Important
      trend: 'increasing',
      gap: 500,
      gapPercentage: 11,
      interpretation: '목표 초과 달성',
      priority: 'low',
      suggestedActions: ['사용자 경험 개선 지속']
    },
    {
      id: 'kpi-4',
      kpiName: 'Burn Rate',
      category: 'Finance',
      currentValue: 30000,
      targetValue: 40000,
      unit: 'USD/month',
      score: 82,
      weight: 2, // Important
      trend: 'stable',
      gap: 10000,
      gapPercentage: 25,
      interpretation: '효율적인 자본 사용',
      priority: 'low',
      suggestedActions: ['현재 비용 구조 유지']
    }
  ];

  const summary: ExecutiveSummary = {
    overallScore: 86,
    totalKPIs: 4,
    criticalIssuesCount: 0,
    strengths: [
      '매출 목표 25% 초과 달성',
      '효율적인 고객 획득 비용',
      '안정적인 사용자 성장'
    ],
    weaknesses: [],
    topRecommendations: [
      '현재 성장 전략 유지',
      'ARR 목표 상향 조정 검토',
      '추가 성장 기회 발굴'
    ],
    nextSteps: [
      '분기별 목표 재설정',
      '성장 전략 문서화',
      '팀 확장 계획 수립'
    ]
  };

  const risks: RiskAlert[] = [
    {
      severity: 'info',
      title: '순조로운 성장세',
      description: '모든 핵심 지표가 목표를 달성하고 있습니다',
      affectedKPIs: ['kpi-1', 'kpi-2', 'kpi-3'],
      suggestedActions: ['현재 전략 유지', '추가 기회 모색'],
      detectedBy: 'Auto Analysis Engine'
    }
  ];

  const correlations: CorrelationInsight[] = [
    {
      type: 'unit_economics',
      title: 'LTV/CAC 비율',
      description: '6.25배',
      interpretation: 'Unit Economics가 매우 건강합니다 (목표: 3배 이상)',
      score: 92,
      affectedKPIs: ['kpi-1', 'kpi-2'],
      priority: 'low'
    },
    {
      type: 'efficiency',
      title: 'Growth Efficiency',
      description: '1.67',
      interpretation: '효율적인 성장을 달성하고 있습니다',
      score: 88,
      affectedKPIs: ['kpi-1', 'kpi-4'],
      priority: 'low'
    }
  ];

  return {
    metadata: {
      reportId: 'test-high-score',
      generatedAt: new Date().toISOString(),
      userId: 'test-user',
      companyId: 'test-company',
      reportType: 'comprehensive',
      cluster: {
        sector: 'tech',
        stage: 'seed',
        confidence: 0.9
      }
    },
    summary,
    processedData: mockProcessedData,
    analysisResults: {
      risks,
      correlations,
      predictions: []
    },
    benchmarking: {
      sector: 'tech',
      stage: 'seed',
      percentile: 85,
      comparison: 'above_average'
    }
  };
}

/**
 * 테스트 시나리오 2: 위기 스타트업 (저득점)
 */
export function createLowScoreScenario(): ReportDataV3 {
  const mockProcessedData: ProcessedDiagnosisResult[] = [
    {
      id: 'kpi-1',
      kpiName: 'Monthly Recurring Revenue',
      category: 'Finance',
      currentValue: 5000,
      targetValue: 40000,
      unit: 'USD',
      score: 25,
      weight: 3, // Critical
      trend: 'decreasing',
      gap: -35000,
      gapPercentage: -87.5,
      interpretation: '목표 대비 87.5% 미달',
      priority: 'critical',
      suggestedActions: ['긴급 매출 개선 필요', '새로운 수익 모델 검토']
    },
    {
      id: 'kpi-2',
      kpiName: 'Customer Acquisition Cost',
      category: 'Growth',
      currentValue: 250,
      targetValue: 100,
      unit: 'USD',
      score: 30,
      weight: 3, // Critical
      trend: 'increasing',
      gap: -150,
      gapPercentage: -150,
      interpretation: 'CAC가 너무 높습니다',
      priority: 'critical',
      suggestedActions: ['마케팅 채널 최적화 긴급 필요', '비효율 채널 중단']
    },
    {
      id: 'kpi-3',
      kpiName: 'Churn Rate',
      category: 'Product',
      currentValue: 15,
      targetValue: 5,
      unit: '%',
      score: 35,
      weight: 2, // Important
      trend: 'increasing',
      gap: -10,
      gapPercentage: -200,
      interpretation: '높은 이탈률',
      priority: 'critical',
      suggestedActions: ['고객 만족도 긴급 조사', '제품 개선 필요']
    }
  ];

  const summary: ExecutiveSummary = {
    overallScore: 30,
    totalKPIs: 3,
    criticalIssuesCount: 3,
    strengths: [],
    weaknesses: [
      '매출이 목표의 12.5% 수준',
      'CAC가 목표 대비 2.5배',
      '높은 고객 이탈률 (15%)'
    ],
    topRecommendations: [
      '비용 절감을 통한 런웨이 확보',
      '제품-시장 적합성 재검토',
      '핵심 고객군 집중 공략'
    ],
    nextSteps: [
      '긴급 경영진 회의 소집',
      '비용 구조 전면 재검토',
      '피봇 여부 결정'
    ]
  };

  const risks: RiskAlert[] = [
    {
      severity: 'critical',
      title: '생존 위기 경고',
      description: '매출과 고객 획득 비용 모두 위험 수준입니다',
      affectedKPIs: ['kpi-1', 'kpi-2'],
      suggestedActions: [
        '즉시 비용 절감 실행',
        '추가 투자 유치 검토',
        '사업 모델 재설계'
      ],
      detectedBy: 'Critical Threshold Monitor'
    },
    {
      severity: 'critical',
      title: '높은 고객 이탈',
      description: '월 15%의 이탈률은 지속 가능하지 않습니다',
      affectedKPIs: ['kpi-3'],
      suggestedActions: [
        '이탈 고객 인터뷰',
        '제품 핵심 가치 재정의',
        'Onboarding 프로세스 개선'
      ],
      detectedBy: 'Churn Alert System'
    }
  ];

  const correlations: CorrelationInsight[] = [
    {
      type: 'unit_economics',
      title: 'LTV/CAC 비율',
      description: '0.4배',
      interpretation: 'Unit Economics가 매우 나쁩니다 (최소 3배 필요)',
      score: 15,
      affectedKPIs: ['kpi-1', 'kpi-2'],
      priority: 'critical'
    }
  ];

  return {
    metadata: {
      reportId: 'test-low-score',
      generatedAt: new Date().toISOString(),
      userId: 'test-user',
      companyId: 'test-company',
      reportType: 'comprehensive',
      cluster: {
        sector: 'tech',
        stage: 'seed',
        confidence: 0.9
      }
    },
    summary,
    processedData: mockProcessedData,
    analysisResults: {
      risks,
      correlations,
      predictions: []
    },
    benchmarking: {
      sector: 'tech',
      stage: 'seed',
      percentile: 15,
      comparison: 'below_average'
    }
  };
}

/**
 * 테스트 시나리오 3: 불균형 스타트업
 */
export function createImbalancedScenario(): ReportDataV3 {
  const mockProcessedData: ProcessedDiagnosisResult[] = [
    // Finance - 강함
    {
      id: 'kpi-1',
      kpiName: 'Monthly Recurring Revenue',
      category: 'Finance',
      currentValue: 80000,
      targetValue: 50000,
      unit: 'USD',
      score: 95,
      weight: 3,
      trend: 'increasing',
      gap: 30000,
      gapPercentage: 60,
      interpretation: '뛰어난 매출 성장',
      priority: 'low',
      suggestedActions: ['성장 모멘텀 유지']
    },
    // Growth - 강함
    {
      id: 'kpi-2',
      kpiName: 'User Growth Rate',
      category: 'Growth',
      currentValue: 25,
      targetValue: 20,
      unit: '%',
      score: 90,
      weight: 3,
      trend: 'increasing',
      gap: 5,
      gapPercentage: 25,
      interpretation: '탁월한 성장률',
      priority: 'low',
      suggestedActions: ['현재 전략 유지']
    },
    // Operations - 약함
    {
      id: 'kpi-3',
      kpiName: 'System Uptime',
      category: 'Operations',
      currentValue: 92,
      targetValue: 99.9,
      unit: '%',
      score: 35,
      weight: 2,
      trend: 'stable',
      gap: -7.9,
      gapPercentage: -7.9,
      interpretation: '시스템 안정성 부족',
      priority: 'high',
      suggestedActions: ['인프라 개선 필요', 'DevOps 강화']
    },
    // Team - 약함
    {
      id: 'kpi-4',
      kpiName: 'Employee Satisfaction',
      category: 'Team',
      currentValue: 60,
      targetValue: 85,
      unit: 'score',
      score: 40,
      weight: 2,
      trend: 'decreasing',
      gap: -25,
      gapPercentage: -29.4,
      interpretation: '낮은 직원 만족도',
      priority: 'high',
      suggestedActions: ['조직 문화 개선', '복지 제도 보강']
    }
  ];

  const summary: ExecutiveSummary = {
    overallScore: 65,
    totalKPIs: 4,
    criticalIssuesCount: 0,
    strengths: [
      '뛰어난 매출 성장 (목표 대비 60% 초과)',
      '탁월한 사용자 성장률'
    ],
    weaknesses: [
      '시스템 안정성 부족 (92% uptime)',
      '낮은 직원 만족도 (60점)'
    ],
    topRecommendations: [
      'Operations 역량 강화 투자',
      '팀 문화 및 복지 개선',
      '성장과 안정성의 균형 추구'
    ],
    nextSteps: [
      'DevOps 팀 구성 또는 강화',
      '직원 만족도 조사 실시',
      '인프라 안정성 개선 프로젝트 시작'
    ]
  };

  const risks: RiskAlert[] = [
    {
      severity: 'warning',
      title: '성장-안정성 불균형',
      description: '빠른 성장에 비해 운영 안정성이 따라가지 못하고 있습니다',
      affectedKPIs: ['kpi-3'],
      suggestedActions: [
        '인프라 투자 확대',
        '기술 부채 해소',
        'SRE 채용'
      ],
      detectedBy: 'Imbalance Detector'
    },
    {
      severity: 'warning',
      title: '조직 건강도 위험',
      description: '직원 만족도 하락은 장기적 성장에 위험 요소입니다',
      affectedKPIs: ['kpi-4'],
      suggestedActions: [
        '1:1 미팅 강화',
        '복지 제도 점검',
        '커리어 패스 명확화'
      ],
      detectedBy: 'Team Health Monitor'
    }
  ];

  const correlations: CorrelationInsight[] = [
    {
      type: 'growth',
      title: 'Growth-Stability Score',
      description: '불균형',
      interpretation: '성장은 빠르지만 안정성이 부족합니다',
      score: 55,
      affectedKPIs: ['kpi-2', 'kpi-3'],
      priority: 'medium'
    }
  ];

  return {
    metadata: {
      reportId: 'test-imbalanced',
      generatedAt: new Date().toISOString(),
      userId: 'test-user',
      companyId: 'test-company',
      reportType: 'comprehensive',
      cluster: {
        sector: 'tech',
        stage: 'series-a',
        confidence: 0.85
      }
    },
    summary,
    processedData: mockProcessedData,
    analysisResults: {
      risks,
      correlations,
      predictions: []
    },
    benchmarking: {
      sector: 'tech',
      stage: 'series-a',
      percentile: 65,
      comparison: 'average'
    }
  };
}

/**
 * 검증 함수: 데이터 구조 유효성
 */
export function validateReportStructure(report: ReportDataV3): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Metadata 검증
  if (!report.metadata || !report.metadata.reportId) {
    errors.push('Missing metadata or reportId');
  }

  // Summary 검증
  if (!report.summary || typeof report.summary.overallScore !== 'number') {
    errors.push('Invalid summary structure');
  }

  // ProcessedData 검증
  if (!Array.isArray(report.processedData) || report.processedData.length === 0) {
    errors.push('ProcessedData must be a non-empty array');
  }

  // AnalysisResults 검증
  if (!report.analysisResults) {
    errors.push('Missing analysisResults');
  } else {
    if (!Array.isArray(report.analysisResults.risks)) {
      errors.push('analysisResults.risks must be an array');
    }
    if (!Array.isArray(report.analysisResults.correlations)) {
      errors.push('analysisResults.correlations must be an array');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 검증 함수: 점수 범위 및 로직
 */
export function validateScoring(report: ReportDataV3): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Overall Score 범위 (0-100)
  if (report.summary.overallScore < 0 || report.summary.overallScore > 100) {
    errors.push(`Overall score out of range: ${report.summary.overallScore}`);
  }

  // KPI 점수 범위
  report.processedData.forEach((kpi) => {
    if (kpi.score < 0 || kpi.score > 100) {
      errors.push(`KPI ${kpi.id} score out of range: ${kpi.score}`);
    }
  });

  // Correlation Insights 점수
  report.analysisResults.correlations.forEach((corr, idx) => {
    if (corr.score < 0 || corr.score > 100) {
      errors.push(`Correlation ${idx} score out of range: ${corr.score}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 검증 함수: 비즈니스 로직 일관성
 */
export function validateBusinessLogic(report: ReportDataV3): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // 고득점 스타트업은 critical issue가 적어야 함
  if (report.summary.overallScore >= 80 && report.summary.criticalIssuesCount > 2) {
    warnings.push('High score but many critical issues - inconsistent');
  }

  // 저득점 스타트업은 critical issue가 많아야 함
  if (report.summary.overallScore <= 40 && report.summary.criticalIssuesCount === 0) {
    warnings.push('Low score but no critical issues - inconsistent');
  }

  // Critical severity risk는 critical priority KPI와 연관되어야 함
  const criticalRisks = report.analysisResults.risks.filter(
    (r) => r.severity === 'critical'
  );
  const criticalKPIs = report.processedData.filter((kpi) => kpi.priority === 'critical');

  if (criticalRisks.length > 0 && criticalKPIs.length === 0) {
    warnings.push('Critical risks exist but no critical priority KPIs');
  }

  return {
    valid: warnings.length === 0,
    warnings
  };
}

/**
 * 전체 검증 실행
 */
export function runFullValidation() {
  console.log('='.repeat(60));
  console.log('V3 Report System Validation');
  console.log('='.repeat(60));

  const scenarios = [
    { name: 'High Score Startup', data: createHighScoreScenario() },
    { name: 'Low Score Startup', data: createLowScoreScenario() },
    { name: 'Imbalanced Startup', data: createImbalancedScenario() }
  ];

  scenarios.forEach((scenario) => {
    console.log(`\n[Scenario] ${scenario.name}`);
    console.log('-'.repeat(60));

    // 구조 검증
    const structureResult = validateReportStructure(scenario.data);
    console.log(`Structure: ${structureResult.valid ? '✓ PASS' : '✗ FAIL'}`);
    if (structureResult.errors.length > 0) {
      structureResult.errors.forEach((err) => console.log(`  - ${err}`));
    }

    // 점수 검증
    const scoringResult = validateScoring(scenario.data);
    console.log(`Scoring: ${scoringResult.valid ? '✓ PASS' : '✗ FAIL'}`);
    if (scoringResult.errors.length > 0) {
      scoringResult.errors.forEach((err) => console.log(`  - ${err}`));
    }

    // 비즈니스 로직 검증
    const logicResult = validateBusinessLogic(scenario.data);
    console.log(`Business Logic: ${logicResult.valid ? '✓ PASS' : '⚠ WARNING'}`);
    if (logicResult.warnings.length > 0) {
      logicResult.warnings.forEach((warn) => console.log(`  - ${warn}`));
    }

    // 요약 정보
    console.log('\nSummary:');
    console.log(`  Overall Score: ${scenario.data.summary.overallScore}`);
    console.log(`  Total KPIs: ${scenario.data.summary.totalKPIs}`);
    console.log(`  Critical Issues: ${scenario.data.summary.criticalIssuesCount}`);
    console.log(`  Risk Alerts: ${scenario.data.analysisResults.risks.length}`);
    console.log(`  Correlations: ${scenario.data.analysisResults.correlations.length}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('Validation Complete');
  console.log('='.repeat(60));
}

// Export all test data for use in components
export const testScenarios = {
  highScore: createHighScoreScenario(),
  lowScore: createLowScoreScenario(),
  imbalanced: createImbalancedScenario()
};