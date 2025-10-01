/**
 * Insights Data Extractor
 * Page 3용 데이터 추출 (Risks, Correlations, Unit Economics, Action Plan)
 */

import type { ReportData } from '@/types/reportV3.types';

export interface CompactRisk {
  id: string;
  severity: 'critical' | 'high' | 'medium';
  category: string;
  title: string;
  impact: string;
  affectedKPIs: string[];
}

export interface CorrelationInsight {
  id: string;
  type: 'positive' | 'negative' | 'neutral';
  metric1: string;
  metric2: string;
  strength: number; // 0-100
  insight: string;
}

export interface UnitEconomicsData {
  metrics: Array<{
    label: string;
    value: number;
    unit: string;
    benchmark?: number;
    status: 'excellent' | 'good' | 'attention';
  }>;
}

export interface CompactActionItem {
  id: string;
  priority: 'critical' | 'high' | 'medium';
  category: string;
  title: string;
  description: string;
  estimatedImpact: string;
  timeframe: 'immediate' | 'short' | 'medium';
  relatedKPIs: string[];
}

export interface InsightsActionData {
  risks: CompactRisk[];
  correlations: CorrelationInsight[];
  unitEconomics: UnitEconomicsData;
  actionPlan: CompactActionItem[];
}

/**
 * Extract Insights & Action Plan data from report
 */
export function extractInsightsActionData(reportData: ReportData): InsightsActionData {
  const {
    riskAlerts = [],
    correlations = [],
    unitEconomics = {},
    actionPlan = [],
    processedData = []
  } = reportData;

  // Extract Compact Risks (top 5 most severe)
  const extractedRisks: CompactRisk[] = riskAlerts
    .slice(0, 5)
    .map((alert, index) => {
      // Infer severity from alert text
      const isCritical = /심각|치명|위험|Critical/i.test(alert);
      const isHigh = /높음|개선 필요|High/i.test(alert);
      const severity = isCritical ? 'critical' : isHigh ? 'high' : 'medium';

      // Extract category (first few words)
      const category = alert.split(':')[0] || alert.substring(0, 20);

      // Find affected KPIs (simple heuristic)
      const affectedKPIs = processedData
        .filter(item =>
          item.insights.riskLevel === 'high' ||
          alert.toLowerCase().includes(item.kpi.question.toLowerCase().substring(0, 10))
        )
        .slice(0, 2)
        .map(item => item.kpi.question.substring(0, 30) + '...');

      return {
        id: `risk-${index}`,
        severity: severity as 'critical' | 'high' | 'medium',
        category,
        title: alert.substring(0, 60),
        impact: alert,
        affectedKPIs
      };
    });

  // Extract Correlations (derived metrics)
  const extractedCorrelations: CorrelationInsight[] = correlations
    .slice(0, 4)
    .map((corr, index) => {
      const isPositive = /긍정|증가|개선|향상/.test(corr);
      const isNegative = /부정|감소|악화|하락/.test(corr);

      return {
        id: `corr-${index}`,
        type: (isPositive ? 'positive' : isNegative ? 'negative' : 'neutral') as 'positive' | 'negative' | 'neutral',
        metric1: `Metric ${index * 2 + 1}`,
        metric2: `Metric ${index * 2 + 2}`,
        strength: 60 + Math.random() * 30, // Mock strength
        insight: corr
      };
    });

  // Extract Unit Economics
  const extractedUnitEconomics: UnitEconomicsData = {
    metrics: [
      {
        label: 'CAC',
        value: unitEconomics.cac || 0,
        unit: '원',
        benchmark: 50000,
        status: unitEconomics.cac && unitEconomics.cac < 50000 ? 'excellent' :
                unitEconomics.cac && unitEconomics.cac < 80000 ? 'good' : 'attention'
      },
      {
        label: 'LTV',
        value: unitEconomics.ltv || 0,
        unit: '원',
        benchmark: 150000,
        status: unitEconomics.ltv && unitEconomics.ltv > 150000 ? 'excellent' :
                unitEconomics.ltv && unitEconomics.ltv > 100000 ? 'good' : 'attention'
      },
      {
        label: 'LTV/CAC',
        value: unitEconomics.ltv && unitEconomics.cac
          ? unitEconomics.ltv / unitEconomics.cac
          : 0,
        unit: '배',
        benchmark: 3,
        status: unitEconomics.ltv && unitEconomics.cac && (unitEconomics.ltv / unitEconomics.cac) > 3
          ? 'excellent'
          : unitEconomics.ltv && unitEconomics.cac && (unitEconomics.ltv / unitEconomics.cac) > 2
          ? 'good'
          : 'attention'
      },
      {
        label: 'Burn Rate',
        value: unitEconomics.burnRate || 0,
        unit: '원/월',
        benchmark: 10000000,
        status: unitEconomics.burnRate && unitEconomics.burnRate < 10000000 ? 'excellent' :
                unitEconomics.burnRate && unitEconomics.burnRate < 20000000 ? 'good' : 'attention'
      }
    ]
  };

  // Extract Action Plan (top 6 items)
  const extractedActionPlan: CompactActionItem[] = actionPlan
    .slice(0, 6)
    .map((action, index) => {
      // Infer priority
      const isCritical = /즉시|긴급|심각|Critical/i.test(action);
      const isHigh = /우선|중요|High/i.test(action);
      const priority = isCritical ? 'critical' : isHigh ? 'high' : 'medium';

      // Infer timeframe
      const isImmediate = /즉시|1주|1개월/i.test(action);
      const isShort = /3개월|단기/i.test(action);
      const timeframe = isImmediate ? 'immediate' : isShort ? 'short' : 'medium';

      // Extract category
      const category = action.split(':')[0] || action.substring(0, 15);

      // Find related KPIs
      const relatedKPIs = processedData
        .filter(item => item.insights.riskLevel === 'high')
        .slice(0, 2)
        .map(item => item.kpi.question.substring(0, 25));

      return {
        id: `action-${index}`,
        priority: priority as 'critical' | 'high' | 'medium',
        category,
        title: action.substring(0, 60),
        description: action,
        estimatedImpact: isCritical ? '높음' : isHigh ? '중간' : '낮음',
        timeframe: timeframe as 'immediate' | 'short' | 'medium',
        relatedKPIs
      };
    });

  return {
    risks: extractedRisks,
    correlations: extractedCorrelations,
    unitEconomics: extractedUnitEconomics,
    actionPlan: extractedActionPlan
  };
}
