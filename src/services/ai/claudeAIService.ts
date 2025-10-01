/**
 * Claude AI Service
 * KPI Report V3를 위한 AI 기반 인사이트 생성 서비스
 */

import { SECTOR_NAMES, STAGE_NAMES } from '@/types/reportV3.types';

// AxisKey 타입 정의 (순환 참조 방지)
type AxisKey = 'GO' | 'EC' | 'PT' | 'PF' | 'TO';

interface ExecutiveSummaryData {
  cluster: {
    sector: string;
    stage: string;
  };
  overallScore: number;
  axisScores: Record<AxisKey, number>;
  completionRate: number;
  totalKPIs: number;
}

interface AxisInsightData {
  axisKey: AxisKey;
  axisName: string;
  score: number;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  keyKPIs: Array<{
    name: string;
    score: number;
    weight: string;
  }>;
  peerAverage?: number;
  industryBenchmark?: number;
}

interface KPIInterpretationData {
  kpiName: string;
  currentScore: number;
  targetScore: number;
  axis: AxisKey;
  weight: string;
  historicalData?: Array<{ date: string; score: number }>;
}

interface ActionPlanData {
  axisKey: AxisKey;
  currentScore: number;
  targetScore: number;
  timeframe: string;
  resources?: string[];
  constraints?: string[];
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  timeframe: string;
  owner?: string;
  dependencies?: string[];
}

interface ClaudeResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class ClaudeAIService {
  private apiKey: string;
  private apiUrl = 'https://api.anthropic.com/v1/messages';
  private model = 'claude-3-5-sonnet-20241022';
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheDuration = 24 * 60 * 60 * 1000; // 24시간

  constructor() {
    this.apiKey = import.meta.env.VITE_CLAUDE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ Claude API key not found. AI features will be disabled.');
    }
  }

  /**
   * Executive Summary 생성
   */
  async generateExecutiveSummary(data: ExecutiveSummaryData): Promise<string> {
    const cacheKey = `exec-summary-${data.overallScore}-${JSON.stringify(data.axisScores)}`;

    // 캐시 확인
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('✅ Using cached Executive Summary');
      return cached;
    }

    // 개발 환경에서는 CORS 에러 방지를 위해 바로 fallback 사용
    if (import.meta.env.DEV) {
      const fallback = this.getFallbackExecutiveSummary(data);
      this.setCache(cacheKey, fallback);
      return fallback;
    }

    const prompt = this.buildExecutiveSummaryPrompt(data);

    try {
      const response = await this.callClaude(prompt, 800);
      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      // CORS 오류는 예상된 동작이므로 조용히 fallback 반환
      return this.getFallbackExecutiveSummary(data);
    }
  }

  /**
   * 축별 인사이트 생성
   */
  async generateAxisInsight(data: AxisInsightData): Promise<string> {
    const cacheKey = `axis-insight-${data.axisKey}-${data.score}`;

    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log(`✅ Using cached insight for ${data.axisKey}`);
      return cached;
    }

    // 개발 환경에서는 CORS 에러 방지를 위해 바로 fallback 사용
    if (import.meta.env.DEV) {
      const fallback = this.getFallbackAxisInsight(data);
      this.setCache(cacheKey, fallback);
      return fallback;
    }

    const prompt = this.buildAxisInsightPrompt(data);

    try {
      const response = await this.callClaude(prompt, 500);
      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      console.error(`❌ Failed to generate insight for ${data.axisKey}:`, error);
      return this.getFallbackAxisInsight(data);
    }
  }

  /**
   * 개별 KPI 해석
   */
  async interpretKPI(data: KPIInterpretationData): Promise<string> {
    const cacheKey = `kpi-interpret-${data.kpiName}-${data.currentScore}`;

    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // 개발 환경에서는 CORS 에러 방지를 위해 바로 fallback 사용
    if (import.meta.env.DEV) {
      const fallback = this.getFallbackKPIInterpretation(data);
      this.setCache(cacheKey, fallback);
      return fallback;
    }

    const prompt = this.buildKPIInterpretationPrompt(data);

    try {
      const response = await this.callClaude(prompt, 300);
      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      console.error(`❌ Failed to interpret KPI ${data.kpiName}:`, error);
      return this.getFallbackKPIInterpretation(data);
    }
  }

  /**
   * 액션 플랜 생성
   */
  async generateActionPlan(data: ActionPlanData): Promise<ActionItem[]> {
    const cacheKey = `action-plan-${data.axisKey}-${data.currentScore}`;

    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // 개발 환경에서는 CORS 에러 방지를 위해 바로 fallback 사용
    if (import.meta.env.DEV) {
      const fallback = this.getFallbackActionPlan(data);
      this.setCache(cacheKey, fallback);
      return fallback;
    }

    const prompt = this.buildActionPlanPrompt(data);

    try {
      const response = await this.callClaude(prompt, 1000);
      const actionItems = this.parseActionPlan(response, data.axisKey);
      this.setCache(cacheKey, actionItems);
      return actionItems;
    } catch (error) {
      console.error(`❌ Failed to generate action plan for ${data.axisKey}:`, error);
      return this.getFallbackActionPlan(data);
    }
  }

  /**
   * Claude API 호출
   */
  private async callClaude(prompt: string, maxTokens: number = 1024): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Claude API key not configured');
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const result: ClaudeResponse = await response.json();
    return result.content[0].text;
  }

  /**
   * 프롬프트 빌더 - Executive Summary
   */
  private buildExecutiveSummaryPrompt(data: ExecutiveSummaryData): string {
    const axisNames: Record<AxisKey, string> = {
      'GO': 'Go-to-Market',
      'EC': 'Economics',
      'PT': 'Product & Tech',
      'PF': 'Performance',
      'TO': 'Team & Org'
    };

    return `당신은 스타트업 비즈니스 분석 전문가입니다.
다음 KPI 진단 데이터를 바탕으로 경영진을 위한 전문적인 Executive Summary를 작성해주세요.

**회사 정보**
- 업종: ${SECTOR_NAMES[data.cluster.sector as keyof typeof SECTOR_NAMES] || data.cluster.sector}
- 성장 단계: ${STAGE_NAMES[data.cluster.stage as keyof typeof STAGE_NAMES] || data.cluster.stage}
- 전체 점수: ${data.overallScore.toFixed(0)}/100점
- KPI 완료율: ${data.completionRate.toFixed(0)}% (${data.totalKPIs}개 중)

**축별 점수**
${Object.entries(data.axisScores).map(([axis, score]) =>
  `- ${axisNames[axis as AxisKey]}: ${score.toFixed(0)}/100점`
).join('\n')}

**요구사항**
1. 2-3문단으로 작성 (각 문단 3-4줄)
2. 투자자도 이해할 수 있는 전문적이고 간결한 톤
3. 핵심 강점 1-2개, 핵심 약점 1-2개 명시
4. 구체적인 수치 활용
5. 다음 단계 권장사항 1-2개 포함

**출력 형식**: 순수 텍스트 (마크다운 없음, 제목 없음)`;
  }

  /**
   * 프롬프트 빌더 - Axis Insight
   */
  private buildAxisInsightPrompt(data: AxisInsightData): string {
    const trendText = data.trend === 'up' ? `상승 추세 (+${data.trendValue}점)` :
                      data.trend === 'down' ? `하락 추세 (${data.trendValue}점)` :
                      '안정적 유지';

    return `당신은 스타트업 비즈니스 분석 전문가입니다.
다음 ${data.axisName} 영역의 성과 데이터를 분석하여 인사이트를 작성해주세요.

**영역 정보**
- 영역명: ${data.axisName}
- 현재 점수: ${data.score.toFixed(0)}/100점
- 트렌드: ${trendText}
${data.peerAverage ? `- 피어 평균: ${data.peerAverage.toFixed(0)}점` : ''}
${data.industryBenchmark ? `- 업계 벤치마크: ${data.industryBenchmark.toFixed(0)}점` : ''}

**핵심 KPI**
${data.keyKPIs.slice(0, 3).map(kpi =>
  `- ${kpi.name}: ${kpi.score.toFixed(0)}점 (가중치: ${kpi.weight})`
).join('\n')}

**요구사항**
1. 2-3문장으로 간결하게 작성
2. 현재 성과 평가 + 개선 방향 1가지
3. 구체적인 수치 활용
4. 실행 가능한 조언 포함

**출력 형식**: 순수 텍스트`;
  }

  /**
   * 프롬프트 빌더 - KPI Interpretation
   */
  private buildKPIInterpretationPrompt(data: KPIInterpretationData): string {
    return `당신은 스타트업 KPI 분석 전문가입니다.
다음 KPI의 현재 상태를 해석하고 조언을 제공해주세요.

**KPI 정보**
- 지표명: ${data.kpiName}
- 현재 점수: ${data.currentScore.toFixed(0)}/100점
- 목표 점수: ${data.targetScore.toFixed(0)}점
- 소속 영역: ${data.axis}
- 가중치: ${data.weight}

**요구사항**
1. 1-2문장으로 간결하게 작성
2. 현재 상태 평가 + 개선 방향 1가지
3. 실행 가능한 조언

**출력 형식**: 순수 텍스트`;
  }

  /**
   * 프롬프트 빌더 - Action Plan
   */
  private buildActionPlanPrompt(data: ActionPlanData): string {
    return `당신은 스타트업 전략 컨설턴트입니다.
다음 영역의 개선을 위한 액션 플랜을 작성해주세요.

**영역 정보**
- 영역: ${data.axisKey}
- 현재 점수: ${data.currentScore.toFixed(0)}점
- 목표 점수: ${data.targetScore.toFixed(0)}점
- 기간: ${data.timeframe}
${data.resources ? `- 가용 리소스: ${data.resources.join(', ')}` : ''}
${data.constraints ? `- 제약사항: ${data.constraints.join(', ')}` : ''}

**요구사항**
1. 3-5개의 구체적인 액션 아이템 제안
2. 각 아이템마다 다음 형식으로 작성:
   - 제목 (한 줄)
   - 설명 (2-3줄)
   - 우선순위: high/medium/low
   - 노력: high/medium/low
   - 임팩트: high/medium/low
   - 기간: 예) "2주", "1개월", "분기"

**출력 형식**:
각 액션을 다음 구분자로 구분:
---ACTION---
제목: [제목]
설명: [설명]
우선순위: [high/medium/low]
노력: [high/medium/low]
임팩트: [high/medium/low]
기간: [기간]`;
  }

  /**
   * 액션 플랜 파싱
   */
  private parseActionPlan(response: string, axisKey: AxisKey): ActionItem[] {
    const actions = response.split('---ACTION---').filter(a => a.trim());

    return actions.map((action, index) => {
      const lines = action.trim().split('\n');
      const data: Record<string, string> = {};

      lines.forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
          data[key.trim()] = valueParts.join(':').trim();
        }
      });

      return {
        id: `${axisKey}-action-${index + 1}`,
        title: data['제목'] || `액션 ${index + 1}`,
        description: data['설명'] || '',
        priority: (data['우선순위'] as any) || 'medium',
        effort: (data['노력'] as any) || 'medium',
        impact: (data['임팩트'] as any) || 'medium',
        timeframe: data['기간'] || '1개월'
      };
    });
  }

  /**
   * 캐시 관리
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // 캐시 크기 제한 (최대 100개)
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * Fallback 데이터 - Executive Summary
   */
  private getFallbackExecutiveSummary(data: ExecutiveSummaryData): string {
    const strongAxes = Object.entries(data.axisScores)
      .filter(([_, score]) => score >= 70)
      .map(([axis]) => axis);

    const weakAxes = Object.entries(data.axisScores)
      .filter(([_, score]) => score < 50)
      .map(([axis]) => axis);

    return `${SECTOR_NAMES[data.cluster.sector as keyof typeof SECTOR_NAMES] || data.cluster.sector} 업종의 ${STAGE_NAMES[data.cluster.stage as keyof typeof STAGE_NAMES] || data.cluster.stage} 단계 기업으로서, 전체 점수 ${data.overallScore.toFixed(0)}점을 기록했습니다. ${data.totalKPIs}개 KPI 중 ${Math.round(data.totalKPIs * data.completionRate / 100)}개를 완료하여 ${data.completionRate.toFixed(0)}%의 진행률을 보이고 있습니다.

${strongAxes.length > 0 ? `${strongAxes.join(', ')} 영역에서 강점을 보이고 있으며, ` : ''}${weakAxes.length > 0 ? `${weakAxes.join(', ')} 영역에서 개선이 필요합니다.` : '전반적으로 균형잡힌 성과를 나타내고 있습니다.'}

다음 분기에는 ${weakAxes.length > 0 ? `${weakAxes[0]} 영역 개선에 집중하고, ` : ''}현재 강점을 유지하면서 전체적인 균형을 맞추는 것을 권장합니다.`;
  }

  /**
   * Fallback 데이터 - Axis Insight
   */
  private getFallbackAxisInsight(data: AxisInsightData): string {
    const status = data.score >= 70 ? '우수한' : data.score >= 50 ? '적정한' : '개선이 필요한';
    const comparison = data.peerAverage
      ? data.score > data.peerAverage
        ? `피어 평균(${data.peerAverage.toFixed(0)}점)을 상회하고 있습니다.`
        : `피어 평균(${data.peerAverage.toFixed(0)}점)에 미치지 못하고 있습니다.`
      : '';

    return `${data.axisName} 영역은 현재 ${data.score.toFixed(0)}점으로 ${status} 수준입니다. ${comparison} ${data.keyKPIs[0]?.name || '핵심 지표'}를 중심으로 ${data.score < 70 ? '개선 활동이 필요' : '우수한 성과를 유지'}합니다.`;
  }

  /**
   * Fallback 데이터 - KPI Interpretation
   */
  private getFallbackKPIInterpretation(data: KPIInterpretationData): string {
    const gap = data.targetScore - data.currentScore;
    const status = data.currentScore >= 70 ? '양호한' : data.currentScore >= 50 ? '보통' : '개선이 필요한';

    return `${data.kpiName}은 현재 ${data.currentScore.toFixed(0)}점으로 ${status} 상태입니다. ${gap > 0 ? `목표 달성을 위해 ${gap.toFixed(0)}점 개선이 필요합니다.` : '목표를 달성했습니다.'}`;
  }

  /**
   * Fallback 데이터 - Action Plan
   */
  private getFallbackActionPlan(data: ActionPlanData): ActionItem[] {
    return [
      {
        id: `${data.axisKey}-action-1`,
        title: `${data.axisKey} 영역 현황 분석`,
        description: '현재 상태를 정확히 파악하고 개선이 필요한 세부 항목을 식별합니다.',
        priority: 'high',
        effort: 'low',
        impact: 'medium',
        timeframe: '1주'
      },
      {
        id: `${data.axisKey}-action-2`,
        title: '개선 계획 수립',
        description: '분석 결과를 바탕으로 구체적인 개선 계획과 로드맵을 수립합니다.',
        priority: 'high',
        effort: 'medium',
        impact: 'high',
        timeframe: '2주'
      },
      {
        id: `${data.axisKey}-action-3`,
        title: '실행 및 모니터링',
        description: '계획을 실행하고 주간 단위로 진행 상황을 모니터링합니다.',
        priority: 'medium',
        effort: 'high',
        impact: 'high',
        timeframe: data.timeframe
      }
    ];
  }

  /**
   * 서비스 상태 확인
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ AI cache cleared');
  }
}

// 싱글톤 인스턴스
let claudeServiceInstance: ClaudeAIService | null = null;

export function getClaudeAIService(): ClaudeAIService {
  if (!claudeServiceInstance) {
    claudeServiceInstance = new ClaudeAIService();
  }
  return claudeServiceInstance;
}