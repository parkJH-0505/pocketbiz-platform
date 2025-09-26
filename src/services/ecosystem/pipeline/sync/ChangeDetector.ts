/**
 * Change Detector
 * 시스템 간 데이터 변화를 감지하고 추적하는 시스템
 */

import { CentralEventBus } from '../../EventBus';
import { DataTransformationEngine } from '../transform/DataTransformationEngine';
import type {
  ChangeEvent,
  ChangeDetectionConfig,
  SyncOperationType,
  ConflictedField
} from './types';
import type { UnifiedEntity, UnifiedEntityType } from '../transform/types';
import type { DataSourceType } from '../types';

interface EntitySnapshot {
  entityId: string;
  entityType: UnifiedEntityType;
  sourceSystem: DataSourceType;
  entity: UnifiedEntity;
  lastModified: Date;
  checksum: string;
  version: number;
}

interface ChangeBuffer {
  changes: ChangeEvent[];
  lastFlush: Date;
  size: number;
}

export class ChangeDetector {
  private static instance: ChangeDetector;

  private eventBus: CentralEventBus;
  private transformationEngine: DataTransformationEngine;
  private config: ChangeDetectionConfig;

  // 엔터티 스냅샷 저장소
  private entitySnapshots: Map<string, EntitySnapshot> = new Map();
  private changeBuffer: ChangeBuffer;
  private isRunning = false;
  private pollingInterval?: NodeJS.Timeout;

  // 중복 제거를 위한 윈도우
  private recentChanges: Map<string, Date> = new Map();

  private constructor() {
    this.eventBus = CentralEventBus.getInstance();
    this.transformationEngine = DataTransformationEngine.getInstance();
    this.config = this.getDefaultConfig();
    this.changeBuffer = {
      changes: [],
      lastFlush: new Date(),
      size: 0
    };

    this.setupEventListeners();
  }

  static getInstance(): ChangeDetector {
    if (!ChangeDetector.instance) {
      ChangeDetector.instance = new ChangeDetector();
    }
    return ChangeDetector.instance;
  }

  /**
   * 변화 감지 시작
   */
  async start(config?: Partial<ChangeDetectionConfig>): Promise<void> {
    if (this.isRunning) {
      console.warn('[ChangeDetector] Already running');
      return;
    }

    if (config) {
      this.config = { ...this.config, ...config };
    }

    console.log('🔍 [ChangeDetector] Starting change detection...');

    // 초기 스냅샷 생성
    await this.createInitialSnapshots();

    // 모드에 따른 감지 시작
    if (this.config.mode === 'polling' || this.config.mode === 'hybrid') {
      this.startPolling();
    }

    // 버퍼 플러시 스케줄링
    this.scheduleBufferFlush();

    this.isRunning = true;
    console.log('✅ [ChangeDetector] Change detection started');
  }

  /**
   * 변화 감지 중지
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.warn('[ChangeDetector] Not running');
      return;
    }

    console.log('🛑 [ChangeDetector] Stopping change detection...');

    // 폴링 중지
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
    }

    // 마지막 버퍼 플러시
    await this.flushChangeBuffer();

    this.isRunning = false;
    console.log('✅ [ChangeDetector] Change detection stopped');
  }

  /**
   * 수동으로 변화 감지 실행
   */
  async detectChanges(
    sourceSystem?: DataSourceType,
    entityType?: UnifiedEntityType
  ): Promise<ChangeEvent[]> {
    console.log(`[ChangeDetector] Manual change detection - ${sourceSystem || 'all'}:${entityType || 'all'}`);

    const detectedChanges: ChangeEvent[] = [];

    // 모든 엔터티 조회
    const entities = this.transformationEngine.getAllEntities();

    for (const entity of entities) {
      // 필터 적용
      if (sourceSystem && entity.sourceType !== sourceSystem) continue;
      if (entityType && entity.type !== entityType) continue;

      const changes = await this.detectEntityChanges(entity);
      detectedChanges.push(...changes);
    }

    console.log(`[ChangeDetector] Detected ${detectedChanges.length} changes`);
    return detectedChanges;
  }

  /**
   * 개별 엔터티 변화 감지
   */
  private async detectEntityChanges(entity: UnifiedEntity): Promise<ChangeEvent[]> {
    const snapshotKey = this.getSnapshotKey(entity);
    const existingSnapshot = this.entitySnapshots.get(snapshotKey);

    // 새로운 엔터티
    if (!existingSnapshot) {
      const changeEvent = await this.createChangeEvent(entity, 'create');
      await this.updateSnapshot(entity);
      return [changeEvent];
    }

    // 변화 감지
    const hasChanged = this.hasEntityChanged(entity, existingSnapshot);
    if (!hasChanged) {
      return [];
    }

    // 변화 유형 결정
    const operationType = this.determineOperationType(entity, existingSnapshot);

    const changeEvent = await this.createChangeEvent(
      entity,
      operationType,
      existingSnapshot.entity
    );

    await this.updateSnapshot(entity);
    return [changeEvent];
  }

  /**
   * 엔터티 변화 여부 확인
   */
  private hasEntityChanged(entity: UnifiedEntity, snapshot: EntitySnapshot): boolean {
    const currentChecksum = this.calculateChecksum(entity);
    const snapshotChecksum = snapshot.checksum;

    // 체크섬 비교
    if (currentChecksum !== snapshotChecksum) {
      return true;
    }

    // 수정 시간 비교
    const currentModified = new Date(entity.updatedAt);
    const snapshotModified = new Date(snapshot.lastModified);

    return currentModified > snapshotModified;
  }

  /**
   * 작업 유형 결정
   */
  private determineOperationType(
    currentEntity: UnifiedEntity,
    snapshot: EntitySnapshot
  ): SyncOperationType {
    // 논리적 삭제 확인
    if (currentEntity.status === 'archived' && snapshot.entity.status !== 'archived') {
      return 'delete';
    }

    // 복원 확인
    if (currentEntity.status !== 'archived' && snapshot.entity.status === 'archived') {
      return 'restore';
    }

    // 기본적으로 업데이트
    return 'update';
  }

  /**
   * 변화 이벤트 생성
   */
  private async createChangeEvent(
    currentEntity: UnifiedEntity,
    operationType: SyncOperationType,
    previousEntity?: UnifiedEntity
  ): Promise<ChangeEvent> {
    // 변경된 필드 계산
    const changedFields = previousEntity
      ? this.calculateChangedFields(currentEntity, previousEntity)
      : Object.keys(currentEntity);

    // 동기화 대상 시스템 결정
    const targetSystems = this.determineTargetSystems(
      currentEntity.sourceType as DataSourceType,
      currentEntity.type
    );

    // 우선순위 계산
    const priority = this.calculatePriority(
      currentEntity.type,
      operationType,
      changedFields
    );

    const changeEvent: ChangeEvent = {
      id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entityId: currentEntity.id,
      entityType: currentEntity.type,
      sourceSystem: currentEntity.sourceType as DataSourceType,
      operationType,
      timestamp: new Date(),

      previousVersion: previousEntity,
      currentVersion: currentEntity,
      changedFields,

      userId: currentEntity.updatedBy,
      changeSource: 'system', // 실제로는 더 정교한 추적 필요
      changeReason: this.inferChangeReason(operationType, changedFields),

      syncRequired: targetSystems.length > 0,
      targetSystems,
      priority
    };

    // 중복 제거 확인
    if (this.isDuplicateChange(changeEvent)) {
      console.log(`[ChangeDetector] Duplicate change ignored: ${changeEvent.id}`);
      return changeEvent; // 빈 이벤트는 아니지만 처리하지 않음
    }

    // 버퍼에 추가
    await this.addToBuffer(changeEvent);

    return changeEvent;
  }

  /**
   * 변경된 필드 계산
   */
  private calculateChangedFields(
    current: UnifiedEntity,
    previous: UnifiedEntity
  ): string[] {
    const changedFields: string[] = [];

    const compareObjects = (
      currentObj: any,
      previousObj: any,
      path: string = ''
    ) => {
      for (const key in currentObj) {
        const currentPath = path ? `${path}.${key}` : key;
        const currentValue = currentObj[key];
        const previousValue = previousObj?.[key];

        if (typeof currentValue === 'object' && currentValue !== null) {
          if (typeof previousValue === 'object' && previousValue !== null) {
            compareObjects(currentValue, previousValue, currentPath);
          } else {
            changedFields.push(currentPath);
          }
        } else if (currentValue !== previousValue) {
          changedFields.push(currentPath);
        }
      }
    };

    compareObjects(current, previous);
    return changedFields;
  }

  /**
   * 동기화 대상 시스템 결정
   */
  private determineTargetSystems(
    sourceSystem: DataSourceType,
    entityType: UnifiedEntityType
  ): DataSourceType[] {
    const allSystems: DataSourceType[] = ['v2', 'calendar', 'buildup'];

    // 소스 시스템 제외
    const targetSystems = allSystems.filter(system => system !== sourceSystem);

    // 엔터티 타입별 필터링 (실제로는 설정에서 관리)
    return targetSystems.filter(system => {
      // 예: 캘린더는 이벤트와 작업만 동기화
      if (system === 'calendar') {
        return ['event', 'task'].includes(entityType);
      }
      // V2는 프로젝트와 추천사항만 동기화
      if (system === 'v2') {
        return ['project', 'recommendation'].includes(entityType);
      }
      // Buildup은 프로젝트와 KPI만 동기화
      if (system === 'buildup') {
        return ['project', 'kpi'].includes(entityType);
      }
      return true;
    });
  }

  /**
   * 우선순위 계산
   */
  private calculatePriority(
    entityType: UnifiedEntityType,
    operationType: SyncOperationType,
    changedFields: string[]
  ): number {
    let priority = 5; // 기본 우선순위

    // 작업 유형별 우선순위
    switch (operationType) {
      case 'create':
        priority += 2;
        break;
      case 'delete':
        priority += 3;
        break;
      case 'update':
        priority += 1;
        break;
      case 'restore':
        priority += 2;
        break;
    }

    // 엔터티 타입별 우선순위
    switch (entityType) {
      case 'kpi':
        priority += 2;
        break;
      case 'project':
        priority += 1;
        break;
      case 'recommendation':
        priority += 1;
        break;
    }

    // 중요 필드 변경 시 우선순위 증가
    const criticalFields = ['status', 'priority', 'scores', 'progress'];
    const hasCriticalChange = changedFields.some(field =>
      criticalFields.some(critical => field.includes(critical))
    );

    if (hasCriticalChange) {
      priority += 2;
    }

    return Math.min(10, Math.max(1, priority));
  }

  /**
   * 변화 이유 추론
   */
  private inferChangeReason(
    operationType: SyncOperationType,
    changedFields: string[]
  ): string {
    switch (operationType) {
      case 'create':
        return 'New entity created';
      case 'delete':
        return 'Entity deleted or archived';
      case 'restore':
        return 'Entity restored from archive';
      case 'update':
        if (changedFields.includes('status')) {
          return 'Status change';
        }
        if (changedFields.some(f => f.includes('score'))) {
          return 'Score update';
        }
        if (changedFields.includes('progress')) {
          return 'Progress update';
        }
        return `Fields updated: ${changedFields.slice(0, 3).join(', ')}`;
      default:
        return 'Unknown change';
    }
  }

  /**
   * 중복 변화 확인
   */
  private isDuplicateChange(changeEvent: ChangeEvent): boolean {
    if (!this.config.enableDeduplication) {
      return false;
    }

    const key = `${changeEvent.entityId}:${changeEvent.operationType}`;
    const lastChange = this.recentChanges.get(key);

    if (lastChange) {
      const timeDiff = changeEvent.timestamp.getTime() - lastChange.getTime();
      if (timeDiff < this.config.deduplicationWindow) {
        return true;
      }
    }

    // 최근 변경 기록 업데이트
    this.recentChanges.set(key, changeEvent.timestamp);

    // 오래된 기록 정리
    this.cleanupRecentChanges();

    return false;
  }

  /**
   * 버퍼에 변화 이벤트 추가
   */
  private async addToBuffer(changeEvent: ChangeEvent): Promise<void> {
    this.changeBuffer.changes.push(changeEvent);
    this.changeBuffer.size++;

    // 버퍼 크기 확인
    if (this.changeBuffer.size >= this.config.batchSize) {
      await this.flushChangeBuffer();
    }
  }

  /**
   * 변화 버퍼 플러시
   */
  private async flushChangeBuffer(): Promise<void> {
    if (this.changeBuffer.changes.length === 0) {
      return;
    }

    console.log(`[ChangeDetector] Flushing ${this.changeBuffer.changes.length} changes`);

    const changesToFlush = [...this.changeBuffer.changes];

    // 버퍼 초기화
    this.changeBuffer.changes = [];
    this.changeBuffer.size = 0;
    this.changeBuffer.lastFlush = new Date();

    // 이벤트 발행
    for (const change of changesToFlush) {
      await this.eventBus.emit({
        id: `change_detected_${Date.now()}`,
        type: 'sync:change_detected',
        source: 'change-detector',
        timestamp: Date.now(),
        data: { changeEvent: change }
      });
    }

    console.log(`[ChangeDetector] Flushed ${changesToFlush.length} changes to event bus`);
  }

  /**
   * 버퍼 플러시 스케줄링
   */
  private scheduleBufferFlush(): void {
    setInterval(async () => {
      const timeSinceLastFlush = Date.now() - this.changeBuffer.lastFlush.getTime();

      if (timeSinceLastFlush >= this.config.flushInterval && this.changeBuffer.changes.length > 0) {
        await this.flushChangeBuffer();
      }
    }, Math.min(this.config.flushInterval / 2, 5000)); // 최소 5초마다 체크
  }

  /**
   * 폴링 시작
   */
  private startPolling(): void {
    this.pollingInterval = setInterval(async () => {
      try {
        await this.detectChanges();
      } catch (error) {
        console.error('[ChangeDetector] Polling error:', error);
      }
    }, this.config.pollInterval);

    console.log(`[ChangeDetector] Polling started with ${this.config.pollInterval}ms interval`);
  }

  /**
   * 초기 스냅샷 생성
   */
  private async createInitialSnapshots(): Promise<void> {
    console.log('[ChangeDetector] Creating initial snapshots...');

    const entities = this.transformationEngine.getAllEntities();

    for (const entity of entities) {
      await this.updateSnapshot(entity);
    }

    console.log(`[ChangeDetector] Created ${this.entitySnapshots.size} initial snapshots`);
  }

  /**
   * 엔터티 스냅샷 업데이트
   */
  private async updateSnapshot(entity: UnifiedEntity): Promise<void> {
    const key = this.getSnapshotKey(entity);

    const snapshot: EntitySnapshot = {
      entityId: entity.id,
      entityType: entity.type,
      sourceSystem: entity.sourceType as DataSourceType,
      entity: { ...entity }, // 깊은 복사 필요 시 JSON.parse(JSON.stringify(entity))
      lastModified: new Date(entity.updatedAt),
      checksum: this.calculateChecksum(entity),
      version: (this.entitySnapshots.get(key)?.version || 0) + 1
    };

    this.entitySnapshots.set(key, snapshot);
  }

  /**
   * 스냅샷 키 생성
   */
  private getSnapshotKey(entity: UnifiedEntity): string {
    return `${entity.sourceType}:${entity.type}:${entity.id}`;
  }

  /**
   * 체크섬 계산
   */
  private calculateChecksum(entity: UnifiedEntity): string {
    // 간단한 체크섬 계산 (실제로는 더 정교한 해싱 필요)
    const data = JSON.stringify(entity, Object.keys(entity).sort());
    return Buffer.from(data).toString('base64').slice(0, 16);
  }

  /**
   * 최근 변경 기록 정리
   */
  private cleanupRecentChanges(): void {
    const cutoff = Date.now() - this.config.deduplicationWindow;

    for (const [key, timestamp] of this.recentChanges.entries()) {
      if (timestamp.getTime() < cutoff) {
        this.recentChanges.delete(key);
      }
    }
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    // 변환 완료 시 스냅샷 업데이트
    this.eventBus.subscribe(
      'transform:completed',
      async (event) => {
        const { entity } = event.data;
        if (entity) {
          await this.updateSnapshot(entity);
        }
      },
      5
    );
  }

  /**
   * 기본 설정 반환
   */
  private getDefaultConfig(): ChangeDetectionConfig {
    return {
      mode: 'hybrid',
      pollInterval: 30000, // 30초

      enabledSystems: ['v2', 'calendar', 'buildup'],
      enabledEntityTypes: ['project', 'event', 'task', 'kpi', 'recommendation'],

      batchSize: 50,
      maxBufferSize: 200,
      flushInterval: 10000, // 10초

      enableDeduplication: true,
      deduplicationWindow: 5000 // 5초
    };
  }

  /**
   * 통계 조회
   */
  getStatistics() {
    return {
      isRunning: this.isRunning,
      totalSnapshots: this.entitySnapshots.size,
      bufferSize: this.changeBuffer.size,
      lastFlush: this.changeBuffer.lastFlush,
      recentChangesCount: this.recentChanges.size,
      config: this.config
    };
  }

  /**
   * 설정 업데이트
   */
  updateConfig(config: Partial<ChangeDetectionConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[ChangeDetector] Configuration updated');
  }

  /**
   * 정리
   */
  async dispose(): Promise<void> {
    await this.stop();
    this.entitySnapshots.clear();
    this.changeBuffer.changes = [];
    this.recentChanges.clear();
    console.log('[ChangeDetector] Disposed');
  }
}