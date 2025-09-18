/**
 * @fileoverview Phase Transition Edge Case 시나리오 정의
 * @description 시스템에서 발생할 수 있는 예외 상황들과 대응 방안
 * @author PocketCompany
 * @since 2025-01-19
 */

export interface EdgeCaseScenario {
  id: string;
  name: string;
  description: string;
  category: 'concurrency' | 'data_integrity' | 'user_experience' | 'system_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  triggers: string[];
  expectedBehavior: string;
  preventionStrategy: string;
  recoveryStrategy: string;
  testCase?: () => Promise<boolean>;
}

/**
 * 동시성 관련 Edge Cases
 */
export const CONCURRENCY_EDGE_CASES: EdgeCaseScenario[] = [
  {
    id: 'EC_CONCURRENT_001',
    name: '동시 Phase Transition 요청',
    description: '같은 프로젝트에 대해 동시에 여러 phase transition이 요청되는 경우',
    category: 'concurrency',
    severity: 'critical',
    triggers: [
      '사용자가 빠르게 여러 미팅을 연속 생성',
      '두 개의 브라우저 탭에서 동시에 미팅 예약',
      '네트워크 지연으로 인한 중복 요청'
    ],
    expectedBehavior: '첫 번째 요청만 처리되고, 나머지는 대기 후 순차 처리',
    preventionStrategy: 'TransitionQueue를 통한 프로젝트별 mutex 구현',
    recoveryStrategy: '실패한 요청을 큐에 재등록하여 순차 처리'
  },
  {
    id: 'EC_CONCURRENT_002',
    name: '중복 미팅 생성 시도',
    description: '동일한 meetingSequence로 여러 미팅을 동시 생성하려는 경우',
    category: 'concurrency',
    severity: 'high',
    triggers: [
      'UI에서 빠른 더블클릭',
      '네트워크 타임아웃으로 인한 재시도',
      'API 응답 지연 중 사용자의 추가 요청'
    ],
    expectedBehavior: '첫 번째 미팅만 생성되고, 중복 요청은 무시',
    preventionStrategy: 'Debouncing과 중복 검사 로직',
    recoveryStrategy: '중복된 미팅 자동 제거 및 사용자 알림'
  }
];

/**
 * 데이터 무결성 관련 Edge Cases
 */
export const DATA_INTEGRITY_EDGE_CASES: EdgeCaseScenario[] = [
  {
    id: 'EC_DATA_001',
    name: '잘못된 Sequence 순서 생성',
    description: '이전 단계 미팅 없이 후속 미팅을 생성하려는 경우',
    category: 'data_integrity',
    severity: 'high',
    triggers: [
      'guide_2 미팅을 guide_1 없이 생성',
      'pre_meeting 없이 guide_1 생성',
      '관리자의 수동 미팅 생성'
    ],
    expectedBehavior: '이전 단계 확인 후 오류 메시지 표시 및 생성 차단',
    preventionStrategy: 'Phase validation rules 적용',
    recoveryStrategy: '누락된 이전 단계 미팅 자동 생성 제안'
  },
  {
    id: 'EC_DATA_002',
    name: '프로젝트-미팅 연결 불일치',
    description: '존재하지 않는 프로젝트에 미팅을 생성하려는 경우',
    category: 'data_integrity',
    severity: 'critical',
    triggers: [
      '프로젝트 삭제 후 미팅 생성 시도',
      '잘못된 projectId 참조',
      '캐시된 프로젝트 정보 사용'
    ],
    expectedBehavior: '프로젝트 존재 여부 확인 후 오류 처리',
    preventionStrategy: '프로젝트 유효성 검사 및 실시간 동기화',
    recoveryStrategy: '유효한 프로젝트로 연결 변경 또는 미팅 삭제'
  },
  {
    id: 'EC_DATA_003',
    name: 'Mock vs Real 데이터 충돌',
    description: '기존 mock 데이터와 새로 생성된 실제 데이터 간 ID 충돌',
    category: 'data_integrity',
    severity: 'medium',
    triggers: [
      '마이그레이션 중 ID 중복',
      '동일한 날짜/시간에 중복 미팅',
      'localStorage 불일치'
    ],
    expectedBehavior: 'ID 충돌 감지 및 자동 해결',
    preventionStrategy: '유니크 ID 생성기 및 중복 검사',
    recoveryStrategy: '충돌된 데이터 자동 병합 또는 분리'
  }
];

/**
 * 사용자 경험 관련 Edge Cases
 */
export const USER_EXPERIENCE_EDGE_CASES: EdgeCaseScenario[] = [
  {
    id: 'EC_UX_001',
    name: '미팅 생성 중 페이지 새로고침',
    description: '미팅 생성 프로세스 중간에 페이지가 새로고침되는 경우',
    category: 'user_experience',
    severity: 'medium',
    triggers: [
      '사용자의 실수로 새로고침',
      '브라우저 크래시',
      '네트워크 연결 끊김'
    ],
    expectedBehavior: '진행 중인 작업 상태 복구 또는 명확한 안내',
    preventionStrategy: '작업 상태 localStorage 저장',
    recoveryStrategy: '미완료 작업 복구 제안 및 데이터 정리'
  },
  {
    id: 'EC_UX_002',
    name: '네트워크 끊김 상태에서 미팅 생성',
    description: '오프라인 상태에서 미팅 생성을 시도하는 경우',
    category: 'user_experience',
    severity: 'medium',
    triggers: [
      '인터넷 연결 불안정',
      '서버 다운타임',
      '방화벽 차단'
    ],
    expectedBehavior: '오프라인 상태 감지 및 임시 저장',
    preventionStrategy: '네트워크 상태 모니터링',
    recoveryStrategy: '연결 복구 시 자동 동기화'
  }
];

/**
 * 시스템 오류 관련 Edge Cases
 */
export const SYSTEM_ERROR_EDGE_CASES: EdgeCaseScenario[] = [
  {
    id: 'EC_SYSTEM_001',
    name: 'Phase Transition 실행 중 오류',
    description: 'executePhaseTransition 실행 중 시스템 오류 발생',
    category: 'system_error',
    severity: 'critical',
    triggers: [
      'JavaScript 런타임 에러',
      '메모리 부족',
      'Context 상태 오염'
    ],
    expectedBehavior: '오류 감지 및 이전 상태로 롤백',
    preventionStrategy: 'Try-catch 및 state snapshot',
    recoveryStrategy: '스냅샷을 통한 상태 복구'
  },
  {
    id: 'EC_SYSTEM_002',
    name: 'localStorage 용량 초과',
    description: 'localStorage 저장 공간 부족으로 인한 데이터 저장 실패',
    category: 'system_error',
    severity: 'high',
    triggers: [
      '대량의 미팅 데이터 축적',
      '브라우저 저장 공간 제한',
      '다른 앱의 localStorage 사용'
    ],
    expectedBehavior: '저장 공간 확인 및 정리 후 재시도',
    preventionStrategy: '주기적 데이터 정리 및 압축',
    recoveryStrategy: '오래된 데이터 삭제 및 필수 데이터만 유지'
  }
];

/**
 * 모든 Edge Case 시나리오 통합
 */
export const ALL_EDGE_CASES: EdgeCaseScenario[] = [
  ...CONCURRENCY_EDGE_CASES,
  ...DATA_INTEGRITY_EDGE_CASES,
  ...USER_EXPERIENCE_EDGE_CASES,
  ...SYSTEM_ERROR_EDGE_CASES
];

/**
 * Edge Case 시나리오 검색 및 필터링
 */
export class EdgeCaseManager {
  /**
   * 카테고리별 시나리오 조회
   */
  static getByCategory(category: EdgeCaseScenario['category']): EdgeCaseScenario[] {
    return ALL_EDGE_CASES.filter(scenario => scenario.category === category);
  }

  /**
   * 심각도별 시나리오 조회
   */
  static getBySeverity(severity: EdgeCaseScenario['severity']): EdgeCaseScenario[] {
    return ALL_EDGE_CASES.filter(scenario => scenario.severity === severity);
  }

  /**
   * Critical & High 우선순위 시나리오
   */
  static getHighPriority(): EdgeCaseScenario[] {
    return ALL_EDGE_CASES.filter(scenario =>
      scenario.severity === 'critical' || scenario.severity === 'high'
    );
  }

  /**
   * 특정 시나리오 실행 (테스트용)
   */
  static async executeTestCase(scenarioId: string): Promise<boolean> {
    const scenario = ALL_EDGE_CASES.find(s => s.id === scenarioId);
    if (!scenario || !scenario.testCase) {
      return false;
    }

    try {
      return await scenario.testCase();
    } catch (error) {
      console.error(`Edge case test failed for ${scenarioId}:`, error);
      return false;
    }
  }
}

/**
 * Edge Case 발생 로깅
 */
export interface EdgeCaseLog {
  scenarioId: string;
  timestamp: Date;
  projectId?: string;
  userId?: string;
  context: any;
  resolved: boolean;
  resolution?: string;
}

export class EdgeCaseLogger {
  private static logs: EdgeCaseLog[] = [];

  static log(scenarioId: string, context: any, projectId?: string): void {
    this.logs.push({
      scenarioId,
      timestamp: new Date(),
      projectId,
      context,
      resolved: false
    });
  }

  static resolve(scenarioId: string, resolution: string): void {
    const log = this.logs.find(l =>
      l.scenarioId === scenarioId && !l.resolved
    );
    if (log) {
      log.resolved = true;
      log.resolution = resolution;
    }
  }

  static getLogs(): EdgeCaseLog[] {
    return [...this.logs];
  }

  static getUnresolvedLogs(): EdgeCaseLog[] {
    return this.logs.filter(log => !log.resolved);
  }
}