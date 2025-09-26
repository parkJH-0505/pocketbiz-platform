/**
 * Conflict Resolver
 * 데이터 동기화 중 발생하는 충돌을 감지하고 해결하는 시스템
 */

import { CentralEventBus } from '../../EventBus';
import type {
  SyncOperation,
  SyncConflict,
  ConflictResolution,
  ConflictResolutionStrategy,
  ConflictedField
} from './types';
import type { UnifiedEntity } from '../transform/types';

interface ConflictDetectionRule {
  name: string;
  entityType: string;
  fields: string[];
  strategy: ConflictResolutionStrategy;
  priority: number;
  customResolver?: (conflict: SyncConflict) => Promise<ConflictResolution>;
}

interface ConflictAnalysis {
  totalConflicts: number;
  conflictsByType: Record<string, number>;
  conflictsByEntity: Record<string, number>;
  resolutionSuccess: number;
  manualInterventions: number;
}

export class ConflictResolver {
  private static instance: ConflictResolver;

  private eventBus: CentralEventBus;
  private detectionRules: Map<string, ConflictDetectionRule> = new Map();
  private pendingConflicts: Map<string, SyncConflict> = new Map();
  private resolutionHistory: ConflictResolution[] = [];
  private analysis: ConflictAnalysis;

  private constructor() {
    this.eventBus = CentralEventBus.getInstance();
    this.analysis = this.initializeAnalysis();
    this.setupDefaultRules();
  }

  static getInstance(): ConflictResolver {
    if (!ConflictResolver.instance) {
      ConflictResolver.instance = new ConflictResolver();
    }
    return ConflictResolver.instance;
  }

  /**
   * 충돌 감지
   */
  async detectConflicts(operation: SyncOperation): Promise<SyncConflict[]> {
    const conflicts: SyncConflict[] = [];

    console.log(`[ConflictResolver] Detecting conflicts for operation: ${operation.id}`);

    // 기본 충돌 검사
    const basicConflicts = await this.detectBasicConflicts(operation);
    conflicts.push(...basicConflicts);

    // 비즈니스 규칙 충돌 검사
    const businessConflicts = await this.detectBusinessRuleConflicts(operation);
    conflicts.push(...businessConflicts);

    // 의존성 충돌 검사
    const dependencyConflicts = await this.detectDependencyConflicts(operation);
    conflicts.push(...dependencyConflicts);

    console.log(`[ConflictResolver] Detected ${conflicts.length} conflicts for operation ${operation.id}`);

    // 충돌 기록
    for (const conflict of conflicts) {
      this.pendingConflicts.set(conflict.id, conflict);
      this.updateAnalysis(conflict);
    }

    return conflicts;
  }

  /**
   * 기본 충돌 감지
   */
  private async detectBasicConflicts(operation: SyncOperation): Promise<SyncConflict[]> {
    const conflicts: SyncConflict[] = [];

    if (!operation.targetEntity || operation.operationType === 'create') {
      return conflicts; // 생성 작업은 기본 충돌 없음
    }

    const sourceEntity = operation.sourceEntity;
    const targetEntity = operation.targetEntity;

    // 버전 충돌 검사
    const versionConflict = this.checkVersionConflict(sourceEntity, targetEntity);
    if (versionConflict) {
      const conflict = await this.createConflict(
        operation,
        'version',
        sourceEntity,
        targetEntity,
        [versionConflict]
      );
      conflicts.push(conflict);
    }

    // 필드별 충돌 검사
    const fieldConflicts = this.checkFieldConflicts(sourceEntity, targetEntity);
    if (fieldConflicts.length > 0) {
      const conflict = await this.createConflict(
        operation,
        'field',
        sourceEntity,
        targetEntity,
        fieldConflicts
      );
      conflicts.push(conflict);
    }

    return conflicts;
  }

  /**
   * 버전 충돌 검사
   */
  private checkVersionConflict(
    sourceEntity: UnifiedEntity,
    targetEntity: UnifiedEntity
  ): ConflictedField | null {
    const sourceUpdated = new Date(sourceEntity.updatedAt);
    const targetUpdated = new Date(targetEntity.updatedAt);

    // 동시 수정 감지 (5초 이내)
    const timeDiff = Math.abs(sourceUpdated.getTime() - targetUpdated.getTime());
    if (timeDiff < 5000 && sourceEntity.updatedBy !== targetEntity.updatedBy) {
      return {
        fieldPath: 'updatedAt',
        sourceValue: sourceUpdated,
        targetValue: targetUpdated,
        conflictType: 'concurrent_modification',
        lastModified: {
          source: sourceUpdated,
          target: targetUpdated
        }
      };
    }

    return null;
  }

  /**
   * 필드별 충돌 검사
   */
  private checkFieldConflicts(
    sourceEntity: UnifiedEntity,
    targetEntity: UnifiedEntity
  ): ConflictedField[] {
    const conflicts: ConflictedField[] = [];

    // 중요 필드들에 대한 충돌 검사
    const criticalFields = [
      'status', 'priority', 'title', 'progress',
      'scores', 'kpiImpact', 'expectedResults'
    ];

    for (const field of criticalFields) {
      const sourceValue = this.getFieldValue(sourceEntity, field);
      const targetValue = this.getFieldValue(targetEntity, field);

      if (sourceValue !== undefined && targetValue !== undefined) {
        const isConflicted = this.isFieldConflicted(sourceValue, targetValue, field);

        if (isConflicted) {
          conflicts.push({
            fieldPath: field,
            sourceValue,
            targetValue,
            conflictType: 'different_values',
            lastModified: {
              source: new Date(sourceEntity.updatedAt),
              target: new Date(targetEntity.updatedAt)
            }
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * 필드 충돌 여부 확인
   */
  private isFieldConflicted(sourceValue: any, targetValue: any, fieldPath: string): boolean {
    // 기본 값 비교
    if (sourceValue === targetValue) {
      return false;
    }

    // 객체 비교 (점수 등)
    if (typeof sourceValue === 'object' && typeof targetValue === 'object') {
      return JSON.stringify(sourceValue) !== JSON.stringify(targetValue);
    }

    // 숫자 비교 (임계값 기반)
    if (typeof sourceValue === 'number' && typeof targetValue === 'number') {
      if (fieldPath.includes('score') || fieldPath.includes('progress')) {
        return Math.abs(sourceValue - targetValue) > 5; // 5점 이상 차이
      }
    }

    return true;
  }

  /**
   * 비즈니스 규칙 충돌 감지
   */
  private async detectBusinessRuleConflicts(operation: SyncOperation): Promise<SyncConflict[]> {
    const conflicts: SyncConflict[] = [];

    // 프로젝트 상태 전이 규칙
    if (operation.entityType === 'project') {
      const statusConflict = this.checkProjectStatusTransition(operation);
      if (statusConflict) {
        conflicts.push(statusConflict);
      }
    }

    // KPI 점수 유효성 규칙
    if (operation.entityType === 'kpi') {
      const scoreConflict = this.checkKPIScoreValidity(operation);
      if (scoreConflict) {
        conflicts.push(scoreConflict);
      }
    }

    return conflicts;
  }

  /**
   * 프로젝트 상태 전이 규칙 검사
   */
  private checkProjectStatusTransition(operation: SyncOperation): SyncConflict | null {
    const sourceStatus = operation.sourceEntity.status;
    const targetStatus = operation.targetEntity?.status;

    // 잘못된 상태 전이 검사
    const invalidTransitions = [
      { from: 'completed', to: 'draft' },
      { from: 'cancelled', to: 'active' },
      { from: 'archived', to: 'active' }
    ];

    const hasInvalidTransition = invalidTransitions.some(
      transition => targetStatus === transition.from && sourceStatus === transition.to
    );

    if (hasInvalidTransition) {
      return {
        id: `conflict_business_${Date.now()}`,
        syncOperationId: operation.id,
        entityId: operation.entityId,
        entityType: operation.entityType,
        conflictType: 'business_rule',
        sourceVersion: operation.sourceEntity,
        targetVersion: operation.targetEntity!,
        conflictedFields: [{
          fieldPath: 'status',
          sourceValue: sourceStatus,
          targetValue: targetStatus,
          conflictType: 'different_values',
          lastModified: {
            source: new Date(operation.sourceEntity.updatedAt),
            target: new Date(operation.targetEntity!.updatedAt)
          }
        }],
        resolutionStrategy: 'manual',
        resolutionStatus: 'pending',
        detectedAt: new Date(),
        priority: 8,
        autoResolvable: false
      };
    }

    return null;
  }

  /**
   * KPI 점수 유효성 검사
   */
  private checkKPIScoreValidity(operation: SyncOperation): SyncConflict | null {
    const sourceScores = operation.sourceEntity.scores;
    const targetScores = operation.targetEntity?.scores;

    if (!sourceScores || !targetScores) {
      return null;
    }

    // 점수 급격한 변화 감지
    for (const axis of Object.keys(sourceScores)) {
      const sourcScore = sourceScores[axis];
      const targetScore = targetScores[axis];

      if (Math.abs(sourcScore - targetScore) > 30) { // 30점 이상 변화
        return {
          id: `conflict_kpi_${Date.now()}`,
          syncOperationId: operation.id,
          entityId: operation.entityId,
          entityType: operation.entityType,
          conflictType: 'business_rule',
          sourceVersion: operation.sourceEntity,
          targetVersion: operation.targetEntity!,
          conflictedFields: [{
            fieldPath: `scores.${axis}`,
            sourceValue: sourcScore,
            targetValue: targetScore,
            conflictType: 'different_values',
            lastModified: {
              source: new Date(operation.sourceEntity.updatedAt),
              target: new Date(operation.targetEntity!.updatedAt)
            }
          }],
          resolutionStrategy: 'manual',
          resolutionStatus: 'pending',
          detectedAt: new Date(),
          priority: 7,
          autoResolvable: false
        };
      }
    }

    return null;
  }

  /**
   * 의존성 충돌 감지
   */
  private async detectDependencyConflicts(operation: SyncOperation): Promise<SyncConflict[]> {
    const conflicts: SyncConflict[] = [];

    // 삭제 작업 시 의존성 확인
    if (operation.operationType === 'delete') {
      const dependencyConflict = await this.checkDeletionDependencies(operation);
      if (dependencyConflict) {
        conflicts.push(dependencyConflict);
      }
    }

    return conflicts;
  }

  /**
   * 삭제 의존성 검사
   */
  private async checkDeletionDependencies(operation: SyncOperation): Promise<SyncConflict | null> {
    // 실제 구현에서는 데이터베이스에서 의존성을 확인
    // 여기서는 시뮬레이션

    const hasDepenecies = Math.random() > 0.9; // 10% 확률로 의존성 있음

    if (hasDepenecies) {
      return {
        id: `conflict_dependency_${Date.now()}`,
        syncOperationId: operation.id,
        entityId: operation.entityId,
        entityType: operation.entityType,
        conflictType: 'dependency',
        sourceVersion: operation.sourceEntity,
        targetVersion: operation.targetEntity!,
        conflictedFields: [],
        resolutionStrategy: 'manual',
        resolutionStatus: 'pending',
        detectedAt: new Date(),
        priority: 9,
        autoResolvable: false
      };
    }

    return null;
  }

  /**
   * 충돌 해결
   */
  async resolveConflicts(conflicts: SyncConflict[]): Promise<boolean> {
    console.log(`[ConflictResolver] Resolving ${conflicts.length} conflicts`);

    let allResolved = true;

    for (const conflict of conflicts) {
      const resolved = await this.resolveConflict(conflict);
      if (!resolved) {
        allResolved = false;
      }
    }

    console.log(`[ConflictResolver] Resolution complete. All resolved: ${allResolved}`);
    return allResolved;
  }

  /**
   * 개별 충돌 해결
   */
  private async resolveConflict(conflict: SyncConflict): Promise<boolean> {
    console.log(`[ConflictResolver] Resolving conflict: ${conflict.id} (${conflict.resolutionStrategy})`);

    try {
      let resolution: ConflictResolution;

      switch (conflict.resolutionStrategy) {
        case 'source_wins':
          resolution = this.resolveSourceWins(conflict);
          break;
        case 'target_wins':
          resolution = this.resolveTargetWins(conflict);
          break;
        case 'latest_wins':
          resolution = this.resolveLatestWins(conflict);
          break;
        case 'merge_fields':
          resolution = this.resolveMergeFields(conflict);
          break;
        case 'manual':
          // 수동 해결 대기
          console.warn(`[ConflictResolver] Manual resolution required for conflict ${conflict.id}`);
          return false;
        case 'custom':
          resolution = await this.resolveCustom(conflict);
          break;
        default:
          resolution = this.resolveLatestWins(conflict); // 기본 전략
      }

      // 해결 결과 적용
      conflict.resolution = resolution;
      conflict.resolutionStatus = 'resolved';
      conflict.resolvedAt = new Date();
      conflict.resolvedBy = 'system';

      // 히스토리에 추가
      this.resolutionHistory.push(resolution);

      // 분석 업데이트
      this.analysis.resolutionSuccess++;

      // 이벤트 발행
      await this.eventBus.emit({
        id: `conflict_resolved_${Date.now()}`,
        type: 'sync:conflict_resolved',
        source: 'conflict-resolver',
        timestamp: Date.now(),
        data: { conflict, resolution }
      });

      console.log(`[ConflictResolver] Conflict resolved: ${conflict.id}`);
      return true;

    } catch (error) {
      console.error(`[ConflictResolver] Failed to resolve conflict ${conflict.id}:`, error);

      // 수동 해결로 에스컬레이션
      conflict.resolutionStatus = 'escalated';
      this.analysis.manualInterventions++;

      return false;
    }
  }

  /**
   * 소스 우선 해결
   */
  private resolveSourceWins(conflict: SyncConflict): ConflictResolution {
    return {
      strategy: 'source_wins',
      resolvedEntity: conflict.sourceVersion,
      fieldResolutions: conflict.conflictedFields.map(field => ({
        fieldPath: field.fieldPath,
        chosenValue: field.sourceValue,
        chosenSource: 'source',
        reasoning: 'Source system value chosen by source_wins strategy'
      })),
      metadata: {
        resolvedBy: 'system',
        resolvedAt: new Date(),
        confidence: 0.8,
        reasoning: 'Source system has priority in this configuration'
      }
    };
  }

  /**
   * 타겟 우선 해결
   */
  private resolveTargetWins(conflict: SyncConflict): ConflictResolution {
    return {
      strategy: 'target_wins',
      resolvedEntity: conflict.targetVersion,
      fieldResolutions: conflict.conflictedFields.map(field => ({
        fieldPath: field.fieldPath,
        chosenValue: field.targetValue,
        chosenSource: 'target',
        reasoning: 'Target system value chosen by target_wins strategy'
      })),
      metadata: {
        resolvedBy: 'system',
        resolvedAt: new Date(),
        confidence: 0.8,
        reasoning: 'Target system has priority in this configuration'
      }
    };
  }

  /**
   * 최신 수정 우선 해결
   */
  private resolveLatestWins(conflict: SyncConflict): ConflictResolution {
    const resolvedEntity = { ...conflict.sourceVersion };
    const fieldResolutions = conflict.conflictedFields.map(field => {
      const sourceNewer = field.lastModified.source > field.lastModified.target;

      if (sourceNewer) {
        return {
          fieldPath: field.fieldPath,
          chosenValue: field.sourceValue,
          chosenSource: 'source' as const,
          reasoning: 'Source value is more recent'
        };
      } else {
        // 타겟이 더 최신이면 타겟 값 적용
        this.setFieldValue(resolvedEntity, field.fieldPath, field.targetValue);
        return {
          fieldPath: field.fieldPath,
          chosenValue: field.targetValue,
          chosenSource: 'target' as const,
          reasoning: 'Target value is more recent'
        };
      }
    });

    return {
      strategy: 'latest_wins',
      resolvedEntity,
      fieldResolutions,
      metadata: {
        resolvedBy: 'system',
        resolvedAt: new Date(),
        confidence: 0.9,
        reasoning: 'Most recently modified values chosen'
      }
    };
  }

  /**
   * 필드별 병합 해결
   */
  private resolveMergeFields(conflict: SyncConflict): ConflictResolution {
    const resolvedEntity = { ...conflict.sourceVersion };
    const fieldResolutions = conflict.conflictedFields.map(field => {
      // 필드별 병합 로직
      const mergedValue = this.mergeFieldValues(
        field.sourceValue,
        field.targetValue,
        field.fieldPath
      );

      this.setFieldValue(resolvedEntity, field.fieldPath, mergedValue);

      return {
        fieldPath: field.fieldPath,
        chosenValue: mergedValue,
        chosenSource: 'merged' as const,
        reasoning: 'Values merged using field-specific logic'
      };
    });

    return {
      strategy: 'merge_fields',
      resolvedEntity,
      fieldResolutions,
      metadata: {
        resolvedBy: 'system',
        resolvedAt: new Date(),
        confidence: 0.7,
        reasoning: 'Field values merged using intelligent merge logic'
      }
    };
  }

  /**
   * 필드 값 병합
   */
  private mergeFieldValues(sourceValue: any, targetValue: any, fieldPath: string): any {
    // 배열 병합
    if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
      return [...new Set([...sourceValue, ...targetValue])];
    }

    // 객체 병합 (KPI 점수 등)
    if (typeof sourceValue === 'object' && typeof targetValue === 'object') {
      return { ...targetValue, ...sourceValue }; // 소스가 우선
    }

    // 숫자 평균
    if (typeof sourceValue === 'number' && typeof targetValue === 'number') {
      if (fieldPath.includes('score') || fieldPath.includes('progress')) {
        return Math.round((sourceValue + targetValue) / 2);
      }
    }

    // 문자열은 최신 것 선택 (소스 우선)
    return sourceValue;
  }

  /**
   * 커스텀 해결
   */
  private async resolveCustom(conflict: SyncConflict): Promise<ConflictResolution> {
    // 룰 기반 커스텀 해결
    const rule = this.detectionRules.get(conflict.entityType);

    if (rule && rule.customResolver) {
      return await rule.customResolver(conflict);
    }

    // 기본 최신 우선 적용
    return this.resolveLatestWins(conflict);
  }

  /**
   * 충돌 생성
   */
  private async createConflict(
    operation: SyncOperation,
    conflictType: 'field' | 'version' | 'dependency' | 'business_rule',
    sourceEntity: UnifiedEntity,
    targetEntity: UnifiedEntity,
    conflictedFields: ConflictedField[]
  ): Promise<SyncConflict> {
    const strategy = this.determineResolutionStrategy(operation.entityType, conflictType);
    const priority = this.calculateConflictPriority(conflictType, conflictedFields);

    return {
      id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      syncOperationId: operation.id,
      entityId: operation.entityId,
      entityType: operation.entityType,
      conflictType,
      sourceVersion: sourceEntity,
      targetVersion: targetEntity,
      conflictedFields,
      resolutionStrategy: strategy,
      resolutionStatus: 'pending',
      detectedAt: new Date(),
      priority,
      autoResolvable: strategy !== 'manual'
    };
  }

  /**
   * 해결 전략 결정
   */
  private determineResolutionStrategy(
    entityType: string,
    conflictType: string
  ): ConflictResolutionStrategy {
    // 엔터티별 기본 전략
    const entityStrategies: Record<string, ConflictResolutionStrategy> = {
      'kpi': 'latest_wins',
      'project': 'merge_fields',
      'event': 'source_wins',
      'task': 'latest_wins',
      'recommendation': 'source_wins'
    };

    // 충돌 타입별 특수 전략
    if (conflictType === 'business_rule' || conflictType === 'dependency') {
      return 'manual';
    }

    return entityStrategies[entityType] || 'latest_wins';
  }

  /**
   * 충돌 우선순위 계산
   */
  private calculateConflictPriority(
    conflictType: string,
    conflictedFields: ConflictedField[]
  ): number {
    let priority = 5; // 기본 우선순위

    // 충돌 타입별 우선순위
    switch (conflictType) {
      case 'dependency':
        priority = 9;
        break;
      case 'business_rule':
        priority = 8;
        break;
      case 'version':
        priority = 6;
        break;
      case 'field':
        priority = 5;
        break;
    }

    // 중요 필드 충돌 시 우선순위 증가
    const criticalFields = ['status', 'scores', 'priority'];
    const hasCriticalConflict = conflictedFields.some(field =>
      criticalFields.some(critical => field.fieldPath.includes(critical))
    );

    if (hasCriticalConflict) {
      priority += 2;
    }

    return Math.min(10, priority);
  }

  /**
   * 유틸리티 메서드들
   */
  private getFieldValue(entity: UnifiedEntity, fieldPath: string): any {
    return fieldPath.split('.').reduce((obj, key) => obj?.[key], entity);
  }

  private setFieldValue(entity: UnifiedEntity, fieldPath: string, value: any): void {
    const keys = fieldPath.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((obj, key) => {
      if (!obj[key]) obj[key] = {};
      return obj[key];
    }, entity as any);
    target[lastKey] = value;
  }

  /**
   * 기본 규칙 설정
   */
  private setupDefaultRules(): void {
    this.addRule({
      name: 'project_merge_rule',
      entityType: 'project',
      fields: ['progress', 'status', 'team'],
      strategy: 'merge_fields',
      priority: 1
    });

    this.addRule({
      name: 'kpi_latest_rule',
      entityType: 'kpi',
      fields: ['scores', 'measuredAt'],
      strategy: 'latest_wins',
      priority: 1
    });
  }

  /**
   * 규칙 추가
   */
  addRule(rule: ConflictDetectionRule): void {
    this.detectionRules.set(rule.name, rule);
    console.log(`[ConflictResolver] Added rule: ${rule.name}`);
  }

  /**
   * 분석 초기화
   */
  private initializeAnalysis(): ConflictAnalysis {
    return {
      totalConflicts: 0,
      conflictsByType: {},
      conflictsByEntity: {},
      resolutionSuccess: 0,
      manualInterventions: 0
    };
  }

  /**
   * 분석 업데이트
   */
  private updateAnalysis(conflict: SyncConflict): void {
    this.analysis.totalConflicts++;
    this.analysis.conflictsByType[conflict.conflictType] =
      (this.analysis.conflictsByType[conflict.conflictType] || 0) + 1;
    this.analysis.conflictsByEntity[conflict.entityType] =
      (this.analysis.conflictsByEntity[conflict.entityType] || 0) + 1;
  }

  /**
   * 통계 조회
   */
  getStatistics() {
    return {
      pendingConflicts: this.pendingConflicts.size,
      totalRules: this.detectionRules.size,
      resolutionHistory: this.resolutionHistory.length,
      analysis: this.analysis
    };
  }

  /**
   * 수동 충돌 해결
   */
  async manualResolve(
    conflictId: string,
    resolution: ConflictResolution,
    userId: string
  ): Promise<boolean> {
    const conflict = this.pendingConflicts.get(conflictId);
    if (!conflict) {
      console.warn(`[ConflictResolver] Conflict not found: ${conflictId}`);
      return false;
    }

    conflict.resolution = resolution;
    conflict.resolutionStatus = 'resolved';
    conflict.resolvedAt = new Date();
    conflict.resolvedBy = userId;

    this.resolutionHistory.push(resolution);
    this.pendingConflicts.delete(conflictId);

    // 이벤트 발행
    await this.eventBus.emit({
      id: `manual_resolution_${Date.now()}`,
      type: 'sync:conflict_resolved',
      source: 'conflict-resolver',
      timestamp: Date.now(),
      data: { conflict, resolution, resolvedBy: userId }
    });

    console.log(`[ConflictResolver] Manual resolution applied for conflict ${conflictId}`);
    return true;
  }

  /**
   * 정리
   */
  dispose(): void {
    this.pendingConflicts.clear();
    this.detectionRules.clear();
    this.resolutionHistory = [];
    this.analysis = this.initializeAnalysis();
    console.log('[ConflictResolver] Disposed');
  }
}