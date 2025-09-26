/**
 * Conflict Resolver
 * 감지된 충돌을 해결하는 컴포넌트
 */

import type {
  Conflict,
  ResolutionResult,
  ResolutionStrategy,
  ResolutionPolicy,
  MergeOptions,
  ConflictAnalysis
} from './types';
import type { UnifiedEntity } from '../pipeline/transform/types';

export class ConflictResolver {
  private static instance: ConflictResolver;

  private resolutionPolicies: Map<string, ResolutionPolicy>;
  private resolutionHistory: Map<string, ResolutionResult[]>;
  private activeResolutions: Map<string, Promise<ResolutionResult>>;

  private constructor() {
    this.resolutionPolicies = new Map();
    this.resolutionHistory = new Map();
    this.activeResolutions = new Map();

    this.initializeDefaultPolicies();
  }

  public static getInstance(): ConflictResolver {
    if (!ConflictResolver.instance) {
      ConflictResolver.instance = new ConflictResolver();
    }
    return ConflictResolver.instance;
  }

  /**
   * 충돌 해결
   */
  public async resolve(
    conflict: Conflict,
    strategy?: ResolutionStrategy,
    options?: Record<string, any>
  ): Promise<ResolutionResult> {
    // 이미 해결 중인 충돌 확인
    if (this.activeResolutions.has(conflict.id)) {
      return this.activeResolutions.get(conflict.id)!;
    }

    const resolutionPromise = this.performResolution(conflict, strategy, options);
    this.activeResolutions.set(conflict.id, resolutionPromise);

    try {
      const result = await resolutionPromise;
      this.addToHistory(conflict.id, result);
      return result;
    } finally {
      this.activeResolutions.delete(conflict.id);
    }
  }

  /**
   * 실제 해결 수행
   */
  private async performResolution(
    conflict: Conflict,
    strategy?: ResolutionStrategy,
    options?: Record<string, any>
  ): Promise<ResolutionResult> {
    const startTime = Date.now();
    let attempts = 0;
    const maxAttempts = 3;

    // 전략 결정
    const resolveStrategy = strategy || await this.selectStrategy(conflict);

    // 충돌 분석
    const analysis = await this.analyzeConflict(conflict);

    let result: ResolutionResult | null = null;
    let lastError: Error | null = null;

    while (attempts < maxAttempts && !result) {
      attempts++;

      try {
        switch (resolveStrategy) {
          case 'source_wins':
            result = await this.resolveSourceWins(conflict, options);
            break;

          case 'target_wins':
            result = await this.resolveTargetWins(conflict, options);
            break;

          case 'latest_wins':
            result = await this.resolveLatestWins(conflict, options);
            break;

          case 'merge':
            result = await this.resolveMerge(conflict, options);
            break;

          case 'manual':
            result = await this.resolveManual(conflict, options);
            break;

          case 'custom':
            result = await this.resolveCustom(conflict, options);
            break;

          case 'defer':
            result = await this.resolveDefer(conflict, options);
            break;

          case 'reject':
            result = await this.resolveReject(conflict, options);
            break;

          default:
            throw new Error(`Unknown resolution strategy: ${resolveStrategy}`);
        }
      } catch (error) {
        lastError = error as Error;

        // 재시도 가능한 오류인지 확인
        if (!this.isRetryableError(error)) {
          break;
        }

        // 재시도 대기
        if (attempts < maxAttempts) {
          await this.delay(Math.pow(2, attempts) * 1000);
        }
      }
    }

    if (!result) {
      result = {
        conflictId: conflict.id,
        status: 'failure',
        strategy: resolveStrategy,
        resolvedAt: new Date(),
        duration: Date.now() - startTime,
        attempts,
        changes: [],
        error: {
          code: 'RESOLUTION_FAILED',
          message: lastError?.message || 'Failed to resolve conflict',
          details: { analysis }
        }
      };
    }

    return result;
  }

  /**
   * Source Wins 전략
   */
  private async resolveSourceWins(
    conflict: Conflict,
    options?: Record<string, any>
  ): Promise<ResolutionResult> {
    const changes = [];
    const resolvedEntity = { ...conflict.sourceEntity };

    // 변경사항 기록
    if (conflict.targetEntity) {
      const differences = this.findDifferences(
        conflict.sourceEntity.data,
        conflict.targetEntity.data
      );

      for (const diff of differences) {
        changes.push({
          field: diff.path,
          oldValue: diff.targetValue,
          newValue: diff.sourceValue,
          source: 'source' as const
        });
      }
    }

    return {
      conflictId: conflict.id,
      status: 'success',
      strategy: 'source_wins',
      resolvedEntity,
      changes,
      resolvedAt: new Date(),
      duration: 0,
      attempts: 1
    };
  }

  /**
   * Target Wins 전략
   */
  private async resolveTargetWins(
    conflict: Conflict,
    options?: Record<string, any>
  ): Promise<ResolutionResult> {
    if (!conflict.targetEntity) {
      throw new Error('Target entity required for target_wins strategy');
    }

    const changes = [];
    const resolvedEntity = { ...conflict.targetEntity };

    // 변경사항 기록
    const differences = this.findDifferences(
      conflict.sourceEntity.data,
      conflict.targetEntity.data
    );

    for (const diff of differences) {
      changes.push({
        field: diff.path,
        oldValue: diff.sourceValue,
        newValue: diff.targetValue,
        source: 'target' as const
      });
    }

    return {
      conflictId: conflict.id,
      status: 'success',
      strategy: 'target_wins',
      resolvedEntity,
      changes,
      resolvedAt: new Date(),
      duration: 0,
      attempts: 1
    };
  }

  /**
   * Latest Wins 전략
   */
  private async resolveLatestWins(
    conflict: Conflict,
    options?: Record<string, any>
  ): Promise<ResolutionResult> {
    if (!conflict.targetEntity) {
      return this.resolveSourceWins(conflict, options);
    }

    const sourceTime = new Date(
      conflict.sourceEntity.metadata?.updatedAt ||
      conflict.sourceEntity.metadata?.createdAt ||
      0
    ).getTime();

    const targetTime = new Date(
      conflict.targetEntity.metadata?.updatedAt ||
      conflict.targetEntity.metadata?.createdAt ||
      0
    ).getTime();

    if (sourceTime >= targetTime) {
      return this.resolveSourceWins(conflict, options);
    } else {
      return this.resolveTargetWins(conflict, options);
    }
  }

  /**
   * Merge 전략
   */
  private async resolveMerge(
    conflict: Conflict,
    options?: Record<string, any>
  ): Promise<ResolutionResult> {
    if (!conflict.targetEntity) {
      return this.resolveSourceWins(conflict, options);
    }

    const mergeOptions: MergeOptions = options?.mergeOptions || {
      strategy: 'deep',
      arrayMerge: 'union',
      objectMerge: 'deep'
    };

    const mergedData = await this.mergeEntities(
      conflict.sourceEntity,
      conflict.targetEntity,
      mergeOptions
    );

    const resolvedEntity: UnifiedEntity = {
      ...conflict.sourceEntity,
      data: mergedData,
      metadata: {
        ...conflict.sourceEntity.metadata,
        mergedAt: new Date(),
        mergedFrom: [conflict.sourceEntity.id, conflict.targetEntity.id]
      }
    };

    // 변경사항 추적
    const changes = this.trackMergeChanges(
      conflict.sourceEntity.data,
      conflict.targetEntity.data,
      mergedData
    );

    return {
      conflictId: conflict.id,
      status: 'success',
      strategy: 'merge',
      resolvedEntity,
      changes,
      resolvedAt: new Date(),
      duration: 0,
      attempts: 1
    };
  }

  /**
   * 엔터티 병합
   */
  private async mergeEntities(
    source: UnifiedEntity,
    target: UnifiedEntity,
    options: MergeOptions
  ): Promise<any> {
    const sourceData = source.data;
    const targetData = target.data;

    if (options.strategy === 'shallow') {
      return { ...targetData, ...sourceData };
    }

    if (options.strategy === 'deep') {
      return this.deepMerge(sourceData, targetData, options);
    }

    if (options.strategy === 'smart') {
      return this.smartMerge(sourceData, targetData, options);
    }

    return sourceData;
  }

  /**
   * Deep Merge
   */
  private deepMerge(source: any, target: any, options: MergeOptions): any {
    if (source === target) return source;

    if (source === null || source === undefined) return target;
    if (target === null || target === undefined) return source;

    if (typeof source !== 'object' || typeof target !== 'object') {
      return options.onConflict ? options.onConflict('', source, target) : source;
    }

    if (Array.isArray(source) && Array.isArray(target)) {
      return this.mergeArrays(source, target, options.arrayMerge || 'concat');
    }

    const merged: any = {};
    const allKeys = new Set([...Object.keys(source), ...Object.keys(target)]);

    for (const key of allKeys) {
      if (options.fieldStrategies?.has(key)) {
        const fieldStrategy = options.fieldStrategies.get(key)!;
        if (fieldStrategy.transformer) {
          merged[key] = fieldStrategy.transformer(source[key], target[key]);
        } else if (fieldStrategy.priority === 'source') {
          merged[key] = source[key];
        } else if (fieldStrategy.priority === 'target') {
          merged[key] = target[key];
        }
      } else if (key in source && key in target) {
        if (typeof source[key] === 'object' && typeof target[key] === 'object') {
          merged[key] = this.deepMerge(source[key], target[key], options);
        } else if (source[key] !== target[key]) {
          merged[key] = options.onConflict
            ? options.onConflict(key, source[key], target[key])
            : source[key];
        } else {
          merged[key] = source[key];
        }
      } else if (key in source) {
        merged[key] = source[key];
      } else {
        merged[key] = target[key];
      }
    }

    return merged;
  }

  /**
   * Smart Merge
   */
  private smartMerge(source: any, target: any, options: MergeOptions): any {
    // 스마트 병합: 타입과 내용에 따라 최적 전략 선택
    const sourceType = typeof source;
    const targetType = typeof target;

    // 타입이 다른 경우
    if (sourceType !== targetType) {
      // 숫자와 문자열인 경우 변환 시도
      if ((sourceType === 'number' && targetType === 'string') ||
          (sourceType === 'string' && targetType === 'number')) {
        return source;
      }
      return source;
    }

    // 날짜인 경우 최신 선택
    if (source instanceof Date && target instanceof Date) {
      return source > target ? source : target;
    }

    // 객체인 경우 deep merge
    if (sourceType === 'object') {
      return this.deepMerge(source, target, options);
    }

    // 기본값: source 우선
    return source;
  }

  /**
   * 배열 병합
   */
  private mergeArrays(source: any[], target: any[], strategy: string): any[] {
    switch (strategy) {
      case 'concat':
        return [...target, ...source];

      case 'union':
        return [...new Set([...target, ...source])];

      case 'replace':
        return source;

      case 'smart':
        // ID가 있는 객체 배열인 경우 ID 기준 병합
        if (source.length > 0 && typeof source[0] === 'object' && 'id' in source[0]) {
          const merged = [...target];
          for (const item of source) {
            const index = merged.findIndex((m: any) => m.id === item.id);
            if (index >= 0) {
              merged[index] = { ...merged[index], ...item };
            } else {
              merged.push(item);
            }
          }
          return merged;
        }
        return [...new Set([...target, ...source])];

      default:
        return source;
    }
  }

  /**
   * Manual 해결
   */
  private async resolveManual(
    conflict: Conflict,
    options?: Record<string, any>
  ): Promise<ResolutionResult> {
    // 수동 해결 요청 생성
    return {
      conflictId: conflict.id,
      status: 'deferred',
      strategy: 'manual',
      resolvedAt: new Date(),
      duration: 0,
      attempts: 1,
      changes: [],
      error: {
        code: 'MANUAL_RESOLUTION_REQUIRED',
        message: 'This conflict requires manual resolution',
        details: {
          conflictType: conflict.type,
          severity: conflict.severity
        }
      }
    };
  }

  /**
   * Custom 해결
   */
  private async resolveCustom(
    conflict: Conflict,
    options?: Record<string, any>
  ): Promise<ResolutionResult> {
    if (!options?.customResolver) {
      throw new Error('Custom resolver function required');
    }

    const resolved = await options.customResolver(conflict);

    return {
      conflictId: conflict.id,
      status: 'success',
      strategy: 'custom',
      resolvedEntity: resolved,
      changes: [],
      resolvedAt: new Date(),
      duration: 0,
      attempts: 1
    };
  }

  /**
   * Defer 해결
   */
  private async resolveDefer(
    conflict: Conflict,
    options?: Record<string, any>
  ): Promise<ResolutionResult> {
    const deferUntil = options?.deferUntil || new Date(Date.now() + 3600000); // 1시간 후

    return {
      conflictId: conflict.id,
      status: 'deferred',
      strategy: 'defer',
      resolvedAt: new Date(),
      duration: 0,
      attempts: 1,
      changes: [],
      error: {
        code: 'DEFERRED',
        message: `Resolution deferred until ${deferUntil.toISOString()}`,
        details: { deferUntil }
      }
    };
  }

  /**
   * Reject 해결
   */
  private async resolveReject(
    conflict: Conflict,
    options?: Record<string, any>
  ): Promise<ResolutionResult> {
    return {
      conflictId: conflict.id,
      status: 'failure',
      strategy: 'reject',
      resolvedAt: new Date(),
      duration: 0,
      attempts: 1,
      changes: [],
      error: {
        code: 'REJECTED',
        message: options?.reason || 'Conflict resolution rejected',
        details: { conflict }
      }
    };
  }

  /**
   * 전략 선택
   */
  private async selectStrategy(conflict: Conflict): Promise<ResolutionStrategy> {
    // 정책 기반 전략 선택
    const policy = this.findApplicablePolicy(conflict);

    if (policy) {
      for (const rule of policy.rules) {
        if (rule.condition(conflict)) {
          return rule.strategy;
        }
      }
      return policy.defaultStrategy;
    }

    // 기본 전략 선택
    return conflict.suggestedStrategy || 'manual';
  }

  /**
   * 적용 가능한 정책 찾기
   */
  private findApplicablePolicy(conflict: Conflict): ResolutionPolicy | null {
    for (const policy of this.resolutionPolicies.values()) {
      if (!policy.enabled) continue;

      if (policy.entityType && policy.entityType !== conflict.sourceEntity.type) {
        continue;
      }

      if (policy.conflictType && policy.conflictType !== conflict.type) {
        continue;
      }

      return policy;
    }

    return null;
  }

  /**
   * 충돌 분석
   */
  private async analyzeConflict(conflict: Conflict): Promise<ConflictAnalysis> {
    const impact = this.assessImpact(conflict);
    const recommendations = this.generateRecommendations(conflict);
    const patterns = await this.detectPatterns(conflict);

    return {
      conflictId: conflict.id,
      category: this.categorizeConflict(conflict),
      impact,
      recommendations,
      patterns
    };
  }

  /**
   * 영향 평가
   */
  private assessImpact(conflict: Conflict): ConflictAnalysis['impact'] {
    let scope: 'field' | 'entity' | 'related' | 'system' = 'field';
    const affectedEntities = [conflict.sourceEntity.id];

    if (conflict.targetEntity) {
      affectedEntities.push(conflict.targetEntity.id);
    }

    // 범위 결정
    if (conflict.type === 'reference' || conflict.type === 'constraint') {
      scope = 'related';
    } else if (conflict.type === 'schema') {
      scope = 'entity';
    }

    // 데이터 손실 여부
    const dataLoss = conflict.type === 'version' ||
                     (conflict.details.differences?.length || 0) > 5;

    return {
      scope,
      affectedEntities,
      dataLoss,
      reversible: conflict.type !== 'constraint' && conflict.type !== 'reference'
    };
  }

  /**
   * 추천 생성
   */
  private generateRecommendations(
    conflict: Conflict
  ): ConflictAnalysis['recommendations'] {
    const recommendations: ConflictAnalysis['recommendations'] = [];

    for (const strategy of conflict.availableStrategies) {
      const confidence = this.calculateConfidence(conflict, strategy);
      const rationale = this.explainStrategy(conflict, strategy);
      const risks = this.identifyRisks(conflict, strategy);

      recommendations.push({
        strategy,
        confidence,
        rationale,
        risks
      });
    }

    // 신뢰도 기준 정렬
    recommendations.sort((a, b) => b.confidence - a.confidence);

    return recommendations;
  }

  /**
   * 신뢰도 계산
   */
  private calculateConfidence(
    conflict: Conflict,
    strategy: ResolutionStrategy
  ): number {
    let confidence = 0.5;

    // 제안된 전략이면 신뢰도 증가
    if (strategy === conflict.suggestedStrategy) {
      confidence += 0.2;
    }

    // 충돌 타입과 전략 매칭
    const goodMatches: Record<string, ResolutionStrategy[]> = {
      version: ['latest_wins'],
      data: ['merge', 'latest_wins'],
      concurrent: ['latest_wins', 'merge']
    };

    if (goodMatches[conflict.type]?.includes(strategy)) {
      confidence += 0.2;
    }

    // 심각도에 따른 조정
    if (conflict.severity === 'low' && strategy !== 'manual') {
      confidence += 0.1;
    } else if (conflict.severity === 'critical' && strategy === 'manual') {
      confidence += 0.2;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * 전략 설명
   */
  private explainStrategy(
    conflict: Conflict,
    strategy: ResolutionStrategy
  ): string {
    const explanations: Record<ResolutionStrategy, string> = {
      source_wins: 'Use incoming changes, discarding existing data',
      target_wins: 'Keep existing data, discarding incoming changes',
      latest_wins: 'Use the most recently modified version',
      merge: 'Combine both versions intelligently',
      manual: 'Require human intervention for resolution',
      custom: 'Apply custom resolution logic',
      defer: 'Postpone resolution for later',
      reject: 'Reject the change entirely'
    };

    return explanations[strategy] || 'Unknown strategy';
  }

  /**
   * 리스크 식별
   */
  private identifyRisks(
    conflict: Conflict,
    strategy: ResolutionStrategy
  ): string[] {
    const risks: string[] = [];

    if (strategy === 'source_wins' || strategy === 'target_wins') {
      risks.push('Potential data loss');
    }

    if (strategy === 'merge') {
      risks.push('May create inconsistent state');
      risks.push('Complex validation required');
    }

    if (strategy === 'defer') {
      risks.push('Conflict may worsen over time');
      risks.push('Blocking other operations');
    }

    if (conflict.severity === 'critical' && strategy !== 'manual') {
      risks.push('Automated resolution may not be appropriate');
    }

    return risks;
  }

  /**
   * 패턴 감지
   */
  private async detectPatterns(
    conflict: Conflict
  ): Promise<ConflictAnalysis['patterns']> {
    const history = this.resolutionHistory.get(conflict.sourceEntity.id) || [];
    const similarConflicts = history.filter(r =>
      r.strategy === conflict.suggestedStrategy
    );

    return {
      isRecurring: similarConflicts.length > 2,
      frequency: similarConflicts.length,
      lastOccurrence: similarConflicts[similarConflicts.length - 1]?.resolvedAt,
      similarConflicts: similarConflicts.map(r => r.conflictId)
    };
  }

  /**
   * 충돌 분류
   */
  private categorizeConflict(conflict: Conflict): ConflictAnalysis['category'] {
    if (conflict.type === 'schema' || conflict.type === 'constraint') {
      return 'structural';
    }

    if (conflict.severity === 'critical') {
      return 'critical';
    }

    if (conflict.details.differences?.length === 1 &&
        conflict.severity === 'low') {
      return 'trivial';
    }

    return 'semantic';
  }

  /**
   * 병합 변경사항 추적
   */
  private trackMergeChanges(source: any, target: any, merged: any): any[] {
    const changes: any[] = [];
    const allKeys = new Set([
      ...Object.keys(source),
      ...Object.keys(target),
      ...Object.keys(merged)
    ]);

    for (const key of allKeys) {
      const sourceValue = source[key];
      const targetValue = target[key];
      const mergedValue = merged[key];

      if (mergedValue !== targetValue) {
        let changeSource: 'source' | 'target' | 'merged' | 'computed' = 'merged';

        if (mergedValue === sourceValue) {
          changeSource = 'source';
        } else if (mergedValue === targetValue) {
          changeSource = 'target';
        } else if (sourceValue !== undefined && targetValue !== undefined) {
          changeSource = 'computed';
        }

        changes.push({
          field: key,
          oldValue: targetValue,
          newValue: mergedValue,
          source: changeSource
        });
      }
    }

    return changes;
  }

  /**
   * 유틸리티 메서드
   */
  private findDifferences(source: any, target: any): any[] {
    // ConflictDetector와 동일한 로직
    const differences: any[] = [];
    this.findDifferencesRecursive(source, target, '', differences);
    return differences;
  }

  private findDifferencesRecursive(
    source: any,
    target: any,
    path: string,
    differences: any[]
  ): void {
    if (source === target) return;

    if (typeof source !== typeof target ||
        source === null || target === null) {
      differences.push({ path, sourceValue: source, targetValue: target });
      return;
    }

    if (typeof source === 'object') {
      const allKeys = new Set([...Object.keys(source), ...Object.keys(target)]);
      for (const key of allKeys) {
        const newPath = path ? `${path}.${key}` : key;
        this.findDifferencesRecursive(
          source[key],
          target[key],
          newPath,
          differences
        );
      }
    } else if (source !== target) {
      differences.push({ path, sourceValue: source, targetValue: target });
    }
  }

  private isRetryableError(error: any): boolean {
    const retryableCodes = ['EAGAIN', 'ECONNRESET', 'ETIMEDOUT'];
    return retryableCodes.includes(error?.code) ||
           error?.message?.includes('temporary') ||
           error?.message?.includes('timeout');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private addToHistory(conflictId: string, result: ResolutionResult): void {
    const entityId = conflictId.split('-')[1]; // 간단한 추출
    if (!this.resolutionHistory.has(entityId)) {
      this.resolutionHistory.set(entityId, []);
    }
    this.resolutionHistory.get(entityId)!.push(result);
  }

  /**
   * 기본 정책 초기화
   */
  private initializeDefaultPolicies(): void {
    // 버전 충돌 정책
    this.resolutionPolicies.set('version-policy', {
      id: 'version-policy',
      name: 'Version Conflict Policy',
      description: 'Default policy for version conflicts',
      conflictType: 'version',
      rules: [
        {
          condition: (c) => c.severity === 'low',
          strategy: 'latest_wins',
          priority: 1
        },
        {
          condition: (c) => c.severity === 'high',
          strategy: 'manual',
          priority: 2
        }
      ],
      defaultStrategy: 'latest_wins',
      options: {
        autoResolve: true,
        requireApproval: false,
        notifyOnConflict: true,
        maxRetries: 3,
        retryDelay: 1000
      },
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 데이터 충돌 정책
    this.resolutionPolicies.set('data-policy', {
      id: 'data-policy',
      name: 'Data Conflict Policy',
      description: 'Default policy for data conflicts',
      conflictType: 'data',
      rules: [
        {
          condition: (c) => c.severity === 'low',
          strategy: 'merge',
          priority: 1
        },
        {
          condition: (c) => c.severity === 'medium',
          strategy: 'latest_wins',
          priority: 2
        }
      ],
      defaultStrategy: 'merge',
      options: {
        autoResolve: true,
        requireApproval: false,
        notifyOnConflict: false,
        maxRetries: 2,
        retryDelay: 500
      },
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * 정책 관리
   */
  public addPolicy(policy: ResolutionPolicy): void {
    this.resolutionPolicies.set(policy.id, policy);
  }

  public removePolicy(policyId: string): void {
    this.resolutionPolicies.delete(policyId);
  }

  public getPolicy(policyId: string): ResolutionPolicy | undefined {
    return this.resolutionPolicies.get(policyId);
  }

  public getPolicies(): ResolutionPolicy[] {
    return Array.from(this.resolutionPolicies.values());
  }
}