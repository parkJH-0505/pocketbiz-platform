/**
 * Buildup System Data Collector
 * Buildup 시스템의 데이터를 수집하는 전용 수집기
 */

import { BaseDataCollector } from '../DataCollector';
import type {
  CollectionConfig,
  CollectionResult,
  RawDataRecord,
  BuildupSystemData,
  BuildupProjectData,
  BuildupServiceData,
  BuildupMeetingData,
  BuildupDeliverableData,
  DataQuality
} from '../types';
import type { AxisKey } from '../../../../types/buildup.types';

export class BuildupDataCollector extends BaseDataCollector {
  private mockBuildupData: BuildupSystemData;

  constructor() {
    super('buildup-system', 'buildup');
    this.initializeMockData();
  }

  /**
   * Buildup 시스템에서 데이터 수집
   */
  async collect(config: CollectionConfig): Promise<CollectionResult> {
    this.currentConfig = config;
    return this.executeCollection(config);
  }

  /**
   * 실제 Buildup 데이터 추출
   */
  protected async extractData(config: CollectionConfig): Promise<RawDataRecord[]> {
    const records: RawDataRecord[] = [];
    const collectedAt = new Date();

    if (config.mode === 'batch' || config.mode === 'hybrid') {
      records.push(...await this.extractBatchData(collectedAt));
    }

    if (config.mode === 'realtime' || config.mode === 'hybrid') {
      records.push(...await this.extractRealtimeData(collectedAt));
    }

    return records;
  }

  /**
   * 배치 데이터 추출
   */
  private async extractBatchData(collectedAt: Date): Promise<RawDataRecord[]> {
    const records: RawDataRecord[] = [];

    // 프로젝트 데이터 수집
    for (const project of this.mockBuildupData.projects) {
      records.push(this.createRecord('project', project, collectedAt));
    }

    // 서비스 데이터 수집
    for (const service of this.mockBuildupData.services) {
      records.push(this.createRecord('service', service, collectedAt));
    }

    // 미팅 데이터 수집
    for (const meeting of this.mockBuildupData.meetings) {
      records.push(this.createRecord('meeting', meeting, collectedAt));
    }

    // 산출물 데이터 수집
    for (const deliverable of this.mockBuildupData.deliverables) {
      records.push(this.createRecord('deliverable', deliverable, collectedAt));
    }

    return records;
  }

  /**
   * 실시간 데이터 추출
   */
  private async extractRealtimeData(collectedAt: Date): Promise<RawDataRecord[]> {
    const records: RawDataRecord[] = [];
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // 최근 진행상황 업데이트가 있는 프로젝트만 수집
    const recentProjects = this.mockBuildupData.projects.filter(project =>
      project.lastUpdated && new Date(project.lastUpdated) > thirtyMinutesAgo
    );

    for (const project of recentProjects) {
      records.push(this.createRecord('project', project, collectedAt, 'realtime'));
    }

    // 최근 완료된 미팅 수집
    const recentMeetings = this.mockBuildupData.meetings.filter(meeting =>
      meeting.completedAt && new Date(meeting.completedAt) > thirtyMinutesAgo
    );

    for (const meeting of recentMeetings) {
      records.push(this.createRecord('meeting', meeting, collectedAt, 'realtime'));
    }

    // 최근 완료된 산출물 수집
    const recentDeliverables = this.mockBuildupData.deliverables.filter(deliverable =>
      deliverable.completedAt && new Date(deliverable.completedAt) > thirtyMinutesAgo
    );

    for (const deliverable of recentDeliverables) {
      records.push(this.createRecord('deliverable', deliverable, collectedAt, 'realtime'));
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
      id: `buildup_${dataType}_${data.id}_${mode}`,
      sourceId: this.sourceId,
      sourceType: 'buildup',
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
    if (!data.title && !data.name) score -= 25;

    // 데이터 타입별 검증
    if (data.type === 'project') {
      if (!data.status || !data.phase) score -= 20;
      if (data.progress < 0 || data.progress > 100) score -= 15;
      if (!data.team || !data.team.pmId) score -= 10;
      if (new Date(data.endDate) < new Date(data.startDate)) score -= 20;
    }

    if (data.type === 'service') {
      if (!data.category || data.price < 0) score -= 15;
      if (!data.kpiImpact || data.kpiImpact.length === 0) score -= 10;
    }

    if (data.type === 'meeting') {
      if (!data.projectId || !data.agenda) score -= 20;
      if (data.duration <= 0) score -= 15;
      if (!data.participants || data.participants.length === 0) score -= 10;
    }

    if (data.type === 'deliverable') {
      if (!data.projectId || !data.assigneeId) score -= 25;
      if (new Date(data.dueDate) < new Date()) {
        if (data.status !== 'completed' && data.status !== 'overdue') {
          score -= 20; // 기한 지났는데 상태가 맞지 않음
        }
      }
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
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Buildup 시스템 헬스 체크
   */
  protected async performHealthCheck(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 180));

    // 프로젝트 상태 일관성 체크
    const inconsistentProjects = this.mockBuildupData.projects.filter(project => {
      if (project.status === 'completed' && project.progress !== 100) return true;
      if (project.status === 'active' && project.progress >= 100) return true;
      return false;
    });

    if (inconsistentProjects.length > 0) {
      throw new Error(`Found ${inconsistentProjects.length} projects with inconsistent status/progress`);
    }

    // 산출물-프로젝트 연결 무결성 체크
    const orphanedDeliverables = this.mockBuildupData.deliverables.filter(deliverable =>
      !this.mockBuildupData.projects.find(project => project.id === deliverable.projectId)
    );

    if (orphanedDeliverables.length > 0) {
      console.warn(`Found ${orphanedDeliverables.length} deliverables without corresponding projects`);
    }

    // 미팅-프로젝트 연결 무결성 체크
    const orphanedMeetings = this.mockBuildupData.meetings.filter(meeting =>
      !this.mockBuildupData.projects.find(project => project.id === meeting.projectId)
    );

    if (orphanedMeetings.length > 0) {
      console.warn(`Found ${orphanedMeetings.length} meetings without corresponding projects`);
    }
  }

  /**
   * Mock 데이터 초기화
   */
  private initializeMockData(): void {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    this.mockBuildupData = {
      projects: [
        {
          id: 'buildup-project-001',
          title: '마케팅 자동화 시스템 구축',
          description: '고객 획득 및 유지를 위한 자동화 시스템 개발',
          status: 'active',
          phase: 'execution',
          priority: 'high',
          startDate: oneWeekAgo,
          endDate: oneMonthLater,
          progress: 65,
          budget: 5000000,
          team: {
            pmId: 'pm-001',
            memberIds: ['dev-001', 'des-001', 'qa-001']
          },
          tags: ['marketing', 'automation', 'crm'],
          kpiImpact: {
            GO: 15,
            EC: 8,
            PT: 5
          },
          lastUpdated: now
        },
        {
          id: 'buildup-project-002',
          title: '고객 지원 시스템 개선',
          description: '고객 만족도 향상을 위한 지원 시스템 업그레이드',
          status: 'active',
          phase: 'planning',
          priority: 'medium',
          startDate: now,
          endDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
          progress: 20,
          budget: 3000000,
          team: {
            pmId: 'pm-002',
            memberIds: ['dev-002', 'ux-001']
          },
          tags: ['support', 'customer-service', 'improvement'],
          kpiImpact: {
            PT: 12,
            TO: 8
          },
          lastUpdated: new Date(now.getTime() - 10 * 60 * 1000)
        }
      ],
      services: [
        {
          id: 'service-001',
          name: 'CRM 시스템 구축',
          category: '마케팅',
          price: 2500000,
          description: '고객 관계 관리 시스템 개발 및 구축',
          isActive: true,
          kpiImpact: [
            { axis: 'GO', expectedImprovement: 20 },
            { axis: 'EC', expectedImprovement: 10 }
          ]
        },
        {
          id: 'service-002',
          name: '팀 협업 도구 도입',
          category: '조직',
          price: 800000,
          description: 'Slack, Notion 등 협업 도구 세팅 및 교육',
          isActive: true,
          kpiImpact: [
            { axis: 'TO', expectedImprovement: 15 },
            { axis: 'PF', expectedImprovement: 8 }
          ]
        }
      ],
      meetings: [
        {
          id: 'meeting-buildup-001',
          projectId: 'buildup-project-001',
          type: 'progress',
          scheduledAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
          completedAt: new Date(now.getTime() - 60 * 60 * 1000),
          duration: 60,
          agenda: '2주차 진행상황 점검 및 이슈 해결',
          participants: ['pm-001', 'dev-001', 'des-001'],
          notes: '전반적으로 계획대로 진행 중. 일부 기술적 이슈 발견됨.',
          actionItems: [
            'API 연동 이슈 해결',
            '디자인 시안 2차 검토',
            '다음 주 테스트 일정 확정'
          ],
          decisions: [
            'API 라이브러리 변경 승인',
            '테스트 일정 1주 연장 결정'
          ]
        },
        {
          id: 'meeting-buildup-002',
          projectId: 'buildup-project-002',
          type: 'kickoff',
          scheduledAt: now,
          duration: 90,
          agenda: '프로젝트 킥오프 및 역할 분담',
          participants: ['pm-002', 'dev-002', 'ux-001'],
          actionItems: [
            '프로젝트 차터 작성',
            '상세 요구사항 정리',
            '개발 환경 구성'
          ],
          decisions: []
        }
      ],
      deliverables: [
        {
          id: 'deliverable-001',
          projectId: 'buildup-project-001',
          name: 'CRM 시스템 설계서',
          description: '시스템 아키텍처 및 상세 설계 문서',
          dueDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          completedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          status: 'completed',
          assigneeId: 'dev-001',
          reviewerId: 'pm-001',
          dependencies: []
        },
        {
          id: 'deliverable-002',
          projectId: 'buildup-project-001',
          name: '프론트엔드 UI 구현',
          description: '사용자 인터페이스 개발',
          dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
          status: 'in_progress',
          assigneeId: 'des-001',
          reviewerId: 'pm-001',
          dependencies: ['deliverable-001']
        },
        {
          id: 'deliverable-003',
          projectId: 'buildup-project-002',
          name: '현 시스템 분석 보고서',
          description: '기존 고객 지원 시스템 분석 및 개선점 도출',
          dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          status: 'pending',
          assigneeId: 'ux-001',
          dependencies: []
        }
      ],
      lastSync: now
    };
  }

  /**
   * 실시간 업데이트 시뮬레이션
   */
  simulateRealtimeUpdate(): void {
    const now = new Date();

    // 프로젝트 진행률 업데이트
    if (this.mockBuildupData.projects.length > 0) {
      const project = this.mockBuildupData.projects[0];
      project.progress = Math.min(100, project.progress + 5);
      project.lastUpdated = now;

      // 진행률이 100%에 도달하면 완료 상태로 변경
      if (project.progress >= 100) {
        project.status = 'completed';
      }
    }

    // 새 산출물 완료 시뮬레이션
    const inProgressDeliverable = this.mockBuildupData.deliverables.find(
      d => d.status === 'in_progress'
    );

    if (inProgressDeliverable) {
      inProgressDeliverable.status = 'completed';
      inProgressDeliverable.completedAt = now;
    }

    // 새 미팅 완료 시뮬레이션
    const scheduledMeeting = this.mockBuildupData.meetings.find(
      m => !m.completedAt
    );

    if (scheduledMeeting) {
      scheduledMeeting.completedAt = now;
      scheduledMeeting.notes = '실시간 업데이트 테스트로 완료됨';
      scheduledMeeting.actionItems.push('테스트 완료 확인');
    }

    this.mockBuildupData.lastSync = now;
  }

  /**
   * 정리
   */
  dispose(): void {
    super.dispose();
    this.mockBuildupData = null as any;
  }
}