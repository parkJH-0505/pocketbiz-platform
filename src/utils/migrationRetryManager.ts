/**
 * migrationRetryManager.ts
 *
 * 마이그레이션 재시도 관리자
 * 무한 재시도 방지 및 상태 추적
 */

interface RetryRecord {
  migrationId: string;
  attempts: number;
  lastAttempt: Date;
  status: 'pending' | 'completed' | 'failed' | 'skipped';
  reason?: string;
}

class MigrationRetryManager {
  private records = new Map<string, RetryRecord>();
  private maxAttempts = 3;
  private retryDelay = 5000; // 5초
  private storageKey = 'migration_retry_records';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * 마이그레이션 ID 생성
   */
  generateMigrationId(projectId?: string): string {
    const timestamp = new Date().toISOString();
    const projectPart = projectId || 'global';
    return `migration_${projectPart}_${timestamp}`;
  }

  /**
   * 재시도 가능 여부 확인
   */
  shouldRetry(migrationId: string): boolean {
    const record = this.records.get(migrationId);

    // 처음 시도
    if (!record) {
      return true;
    }

    // 이미 완료됨
    if (record.status === 'completed') {
      ;
      return false;
    }

    // 스킵됨
    if (record.status === 'skipped') {
      return false;
    }

    // 최대 시도 횟수 초과
    if (record.attempts >= this.maxAttempts) {
      console.warn(`⚠️ Migration ${migrationId} exceeded max attempts (${this.maxAttempts})`);
      return false;
    }

    // 재시도 지연 시간 체크
    const timeSinceLastAttempt = Date.now() - record.lastAttempt.getTime();
    if (timeSinceLastAttempt < this.retryDelay) {
      console.log(`⏳ Waiting before retry... ${this.retryDelay - timeSinceLastAttempt}ms remaining`);
      return false;
    }

    return true;
  }

  /**
   * 시도 기록
   */
  recordAttempt(migrationId: string): void {
    const existing = this.records.get(migrationId);

    if (existing) {
      existing.attempts += 1;
      existing.lastAttempt = new Date();
      existing.status = 'pending';
    } else {
      this.records.set(migrationId, {
        migrationId,
        attempts: 1,
        lastAttempt: new Date(),
        status: 'pending'
      });
    }

    this.saveToStorage();
  }

  /**
   * 완료 표시
   */
  markCompleted(migrationId: string): void {
    const record = this.records.get(migrationId) || {
      migrationId,
      attempts: 0,
      lastAttempt: new Date(),
      status: 'pending' as const
    };

    record.status = 'completed';
    this.records.set(migrationId, record);

    ;
    this.saveToStorage();
  }

  /**
   * 실패 표시
   */
  markFailed(migrationId: string, reason: string): void {
    const record = this.records.get(migrationId) || {
      migrationId,
      attempts: 0,
      lastAttempt: new Date(),
      status: 'pending' as const
    };

    record.status = 'failed';
    record.reason = reason;
    this.records.set(migrationId, record);

    console.error(`❌ Migration failed: ${migrationId} - ${reason}`);
    this.saveToStorage();
  }

  /**
   * 스킵 표시
   */
  markSkipped(migrationId: string, reason: string): void {
    const record = this.records.get(migrationId) || {
      migrationId,
      attempts: 0,
      lastAttempt: new Date(),
      status: 'pending' as const
    };

    record.status = 'skipped';
    record.reason = reason;
    this.records.set(migrationId, record);

    this.saveToStorage();
  }

  /**
   * 시도 횟수 조회
   */
  getAttemptCount(migrationId: string): number {
    return this.records.get(migrationId)?.attempts || 0;
  }

  /**
   * 상태 조회
   */
  getStatus(migrationId: string): RetryRecord['status'] | null {
    return this.records.get(migrationId)?.status || null;
  }

  /**
   * 모든 기록 조회
   */
  getAllRecords(): RetryRecord[] {
    return Array.from(this.records.values());
  }

  /**
   * 프로젝트별 마이그레이션 완료 여부
   */
  isProjectMigrated(projectId: string): boolean {
    const projectRecords = Array.from(this.records.values()).filter(r =>
      r.migrationId.includes(projectId)
    );

    return projectRecords.some(r => r.status === 'completed');
  }

  /**
   * 초기화
   */
  reset(): void {
    this.records.clear();
    localStorage.removeItem(this.storageKey);
    ;
  }

  /**
   * 오래된 기록 정리
   */
  cleanOldRecords(daysOld: number = 7): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let removed = 0;
    this.records.forEach((record, id) => {
      if (record.lastAttempt < cutoffDate) {
        this.records.delete(id);
        removed++;
      }
    });

    if (removed > 0) {
      this.saveToStorage();
    }
  }

  /**
   * LocalStorage에 저장
   */
  private saveToStorage(): void {
    try {
      const data = Array.from(this.records.entries());
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save migration records:', error);
    }
  }

  /**
   * LocalStorage에서 로드
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored) as Array<[string, RetryRecord]>;
        data.forEach(([id, record]) => {
          // Date 객체 복원
          record.lastAttempt = new Date(record.lastAttempt);
          this.records.set(id, record);
        });
      }
    } catch (error) {
      console.error('Failed to load migration records:', error);
    }
  }

  /**
   * 통계 정보
   */
  getStatistics(): {
    total: number;
    completed: number;
    failed: number;
    skipped: number;
    pending: number;
  } {
    const stats = {
      total: this.records.size,
      completed: 0,
      failed: 0,
      skipped: 0,
      pending: 0
    };

    this.records.forEach(record => {
      stats[record.status]++;
    });

    return stats;
  }
}

// Singleton 인스턴스
export const migrationRetryManager = new MigrationRetryManager();

// 개발 환경에서 디버깅용
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).__migrationRetry__ = migrationRetryManager;
}