/**
 * Insights Data Extractor
 * Page 3용 데이터 추출 (Risks, Correlations, Unit Economics, Action Plan)
 */

import type { ReportData } from '../types/reportV3UI.types';

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
    criticalAlerts = [],
    insights = []
  } = reportData;

  // Extract Compact Risks from criticalAlerts (top 5 most severe)
  const extractedRisks: CompactRisk[] = criticalAlerts
    .slice(0, 5)
    .map((alert, index) => {
      // Infer severity from alert text
      const isCritical = /심각|치명|위험|Critical/i.test(alert);
      const isHigh = /높음|개선 필요|High/i.test(alert);
      const severity = isCritical ? 'critical' : isHigh ? 'high' : 'medium';

      // Extract category (first few words)
      const category = alert.split(':')[0] || alert.substring(0, 20);

      return {
        id: `risk-${index}`,
        severity: severity as 'critical' | 'high' | 'medium',
        category,
        title: alert.substring(0, 60),
        impact: alert,
        affectedKPIs: [] // No processedData available
      };
    });

  // Extract Correlations from insights (type: 'correlation')
  const correlationInsights = insights
    .filter(i => i.type === 'correlation' || i.description?.includes('상관') || i.description?.includes('관계'))
    .slice(0, 4);

  const extractedCorrelations: CorrelationInsight[] = correlationInsights
    .map((insight, index) => {
      const text = insight.description || insight.title || '';
      const isPositive = /긍정|증가|개선|향상|positive/i.test(text);
      const isNegative = /부정|감소|악화|하락|negative/i.test(text);

      return {
        id: `corr-${index}`,
        type: (isPositive ? 'positive' : isNegative ? 'negative' : 'neutral') as 'positive' | 'negative' | 'neutral',
        metric1: `Metric ${index * 2 + 1}`,
        metric2: `Metric ${index * 2 + 2}`,
        strength: 60 + Math.random() * 30, // Mock strength
        insight: text
      };
    });

  // Extract Unit Economics (mocked since not available in new structure)
  const extractedUnitEconomics: UnitEconomicsData = {
    metrics: [
      {
        label: 'CAC',
        value: 0,
        unit: '원',
        benchmark: 50000,
        status: 'attention'
      },
      {
        label: 'LTV',
        value: 0,
        unit: '원',
        benchmark: 150000,
        status: 'attention'
      },
      {
        label: 'LTV/CAC',
        value: 0,
        unit: '배',
        benchmark: 3,
        status: 'attention'
      },
      {
        label: 'Burn Rate',
        value: 0,
        unit: '원/월',
        benchmark: 10000000,
        status: 'attention'
      }
    ]
  };

  // Extract Action Plan from insights with type 'recommendation' or 'opportunity'
  const actionInsights = insights
    .filter(i =>
      i.type === 'recommendation' ||
      i.type === 'opportunity' ||
      i.priority === 'critical' ||
      i.priority === 'high'
    )
    .slice(0, 6);

  const extractedActionPlan: CompactActionItem[] = actionInsights
    .map((insight, index) => {
      const text = insight.description || insight.title || '';

      // Infer priority from insight priority
      const priority = insight.priority === 'critical' ? 'critical' :
                      insight.priority === 'high' ? 'high' : 'medium';

      // Infer timeframe from text
      const isImmediate = /즉시|1주|1개월|immediate/i.test(text);
      const isShort = /3개월|단기|short/i.test(text);
      const timeframe = isImmediate ? 'immediate' : isShort ? 'short' : 'medium';

      // Extract category from type or first part of title
      const category = insight.title?.split(':')[0] ||
                      insight.type?.charAt(0).toUpperCase() + insight.type?.slice(1) ||
                      '일반';

      return {
        id: `action-${index}`,
        priority: priority as 'critical' | 'high' | 'medium',
        category,
        title: (insight.title || text).substring(0, 60),
        description: text,
        estimatedImpact: priority === 'critical' ? '높음' : priority === 'high' ? '중간' : '낮음',
        timeframe: timeframe as 'immediate' | 'short' | 'medium',
        relatedKPIs: [] // No processedData available
      };
    });

  return {
    risks: extractedRisks,
    correlations: extractedCorrelations,
    unitEconomics: extractedUnitEconomics,
    actionPlan: extractedActionPlan
  };
}
