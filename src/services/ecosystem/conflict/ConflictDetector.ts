/**
 * Conflict Detector
 * 데이터 충돌을 감지하는 컴포넌트
 */

import type {
  Conflict,
  ConflictType,
  ConflictSeverity,
  ConflictContext,
  ResolutionStrategy
} from './types';
import type { UnifiedEntity } from '../pipeline/transform/types';

export class ConflictDetector {
  private static instance: ConflictDetector;

  private detectionRules: Map<ConflictType, DetectionRule[]>;
  private severityCalculator: SeverityCalculator;

  private constructor() {
    this.detectionRules = new Map();
    this.severityCalculator = new SeverityCalculator();

    this.initializeDetectionRules();
  }

  public static getInstance(): ConflictDetector {
    if (!ConflictDetector.instance) {
      ConflictDetector.instance = new ConflictDetector();
    }
    return ConflictDetector.instance;
  }

  /**
   * 충돌 감지
   */
  public async detect(
    source: UnifiedEntity,
    target?: UnifiedEntity,
    context?: Partial<ConflictContext>
  ): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];
    const fullContext = this.buildContext(context);

    // 타겟이 없으면 생성 충돌 검사
    if (!target) {
      const createConflicts = await this.detectCreateConflicts(source, fullContext);
      conflicts.push(...createConflicts);
    } else {
      // 타겟이 있으면 업데이트/병합 충돌 검사
      const updateConflicts = await this.detectUpdateConflicts(source, target, fullContext);
      conflicts.push(...updateConflicts);
    }

    // 충돌 우선순위 정렬
    conflicts.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    return conflicts;
  }

  /**
   * 생성 충돌 감지
   */
  private async detectCreateConflicts(
    entity: UnifiedEntity,
    context: ConflictContext
  ): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    // 고유성 충돌 검사
    const uniqueConflict = this.checkUniquenessConflict(entity);
    if (uniqueConflict) {
      conflicts.push(this.createConflict('constraint', entity, undefined, {
        constraints: ['unique'],
        details: uniqueConflict
      }, context));
    }

    // 참조 무결성 검사
    const referenceConflict = this.checkReferentialIntegrity(entity);
    if (referenceConflict) {
      conflicts.push(this.createConflict('reference', entity, undefined, {
        constraints: ['foreign_key'],
        details: referenceConflict
      }, context));
    }

    return conflicts;
  }

  /**
   * 업데이트 충돌 감지
   */
  private async detectUpdateConflicts(
    source: UnifiedEntity,
    target: UnifiedEntity,
    context: ConflictContext
  ): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    // 버전 충돌 검사
    if (this.hasVersionConflict(source, target)) {
      conflicts.push(this.createConflict('version', source, target, {
        sourceValue: source.metadata?.version,
        targetValue: target.metadata?.version
      }, context));
    }

    // 데이터 충돌 검사
    const dataConflicts = this.detectDataConflicts(source, target);
    for (const conflict of dataConflicts) {
      conflicts.push(this.createConflict('data', source, target, conflict, context));
    }

    // 스키마 충돌 검사
    if (this.hasSchemaConflict(source, target)) {
      conflicts.push(this.createConflict('schema', source, target, {
        message: 'Schema mismatch between source and target'
      }, context));
    }

    // 동시성 충돌 검사
    if (this.hasConcurrentModification(source, target, context)) {
      conflicts.push(this.createConflict('concurrent', source, target, {
        message: 'Concurrent modification detected'
      }, context));
    }

    return conflicts;
  }

  /**
   * 데이터 충돌 감지
   */
  private detectDataConflicts(
    source: UnifiedEntity,
    target: UnifiedEntity
  ): any[] {
    const conflicts: any[] = [];
    const differences = this.findDifferences(source.data, target.data);

    for (const diff of differences) {
      // 변경된 값이 충돌 조건을 만족하는지 확인
      if (this.isConflictingChange(diff)) {
        conflicts.push({
          field: diff.path,
          sourceValue: diff.sourceValue,
          targetValue: diff.targetValue,
          differences: [diff]
        });
      }
    }

    return conflicts;
  }

  /**
   * 객체 간 차이점 찾기
   */
  private findDifferences(
    source: any,
    target: any,
    path: string = ''
  ): Array<{ path: string; sourceValue: any; targetValue: any }> {
    const differences: Array<{ path: string; sourceValue: any; targetValue: any }> = [];

    if (source === target) {
      return differences;
    }

    if (typeof source !== typeof target) {
      differences.push({ path, sourceValue: source, targetValue: target });
      return differences;
    }

    if (typeof source === 'object' && source !== null && target !== null) {
      const allKeys = new Set([...Object.keys(source), ...Object.keys(target)]);

      for (const key of allKeys) {
        const newPath = path ? `${path}.${key}` : key;

        if (!(key in source)) {
          differences.push({ path: newPath, sourceValue: undefined, targetValue: target[key] });
        } else if (!(key in target)) {
          differences.push({ path: newPath, sourceValue: source[key], targetValue: undefined });
        } else if (Array.isArray(source[key]) && Array.isArray(target[key])) {
          if (JSON.stringify(source[key]) !== JSON.stringify(target[key])) {
            differences.push({ path: newPath, sourceValue: source[key], targetValue: target[key] });
          }
        } else if (typeof source[key] === 'object' && typeof target[key] === 'object') {
          differences.push(...this.findDifferences(source[key], target[key], newPath));
        } else if (source[key] !== target[key]) {
          differences.push({ path: newPath, sourceValue: source[key], targetValue: target[key] });
        }
      }
    } else if (source !== target) {
      differences.push({ path, sourceValue: source, targetValue: target });
    }

    return differences;
  }

  /**
   * 충돌 조건 확인
   */
  private isConflictingChange(diff: any): boolean {
    // 양쪽 모두 값이 있고 다른 경우
    if (diff.sourceValue !== undefined &&
        diff.targetValue !== undefined &&
        diff.sourceValue !== diff.targetValue) {
      return true;
    }

    return false;
  }

  /**
   * 버전 충돌 확인
   */
  private hasVersionConflict(source: UnifiedEntity, target: UnifiedEntity): boolean {
    const sourceVersion = source.metadata?.version || 0;
    const targetVersion = target.metadata?.version || 0;

    // 소스가 타겟보다 이전 버전인 경우
    return sourceVersion < targetVersion;
  }

  /**
   * 스키마 충돌 확인
   */
  private hasSchemaConflict(source: UnifiedEntity, target: UnifiedEntity): boolean {
    // 엔터티 타입이 다른 경우
    if (source.type !== target.type) {
      return true;
    }

    // 필수 필드 누락 확인
    const sourceKeys = Object.keys(source.data);
    const targetKeys = Object.keys(target.data);

    // 키 구조가 크게 다른 경우
    const commonKeys = sourceKeys.filter(k => targetKeys.includes(k));
    const similarity = commonKeys.length / Math.max(sourceKeys.length, targetKeys.length);

    return similarity < 0.5; // 50% 미만 유사도면 스키마 충돌
  }

  /**
   * 동시 수정 확인
   */
  private hasConcurrentModification(
    source: UnifiedEntity,
    target: UnifiedEntity,
    context: ConflictContext
  ): boolean {
    const sourceModified = source.metadata?.updatedAt || source.metadata?.createdAt;
    const targetModified = target.metadata?.updatedAt || target.metadata?.createdAt;

    if (!sourceModified || !targetModified) {
      return false;
    }

    // 타임스탬프 차이가 매우 작은 경우 (1초 이내)
    const timeDiff = Math.abs(
      new Date(sourceModified).getTime() - new Date(targetModified).getTime()
    );

    return timeDiff < 1000 && context.sessionId !== target.metadata?.sessionId;
  }

  /**
   * 고유성 충돌 확인
   */
  private checkUniquenessConflict(entity: UnifiedEntity): any {
    // 실제 구현에서는 데이터베이스 조회 필요
    // 여기서는 시뮬레이션
    const uniqueFields = ['id', 'email', 'username'];

    for (const field of uniqueFields) {
      if (entity.data[field]) {
        // 고유성 위반 시뮬레이션 (10% 확률)
        if (Math.random() < 0.1) {
          return {
            field,
            value: entity.data[field],
            message: `Duplicate value for unique field: ${field}`
          };
        }
      }
    }

    return null;
  }

  /**
   * 참조 무결성 확인
   */
  private checkReferentialIntegrity(entity: UnifiedEntity): any {
    // 실제 구현에서는 관련 엔터티 확인 필요
    const referenceFields = entity.relationships || [];

    for (const relation of referenceFields) {
      // 참조 무결성 위반 시뮬레이션 (5% 확률)
      if (Math.random() < 0.05) {
        return {
          field: relation.field,
          targetId: relation.targetId,
          message: `Referenced entity not found: ${relation.targetId}`
        };
      }
    }

    return null;
  }

  /**
   * 충돌 객체 생성
   */
  private createConflict(
    type: ConflictType,
    source: UnifiedEntity,
    target: UnifiedEntity | undefined,
    details: any,
    context: ConflictContext
  ): Conflict {
    const conflictId = `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const severity = this.severityCalculator.calculate(type, details);
    const strategies = this.getAvailableStrategies(type, severity);

    return {
      id: conflictId,
      type,
      severity,
      status: 'detected',
      sourceEntity: source,
      targetEntity: target,
      field: details.field,
      details: {
        sourceValue: details.sourceValue,
        targetValue: details.targetValue,
        differences: details.differences,
        constraints: details.constraints,
        rules: details.rules
      },
      context,
      suggestedStrategy: strategies[0],
      availableStrategies: strategies,
      detectedAt: new Date()
    };
  }

  /**
   * 사용 가능한 해결 전략 반환
   */
  private getAvailableStrategies(
    type: ConflictType,
    severity: ConflictSeverity
  ): ResolutionStrategy[] {
    const strategies: ResolutionStrategy[] = [];

    switch (type) {
      case 'version':
        strategies.push('latest_wins', 'source_wins', 'target_wins', 'merge');
        break;

      case 'data':
        if (severity === 'low') {
          strategies.push('latest_wins', 'merge', 'source_wins', 'target_wins');
        } else {
          strategies.push('manual', 'merge', 'defer');
        }
        break;

      case 'schema':
        strategies.push('reject', 'manual', 'defer');
        break;

      case 'concurrent':
        strategies.push('latest_wins', 'merge', 'defer', 'manual');
        break;

      case 'constraint':
      case 'reference':
        strategies.push('reject', 'defer', 'manual');
        break;

      default:
        strategies.push('manual', 'defer');
    }

    return strategies;
  }

  /**
   * 컨텍스트 빌드
   */
  private buildContext(partial?: Partial<ConflictContext>): ConflictContext {
    return {
      timestamp: new Date(),
      source: partial?.source || 'system',
      target: partial?.target || 'database',
      operation: partial?.operation || 'update',
      userId: partial?.userId,
      sessionId: partial?.sessionId || this.generateSessionId(),
      priority: partial?.priority || 5,
      metadata: partial?.metadata
    };
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 탐지 규칙 초기화
   */
  private initializeDetectionRules(): void {
    // 버전 충돌 규칙
    this.detectionRules.set('version', [
      {
        name: 'version_mismatch',
        condition: (source: any, target: any) => {
          return source.version !== target.version;
        },
        severity: 'medium'
      }
    ]);

    // 데이터 충돌 규칙
    this.detectionRules.set('data', [
      {
        name: 'field_conflict',
        condition: (source: any, target: any) => {
          return source !== target && source !== undefined && target !== undefined;
        },
        severity: 'low'
      }
    ]);

    // 추가 규칙 정의...
  }
}

/**
 * 심각도 계산기
 */
class SeverityCalculator {
  calculate(type: ConflictType, details: any): ConflictSeverity {
    // 타입별 기본 심각도
    const baseSeverity: Record<ConflictType, ConflictSeverity> = {
      data: 'low',
      schema: 'high',
      version: 'medium',
      constraint: 'high',
      reference: 'critical',
      business: 'high',
      concurrent: 'medium',
      merge: 'medium'
    };

    let severity = baseSeverity[type] || 'medium';

    // 세부사항에 따른 심각도 조정
    if (details.constraints?.includes('unique')) {
      severity = 'critical';
    }

    if (details.dataLoss) {
      severity = 'critical';
    }

    if (details.affectedEntities?.length > 10) {
      severity = this.increaseSeverity(severity);
    }

    return severity;
  }

  private increaseSeverity(current: ConflictSeverity): ConflictSeverity {
    const levels: ConflictSeverity[] = ['low', 'medium', 'high', 'critical'];
    const currentIndex = levels.indexOf(current);
    return levels[Math.min(currentIndex + 1, levels.length - 1)];
  }
}

/**
 * 탐지 규칙 인터페이스
 */
interface DetectionRule {
  name: string;
  condition: (source: any, target: any) => boolean;
  severity: ConflictSeverity;
}