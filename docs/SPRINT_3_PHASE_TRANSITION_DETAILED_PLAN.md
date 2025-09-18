# 📋 Sprint 3: Phase Transition 자동화 시스템 - 5단계 상세 실행 계획

> **작성일**: 2025-01-19
> **목표**: 미팅 예약 기반 자동 단계 전환 시스템 완성
> **예상 소요 시간**: 8-10시간 (5단계 순차 진행)

## 🎯 Sprint 3 최종 목표

### **핵심 비즈니스 로직**
> **"미팅 예약 = 해당 단계 작업 진행 중"**
>
> PM이 다음 미팅을 예약했다는 것은 이미 그 단계의 작업을 수행하고 있다는 의미

### **구현 목표**
1. ✅ ScheduleContext의 `schedule:created` 이벤트 감지
2. ✅ BuildupContext에서 이벤트 수신 및 Phase Transition 트리거
3. ✅ 자동 단계 전환 실행 및 UI 업데이트
4. ✅ Phase History 기록 및 추적
5. ✅ 실시간 사용자 알림 및 피드백

---

## 🏗️ 현재 시스템 분석 결과

### **✅ 이미 구현된 것들 (활용 가능)**
1. **ScheduleContext** (900+ lines)
   - `schedule:created`, `schedule:updated` 이벤트 발생 ✅
   - BuildupProjectMeeting 타입 지원 ✅
   - projectId 링킹 시스템 ✅

2. **BuildupContext** (2060+ lines)
   - 이벤트 리스너 기본 구조 ✅
   - `requestManualPhaseTransition` 함수 ✅
   - `phaseTransitionEvents` 배열 ✅
   - EventSourceTracker 순환 참조 방지 ✅

3. **Phase Transition Module**
   - PhaseTransitionModule.ts (모듈 로더) ✅
   - PhaseTransitionEngineV2.ts (엔진 코어) ✅
   - usePhaseTransition.ts (React Hook) ✅

### **❌ 구현 필요한 것들**
1. **이벤트 연결**: ScheduleContext → BuildupContext 이벤트 처리
2. **미팅 시퀀스 매핑**: 가이드 1차~4차 → 단계 전환 규칙
3. **자동 트리거 로직**: 미팅 예약 감지 → 단계 업데이트
4. **UI 피드백**: Toast 알림, 시각적 전환 효과
5. **검증 시스템**: 중복 전환 방지, 롤백 메커니즘

---

## 📊 5단계 세부 실행 계획

### **Phase 1: 이벤트 연결 및 기본 구조 구축** (2시간)

#### 목표
ScheduleContext의 이벤트가 BuildupContext에서 제대로 수신되고 처리되는 파이프라인 구축

#### 작업 항목
```typescript
// 1-1. BuildupContext 이벤트 리스너 강화
const handleScheduleCreated = (e: CustomEvent) => {
  const { schedule, source } = e.detail;

  // 빌드업 프로젝트 미팅만 처리
  if (schedule.type !== 'buildup_project') return;

  // EventSourceTracker로 순환 참조 방지
  if (!EventSourceTracker.shouldProcess(e.detail.eventId)) return;

  // Phase Transition 트리거 로직
  processPhaseTransition(schedule);
};

// 1-2. 미팅 시퀀스 식별 함수
const identifyMeetingSequence = (schedule: BuildupProjectMeeting): string | null => {
  const { meetingSequence, title } = schedule;

  // 명시적 시퀀스 우선
  if (meetingSequence) return meetingSequence;

  // 제목 기반 패턴 매칭
  if (title.includes('킥오프') || title.includes('1차')) return 'guide_1st';
  if (title.includes('2차')) return 'guide_2nd';
  if (title.includes('3차')) return 'guide_3rd';
  if (title.includes('4차')) return 'guide_4th';

  return null;
};

// 1-3. 이벤트 리스너 등록 (useEffect)
useEffect(() => {
  window.addEventListener('schedule:created', handleScheduleCreated);
  window.addEventListener('schedule:updated', handleScheduleUpdated);

  return () => {
    window.removeEventListener('schedule:created', handleScheduleCreated);
    window.removeEventListener('schedule:updated', handleScheduleUpdated);
  };
}, []);
```

#### 검증 포인트
- [ ] console.log로 이벤트 수신 확인
- [ ] EventSourceTracker 순환 참조 방지 작동
- [ ] 빌드업 프로젝트 미팅만 필터링

---

### **Phase 2: Phase Transition 규칙 엔진 구현** (2시간)

#### 목표
미팅 시퀀스에 따른 자동 단계 전환 규칙 구현

#### 작업 항목
```typescript
// 2-1. 전환 규칙 맵 정의
const MEETING_TO_PHASE_MAP = {
  'pre_meeting': { from: 'contract_pending', to: 'contract_signed' },
  'guide_1st': { from: 'contract_signed', to: 'planning' },
  'guide_2nd': { from: 'planning', to: 'design' },
  'guide_3rd': { from: 'design', to: 'execution' },
  'guide_4th': { from: 'execution', to: 'review' }
};

// 2-2. 전환 가능 여부 검증
const canTransition = (project: Project, targetPhase: string): boolean => {
  // 이미 해당 단계인지 체크
  if (project.phase === targetPhase) return false;

  // 역행 방지 (옵션)
  const currentIndex = PHASE_ORDER.indexOf(project.phase);
  const targetIndex = PHASE_ORDER.indexOf(targetPhase);
  if (targetIndex < currentIndex) {
    console.warn('⚠️ Backward transition detected');
    // 관리자 승인 필요 플래그 설정 가능
  }

  return true;
};

// 2-3. Phase Transition 실행
const executePhaseTransition = async (
  projectId: string,
  fromPhase: string,
  toPhase: string,
  trigger: 'meeting_scheduled' | 'payment' | 'manual',
  metadata?: any
) => {
  // 1. 프로젝트 상태 업데이트
  setProjects(prev => prev.map(p =>
    p.id === projectId
      ? {
          ...p,
          phase: toPhase,
          phaseHistory: [
            ...p.phaseHistory,
            {
              phase: toPhase,
              transitionedAt: new Date().toISOString(),
              transitionedBy: metadata?.pmId || 'system',
              trigger,
              metadata
            }
          ]
        }
      : p
  ));

  // 2. Phase Transition Event 기록
  const event: PhaseTransitionEvent = {
    id: `PTE-${Date.now()}`,
    projectId,
    fromPhase,
    toPhase,
    trigger,
    timestamp: new Date().toISOString(),
    metadata
  };

  setPhaseTransitionEvents(prev => [...prev, event]);

  // 3. 외부 이벤트 발생 (다른 컴포넌트 알림)
  window.dispatchEvent(new CustomEvent('project:phase_changed', {
    detail: { projectId, fromPhase, toPhase, trigger }
  }));
};
```

#### 검증 포인트
- [ ] 전환 규칙 맵 정확성
- [ ] 중복 전환 방지 로직
- [ ] Phase History 정확한 기록

---

### **Phase 3: UI 피드백 및 사용자 경험** (1.5시간)

#### 목표
단계 전환 시 명확한 시각적 피드백과 알림 제공

#### 작업 항목
```typescript
// 3-1. Toast 알림 시스템 통합
import { useToast } from '../contexts/ToastContext';

const showPhaseTransitionNotification = (
  projectName: string,
  fromPhase: string,
  toPhase: string
) => {
  const { showSuccess, showInfo } = useToast();

  // 단계별 맞춤 메시지
  const messages = {
    'planning': `🎯 ${projectName} 프로젝트가 기획 단계로 전환되었습니다`,
    'design': `🎨 ${projectName} 프로젝트가 설계 단계로 전환되었습니다`,
    'execution': `🚀 ${projectName} 프로젝트가 실행 단계로 전환되었습니다`,
    'review': `✅ ${projectName} 프로젝트가 검토 단계로 전환되었습니다`
  };

  showSuccess(messages[toPhase] || `프로젝트 단계가 ${toPhase}로 변경되었습니다`);
};

// 3-2. ProjectDetail 컴포넌트 실시간 업데이트
useEffect(() => {
  const handlePhaseChanged = (e: CustomEvent) => {
    const { projectId, toPhase } = e.detail;
    if (projectId === currentProjectId) {
      // 애니메이션 효과
      setIsTransitioning(true);
      setTimeout(() => setIsTransitioning(false), 500);

      // 프로젝트 데이터 리프레시
      refreshProject(projectId);
    }
  };

  window.addEventListener('project:phase_changed', handlePhaseChanged);
  return () => window.removeEventListener('project:phase_changed', handlePhaseChanged);
}, [currentProjectId]);

// 3-3. Phase Indicator 애니메이션
<ProjectPhaseIndicator
  currentPhase={project.phase}
  progress={calculatePhaseProgress(project)}
  className={isTransitioning ? 'animate-pulse' : ''}
/>
```

#### 검증 포인트
- [ ] Toast 알림 정상 표시
- [ ] ProjectDetail UI 실시간 업데이트
- [ ] 애니메이션 효과 작동

---

### **Phase 4: 엣지 케이스 및 오류 처리** (1.5시간)

#### 목표
예외 상황 처리 및 시스템 안정성 보장

#### 작업 항목
```typescript
// 4-1. 동시 요청 처리 (Debouncing)
const transitionQueue = new Map<string, NodeJS.Timeout>();

const queuePhaseTransition = (projectId: string, toPhase: string, delay = 1000) => {
  // 기존 대기중인 전환 취소
  if (transitionQueue.has(projectId)) {
    clearTimeout(transitionQueue.get(projectId));
  }

  // 새 전환 대기열 추가
  const timeoutId = setTimeout(() => {
    executePhaseTransition(projectId, currentPhase, toPhase);
    transitionQueue.delete(projectId);
  }, delay);

  transitionQueue.set(projectId, timeoutId);
};

// 4-2. 롤백 메커니즘
const rollbackPhaseTransition = async (projectId: string, event: PhaseTransitionEvent) => {
  try {
    // 이전 상태로 복원
    setProjects(prev => prev.map(p =>
      p.id === projectId
        ? {
            ...p,
            phase: event.fromPhase,
            phaseHistory: p.phaseHistory.filter(h =>
              h.transitionedAt !== event.timestamp
            )
          }
        : p
    ));

    showWarning(`단계 전환이 취소되었습니다: ${event.metadata?.reason}`);
  } catch (error) {
    showError('롤백 실패: 관리자에게 문의하세요');
  }
};

// 4-3. 검증 실패 시 처리
const handleTransitionError = (error: any, context: any) => {
  console.error('Phase Transition Error:', error, context);

  // 에러 타입별 처리
  if (error.code === 'INVALID_SEQUENCE') {
    showError('잘못된 미팅 순서입니다. 이전 단계를 먼저 완료하세요.');
  } else if (error.code === 'PERMISSION_DENIED') {
    showError('단계 전환 권한이 없습니다.');
  } else {
    showError('단계 전환 중 오류가 발생했습니다.');
  }

  // 에러 로깅
  logPhaseTransitionError(error, context);
};
```

#### 검증 포인트
- [ ] 동시 다발적 미팅 예약 시 처리
- [ ] 롤백 기능 정상 작동
- [ ] 에러 메시지 적절성

---

### **Phase 5: 통합 테스트 및 최종 검증** (2시간)

#### 목표
전체 시스템 통합 테스트 및 완성도 검증

#### 테스트 시나리오

##### 5-1. 정상 플로우 테스트
```typescript
// 테스트 케이스 1: 킥오프 미팅 예약 → 기획 단계 전환
const testCase1 = async () => {
  // 1. 테스트 프로젝트 생성 (contract_signed 상태)
  const testProject = createTestProject('TEST-001', 'contract_signed');

  // 2. 가이드 1차 미팅 예약
  const meeting = {
    type: 'buildup_project',
    projectId: 'TEST-001',
    title: '가이드 1차 미팅 (킥오프)',
    meetingSequence: 'guide_1st',
    date: '2025-01-20T10:00:00'
  };

  // 3. ScheduleContext를 통한 미팅 생성
  await scheduleContext.createSchedule(meeting);

  // 4. 검증: 프로젝트가 planning 단계로 전환되었는지
  await waitFor(() => {
    const updated = getProject('TEST-001');
    expect(updated.phase).toBe('planning');
  });

  // 5. Phase History 검증
  const history = getPhaseTransitionHistory('TEST-001');
  expect(history).toHaveLength(1);
  expect(history[0].trigger).toBe('meeting_scheduled');
};
```

##### 5-2. 엣지 케이스 테스트
```typescript
// 테스트 케이스 2: 중복 미팅 예약
const testCase2 = async () => {
  // 동일 프로젝트에 2개의 가이드 1차 미팅 연속 예약
  await scheduleContext.createSchedule(meeting1);
  await scheduleContext.createSchedule(meeting2);

  // 단계는 한 번만 전환되어야 함
  const history = getPhaseTransitionHistory('TEST-002');
  expect(history).toHaveLength(1);
};

// 테스트 케이스 3: 순서 역행 시도
const testCase3 = async () => {
  // execution 단계 프로젝트에 가이드 1차 미팅 예약
  const backwardMeeting = {
    projectId: 'TEST-003',
    meetingSequence: 'guide_1st'
  };

  await scheduleContext.createSchedule(backwardMeeting);

  // 경고 메시지 표시되었는지 확인
  expect(mockShowWarning).toHaveBeenCalledWith(
    expect.stringContaining('역행')
  );
};
```

##### 5-3. 성능 테스트
```typescript
// 대량 미팅 동시 처리
const performanceTest = async () => {
  const startTime = Date.now();

  // 10개 프로젝트의 미팅 동시 생성
  const promises = Array.from({ length: 10 }, (_, i) =>
    scheduleContext.createSchedule({
      projectId: `PERF-${i}`,
      meetingSequence: 'guide_1st'
    })
  );

  await Promise.all(promises);

  const endTime = Date.now();
  console.log(`처리 시간: ${endTime - startTime}ms`);

  // 모든 프로젝트가 정확히 전환되었는지 확인
  for (let i = 0; i < 10; i++) {
    const project = getProject(`PERF-${i}`);
    expect(project.phase).toBe('planning');
  }
};
```

#### 최종 체크리스트
- [ ] 가이드 1차 미팅 → planning 전환 ✓
- [ ] 가이드 2차 미팅 → design 전환 ✓
- [ ] 가이드 3차 미팅 → execution 전환 ✓
- [ ] 가이드 4차 미팅 → review 전환 ✓
- [ ] Toast 알림 표시 ✓
- [ ] ProjectDetail UI 실시간 업데이트 ✓
- [ ] Phase History 정확한 기록 ✓
- [ ] 중복 전환 방지 ✓
- [ ] 에러 처리 및 롤백 ✓
- [ ] 성능 (1초 이내 처리) ✓

---

## 📈 예상 결과물

### **Sprint 3 완료 후 사용자 경험**

1. **PM 관점**
   - 미팅 예약만으로 프로젝트 단계 자동 업데이트
   - 수동 단계 관리 부담 제거
   - 실시간 프로젝트 진행 상황 파악

2. **시스템 관점**
   - 완전 자동화된 Phase Transition
   - 이벤트 기반 실시간 동기화
   - 추적 가능한 전환 이력

3. **데이터 일관성**
   - ScheduleContext ↔ BuildupContext 완전 동기화
   - 단일 진실 원천 (Single Source of Truth)
   - 충돌 없는 상태 관리

### **기술적 성과**
- ✅ 이벤트 드리븐 아키텍처 완성
- ✅ 순환 참조 없는 안전한 Context 통신
- ✅ 확장 가능한 Phase Transition 규칙 엔진
- ✅ 완벽한 에러 처리 및 복구 메커니즘

---

## 🚀 다음 단계 (Sprint 4 예고)

### **고도화 작업**
1. **지능형 Phase Transition**
   - AI 기반 단계 추천
   - 프로젝트 패턴 학습

2. **고급 워크플로우**
   - 조건부 단계 전환
   - 병렬 단계 처리
   - 커스텀 단계 정의

3. **분석 및 인사이트**
   - Phase Duration 분석
   - 병목 구간 식별
   - 프로젝트 예측 모델

---

## 📝 구현 우선순위

### **필수 (Must Have)**
1. ✅ 미팅 예약 → 단계 전환 자동화
2. ✅ Phase History 기록
3. ✅ UI 실시간 업데이트

### **중요 (Should Have)**
1. ✅ Toast 알림
2. ✅ 중복 방지 로직
3. ✅ 에러 처리

### **선택 (Nice to Have)**
1. ⏸️ 롤백 메커니즘
2. ⏸️ 관리자 승인 플로우
3. ⏸️ 고급 분석 대시보드

---

**Sprint 3 실행 준비 완료!** 🎯

각 Phase를 순차적으로 진행하며, 각 단계 완료 후 검증 포인트를 확인하고 다음 단계로 진행합니다.