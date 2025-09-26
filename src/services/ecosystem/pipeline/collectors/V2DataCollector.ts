/**
 * V2 System Data Collector
 * V2 시스템의 데이터를 수집하는 전용 수집기
 */

import { BaseDataCollector } from '../DataCollector';
import type {
  CollectionConfig,
  CollectionResult,
  RawDataRecord,
  V2SystemData,
  V2ScenarioData,
  V2RecommendationData,
  V2SimulationData,
  DataQuality
} from '../types';
import type { AxisKey } from '../../../../types/buildup.types';

export class V2DataCollector extends BaseDataCollector {
  private mockV2Data: V2SystemData;

  constructor() {
    super('v2-system', 'v2');
    this.initializeMockData();
  }

  /**
   * V2 시스템에서 데이터 수집
   */
  async collect(config: CollectionConfig): Promise<CollectionResult> {
    this.currentConfig = config;
    return this.executeCollection(config);
  }

  /**
   * 실제 V2 데이터 추출
   */
  protected async extractData(config: CollectionConfig): Promise<RawDataRecord[]> {
    const records: RawDataRecord[] = [];
    const collectedAt = new Date();

    // 배치 모드와 실시간 모드에 따른 처리
    if (config.mode === 'batch' || config.mode === 'hybrid') {
      // 배치 수집: 전체 데이터 수집
      records.push(...await this.extractBatchData(collectedAt));
    }

    if (config.mode === 'realtime' || config.mode === 'hybrid') {
      // 실시간 수집: 최근 변경사항만 수집
      records.push(...await this.extractRealtimeData(collectedAt));
    }

    return records;
  }

  /**
   * 배치 데이터 추출
   */
  private async extractBatchData(collectedAt: Date): Promise<RawDataRecord[]> {
    const records: RawDataRecord[] = [];

    // 시나리오 데이터 수집
    for (const scenario of this.mockV2Data.scenarios) {
      records.push(this.createRecord('scenario', scenario, collectedAt));
    }

    // KPI 점수 데이터 수집
    records.push(this.createRecord('kpi-scores', this.mockV2Data.kpiScores, collectedAt));

    // 추천사항 데이터 수집
    for (const recommendation of this.mockV2Data.recommendations) {
      records.push(this.createRecord('recommendation', recommendation, collectedAt));
    }

    // 시뮬레이션 데이터 수집
    for (const simulation of this.mockV2Data.simulations) {
      records.push(this.createRecord('simulation', simulation, collectedAt));
    }

    return records;
  }

  /**
   * 실시간 데이터 추출 (변경사항만)
   */
  private async extractRealtimeData(collectedAt: Date): Promise<RawDataRecord[]> {
    const records: RawDataRecord[] = [];
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // 최근 5분 내 변경된 시나리오만 수집
    const recentScenarios = this.mockV2Data.scenarios.filter(
      scenario => scenario.updatedAt > fiveMinutesAgo
    );

    for (const scenario of recentScenarios) {
      records.push(this.createRecord('scenario', scenario, collectedAt, 'realtime'));
    }

    // 최근 추천사항 수집
    const recentRecommendations = this.mockV2Data.recommendations.filter(
      rec => rec.createdAt > fiveMinutesAgo
    );

    for (const recommendation of recentRecommendations) {
      records.push(this.createRecord('recommendation', recommendation, collectedAt, 'realtime'));
    }

    return records;
  }

  /**
   * 레코드 생성 헬퍼
   */
  private createRecord(
    dataType: string,
    data: any,
    collectedAt: Date,
    mode: 'batch' | 'realtime' = 'batch'
  ): RawDataRecord {
    const recordData = {
      type: dataType,
      ...data
    };

    const serializedData = JSON.stringify(recordData);
    const checksum = this.calculateChecksum(serializedData);

    return {
      id: `v2_${dataType}_${data.id || Date.now()}_${mode}`,
      sourceId: this.sourceId,
      sourceType: 'v2',
      collectedAt,
      data: recordData,
      metadata: {
        version: '1.0.0',
        checksum,
        size: serializedData.length,
        format: 'json'
      },
      quality: this.assessDataQuality(recordData)
    };
  }

  /**
   * 데이터 품질 평가
   */
  private assessDataQuality(data: any): DataQuality {
    let score = 100;

    // 필수 필드 체크
    if (!data.id) score -= 30;
    if (!data.createdAt && !data.updatedAt) score -= 20;

    // 데이터 타입별 특수 검증
    if (data.type === 'scenario') {
      if (!data.name || !data.keyActions || !data.projectedScores) score -= 25;
      if (data.keyActions?.length === 0) score -= 15;
    }

    if (data.type === 'recommendation') {
      if (!data.title || !data.targetAxis || !data.actionItems) score -= 25;
      if (data.confidence < 0.5) score -= 10;
    }

    // 품질 등급 결정
    if (score >= 90) return 'high';
    if (score >= 70) return 'medium';
    if (score >= 50) return 'low';
    return 'corrupted';
  }

  /**
   * 체크섬 계산
   */
  private calculateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit integer로 변환
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * V2 시스템 헬스 체크
   */
  protected async performHealthCheck(): Promise<void> {
    // V2 시스템 상태 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 200));

    // 실제 구현에서는 V2 API 엔드포인트 체크
    const isV2Available = true; // 실제로는 API 호출 결과

    if (!isV2Available) {
      throw new Error('V2 system is not responding');
    }

    // 데이터 일관성 체크
    if (this.mockV2Data.scenarios.length === 0) {
      throw new Error('No scenario data available');
    }
  }

  /**
   * Mock 데이터 초기화
   */
  private initializeMockData(): void {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    this.mockV2Data = {
      scenarios: [
        {
          id: 'scenario-001',
          name: '고객 획득 최적화',
          description: '마케팅 채널 다각화를 통한 고객 획득률 개선',
          projectedScores: {
            GO: 85,
            EC: 78,
            PT: 82,
            PF: 75,
            TO: 80
          },
          keyActions: [
            '소셜미디어 마케팅 강화',
            '인플루언서 협업 확대',
            '고객 추천 프로그램 도입'
          ],
          timeline: '2개월',
          priority: 'high',
          status: 'active',
          createdAt: oneHourAgo,
          updatedAt: now,
          tags: ['marketing', 'growth', 'optimization'],
          estimatedEffort: 8,
          expectedROI: 150
        },
        {
          id: 'scenario-002',
          name: '운영 효율성 향상',
          description: '자동화 도구 도입을 통한 운영 프로세스 최적화',
          projectedScores: {
            GO: 72,
            EC: 88,
            PT: 85,
            PF: 90,
            TO: 85
          },
          keyActions: [
            'CRM 시스템 업그레이드',
            '업무 자동화 도구 도입',
            '팀 교육 프로그램 실시'
          ],
          timeline: '3개월',
          priority: 'medium',
          status: 'draft',
          createdAt: oneHourAgo,
          updatedAt: oneHourAgo,
          tags: ['automation', 'efficiency', 'process'],
          estimatedEffort: 6,
          expectedROI: 120
        }
      ],
      kpiScores: {
        GO: 70,
        EC: 75,
        PT: 78,
        PF: 65,
        TO: 72
      },
      recommendations: [
        {
          id: 'rec-001',
          title: '고객 피드백 시스템 구축',
          description: '체계적인 고객 피드백 수집 및 분석 시스템 도입',
          targetAxis: 'PT',
          expectedImpact: 8,
          priority: 'high',
          timeframe: 'medium',
          actionItems: [
            '피드백 수집 도구 선정',
            '분석 대시보드 구축',
            '팀 교육 실시'
          ],
          confidence: 0.85,
          createdAt: now
        },
        {
          id: 'rec-002',
          title: '팀 커뮤니케이션 개선',
          description: '협업 도구 도입 및 커뮤니케이션 프로세스 정립',
          targetAxis: 'TO',
          expectedImpact: 12,
          priority: 'medium',
          timeframe: 'short',
          actionItems: [
            'Slack 워크스페이스 구축',
            '정기 회의 체계 수립',
            '문서화 표준 정립'
          ],
          confidence: 0.92,
          createdAt: oneHourAgo
        }
      ],
      simulations: [
        {
          id: 'sim-001',
          scenarioId: 'scenario-001',
          inputParameters: {
            marketingBudget: 500000,
            targetCustomers: 1000,
            conversionRate: 0.05
          },
          outputResults: {
            GO: 85,
            EC: 78,
            PT: 82,
            PF: 75,
            TO: 80
          },
          confidence: 0.78,
          runAt: now,
          duration: 1250
        }
      ],
      lastSync: now
    };
  }

  /**
   * 실시간 데이터 업데이트 시뮬레이션
   */
  simulateRealtimeUpdate(): void {
    const now = new Date();

    // 시나리오 상태 변경 시뮬레이션
    if (this.mockV2Data.scenarios.length > 0) {
      const scenario = this.mockV2Data.scenarios[0];
      scenario.updatedAt = now;
      scenario.progress = Math.min(100, (scenario.progress || 0) + 10);
    }

    // 새로운 추천사항 추가
    this.mockV2Data.recommendations.push({
      id: `rec-${Date.now()}`,
      title: '실시간 추천사항',
      description: '실시간 업데이트 테스트용 추천사항',
      targetAxis: 'GO',
      expectedImpact: 5,
      priority: 'low',
      timeframe: 'immediate',
      actionItems: ['즉시 실행 가능한 액션'],
      confidence: 0.6,
      createdAt: now
    });

    this.mockV2Data.lastSync = now;
  }

  /**
   * 정리
   */
  dispose(): void {
    super.dispose();
    this.mockV2Data = null as any;
  }
}