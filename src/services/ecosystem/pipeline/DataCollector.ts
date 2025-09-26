/**
 * Base Data Collector
 * 데이터 수집기 기본 구현
 */

import { CentralEventBus } from '../EventBus';
import type {
  DataCollector,
  DataSourceType,
  CollectionConfig,
  CollectionResult,
  CollectionError,
  RawDataRecord,
  CollectionStartedEvent,
  CollectionCompletedEvent,
  DataReceivedEvent
} from './types';

export abstract class BaseDataCollector implements DataCollector {
  public readonly sourceId: string;
  public readonly sourceType: DataSourceType;
  public isActive: boolean = true;

  protected eventBus: CentralEventBus;
  protected collectionHistory: CollectionResult[] = [];
  protected currentConfig?: CollectionConfig;
  protected healthStatus: 'healthy' | 'warning' | 'error' = 'healthy';
  protected lastHealthCheck?: Date;

  constructor(sourceId: string, sourceType: DataSourceType) {
    this.sourceId = sourceId;
    this.sourceType = sourceType;
    this.eventBus = CentralEventBus.getInstance();
  }

  /**
   * 데이터 수집 실행 (하위 클래스에서 구현)
   */
  abstract collect(config: CollectionConfig): Promise<CollectionResult>;

  /**
   * 실제 데이터 추출 (하위 클래스에서 구현)
   */
  protected abstract extractData(config: CollectionConfig): Promise<RawDataRecord[]>;

  /**
   * 수집 작업 공통 처리 로직
   */
  protected async executeCollection(config: CollectionConfig): Promise<CollectionResult> {
    const collectionId = `collection_${this.sourceId}_${Date.now()}`;
    const startTime = Date.now();
    const startedAt = new Date();

    // 수집 시작 이벤트 발행
    await this.emitCollectionStarted(collectionId, config, startedAt);

    const result: CollectionResult = {
      id: collectionId,
      sourceId: this.sourceId,
      startedAt,
      status: 'running',
      recordsProcessed: 0,
      recordsSucceeded: 0,
      recordsFailed: 0,
      errors: [],
      performance: {
        duration: 0,
        throughput: 0,
        memoryUsed: 0
      }
    };

    try {
      const memoryBefore = this.getMemoryUsage();

      // 실제 데이터 추출
      const records = await this.extractData(config);
      result.recordsProcessed = records.length;

      // 데이터 검증 및 처리
      const { succeeded, failed, errors } = await this.processRecords(records, config);

      result.recordsSucceeded = succeeded.length;
      result.recordsFailed = failed.length;
      result.errors = errors;
      result.status = errors.length > 0 ? (succeeded.length > 0 ? 'completed' : 'failed') : 'completed';
      result.completedAt = new Date();

      const memoryAfter = this.getMemoryUsage();
      const duration = Date.now() - startTime;

      result.performance = {
        duration,
        throughput: records.length > 0 ? records.length / (duration / 1000) : 0,
        memoryUsed: memoryAfter - memoryBefore
      };

      // 성공한 레코드들 이벤트 발행
      if (succeeded.length > 0) {
        await this.emitDataReceived(succeeded);
      }

      // 수집 완료 이벤트 발행
      await this.emitCollectionCompleted(collectionId, result);

      // 히스토리에 추가
      this.collectionHistory.push(result);

      // 히스토리 크기 제한 (최근 100개만 유지)
      if (this.collectionHistory.length > 100) {
        this.collectionHistory = this.collectionHistory.slice(-100);
      }

      return result;

    } catch (error) {
      result.status = 'failed';
      result.completedAt = new Date();
      result.errors.push({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        severity: 'critical'
      });

      await this.emitCollectionCompleted(collectionId, result);
      this.collectionHistory.push(result);

      throw error;
    }
  }

  /**
   * 수집된 레코드 처리 및 검증
   */
  protected async processRecords(
    records: RawDataRecord[],
    config: CollectionConfig
  ): Promise<{
    succeeded: RawDataRecord[];
    failed: RawDataRecord[];
    errors: CollectionError[];
  }> {
    const succeeded: RawDataRecord[] = [];
    const failed: RawDataRecord[] = [];
    const errors: CollectionError[] = [];

    for (const record of records) {
      try {
        // 기본 검증
        if (!this.validateRecord(record)) {
          failed.push(record);
          errors.push({
            recordId: record.id,
            error: 'Record validation failed',
            timestamp: new Date(),
            severity: 'error',
            context: { recordId: record.id }
          });
          continue;
        }

        // 필터 적용
        if (config.filters && !this.applyFilters(record, config.filters)) {
          continue; // 필터에 의해 제외됨
        }

        // 변환 규칙 적용
        if (config.transformRules) {
          this.applyTransformRules(record, config.transformRules);
        }

        succeeded.push(record);

      } catch (error) {
        failed.push(record);
        errors.push({
          recordId: record.id,
          error: error instanceof Error ? error.message : 'Processing failed',
          timestamp: new Date(),
          severity: 'error',
          context: { recordId: record.id }
        });
      }
    }

    return { succeeded, failed, errors };
  }

  /**
   * 레코드 기본 검증
   */
  protected validateRecord(record: RawDataRecord): boolean {
    if (!record.id || !record.sourceId || !record.data) {
      return false;
    }

    if (record.sourceId !== this.sourceId) {
      return false;
    }

    if (!record.metadata || !record.metadata.checksum) {
      return false;
    }

    return true;
  }

  /**
   * 필터 적용
   */
  protected applyFilters(record: RawDataRecord, filters: Record<string, any>): boolean {
    for (const [field, expectedValue] of Object.entries(filters)) {
      const actualValue = this.getNestedValue(record.data, field);

      if (Array.isArray(expectedValue)) {
        if (!expectedValue.includes(actualValue)) {
          return false;
        }
      } else if (actualValue !== expectedValue) {
        return false;
      }
    }
    return true;
  }

  /**
   * 변환 규칙 적용
   */
  protected applyTransformRules(record: RawDataRecord, rules: any[]): void {
    for (const rule of rules) {
      switch (rule.operation) {
        case 'rename':
          this.renameField(record.data, rule.field, rule.params.newName);
          break;
        case 'convert':
          this.convertField(record.data, rule.field, rule.params.type);
          break;
        case 'filter':
          // 이미 applyFilters에서 처리됨
          break;
        case 'aggregate':
          this.aggregateField(record.data, rule.field, rule.params);
          break;
      }
    }
  }

  /**
   * 헬스 체크 구현
   */
  async checkHealth(): Promise<{
    isHealthy: boolean;
    lastCheck: Date;
    response: number;
    errors?: string[];
  }> {
    const startTime = Date.now();
    this.lastHealthCheck = new Date();
    const errors: string[] = [];

    try {
      // 기본 헬스 체크 (하위 클래스에서 오버라이드 가능)
      await this.performHealthCheck();

      const response = Date.now() - startTime;
      const isHealthy = response < 5000; // 5초 이내 응답

      this.healthStatus = isHealthy ? 'healthy' : 'warning';

      return {
        isHealthy,
        lastCheck: this.lastHealthCheck,
        response,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      this.healthStatus = 'error';
      errors.push(error instanceof Error ? error.message : 'Health check failed');

      return {
        isHealthy: false,
        lastCheck: this.lastHealthCheck,
        response: Date.now() - startTime,
        errors
      };
    }
  }

  /**
   * 실제 헬스 체크 수행 (하위 클래스에서 구현)
   */
  protected async performHealthCheck(): Promise<void> {
    // 기본 구현: 단순히 완료 처리
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * 설정 업데이트
   */
  updateConfig(config: Partial<CollectionConfig>): void {
    if (this.currentConfig) {
      this.currentConfig = { ...this.currentConfig, ...config };
    } else {
      console.warn(`No current config found for collector ${this.sourceId}`);
    }
  }

  /**
   * 통계 정보 반환
   */
  getStatistics(): {
    totalCollections: number;
    successRate: number;
    averageResponseTime: number;
    lastCollectionAt?: Date;
  } {
    const total = this.collectionHistory.length;
    const successful = this.collectionHistory.filter(r => r.status === 'completed').length;
    const totalDuration = this.collectionHistory.reduce((sum, r) => sum + r.performance.duration, 0);

    return {
      totalCollections: total,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      averageResponseTime: total > 0 ? totalDuration / total : 0,
      lastCollectionAt: this.collectionHistory.length > 0
        ? this.collectionHistory[this.collectionHistory.length - 1].startedAt
        : undefined
    };
  }

  /**
   * 이벤트 발행 메서드들
   */
  protected async emitCollectionStarted(
    collectionId: string,
    config: CollectionConfig,
    startedAt: Date
  ): Promise<void> {
    const event: CollectionStartedEvent = {
      id: `event_${Date.now()}`,
      type: 'pipeline:collection:started',
      source: 'buildup-auto',
      timestamp: Date.now(),
      data: {
        sourceId: this.sourceId,
        collectionId,
        config,
        startedAt
      }
    };

    await this.eventBus.emit(event);
  }

  protected async emitCollectionCompleted(
    collectionId: string,
    result: CollectionResult
  ): Promise<void> {
    const event: CollectionCompletedEvent = {
      id: `event_${Date.now()}`,
      type: 'pipeline:collection:completed',
      source: 'buildup-auto',
      timestamp: Date.now(),
      data: {
        sourceId: this.sourceId,
        collectionId,
        result
      }
    };

    await this.eventBus.emit(event);
  }

  protected async emitDataReceived(records: RawDataRecord[]): Promise<void> {
    const event: DataReceivedEvent = {
      id: `event_${Date.now()}`,
      type: 'pipeline:data:received',
      source: 'buildup-auto',
      timestamp: Date.now(),
      data: {
        sourceId: this.sourceId,
        records,
        receivedAt: new Date()
      }
    };

    await this.eventBus.emit(event);
  }

  /**
   * 유틸리티 메서드들
   */
  protected getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  protected renameField(obj: any, oldName: string, newName: string): void {
    if (obj.hasOwnProperty(oldName)) {
      obj[newName] = obj[oldName];
      delete obj[oldName];
    }
  }

  protected convertField(obj: any, field: string, targetType: string): void {
    if (!obj.hasOwnProperty(field)) return;

    const value = obj[field];
    switch (targetType) {
      case 'string':
        obj[field] = String(value);
        break;
      case 'number':
        obj[field] = Number(value);
        break;
      case 'boolean':
        obj[field] = Boolean(value);
        break;
      case 'date':
        obj[field] = new Date(value);
        break;
    }
  }

  protected aggregateField(obj: any, field: string, params: any): void {
    // 간단한 aggregation 구현
    if (Array.isArray(obj[field])) {
      switch (params.operation) {
        case 'count':
          obj[field] = obj[field].length;
          break;
        case 'sum':
          obj[field] = obj[field].reduce((sum: number, val: any) => sum + Number(val), 0);
          break;
        case 'avg':
          obj[field] = obj[field].reduce((sum: number, val: any) => sum + Number(val), 0) / obj[field].length;
          break;
      }
    }
  }

  protected getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * 정리 메서드
   */
  dispose(): void {
    this.isActive = false;
    this.collectionHistory = [];
  }
}