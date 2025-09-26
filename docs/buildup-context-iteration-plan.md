# BuildupContext 데이터 통합 개선 계획

## 📅 작성일: 2025-01-25
## 🎯 목표: BuildupContext와 CalendarContext 간 완벽한 데이터 동기화 시스템 구축

---

## 현재 상태 평가 (As-Is)

### ✅ 구현 완료된 기능
- **기본 양방향 동기화**: BuildupContext ↔ CalendarContext 데이터 교환
- **프로젝트 마일스톤 자동 생성**: Phase 변경 시 캘린더 이벤트 생성
- **드래그앤드롭 히스토리**: LocalStorage에 작업 기록 저장

### ❌ 현재 문제점
1. **성능 이슈**: 전체 projects 배열을 JSON.stringify로 비교 (O(n) 복잡도)
2. **에러 처리 부재**: 동기화 실패 시 복구 메커니즘 없음
3. **메모리 누수 위험**: cleanup 함수 미구현
4. **데이터 충돌**: 다중 업데이트 시 race condition 발생 가능

---

## Phase 1: 핵심 성능 최적화 (예상: 4시간)

### 1.1 동기화 성능 개선

#### 현재 문제 코드
```typescript
// ❌ 비효율적: 매번 전체 데이터를 문자열화하여 비교
const projectsSnapshot = useRef(JSON.stringify(projects));
useEffect(() => {
  const currentSnapshot = JSON.stringify(projects);
  if (projectsSnapshot.current !== currentSnapshot) {
    projectsSnapshot.current = currentSnapshot;
    syncWithProjects();
  }
}, [projects, syncWithProjects]);
```

#### 개선 구현 계획
```typescript
// ✅ 효율적: 버전 관리 시스템 도입
interface ProjectWithVersion extends Project {
  version: number;
  lastModified: Date;
  changeType?: 'added' | 'modified' | 'removed';
}

// 세밀한 변경 감지 훅
const useProjectChangeDetection = () => {
  const previousProjectsMap = useRef<Map<string, ProjectWithVersion>>(new Map());
  const versionCounter = useRef(0);

  const detectChanges = useCallback((currentProjects: Project[]) => {
    const changes = {
      added: [] as Project[],
      modified: [] as Project[],
      removed: [] as string[],
    };

    const currentIds = new Set(currentProjects.map(p => p.id));

    // 추가/수정 감지
    currentProjects.forEach(project => {
      const previous = previousProjectsMap.current.get(project.id);

      if (!previous) {
        changes.added.push(project);
      } else {
        // 깊은 비교 대신 버전 또는 타임스탬프 비교
        const hasChanged = project.lastModified > previous.lastModified;
        if (hasChanged) {
          changes.modified.push(project);
        }
      }
    });

    // 삭제 감지
    previousProjectsMap.current.forEach((_, id) => {
      if (!currentIds.has(id)) {
        changes.removed.push(id);
      }
    });

    // 맵 업데이트
    previousProjectsMap.current = new Map(
      currentProjects.map(p => [p.id, { ...p, version: ++versionCounter.current }])
    );

    return changes;
  }, []);

  return { detectChanges };
};
```

#### 구현 체크리스트
- [ ] ProjectWithVersion 인터페이스 정의
- [ ] useProjectChangeDetection 훅 구현
- [ ] CalendarContext에 적용
- [ ] 성능 측정 (before/after)
- [ ] 단위 테스트 작성

---

## Phase 2: 에러 처리 및 복구 메커니즘 (예상: 3시간)

### 2.1 트랜잭션 기반 동기화

#### 구현 계획
```typescript
// 동기화 트랜잭션 관리자
class SyncTransactionManager {
  private rollbackStack: Array<() => Promise<void>> = [];
  private isTransactionInProgress = false;

  async executeTransaction(operations: SyncOperation[]) {
    if (this.isTransactionInProgress) {
      throw new Error('Transaction already in progress');
    }

    this.isTransactionInProgress = true;
    this.rollbackStack = [];

    try {
      for (const operation of operations) {
        const rollback = await this.executeOperation(operation);
        this.rollbackStack.push(rollback);
      }

      // 모든 작업 성공 시 커밋
      await this.commit();
    } catch (error) {
      // 실패 시 롤백
      await this.rollback();
      throw new SyncError('Sync failed', error, operations);
    } finally {
      this.isTransactionInProgress = false;
    }
  }

  private async executeOperation(operation: SyncOperation) {
    const previousState = operation.getPreviousState();

    await operation.execute();

    // 롤백 함수 반환
    return async () => {
      await operation.restore(previousState);
    };
  }

  private async rollback() {
    // LIFO 순서로 롤백
    while (this.rollbackStack.length > 0) {
      const rollbackFn = this.rollbackStack.pop();
      try {
        await rollbackFn();
      } catch (error) {
        console.error('Rollback failed:', error);
        // 롤백 실패는 로깅만 하고 계속 진행
      }
    }
  }

  private async commit() {
    // 성공 로그 및 메트릭 수집
    console.log(`Transaction committed with ${this.rollbackStack.length} operations`);
  }
}
```

#### 에러 복구 시나리오
```typescript
// 에러 타입별 복구 전략
const errorRecoveryStrategies = {
  NETWORK_ERROR: {
    maxRetries: 3,
    backoffMs: [1000, 2000, 4000],
    fallback: 'queue_for_later'
  },
  CONFLICT_ERROR: {
    strategy: 'merge',
    conflictResolver: (local, remote) => {
      // 타임스탬프 기반 충돌 해결
      return local.lastModified > remote.lastModified ? local : remote;
    }
  },
  VALIDATION_ERROR: {
    strategy: 'skip_and_log',
    notifyUser: true
  },
  QUOTA_EXCEEDED: {
    strategy: 'cleanup_old_data',
    cleanupThreshold: 30 // 30일 이상 된 데이터 삭제
  }
};
```

#### 구현 체크리스트
- [ ] SyncTransactionManager 클래스 구현
- [ ] SyncOperation 인터페이스 정의
- [ ] 에러 타입 분류 및 전략 구현
- [ ] 롤백 메커니즘 테스트
- [ ] 에러 로깅 시스템 구축

---

## Phase 3: 메모리 관리 최적화 (예상: 2시간)

### 3.1 메모리 누수 방지

#### 구현 계획
```typescript
// useEffect cleanup 패턴
const useSafeSync = () => {
  const abortControllerRef = useRef<AbortController>();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const syncWithCleanup = useCallback(async (signal: AbortSignal) => {
    try {
      const response = await fetch('/api/sync', { signal });
      if (!signal.aborted) {
        // 안전하게 상태 업데이트
        const data = await response.json();
        return data;
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        throw error;
      }
    }
  }, []);

  useEffect(() => {
    // 새 컨트롤러 생성
    abortControllerRef.current = new AbortController();

    // 디바운스된 동기화
    timeoutRef.current = setTimeout(() => {
      syncWithCleanup(abortControllerRef.current.signal);
    }, 300);

    // Cleanup 함수
    return () => {
      // 진행 중인 요청 취소
      abortControllerRef.current?.abort();

      // 타이머 정리
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [syncWithCleanup]);
};
```

#### WeakMap 활용 메모리 최적화
```typescript
// 이벤트 리스너 관리
class EventListenerManager {
  private listeners = new WeakMap<object, Map<string, Set<Function>>>();

  addEventListener(target: object, event: string, handler: Function) {
    if (!this.listeners.has(target)) {
      this.listeners.set(target, new Map());
    }

    const targetListeners = this.listeners.get(target)!;
    if (!targetListeners.has(event)) {
      targetListeners.set(event, new Set());
    }

    targetListeners.get(event)!.add(handler);
  }

  removeEventListener(target: object, event?: string, handler?: Function) {
    const targetListeners = this.listeners.get(target);
    if (!targetListeners) return;

    if (event && handler) {
      targetListeners.get(event)?.delete(handler);
    } else if (event) {
      targetListeners.delete(event);
    } else {
      this.listeners.delete(target);
    }
  }

  // 자동 정리 - WeakMap이 가비지 컬렉션 처리
}
```

#### 구현 체크리스트
- [ ] AbortController 패턴 적용
- [ ] 타이머/인터벌 정리 로직 추가
- [ ] WeakMap 기반 리스너 관리
- [ ] 메모리 프로파일링 수행
- [ ] 메모리 누수 테스트 케이스 작성

---

## Phase 4: UX 개선 - 낙관적 업데이트 (예상: 3시간)

### 4.1 낙관적 업데이트 패턴

#### 구현 계획
```typescript
// 낙관적 업데이트 관리자
class OptimisticUpdateManager {
  private pendingUpdates = new Map<string, PendingUpdate>();
  private optimisticState = new Map<string, any>();

  async performOptimisticUpdate<T>(
    id: string,
    optimisticValue: T,
    actualUpdate: () => Promise<T>
  ): Promise<T> {
    // 1. 즉시 UI 업데이트
    this.applyOptimisticState(id, optimisticValue);

    // 2. 펜딩 상태 추가
    const pendingUpdate: PendingUpdate = {
      id,
      optimisticValue,
      timestamp: Date.now(),
      status: 'pending'
    };
    this.pendingUpdates.set(id, pendingUpdate);

    try {
      // 3. 실제 업데이트 수행
      const actualValue = await actualUpdate();

      // 4. 성공 시 확정
      this.confirmUpdate(id, actualValue);
      return actualValue;

    } catch (error) {
      // 5. 실패 시 롤백
      this.revertUpdate(id);

      // 사용자에게 에러 알림
      this.notifyError(id, error);
      throw error;
    }
  }

  private applyOptimisticState(id: string, value: any) {
    // 이전 상태 백업
    const previousState = this.getCurrentState(id);
    this.optimisticState.set(id, { previous: previousState, current: value });

    // UI 즉시 업데이트
    this.updateUI(id, value);
  }

  private revertUpdate(id: string) {
    const optimistic = this.optimisticState.get(id);
    if (optimistic) {
      // 이전 상태로 복원
      this.updateUI(id, optimistic.previous);
      this.optimisticState.delete(id);
    }
    this.pendingUpdates.delete(id);
  }

  private confirmUpdate(id: string, actualValue: any) {
    this.optimisticState.delete(id);
    this.pendingUpdates.delete(id);

    // 실제 값으로 최종 업데이트
    this.updateUI(id, actualValue);
  }
}
```

#### React Hook 구현
```typescript
// 낙관적 업데이트 훅
const useOptimisticUpdate = <T>(
  initialValue: T,
  updateFn: (value: T) => Promise<T>
) => {
  const [optimisticValue, setOptimisticValue] = useState(initialValue);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const update = useCallback(async (newValue: T) => {
    setIsUpdating(true);
    setError(null);

    // 낙관적 업데이트
    setOptimisticValue(newValue);

    try {
      const actualValue = await updateFn(newValue);
      setOptimisticValue(actualValue);
      return actualValue;
    } catch (err) {
      // 롤백
      setOptimisticValue(initialValue);
      setError(err as Error);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [initialValue, updateFn]);

  return {
    value: optimisticValue,
    update,
    isUpdating,
    error
  };
};
```

#### 구현 체크리스트
- [ ] OptimisticUpdateManager 클래스 구현
- [ ] useOptimisticUpdate 훅 구현
- [ ] UI 피드백 컴포넌트 추가 (로딩, 에러)
- [ ] 롤백 애니메이션 구현
- [ ] 통합 테스트 작성

---

## Phase 5: 배치 업데이트 시스템 (예상: 2시간)

### 5.1 배치 처리 구현

#### 구현 계획
```typescript
// 배치 업데이트 큐
class BatchUpdateQueue {
  private queue: UpdateRequest[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  // 설정 가능한 옵션
  private options = {
    batchSize: 10,
    batchDelay: 500, // ms
    maxWaitTime: 2000, // ms
    priorityLevels: ['high', 'normal', 'low'] as const
  };

  enqueue(request: UpdateRequest) {
    // 우선순위에 따라 큐에 추가
    const insertIndex = this.findInsertIndex(request.priority);
    this.queue.splice(insertIndex, 0, request);

    // 배치 처리 스케줄링
    this.scheduleBatch();

    // 최대 대기 시간 초과 방지
    if (!request.timeoutId) {
      request.timeoutId = setTimeout(() => {
        this.processBatch(true);
      }, this.options.maxWaitTime);
    }
  }

  private scheduleBatch() {
    if (this.batchTimer || this.isProcessing) return;

    this.batchTimer = setTimeout(() => {
      this.processBatch();
    }, this.options.batchDelay);
  }

  private async processBatch(force = false) {
    if (this.isProcessing && !force) return;
    if (this.queue.length === 0) return;

    this.isProcessing = true;
    this.clearBatchTimer();

    // 배치 크기만큼 가져오기
    const batch = this.queue.splice(0, this.options.batchSize);

    // 타임아웃 정리
    batch.forEach(req => {
      if (req.timeoutId) {
        clearTimeout(req.timeoutId);
      }
    });

    try {
      // 배치 처리
      await this.executeBatch(batch);
    } catch (error) {
      // 실패한 요청 재큐잉 (재시도 로직)
      this.handleBatchError(batch, error);
    } finally {
      this.isProcessing = false;

      // 남은 요청이 있으면 다음 배치 스케줄링
      if (this.queue.length > 0) {
        this.scheduleBatch();
      }
    }
  }

  private async executeBatch(batch: UpdateRequest[]) {
    // 동일 타입 요청 그룹화
    const grouped = this.groupByType(batch);

    // 타입별로 병렬 처리
    const promises = Object.entries(grouped).map(([type, requests]) => {
      return this.executeBatchByType(type, requests);
    });

    await Promise.all(promises);
  }

  private groupByType(batch: UpdateRequest[]) {
    return batch.reduce((acc, req) => {
      if (!acc[req.type]) {
        acc[req.type] = [];
      }
      acc[req.type].push(req);
      return acc;
    }, {} as Record<string, UpdateRequest[]>);
  }
}
```

#### React 통합
```typescript
// 배치 업데이트 컨텍스트
const BatchUpdateContext = createContext<BatchUpdateQueue | null>(null);

export const useBatchUpdate = () => {
  const queue = useContext(BatchUpdateContext);

  const batchUpdate = useCallback((
    type: string,
    data: any,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ) => {
    if (!queue) {
      throw new Error('BatchUpdateContext not provided');
    }

    return new Promise((resolve, reject) => {
      queue.enqueue({
        id: generateId(),
        type,
        data,
        priority,
        timestamp: Date.now(),
        resolve,
        reject
      });
    });
  }, [queue]);

  return { batchUpdate };
};
```

#### 구현 체크리스트
- [ ] BatchUpdateQueue 클래스 구현
- [ ] 우선순위 기반 큐잉 로직
- [ ] 타입별 그룹화 및 병렬 처리
- [ ] React Context 통합
- [ ] 배치 크기 및 지연 시간 최적화

---

## Phase 6: 데이터 일관성 검증 (예상: 2시간)

### 6.1 일관성 검증 시스템

#### 구현 계획
```typescript
// 데이터 일관성 검증자
class DataConsistencyValidator {
  private rules: ValidationRule[] = [];
  private validationResults = new Map<string, ValidationResult>();

  // 검증 규칙 등록
  registerRule(rule: ValidationRule) {
    this.rules.push(rule);
  }

  // 전체 검증 수행
  async validateAll(context: ValidationContext): Promise<ValidationReport> {
    const results: ValidationResult[] = [];
    const startTime = performance.now();

    for (const rule of this.rules) {
      const result = await this.validateRule(rule, context);
      results.push(result);
      this.validationResults.set(rule.id, result);
    }

    const endTime = performance.now();

    return {
      timestamp: new Date(),
      duration: endTime - startTime,
      results,
      summary: this.generateSummary(results),
      criticalIssues: results.filter(r => r.severity === 'critical'),
      warnings: results.filter(r => r.severity === 'warning')
    };
  }

  private async validateRule(
    rule: ValidationRule,
    context: ValidationContext
  ): Promise<ValidationResult> {
    try {
      const isValid = await rule.validate(context);

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        passed: isValid,
        severity: isValid ? 'info' : rule.severity,
        message: isValid ? 'Validation passed' : rule.errorMessage,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        passed: false,
        severity: 'error',
        message: `Validation error: ${error.message}`,
        error,
        timestamp: new Date()
      };
    }
  }

  // 자동 복구 시도
  async autoRepair(issues: ValidationResult[]): Promise<RepairReport> {
    const repairs: RepairAttempt[] = [];

    for (const issue of issues) {
      if (issue.severity !== 'critical') continue;

      const rule = this.rules.find(r => r.id === issue.ruleId);
      if (rule?.repair) {
        const attempt = await this.attemptRepair(rule, issue);
        repairs.push(attempt);
      }
    }

    return {
      timestamp: new Date(),
      attempts: repairs,
      successful: repairs.filter(r => r.success).length,
      failed: repairs.filter(r => !r.success).length
    };
  }
}
```

#### 검증 규칙 정의
```typescript
// 구체적인 검증 규칙들
const validationRules: ValidationRule[] = [
  {
    id: 'orphaned-events',
    name: '고아 이벤트 검증',
    severity: 'critical',
    validate: async (ctx) => {
      const orphaned = ctx.events.filter(
        event => !ctx.projects.find(p => p.id === event.projectId)
      );
      return orphaned.length === 0;
    },
    errorMessage: '프로젝트가 없는 캘린더 이벤트 발견',
    repair: async (ctx, issue) => {
      // 고아 이벤트 삭제 또는 기본 프로젝트 할당
      const orphanedEvents = ctx.events.filter(
        event => !ctx.projects.find(p => p.id === event.projectId)
      );

      for (const event of orphanedEvents) {
        await CalendarService.deleteEvent(event.id);
      }

      return { success: true, repaired: orphanedEvents.length };
    }
  },

  {
    id: 'duplicate-meetings',
    name: '중복 미팅 검증',
    severity: 'warning',
    validate: async (ctx) => {
      const meetings = new Map<string, Meeting[]>();

      ctx.projects.forEach(project => {
        project.meetings?.forEach(meeting => {
          const key = `${meeting.date}-${meeting.time}`;
          if (!meetings.has(key)) {
            meetings.set(key, []);
          }
          meetings.get(key)!.push(meeting);
        });
      });

      // 같은 시간에 2개 이상 미팅이 있는지 확인
      const duplicates = Array.from(meetings.values()).filter(m => m.length > 1);
      return duplicates.length === 0;
    },
    errorMessage: '동일 시간대 중복 미팅 발견'
  },

  {
    id: 'data-freshness',
    name: '데이터 신선도 검증',
    severity: 'info',
    validate: async (ctx) => {
      const now = Date.now();
      const staleThreshold = 7 * 24 * 60 * 60 * 1000; // 7일

      const staleProjects = ctx.projects.filter(
        p => now - new Date(p.lastModified).getTime() > staleThreshold
      );

      return staleProjects.length < ctx.projects.length * 0.3; // 30% 미만
    },
    errorMessage: '오래된 데이터가 많음 (7일 이상)'
  }
];
```

#### 구현 체크리스트
- [ ] DataConsistencyValidator 클래스 구현
- [ ] 검증 규칙 인터페이스 정의
- [ ] 핵심 검증 규칙 구현 (최소 10개)
- [ ] 자동 복구 메커니즘 구현
- [ ] 검증 리포트 UI 컴포넌트
- [ ] 정기 검증 스케줄러

---

## 성능 측정 및 모니터링

### 측정 지표
```typescript
interface PerformanceMetrics {
  syncDuration: number;        // 동기화 소요 시간
  memoryUsage: number;         // 메모리 사용량
  renderCount: number;         // 리렌더링 횟수
  errorRate: number;          // 에러 발생률
  conflictRate: number;       // 충돌 발생률
  rollbackCount: number;      // 롤백 횟수
  batchEfficiency: number;    // 배치 처리 효율
  cacheHitRate: number;       // 캐시 히트율
}

// 성능 모니터링 클래스
class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private history: PerformanceMetrics[] = [];

  startMeasurement(operation: string) {
    const startTime = performance.now();
    const startMemory = performance.memory?.usedJSHeapSize || 0;

    return {
      end: () => {
        const duration = performance.now() - startTime;
        const memoryDelta = (performance.memory?.usedJSHeapSize || 0) - startMemory;

        this.recordMetric(operation, { duration, memoryDelta });
      }
    };
  }

  generateReport(): PerformanceReport {
    return {
      current: this.metrics,
      average: this.calculateAverage(),
      trend: this.calculateTrend(),
      recommendations: this.generateRecommendations()
    };
  }
}
```

---

## 구현 순서 및 일정

| 주차 | Phase | 작업 내용 | 예상 시간 | 담당자 |
|------|-------|----------|-----------|--------|
| 1주차 | Phase 1 | 동기화 성능 최적화 | 4시간 | - |
| 1주차 | Phase 2 | 에러 처리 메커니즘 | 3시간 | - |
| 2주차 | Phase 3 | 메모리 관리 | 2시간 | - |
| 2주차 | Phase 4 | 낙관적 업데이트 | 3시간 | - |
| 3주차 | Phase 5 | 배치 업데이트 | 2시간 | - |
| 3주차 | Phase 6 | 데이터 검증 | 2시간 | - |
| 4주차 | - | 통합 테스트 및 최적화 | 4시간 | - |

---

## 성공 기준

### 정량적 지표
- ✅ 동기화 속도: 50% 개선 (목표: < 100ms)
- ✅ 메모리 사용량: 30% 감소
- ✅ 불필요한 리렌더링: 80% 감소
- ✅ 에러 발생률: 90% 감소
- ✅ 데이터 불일치: 0건

### 정성적 지표
- ✅ 사용자 체감 응답속도 개선
- ✅ 안정적인 데이터 동기화
- ✅ 명확한 에러 메시지
- ✅ 일관된 사용자 경험

---

## 리스크 및 대응 방안

### 리스크 1: 기존 코드 호환성
- **대응**: Feature flag를 통한 점진적 롤아웃
- **롤백 계획**: 이전 버전 즉시 복원 가능

### 리스크 2: 성능 저하
- **대응**: A/B 테스트로 실제 성능 측정
- **모니터링**: 실시간 성능 대시보드

### 리스크 3: 복잡도 증가
- **대응**: 상세한 문서화 및 예제 코드
- **교육**: 팀 내 지식 공유 세션

---

## 테스트 계획

### 단위 테스트
```typescript
describe('BuildupContext Sync', () => {
  test('변경 감지 정확도', () => {
    // 테스트 케이스
  });

  test('롤백 메커니즘', () => {
    // 테스트 케이스
  });

  test('메모리 누수 체크', () => {
    // 테스트 케이스
  });
});
```

### 통합 테스트
- 전체 동기화 플로우
- 에러 복구 시나리오
- 동시성 처리

### 성능 테스트
- 대용량 데이터 처리
- 연속 업데이트 처리
- 메모리 사용량 추적

---

## 참고 자료

- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [JavaScript Memory Management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management)
- [Optimistic UI Patterns](https://www.apollographql.com/docs/react/performance/optimistic-ui/)
- [Data Consistency in Distributed Systems](https://martinfowler.com/articles/patterns-of-distributed-systems/)

---

## 업데이트 로그

- **2025-01-25**: 초기 문서 작성
- 추후 업데이트 예정...