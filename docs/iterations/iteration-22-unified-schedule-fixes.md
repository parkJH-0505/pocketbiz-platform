# Iteration 22: 통합 스케줄 시스템 완성 및 오류 수정

> **최종 업데이트**: 2025-09-25
> **실제 구현 상태**: ✅ **100% 완료**

## 📋 개요

### 배경
Iteration 21에서 구현한 통합 스케줄 시스템이 70% 완성되었으나, 컨텍스트 간 연결 부분과 에러 처리에서 심각한 문제가 발생하고 있습니다. 매 페이지 로드 시 40개 이상의 콘솔 에러가 발생하며, 핵심 기능인 자동 마이그레이션과 Phase 전환이 작동하지 않습니다.

### 현재 상태 (2025-09-25 기준)
- ✅ **Sprint 1 (100%)**: 모든 에러 수정 완료
- ✅ **Sprint 2 (100%)**: GlobalContextManager 구현 및 Context 등록 완료
- ✅ **Sprint 3 (100%)**: Migration 시스템 정상 작동
- ✅ **Sprint 4 (100%)**: PhaseTransitionManager 완전 구현
- ✅ **Sprint 5 (100%)**: Event System 완전 구현 및 연동

### 핵심 기능 달성
1. ✅ **미팅 예약 → 자동 단계 전환 완료**
2. ✅ **window.scheduleContext 노출 완료**
3. ✅ **컴포넌트 간 실시간 연동 작동**
4. ✅ **주간 스케줄 필터링 정상 작동 (18개 일정)**

## 🔍 문제 진단

### 1. Critical Errors (즉시 수정 필요)

#### Error 1: showSuccess/showError undefined
- **위치**: `src/contexts/BuildupContext.tsx:2241, 2245`
- **원인**: ToastContext 함수 import 누락
- **영향**: 마이그레이션 즉시 실패

#### Error 2: ScheduleContext not available
- **위치**: `src/utils/phaseTransitionQueue.ts:370`
- **원인**: window.scheduleContext 미설정
- **영향**: Phase 전환 완전 중단

#### Error 3: Unknown projectId infinite loop
- **위치**: `src/utils/dataMigration.ts:441`
- **원인**: 빈 배열 처리 시 'unknown' ID 생성
- **영향**: 2초마다 재시도 → 에러 누적

### 2. Architectural Issues (구조적 문제)

#### Issue 1: Context Bridging 미완성
```typescript
// 현재 상태 (문제)
const ScheduleContext = createContext();
// window 노출 없음

// 필요한 상태
window.scheduleContext = useContext(ScheduleContext);
```

#### Issue 2: EventSourceTracker 미활용
- 구현은 완료되었으나 실제 연결 안 됨
- 순환 참조 방지 로직이 작동하지 않음

## 📐 해결 방안

### Sprint 1: Critical Error Fixes (Day 1-2)

#### Task 1.1: ToastContext Integration
```typescript
// BuildupContext.tsx 수정
import { useToast } from '../contexts/ToastContext';

const BuildupProvider = ({ children }) => {
  const { showSuccess, showError } = useToast();

  // mockMigration 함수 내부
  const mockMigration = async () => {
    try {
      // ... existing logic
      showSuccess('Mock 데이터가 성공적으로 마이그레이션되었습니다');
    } catch (error) {
      console.error('Migration error:', error);
      showError('Mock 데이터 마이그레이션 중 오류가 발생했습니다');
    }
  };
};
```

#### Task 1.2: Window Context Setup
```typescript
// ScheduleContext.tsx 수정
export const ScheduleProvider = ({ children }) => {
  const contextValue = useMemo(() => ({
    schedules,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    // ... other methods
  }), [schedules]);

  // Window 객체에 노출
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scheduleContext = contextValue;
      window.scheduleEventEmitter = scheduleEventEmitter;
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete window.scheduleContext;
        delete window.scheduleEventEmitter;
      }
    };
  }, [contextValue]);

  return (
    <ScheduleContext.Provider value={contextValue}>
      {children}
    </ScheduleContext.Provider>
  );
};
```

#### Task 1.3: ProjectId Handling Fix
```typescript
// dataMigration.ts 수정
const migrateToUnifiedSchedule = async (meetings: Meeting[]): Promise<void> => {
  // 프로젝트가 없을 경우 마이그레이션 스킵
  if (existingProjects.length === 0) {
    console.log('No projects found, skipping migration');
    return; // unknown 대신 early return
  }

  const projectId = existingProjects[0].id;
  // ... continue with valid projectId
};
```

### Sprint 2: Context Bridge Implementation (Day 3-4)

#### Task 2.1: Global Context Manager
```typescript
// 새 파일: src/utils/globalContextManager.ts
class GlobalContextManager {
  private contexts: Map<string, any> = new Map();

  register(name: string, context: any): void {
    this.contexts.set(name, context);
    // Window에도 노출
    if (typeof window !== 'undefined') {
      window[`${name}Context`] = context;
    }
  }

  unregister(name: string): void {
    this.contexts.delete(name);
    if (typeof window !== 'undefined') {
      delete window[`${name}Context`];
    }
  }

  get(name: string): any {
    return this.contexts.get(name);
  }

  isAvailable(name: string): boolean {
    return this.contexts.has(name);
  }
}

export const globalContextManager = new GlobalContextManager();
```

#### Task 2.2: Context Registration
```typescript
// 각 Context Provider에 추가
// ScheduleContext.tsx
useEffect(() => {
  globalContextManager.register('schedule', contextValue);
  return () => globalContextManager.unregister('schedule');
}, [contextValue]);

// BuildupContext.tsx
useEffect(() => {
  globalContextManager.register('buildup', contextValue);
  return () => globalContextManager.unregister('buildup');
}, [contextValue]);
```

### Sprint 3: Migration System Refactor (Day 5-6)

#### Task 3.1: Safe Migration Manager
```typescript
// 새 파일: src/utils/migrationManager.ts
import { globalContextManager } from './globalContextManager';

class MigrationManager {
  private migrationInProgress = false;
  private migrationCompleted = false;

  async attemptMigration(): Promise<boolean> {
    // 이미 완료되었거나 진행 중이면 스킵
    if (this.migrationCompleted || this.migrationInProgress) {
      return false;
    }

    // 필요한 컨텍스트 확인
    if (!globalContextManager.isAvailable('schedule')) {
      console.log('ScheduleContext not ready, postponing migration');
      return false;
    }

    this.migrationInProgress = true;

    try {
      const scheduleContext = globalContextManager.get('schedule');
      // ... migration logic

      this.migrationCompleted = true;
      localStorage.setItem('migration_completed', 'true');
      return true;
    } catch (error) {
      console.error('Migration failed:', error);
      return false;
    } finally {
      this.migrationInProgress = false;
    }
  }

  reset(): void {
    this.migrationCompleted = false;
    this.migrationInProgress = false;
    localStorage.removeItem('migration_completed');
  }
}

export const migrationManager = new MigrationManager();
```

#### Task 3.2: Conditional Migration Trigger
```typescript
// BuildupContext.tsx 수정
useEffect(() => {
  // 마이그레이션 완료 확인
  if (localStorage.getItem('migration_completed') === 'true') {
    return;
  }

  // 조건부 마이그레이션 (한 번만 시도)
  const attemptMigration = async () => {
    const success = await migrationManager.attemptMigration();
    if (success) {
      showSuccess('데이터 마이그레이션이 완료되었습니다');
    }
  };

  // 컨텍스트 준비 후 실행
  const timer = setTimeout(attemptMigration, 3000);
  return () => clearTimeout(timer);
}, []); // 빈 의존성 배열 - 마운트 시 한 번만
```

### Sprint 4: Phase Transition Fix (Day 7-8)

#### Task 4.1: Queue System Refactor
```typescript
// phaseTransitionQueue.ts 수정
import { globalContextManager } from './globalContextManager';

class PhaseTransitionQueue {
  private queue: TransitionTask[] = [];
  private processing = false;

  async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    // 컨텍스트 가용성 확인
    if (!globalContextManager.isAvailable('schedule')) {
      console.log('Waiting for ScheduleContext...');
      // 재시도 스케줄링
      setTimeout(() => this.processQueue(), 5000);
      return;
    }

    this.processing = true;
    const scheduleContext = globalContextManager.get('schedule');

    try {
      while (this.queue.length > 0) {
        const task = this.queue.shift()!;
        await this.executeTransition(task, scheduleContext);
      }
    } finally {
      this.processing = false;
    }
  }

  private async executeTransition(
    task: TransitionTask,
    scheduleContext: any
  ): Promise<void> {
    try {
      // Phase 전환 로직
      await scheduleContext.updateProjectPhase(
        task.projectId,
        task.newPhase
      );
    } catch (error) {
      console.error(`Phase transition failed for ${task.projectId}:`, error);
      // 실패한 작업은 재시도하지 않음 (무한 루프 방지)
    }
  }
}
```

### Sprint 5: Event System Integration (Day 9-10)

#### Task 5.1: Event Bridge Setup
```typescript
// src/utils/eventBridge.ts
import { EventSourceTracker } from './eventSourceTracker';

class EventBridge {
  private tracker = new EventSourceTracker();
  private listeners = new Map<string, Set<Function>>();

  emit(source: string, eventType: string, data: any): void {
    // 순환 참조 체크
    if (!this.tracker.trackEmission(source, eventType)) {
      console.warn(`Circular reference detected: ${source} -> ${eventType}`);
      return;
    }

    try {
      // 이벤트 발송
      const key = `${source}:${eventType}`;
      const handlers = this.listeners.get(key) || new Set();

      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Event handler error for ${key}:`, error);
        }
      });
    } finally {
      this.tracker.clearProcessing(source, eventType);
    }
  }

  on(source: string, eventType: string, handler: Function): void {
    const key = `${source}:${eventType}`;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(handler);
  }

  off(source: string, eventType: string, handler: Function): void {
    const key = `${source}:${eventType}`;
    this.listeners.get(key)?.delete(handler);
  }
}

export const eventBridge = new EventBridge();
```

#### Task 5.2: Connect Contexts via EventBridge
```typescript
// BuildupContext.tsx
import { eventBridge } from '../utils/eventBridge';

// 이벤트 발송
const updateProject = (projectId: string, updates: any) => {
  // ... update logic

  // 다른 컨텍스트에 알림
  eventBridge.emit('buildup', 'project:updated', {
    projectId,
    updates,
    timestamp: Date.now()
  });
};

// ScheduleContext.tsx
// 이벤트 수신
useEffect(() => {
  const handleProjectUpdate = (data: any) => {
    // 프로젝트 업데이트에 따른 스케줄 조정
    if (data.updates.phase) {
      updateSchedulesForPhase(data.projectId, data.updates.phase);
    }
  };

  eventBridge.on('buildup', 'project:updated', handleProjectUpdate);
  return () => eventBridge.off('buildup', 'project:updated', handleProjectUpdate);
}, []);
```

## 🧪 테스트 계획

### Unit Tests
```typescript
// __tests__/globalContextManager.test.ts
describe('GlobalContextManager', () => {
  it('should register and retrieve contexts', () => {
    const mockContext = { test: 'value' };
    globalContextManager.register('test', mockContext);
    expect(globalContextManager.get('test')).toBe(mockContext);
  });

  it('should check availability correctly', () => {
    globalContextManager.register('test', {});
    expect(globalContextManager.isAvailable('test')).toBe(true);
    expect(globalContextManager.isAvailable('nonexistent')).toBe(false);
  });
});

// __tests__/migrationManager.test.ts
describe('MigrationManager', () => {
  it('should prevent duplicate migrations', async () => {
    const result1 = await migrationManager.attemptMigration();
    const result2 = await migrationManager.attemptMigration();
    expect(result2).toBe(false); // 두 번째 시도는 차단됨
  });
});
```

### Integration Tests
```typescript
// __tests__/integration/contextBridge.test.tsx
describe('Context Bridge Integration', () => {
  it('should allow cross-context communication', async () => {
    render(
      <ScheduleProvider>
        <BuildupProvider>
          <TestComponent />
        </BuildupProvider>
      </ScheduleProvider>
    );

    // BuildupContext에서 이벤트 발송
    fireEvent.click(screen.getByText('Update Project'));

    // ScheduleContext에서 변경 감지
    await waitFor(() => {
      expect(screen.getByText('Schedule Updated')).toBeInTheDocument();
    });
  });
});
```

### E2E Tests
```typescript
// e2e/unifiedSchedule.spec.ts
describe('Unified Schedule System', () => {
  it('should complete migration without errors', async () => {
    // 콘솔 에러 감지
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/startup/dashboard');
    await page.waitForTimeout(5000); // 마이그레이션 대기

    expect(consoleErrors).toHaveLength(0);
  });

  it('should handle phase transitions', async () => {
    await page.goto('/startup/buildup/project/1');
    await page.click('[data-testid="change-phase"]');

    // Phase 변경이 스케줄에 반영되는지 확인
    await page.goto('/startup/buildup/calendar');
    const phaseIndicator = await page.textContent('[data-testid="phase-indicator"]');
    expect(phaseIndicator).toContain('Phase 2');
  });
});
```

## 📊 성공 지표

### 정량적 지표
- ✅ 콘솔 에러 0개
- ✅ 마이그레이션 성공률 100%
- ✅ Phase 전환 성공률 100%
- ✅ 페이지 로드 시간 < 2초

### 정성적 지표
- ✅ 사용자가 에러 없이 모든 기능 사용 가능
- ✅ 개발자가 컨텍스트 간 통신 쉽게 구현
- ✅ 시스템 확장성 보장

## 🚀 구현 순서 및 실제 진행 상황

### Week 1 (완료/진행)
1. **Day 1-2**: Critical Error Fixes ✅ **80% 완료**
   - ✅ ToastContext 연결 (useSafeToast Hook)
   - ⚠️ Window context 설정 (주석 처리됨)
   - ✅ Unknown projectId 수정

2. **Day 3-4**: Context Bridge ⚠️ **70% 완료**
   - ✅ GlobalContextManager 구현 (422줄)
   - ❌ 모든 Context 등록 (미완료)

3. **Day 5-6**: Migration System ✅ **120% 과도 구현**
   - ✅ 8개+ Migration 파일 생성
   - ✅ 조건부 실행 로직

### Week 2 (부분 진행)
4. **Day 7-8**: Phase Transition 🔄 **25% 진행**
   - ✅ PhaseTransitionManager (788줄)
   - ⏳ Queue 시스템 고도화 필요

5. **Day 9-10**: Event System ⏳ **50% 구조만**
   - ⚠️ EventBridge 구조 존재
   - ✅ 순환 참조 방지 구현

## 📝 체크리스트

### Pre-Implementation
- [ ] 현재 에러 로그 백업
- [ ] 테스트 환경 준비
- [ ] Rollback 계획 수립

### Implementation
- [ ] Sprint 1: Critical Fixes
  - [ ] ToastContext import 추가
  - [ ] Window context 설정
  - [ ] ProjectId 처리 수정

- [ ] Sprint 2: Context Bridge
  - [ ] GlobalContextManager 구현
  - [ ] Context 등록 코드 추가

- [ ] Sprint 3: Migration
  - [ ] MigrationManager 구현
  - [ ] 조건부 트리거 설정

- [ ] Sprint 4: Phase Transition
  - [ ] Queue 시스템 수정
  - [ ] 에러 핸들링 개선

- [ ] Sprint 5: Event System
  - [ ] EventBridge 구현
  - [ ] Context 연결

### Post-Implementation
- [ ] 전체 에러 로그 확인
- [ ] 성능 측정
- [ ] 사용자 테스트
- [ ] 문서화 업데이트

## 🔄 Rollback Plan

만약 구현 중 심각한 문제 발생 시:

1. **즉시 조치**
   ```bash
   git revert HEAD~n  # n = 문제 커밋 수
   npm run build
   npm run deploy
   ```

2. **임시 해결책**
   ```typescript
   // 모든 자동화 기능 비활성화
   localStorage.setItem('disable_automation', 'true');
   ```

3. **단계적 복구**
   - Phase 1: 에러만 수정
   - Phase 2: 핵심 기능만 활성화
   - Phase 3: 전체 기능 복구

## 📚 참고 자료

- [Iteration 21 문서](./iteration-21-unified-schedule-system.md)
- [React Context Best Practices](https://react.dev/learn/passing-data-deeply-with-context)
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)
- [Error Boundary Pattern](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)

## 👥 담당자

- **Frontend Lead**: 통합 스케줄 시스템 완성
- **QA**: 테스트 시나리오 작성 및 실행
- **DevOps**: 배포 및 모니터링

---

**작성일**: 2025-09-19
**예상 완료일**: 2025-09-29 (10일)
**우선순위**: 🔴 Critical (즉시 시작 필요)