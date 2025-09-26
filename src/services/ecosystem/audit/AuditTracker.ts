/**
 * Audit Tracker
 * 감사 추적 및 컴플라이언스 시스템
 */

import type { UnifiedEntity, UnifiedEntityType } from '../pipeline/transform/types';
import type { TransactionResult } from '../transaction/TransactionManager';
import { EventBus } from '../EventBus';

// 감사 이벤트 타입
export type AuditEventType =
  | 'entity_created'
  | 'entity_updated'
  | 'entity_deleted'
  | 'entity_accessed'
  | 'validation_performed'
  | 'conflict_resolved'
  | 'transaction_committed'
  | 'transaction_aborted'
  | 'permission_granted'
  | 'permission_denied'
  | 'security_alert'
  | 'compliance_check';

// 감사 이벤트 심각도
export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

// 감사 이벤트
export interface AuditEvent {
  id: string;
  type: AuditEventType;
  severity: AuditSeverity;
  timestamp: Date;

  // 액터 정보
  actor: {
    userId?: string;
    systemId?: string;
    ipAddress?: string;
    userAgent?: string;
    sessionId: string;
  };

  // 대상 정보
  target: {
    entityId?: string;
    entityType?: UnifiedEntityType;
    resourcePath?: string;
    operation?: string;
  };

  // 이벤트 세부사항
  details: {
    changes?: Array<{
      field: string;
      oldValue: any;
      newValue: any;
    }>;
    reason?: string;
    result?: 'success' | 'failure';
    errorCode?: string;
    errorMessage?: string;
  };

  // 컴플라이언스 정보
  compliance?: {
    regulations: string[]; // GDPR, HIPAA, SOC2 등
    dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
    retentionPeriod: number; // days
  };

  // 메타데이터
  metadata?: Record<string, any>;
}

// 감사 정책
export interface AuditPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;

  // 정책 규칙
  rules: Array<{
    eventTypes: AuditEventType[];
    entityTypes?: UnifiedEntityType[];
    severities?: AuditSeverity[];
    actors?: string[];
  }>;

  // 액션
  actions: {
    log: boolean;
    alert: boolean;
    block: boolean;
    archive: boolean;
  };

  // 보존 정책
  retention: {
    period: number; // days
    archiveAfter?: number; // days
    deleteAfter?: number; // days
  };
}

// 감사 추적
export interface AuditTrail {
  id: string;
  entityId: string;
  entityType: UnifiedEntityType;

  // 이벤트 체인
  events: AuditEvent[];

  // 타임라인
  timeline: {
    created: Date;
    lastModified: Date;
    lastAccessed: Date;
  };

  // 통계
  statistics: {
    totalEvents: number;
    eventsByType: Record<AuditEventType, number>;
    eventsBySeverity: Record<AuditSeverity, number>;
    uniqueActors: number;
  };
}

// 컴플라이언스 보고서
export interface ComplianceReport {
  id: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };

  // 규정별 준수 상태
  regulations: Record<string, {
    compliant: boolean;
    violations: number;
    warnings: number;
    lastCheck: Date;
  }>;

  // 데이터 프라이버시
  privacy: {
    personalDataAccess: number;
    dataBreaches: number;
    consentViolations: number;
    rightToForgetRequests: number;
  };

  // 접근 제어
  accessControl: {
    unauthorizedAttempts: number;
    privilegedOperations: number;
    suspiciousActivities: number;
  };

  // 추천사항
  recommendations: string[];
}

export class AuditTracker {
  private static instance: AuditTracker;

  private eventBus: EventBus;
  private auditLogs: Map<string, AuditEvent[]>;
  private auditTrails: Map<string, AuditTrail>;
  private auditPolicies: Map<string, AuditPolicy>;

  private eventBuffer: AuditEvent[];
  private flushInterval: NodeJS.Timeout;
  private archiveThreshold: number = 10000; // 이벤트 수

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.auditLogs = new Map();
    this.auditTrails = new Map();
    this.auditPolicies = new Map();
    this.eventBuffer = [];

    this.initializeDefaultPolicies();
    this.setupEventListeners();
    this.startFlushTimer();
  }

  public static getInstance(): AuditTracker {
    if (!AuditTracker.instance) {
      AuditTracker.instance = new AuditTracker();
    }
    return AuditTracker.instance;
  }

  /**
   * 감사 이벤트 기록
   */
  public async logEvent(event: Omit<AuditEvent, 'id'>): Promise<void> {
    const fullEvent: AuditEvent = {
      ...event,
      id: this.generateEventId()
    };

    // 정책 확인
    const applicablePolicies = this.findApplicablePolicies(fullEvent);

    for (const policy of applicablePolicies) {
      await this.applyPolicy(fullEvent, policy);
    }

    // 버퍼에 추가
    this.eventBuffer.push(fullEvent);

    // 임계값 도달 시 즉시 플러시
    if (this.eventBuffer.length >= 100) {
      await this.flush();
    }

    // 감사 추적 업데이트
    if (fullEvent.target.entityId) {
      this.updateAuditTrail(fullEvent);
    }

    // 실시간 알림 (심각도 높은 이벤트)
    if (fullEvent.severity === 'critical') {
      this.sendAlert(fullEvent);
    }
  }

  /**
   * 엔터티 접근 기록
   */
  public async logAccess(
    entity: UnifiedEntity,
    actor: AuditEvent['actor'],
    operation: string
  ): Promise<void> {
    await this.logEvent({
      type: 'entity_accessed',
      severity: 'low',
      timestamp: new Date(),
      actor,
      target: {
        entityId: entity.id,
        entityType: entity.type,
        operation
      },
      details: {
        result: 'success'
      }
    });
  }

  /**
   * 엔터티 변경 기록
   */
  public async logChange(
    entity: UnifiedEntity,
    changes: Array<{ field: string; oldValue: any; newValue: any }>,
    actor: AuditEvent['actor'],
    type: 'entity_created' | 'entity_updated' | 'entity_deleted'
  ): Promise<void> {
    await this.logEvent({
      type,
      severity: this.calculateChangeSeverity(changes),
      timestamp: new Date(),
      actor,
      target: {
        entityId: entity.id,
        entityType: entity.type,
        operation: type.replace('entity_', '')
      },
      details: {
        changes,
        result: 'success'
      }
    });
  }

  /**
   * 보안 이벤트 기록
   */
  public async logSecurityEvent(
    type: 'permission_denied' | 'security_alert',
    actor: AuditEvent['actor'],
    details: AuditEvent['details']
  ): Promise<void> {
    await this.logEvent({
      type,
      severity: type === 'security_alert' ? 'critical' : 'high',
      timestamp: new Date(),
      actor,
      target: {},
      details
    });
  }

  /**
   * 트랜잭션 이벤트 기록
   */
  public async logTransactionEvent(
    result: TransactionResult,
    actor: AuditEvent['actor']
  ): Promise<void> {
    await this.logEvent({
      type: result.success ? 'transaction_committed' : 'transaction_aborted',
      severity: result.success ? 'low' : 'medium',
      timestamp: new Date(),
      actor,
      target: {
        operation: 'transaction'
      },
      details: {
        result: result.success ? 'success' : 'failure',
        errorCode: result.error?.code,
        errorMessage: result.error?.message
      },
      metadata: {
        transactionId: result.transactionId,
        operationsCount: result.operationsCount,
        affectedEntities: result.affectedEntities,
        duration: result.duration
      }
    });
  }

  /**
   * 감사 추적 조회
   */
  public getAuditTrail(entityId: string): AuditTrail | undefined {
    return this.auditTrails.get(entityId);
  }

  /**
   * 감사 이벤트 검색
   */
  public searchEvents(criteria: {
    entityId?: string;
    entityType?: UnifiedEntityType;
    eventType?: AuditEventType;
    severity?: AuditSeverity;
    actor?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): AuditEvent[] {
    let events: AuditEvent[] = [];

    // 모든 로그에서 검색
    for (const logEvents of this.auditLogs.values()) {
      events.push(...logEvents);
    }

    // 필터링
    if (criteria.entityId) {
      events = events.filter(e => e.target.entityId === criteria.entityId);
    }

    if (criteria.entityType) {
      events = events.filter(e => e.target.entityType === criteria.entityType);
    }

    if (criteria.eventType) {
      events = events.filter(e => e.type === criteria.eventType);
    }

    if (criteria.severity) {
      events = events.filter(e => e.severity === criteria.severity);
    }

    if (criteria.actor) {
      events = events.filter(e => e.actor.userId === criteria.actor);
    }

    if (criteria.startDate) {
      events = events.filter(e => e.timestamp >= criteria.startDate!);
    }

    if (criteria.endDate) {
      events = events.filter(e => e.timestamp <= criteria.endDate!);
    }

    // 정렬 (최신순)
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // 제한
    if (criteria.limit) {
      events = events.slice(0, criteria.limit);
    }

    return events;
  }

  /**
   * 컴플라이언스 보고서 생성
   */
  public async generateComplianceReport(
    startDate: Date,
    endDate: Date
  ): Promise<ComplianceReport> {
    const events = this.searchEvents({ startDate, endDate });

    const report: ComplianceReport = {
      id: `report-${Date.now()}`,
      generatedAt: new Date(),
      period: { start: startDate, end: endDate },
      regulations: this.checkRegulationCompliance(events),
      privacy: this.analyzePrivacy(events),
      accessControl: this.analyzeAccessControl(events),
      recommendations: this.generateRecommendations(events)
    };

    return report;
  }

  /**
   * 규정 준수 확인
   */
  private checkRegulationCompliance(
    events: AuditEvent[]
  ): ComplianceReport['regulations'] {
    const regulations: ComplianceReport['regulations'] = {};

    // GDPR 확인
    const gdprViolations = events.filter(e =>
      e.compliance?.regulations.includes('GDPR') &&
      e.details.result === 'failure'
    );

    regulations['GDPR'] = {
      compliant: gdprViolations.length === 0,
      violations: gdprViolations.length,
      warnings: events.filter(e =>
        e.compliance?.regulations.includes('GDPR') &&
        e.severity === 'medium'
      ).length,
      lastCheck: new Date()
    };

    // HIPAA 확인
    const hipaaViolations = events.filter(e =>
      e.compliance?.regulations.includes('HIPAA') &&
      e.details.result === 'failure'
    );

    regulations['HIPAA'] = {
      compliant: hipaaViolations.length === 0,
      violations: hipaaViolations.length,
      warnings: events.filter(e =>
        e.compliance?.regulations.includes('HIPAA') &&
        e.severity === 'medium'
      ).length,
      lastCheck: new Date()
    };

    // SOC2 확인
    const soc2Violations = events.filter(e =>
      e.compliance?.regulations.includes('SOC2') &&
      e.details.result === 'failure'
    );

    regulations['SOC2'] = {
      compliant: soc2Violations.length === 0,
      violations: soc2Violations.length,
      warnings: events.filter(e =>
        e.compliance?.regulations.includes('SOC2') &&
        e.severity === 'medium'
      ).length,
      lastCheck: new Date()
    };

    return regulations;
  }

  /**
   * 프라이버시 분석
   */
  private analyzePrivacy(events: AuditEvent[]): ComplianceReport['privacy'] {
    return {
      personalDataAccess: events.filter(e =>
        e.compliance?.dataClassification === 'restricted' &&
        e.type === 'entity_accessed'
      ).length,
      dataBreaches: events.filter(e =>
        e.type === 'security_alert' &&
        e.details.reason?.includes('breach')
      ).length,
      consentViolations: events.filter(e =>
        e.details.reason?.includes('consent')
      ).length,
      rightToForgetRequests: events.filter(e =>
        e.type === 'entity_deleted' &&
        e.details.reason?.includes('RTBF')
      ).length
    };
  }

  /**
   * 접근 제어 분석
   */
  private analyzeAccessControl(
    events: AuditEvent[]
  ): ComplianceReport['accessControl'] {
    return {
      unauthorizedAttempts: events.filter(e =>
        e.type === 'permission_denied'
      ).length,
      privilegedOperations: events.filter(e =>
        e.metadata?.privileged === true
      ).length,
      suspiciousActivities: events.filter(e =>
        e.type === 'security_alert'
      ).length
    };
  }

  /**
   * 추천사항 생성
   */
  private generateRecommendations(events: AuditEvent[]): string[] {
    const recommendations: string[] = [];

    // 높은 실패율
    const failureRate = events.filter(e =>
      e.details.result === 'failure'
    ).length / events.length;

    if (failureRate > 0.1) {
      recommendations.push('High failure rate detected. Review system configuration and permissions.');
    }

    // 보안 경고
    const securityAlerts = events.filter(e =>
      e.type === 'security_alert'
    ).length;

    if (securityAlerts > 5) {
      recommendations.push('Multiple security alerts detected. Conduct security audit.');
    }

    // 접근 패턴
    const uniqueActors = new Set(events.map(e => e.actor.userId)).size;
    if (uniqueActors < 2) {
      recommendations.push('Limited user activity. Consider implementing proper access controls.');
    }

    // 컴플라이언스
    const complianceEvents = events.filter(e => e.compliance);
    if (complianceEvents.length === 0) {
      recommendations.push('No compliance tracking detected. Enable compliance monitoring.');
    }

    return recommendations;
  }

  /**
   * 변경 심각도 계산
   */
  private calculateChangeSeverity(
    changes: Array<{ field: string; oldValue: any; newValue: any }>
  ): AuditSeverity {
    // 민감한 필드
    const sensitiveFields = ['password', 'email', 'ssn', 'creditCard'];
    const criticalFields = ['role', 'permissions', 'status'];

    for (const change of changes) {
      if (sensitiveFields.some(f => change.field.toLowerCase().includes(f))) {
        return 'high';
      }

      if (criticalFields.some(f => change.field.toLowerCase().includes(f))) {
        return 'medium';
      }
    }

    return 'low';
  }

  /**
   * 적용 가능한 정책 찾기
   */
  private findApplicablePolicies(event: AuditEvent): AuditPolicy[] {
    const policies: AuditPolicy[] = [];

    for (const policy of this.auditPolicies.values()) {
      if (!policy.enabled) continue;

      for (const rule of policy.rules) {
        // 이벤트 타입 매칭
        if (rule.eventTypes.length > 0 &&
            !rule.eventTypes.includes(event.type)) {
          continue;
        }

        // 엔터티 타입 매칭
        if (rule.entityTypes &&
            event.target.entityType &&
            !rule.entityTypes.includes(event.target.entityType)) {
          continue;
        }

        // 심각도 매칭
        if (rule.severities &&
            !rule.severities.includes(event.severity)) {
          continue;
        }

        // 액터 매칭
        if (rule.actors &&
            event.actor.userId &&
            !rule.actors.includes(event.actor.userId)) {
          continue;
        }

        policies.push(policy);
        break;
      }
    }

    return policies;
  }

  /**
   * 정책 적용
   */
  private async applyPolicy(
    event: AuditEvent,
    policy: AuditPolicy
  ): Promise<void> {
    // 로깅
    if (policy.actions.log) {
      this.addToLog(event);
    }

    // 알림
    if (policy.actions.alert) {
      this.sendAlert(event);
    }

    // 차단
    if (policy.actions.block) {
      throw new Error(`Blocked by audit policy: ${policy.name}`);
    }

    // 아카이브
    if (policy.actions.archive) {
      await this.archiveEvent(event);
    }
  }

  /**
   * 감사 추적 업데이트
   */
  private updateAuditTrail(event: AuditEvent): void {
    const entityId = event.target.entityId!;

    if (!this.auditTrails.has(entityId)) {
      this.auditTrails.set(entityId, {
        id: `trail-${entityId}`,
        entityId,
        entityType: event.target.entityType!,
        events: [],
        timeline: {
          created: new Date(),
          lastModified: new Date(),
          lastAccessed: new Date()
        },
        statistics: {
          totalEvents: 0,
          eventsByType: {} as Record<AuditEventType, number>,
          eventsBySeverity: {} as Record<AuditSeverity, number>,
          uniqueActors: 0
        }
      });
    }

    const trail = this.auditTrails.get(entityId)!;
    trail.events.push(event);

    // 타임라인 업데이트
    if (event.type === 'entity_created') {
      trail.timeline.created = event.timestamp;
    } else if (event.type === 'entity_updated') {
      trail.timeline.lastModified = event.timestamp;
    } else if (event.type === 'entity_accessed') {
      trail.timeline.lastAccessed = event.timestamp;
    }

    // 통계 업데이트
    trail.statistics.totalEvents++;
    trail.statistics.eventsByType[event.type] =
      (trail.statistics.eventsByType[event.type] || 0) + 1;
    trail.statistics.eventsBySeverity[event.severity] =
      (trail.statistics.eventsBySeverity[event.severity] || 0) + 1;

    const actors = new Set(trail.events.map(e => e.actor.userId || e.actor.systemId));
    trail.statistics.uniqueActors = actors.size;
  }

  /**
   * 로그에 추가
   */
  private addToLog(event: AuditEvent): void {
    const key = event.target.entityId || 'system';

    if (!this.auditLogs.has(key)) {
      this.auditLogs.set(key, []);
    }

    this.auditLogs.get(key)!.push(event);

    // 아카이브 임계값 확인
    if (this.auditLogs.get(key)!.length > this.archiveThreshold) {
      this.archiveOldEvents(key);
    }
  }

  /**
   * 알림 전송
   */
  private sendAlert(event: AuditEvent): void {
    console.warn('Audit Alert:', {
      id: event.id,
      type: event.type,
      severity: event.severity,
      actor: event.actor.userId || event.actor.systemId,
      target: event.target.entityId,
      message: event.details.errorMessage || event.details.reason
    });

    // 실제 구현에서는 이메일, Slack 등으로 전송
    this.eventBus.emit('audit:alert', event);
  }

  /**
   * 이벤트 아카이브
   */
  private async archiveEvent(event: AuditEvent): Promise<void> {
    // 실제 구현에서는 외부 스토리지로 이동
    console.log('Archiving audit event:', event.id);
  }

  /**
   * 오래된 이벤트 아카이브
   */
  private archiveOldEvents(key: string): void {
    const events = this.auditLogs.get(key);

    if (!events) return;

    const cutoff = events.length - this.archiveThreshold;
    const toArchive = events.splice(0, cutoff);

    console.log(`Archiving ${toArchive.length} old events for ${key}`);

    // 실제 구현에서는 외부 스토리지로 이동
  }

  /**
   * 버퍼 플러시
   */
  private async flush(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    // 배치 저장
    for (const event of events) {
      this.addToLog(event);
    }

    console.log(`Flushed ${events.length} audit events`);
  }

  /**
   * 플러시 타이머 시작
   */
  private startFlushTimer(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 5000); // 5초마다
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    // 엔터티 이벤트
    this.eventBus.on('entity:created', (data) => {
      this.logChange(
        data.entity,
        [],
        { sessionId: data.sessionId, userId: data.userId },
        'entity_created'
      );
    });

    this.eventBus.on('entity:updated', (data) => {
      this.logChange(
        data.entity,
        data.changes,
        { sessionId: data.sessionId, userId: data.userId },
        'entity_updated'
      );
    });

    this.eventBus.on('entity:deleted', (data) => {
      this.logChange(
        data.entity,
        [],
        { sessionId: data.sessionId, userId: data.userId },
        'entity_deleted'
      );
    });

    // 트랜잭션 이벤트
    this.eventBus.on('transaction:committed', (data) => {
      this.logEvent({
        type: 'transaction_committed',
        severity: 'low',
        timestamp: new Date(),
        actor: { sessionId: data.sessionId },
        target: {},
        details: { result: 'success' },
        metadata: data
      });
    });

    this.eventBus.on('transaction:aborted', (data) => {
      this.logEvent({
        type: 'transaction_aborted',
        severity: 'medium',
        timestamp: new Date(),
        actor: { sessionId: data.sessionId },
        target: {},
        details: {
          result: 'failure',
          reason: data.reason
        },
        metadata: data
      });
    });
  }

  /**
   * 기본 정책 초기화
   */
  private initializeDefaultPolicies(): void {
    // 기본 감사 정책
    this.auditPolicies.set('default', {
      id: 'default',
      name: 'Default Audit Policy',
      description: 'Default audit policy for all events',
      enabled: true,
      rules: [{
        eventTypes: [],
        severities: ['high', 'critical']
      }],
      actions: {
        log: true,
        alert: true,
        block: false,
        archive: false
      },
      retention: {
        period: 90,
        archiveAfter: 30,
        deleteAfter: 365
      }
    });

    // 보안 정책
    this.auditPolicies.set('security', {
      id: 'security',
      name: 'Security Audit Policy',
      description: 'Security-focused audit policy',
      enabled: true,
      rules: [{
        eventTypes: ['permission_denied', 'security_alert'],
        severities: ['high', 'critical']
      }],
      actions: {
        log: true,
        alert: true,
        block: true,
        archive: true
      },
      retention: {
        period: 365,
        archiveAfter: 90
      }
    });

    // 컴플라이언스 정책
    this.auditPolicies.set('compliance', {
      id: 'compliance',
      name: 'Compliance Audit Policy',
      description: 'Compliance-focused audit policy',
      enabled: true,
      rules: [{
        eventTypes: ['compliance_check'],
        severities: ['medium', 'high', 'critical']
      }],
      actions: {
        log: true,
        alert: false,
        block: false,
        archive: true
      },
      retention: {
        period: 2555, // 7년
        archiveAfter: 365
      }
    });
  }

  /**
   * 유틸리티 메서드
   */
  private generateEventId(): string {
    return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 정책 관리
   */
  public addPolicy(policy: AuditPolicy): void {
    this.auditPolicies.set(policy.id, policy);
  }

  public removePolicy(policyId: string): void {
    this.auditPolicies.delete(policyId);
  }

  public getPolicy(policyId: string): AuditPolicy | undefined {
    return this.auditPolicies.get(policyId);
  }

  /**
   * 정리
   */
  public destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    this.flush();
  }
}