/**
 * @fileoverview 마이그레이션 조건 시스템
 * @description Sprint 3 - Stage 2: 조건부 실행 로직 확장
 * @author PocketCompany
 * @since 2025-01-23
 */

import { GlobalContextManager } from './globalContextManager';

/**
 * 조건 타입
 */
export type ConditionType =
  | 'first_load'        // 첫 실행
  | 'data_mismatch'     // 데이터 불일치
  | 'project_loaded'    // 프로젝트 로드됨
  | 'schedule_empty'    // 스케줄 비어있음
  | 'user_request'      // 사용자 요청
  | 'data_corruption'   // 데이터 손상
  | 'version_update'    // 버전 업데이트
  | 'context_ready'     // Context 준비 완료
  | 'time_based'        // 시간 기반
  | 'custom';           // 사용자 정의

/**
 * 조건 연산자
 */
export type ConditionOperator = 'AND' | 'OR' | 'NOT';

/**
 * 마이그레이션 조건 인터페이스
 */
export interface MigrationCondition {
  id: string;
  type: ConditionType;
  check: () => boolean | Promise<boolean>;
  priority: number;
  operator?: ConditionOperator;
  description?: string;
  metadata?: any;
  cacheable?: boolean;
  cacheTime?: number; // milliseconds
}

/**
 * 조건 평가 결과
 */
export interface ConditionResult {
  conditionId: string;
  type: ConditionType;
  result: boolean;
  evaluatedAt: Date;
  cached: boolean;
  metadata?: any;
}

/**
 * 조건 그룹
 */
export interface ConditionGroup {
  id: string;
  name: string;
  conditions: MigrationCondition[];
  operator: ConditionOperator;
  priority: number;
}

/**
 * 조건 평가 엔진
 */
export class ConditionEvaluator {
  private cache: Map<string, { result: boolean; timestamp: number }> = new Map();
  private defaultCacheTime = 5000; // 5초
  private contextManager: GlobalContextManager;

  constructor() {
    this.contextManager = GlobalContextManager.getInstance();
  }

  /**
   * 단일 조건 평가
   */
  async evaluateCondition(condition: MigrationCondition): Promise<ConditionResult> {
    const startTime = Date.now();

    // 캐시 확인
    if (condition.cacheable !== false) {
      const cached = this.getCachedResult(condition.id, condition.cacheTime);
      if (cached !== null) {
        return {
          conditionId: condition.id,
          type: condition.type,
          result: cached,
          evaluatedAt: new Date(),
          cached: true,
          metadata: condition.metadata
        };
      }
    }

    // 조건 평가
    try {
      const result = await condition.check();

      // 캐시 저장
      if (condition.cacheable !== false) {
        this.cacheResult(condition.id, result, condition.cacheTime);
      }


      return {
        conditionId: condition.id,
        type: condition.type,
        result,
        evaluatedAt: new Date(),
        cached: false,
        metadata: {
          ...condition.metadata,
          evaluationTime: Date.now() - startTime
        }
      };
    } catch (error) {
      console.error(`❌ Condition evaluation failed: ${condition.id}`, error);
      return {
        conditionId: condition.id,
        type: condition.type,
        result: false,
        evaluatedAt: new Date(),
        cached: false,
        metadata: { error: error.message }
      };
    }
  }

  /**
   * 여러 조건 평가 (AND/OR 연산)
   */
  async evaluateConditions(
    conditions: MigrationCondition[],
    operator: ConditionOperator = 'OR'
  ): Promise<boolean> {
    if (conditions.length === 0) return false;

    const results = await Promise.all(
      conditions.map(c => this.evaluateCondition(c))
    );

    const boolResults = results.map(r => r.result);

    switch (operator) {
      case 'AND':
        return boolResults.every(r => r === true);
      case 'OR':
        return boolResults.some(r => r === true);
      case 'NOT':
        return !boolResults[0]; // NOT은 첫 번째 조건만 평가
      default:
        return false;
    }
  }

  /**
   * 우선순위 기반 평가
   */
  async evaluateWithPriority(conditions: MigrationCondition[]): Promise<ConditionResult[]> {
    // 우선순위 정렬 (높은 것부터)
    const sorted = [...conditions].sort((a, b) => b.priority - a.priority);

    const results: ConditionResult[] = [];

    for (const condition of sorted) {
      const result = await this.evaluateCondition(condition);
      results.push(result);

      // 높은 우선순위 조건이 true면 즉시 반환 (early exit)
      if (result.result && condition.priority >= 10) {
        break;
      }
    }

    return results;
  }

  /**
   * 조건 그룹 평가
   */
  async evaluateGroup(group: ConditionGroup): Promise<boolean> {
    return this.evaluateConditions(group.conditions, group.operator);
  }

  /**
   * 캐시된 결과 가져오기
   */
  private getCachedResult(id: string, customCacheTime?: number): boolean | null {
    const cached = this.cache.get(id);
    if (!cached) return null;

    const cacheTime = customCacheTime || this.defaultCacheTime;
    if (Date.now() - cached.timestamp > cacheTime) {
      this.cache.delete(id);
      return null;
    }

    return cached.result;
  }

  /**
   * 결과 캐싱
   */
  private cacheResult(id: string, result: boolean, customCacheTime?: number): void {
    this.cache.set(id, {
      result,
      timestamp: Date.now()
    });

    // 자동 캐시 정리
    const cacheTime = customCacheTime || this.defaultCacheTime;
    setTimeout(() => {
      this.cache.delete(id);
    }, cacheTime);
  }

  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 캐시 상태 조회
   */
  getCacheStatus(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

/**
 * 내장 조건들
 */
export class BuiltInConditions {
  private contextManager: GlobalContextManager;

  constructor() {
    this.contextManager = GlobalContextManager.getInstance();
  }

  /**
   * 첫 실행 조건
   */
  firstLoad(): MigrationCondition {
    return {
      id: 'first_load',
      type: 'first_load',
      priority: 10,
      description: 'First time running migration',
      check: () => {
        const hasRun = localStorage.getItem('migration_first_run');
        return !hasRun;
      },
      cacheable: true,
      cacheTime: 60000 // 1분
    };
  }

  /**
   * 데이터 불일치 조건
   */
  dataMismatch(): MigrationCondition {
    return {
      id: 'data_mismatch',
      type: 'data_mismatch',
      priority: 8,
      description: 'Data mismatch between contexts',
      check: async () => {
        const buildupContext = await this.contextManager.waitForContext('BuildupContext', 1000);
        const scheduleContext = await this.contextManager.waitForContext('ScheduleContext', 1000);

        if (!buildupContext || !scheduleContext) {
          return false;
        }

        const buildupMeetings = buildupContext.meetings || [];
        const schedules = scheduleContext.schedules || [];

        // 빌드업 미팅이 있는데 스케줄이 없으면 불일치
        return buildupMeetings.length > 0 && schedules.length === 0;
      },
      cacheable: true,
      cacheTime: 10000 // 10초
    };
  }

  /**
   * 프로젝트 로드 조건
   */
  projectLoaded(): MigrationCondition {
    return {
      id: 'project_loaded',
      type: 'project_loaded',
      priority: 7,
      description: 'New project loaded',
      check: async () => {
        const buildupContext = await this.contextManager.waitForContext('BuildupContext', 1000);
        if (!buildupContext) return false;

        const projects = buildupContext.projects || [];
        const lastProjectCount = parseInt(localStorage.getItem('last_project_count') || '0');

        if (projects.length > lastProjectCount) {
          localStorage.setItem('last_project_count', projects.length.toString());
          return true;
        }

        return false;
      },
      cacheable: false // 항상 새로 평가
    };
  }

  /**
   * 스케줄 비어있음 조건
   */
  scheduleEmpty(): MigrationCondition {
    return {
      id: 'schedule_empty',
      type: 'schedule_empty',
      priority: 6,
      description: 'Schedule is empty',
      check: async () => {
        const scheduleContext = await this.contextManager.waitForContext('ScheduleContext', 1000);
        if (!scheduleContext) return false;

        const schedules = scheduleContext.schedules || [];
        const buildupContext = await this.contextManager.waitForContext('BuildupContext', 1000);
        const hasProjects = buildupContext?.projects?.length > 0;

        // 프로젝트는 있는데 스케줄이 없으면
        return hasProjects && schedules.length === 0;
      },
      cacheable: true,
      cacheTime: 5000
    };
  }

  /**
   * 데이터 손상 감지 조건
   */
  dataCorruption(): MigrationCondition {
    return {
      id: 'data_corruption',
      type: 'data_corruption',
      priority: 9,
      description: 'Data corruption detected',
      check: async () => {
        try {
          const buildupContext = await this.contextManager.waitForContext('BuildupContext', 1000);
          if (!buildupContext) return false;

          const projects = buildupContext.projects || [];

          // 프로젝트 데이터 무결성 체크
          for (const project of projects) {
            if (!project.id || project.id === 'unknown') {
              return true; // 손상된 프로젝트 ID
            }
            if (!project.name || project.name === '') {
              return true; // 손상된 프로젝트 이름
            }
          }

          return false;
        } catch (error) {
          console.error('Data corruption check failed:', error);
          return true; // 체크 실패도 손상으로 간주
        }
      },
      cacheable: true,
      cacheTime: 30000 // 30초
    };
  }

  /**
   * 버전 업데이트 조건
   */
  versionUpdate(): MigrationCondition {
    return {
      id: 'version_update',
      type: 'version_update',
      priority: 5,
      description: 'App version updated',
      check: () => {
        const currentVersion = '1.0.0'; // 실제로는 package.json에서 읽어와야 함
        const lastVersion = localStorage.getItem('last_app_version');

        if (!lastVersion || lastVersion !== currentVersion) {
          localStorage.setItem('last_app_version', currentVersion);
          return !lastVersion; // 첫 실행이 아닌 경우만 true
        }

        return false;
      },
      cacheable: true,
      cacheTime: 60000
    };
  }

  /**
   * Context 준비 완료 조건
   */
  contextReady(contextNames: string[]): MigrationCondition {
    return {
      id: `context_ready_${contextNames.join('_')}`,
      type: 'context_ready',
      priority: 8,
      description: `Contexts ready: ${contextNames.join(', ')}`,
      metadata: { contexts: contextNames },
      check: async () => {
        for (const name of contextNames) {
          const context = await this.contextManager.waitForContext(name, 100);
          if (!context) return false;
        }
        return true;
      },
      cacheable: true,
      cacheTime: 5000
    };
  }

  /**
   * 시간 기반 조건 (예: 매일 자정)
   */
  timeBased(hour: number = 0, minute: number = 0): MigrationCondition {
    return {
      id: `time_based_${hour}_${minute}`,
      type: 'time_based',
      priority: 3,
      description: `Time-based trigger at ${hour}:${minute}`,
      metadata: { hour, minute },
      check: () => {
        const now = new Date();
        const lastRun = localStorage.getItem('migration_last_time_run');
        const lastRunDate = lastRun ? new Date(lastRun) : null;

        // 같은 날 이미 실행했으면 false
        if (lastRunDate &&
            lastRunDate.toDateString() === now.toDateString()) {
          return false;
        }

        // 지정된 시간이 되었는지 체크
        if (now.getHours() === hour && now.getMinutes() >= minute) {
          localStorage.setItem('migration_last_time_run', now.toISOString());
          return true;
        }

        return false;
      },
      cacheable: true,
      cacheTime: 60000 // 1분
    };
  }

  /**
   * 사용자 요청 조건 (수동 트리거용)
   */
  userRequest(): MigrationCondition {
    return {
      id: 'user_request',
      type: 'user_request',
      priority: 10, // 최고 우선순위
      description: 'User manually requested migration',
      check: () => {
        // 이 조건은 항상 false, 수동으로 트리거될 때만 true로 설정
        return false;
      },
      cacheable: false
    };
  }

  /**
   * 모든 내장 조건 가져오기
   */
  getAllConditions(): MigrationCondition[] {
    return [
      this.firstLoad(),
      this.dataMismatch(),
      this.projectLoaded(),
      this.scheduleEmpty(),
      this.dataCorruption(),
      this.versionUpdate(),
      this.contextReady(['BuildupContext', 'ScheduleContext'])
    ];
  }
}

// 싱글톤 인스턴스
export const conditionEvaluator = new ConditionEvaluator();
export const builtInConditions = new BuiltInConditions();