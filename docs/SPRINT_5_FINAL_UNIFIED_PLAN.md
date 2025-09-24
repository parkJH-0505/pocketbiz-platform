# Sprint 5: 최종 통합 실행 계획

> **작성일**: 2025-01-24
> **목표**: "미팅 예약 → 자동 단계 전환" 시스템 100% 완성
> **현재 완성도**: 85% (백엔드 완료, UI 통합만 필요)
> **예상 소요**: 3-4시간
> **전제 조건**: Sprint 1-4 완료

## 🎯 프로젝트 최종 목표

### 핵심 요구사항
1. **빌드업 미팅을 예약하면 프로젝트 단계가 자동으로 변경**
   - 가이드 1차 미팅 예약 → "기획" 단계
   - 가이드 2차 미팅 예약 → "설계" 단계
   - 가이드 3차 미팅 예약 → "실행" 단계

2. **모든 일정이 통합 캘린더에 표시**
   - BuildupCalendar에서 모든 미팅 확인
   - ProjectDetail에서 미팅 정보 표시

3. **실시간 동기화**
   - 어디서 생성하든 즉시 반영

## 📊 현재 상태 (85% 완성)

### ✅ 이미 구현된 것

| 구분 | 구현 내역 | 상태 |
|------|----------|------|
| **백엔드** | ScheduleContext (통합 스케줄) | ✅ 100% |
| | PhaseTransitionManager (단계 전환) | ✅ 100% |
| | GlobalContextManager (Context 통신) | ✅ 100% |
| | EventBus (이벤트 시스템) | ✅ 100% |
| **UI** | UniversalScheduleModal (미팅 생성 모달) | ✅ **이미 존재** |
| | BuildupCalendarV3 (캘린더 표시) | ✅ 90% |
| | PhaseTransitionTest (테스트 페이지) | ✅ 100% |
| **연동** | Window context 활성화 | ✅ 100% |
| | 이벤트 트리거 연결 | ✅ 100% |

### ❌ 미구현 부분 (15%)

| 구분 | 필요 작업 | 우선순위 |
|------|----------|----------|
| **데이터** | Mock 프로젝트에 실제 미팅 데이터 | 🔴 필수 |
| **UI** | ProjectDetail 미팅 예약 버튼 | 🔴 필수 |
| **테스트** | E2E 시나리오 검증 | 🔴 필수 |
| **정리** | Migration 에러 해결 | 🟡 권장 |
| | 콘솔 에러 정리 | 🟡 권장 |

## 📋 Sprint 5 실행 계획

### Step 5.1: 실제 데이터 연동 (30분)

#### 5.1.1 프로젝트 미팅 데이터 추가

**파일**: `src/contexts/BuildupContext.tsx`

```typescript
// mockProjects 수정 - 실제 미팅 데이터 포함
const mockProjects: Project[] = [
  {
    id: 'PRJ-001',
    title: 'IR 덱 전문 컨설팅',
    status: 'ongoing',
    phase: 'contract_pending',
    meetings: [
      {
        id: 'MTG-001',
        date: '2025-01-25T14:00:00',
        type: 'pre_meeting',
        title: '사전 미팅',
        projectId: 'PRJ-001',
        status: 'scheduled'
      }
    ],
    // ... 나머지 필드
  },
  {
    id: 'PRJ-002',
    title: 'MVP 개발 프로젝트',
    status: 'ongoing',
    phase: 'planning',
    meetings: [
      {
        id: 'MTG-002',
        date: '2025-01-26T10:00:00',
        type: 'guide_1st',
        title: '가이드 1차 미팅 - 킥오프',
        projectId: 'PRJ-002',
        status: 'completed'
      },
      {
        id: 'MTG-003',
        date: '2025-01-28T14:00:00',
        type: 'guide_2nd',
        title: '가이드 2차 미팅 - 설계',
        projectId: 'PRJ-002',
        status: 'scheduled'
      }
    ]
  }
];
```

#### 5.1.2 Migration 안정화

```typescript
// Migration 임시 비활성화 (line 2350 근처)
if (!migrationAttemptedRef.current) {
  migrationAttemptedRef.current = true;

  // Sprint 5 동안 임시 비활성화
  console.log('📌 Migration disabled for Sprint 5 testing');
  return;

  // 기존 코드는 주석 처리
  /* setTimeout(async () => { ... }, 3000); */
}
```

### Step 5.2: UI 통합 (1시간)

#### 5.2.1 ProjectDetail 미팅 예약 버튼

**파일**: `src/pages/startup/buildup/ProjectDetail.tsx`

```typescript
// Import 추가
import { UniversalScheduleModal } from '../../../components/schedule';
import { useScheduleContext } from '../../../contexts/ScheduleContext';
import { phaseTransitionManager } from '../../../utils/phaseTransitionManager';

// State 추가
const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
const { createSchedule } = useScheduleContext();

// 미팅 타입 결정 함수
const getNextMeetingType = (phase: string): string => {
  const PHASE_TO_MEETING = {
    'contract_pending': 'pre_meeting',
    'contract_signed': 'guide_1st',
    'planning': 'guide_2nd',
    'design': 'guide_3rd',
    'execution': 'guide_4th',
    'review': 'post_meeting'
  };
  return PHASE_TO_MEETING[phase] || 'general_meeting';
};

// 미팅 예약 핸들러
const handleScheduleMeeting = async (scheduleData: any) => {
  try {
    // 1. 미팅 생성 (이벤트 자동 발생)
    const newMeeting = await createSchedule({
      ...scheduleData,
      type: 'buildup_project',
      projectId: project.id,
      meetingSequence: getNextMeetingType(project.phase)
    });

    console.log('✅ 미팅 예약 성공:', newMeeting);

    // 2. UI 닫기
    setIsScheduleModalOpen(false);

    // 3. Phase 전환은 이벤트 시스템이 자동 처리
    // ScheduleContext → Event → PhaseTransitionManager

  } catch (error) {
    console.error('❌ 미팅 예약 실패:', error);
    alert('미팅 예약에 실패했습니다.');
  }
};

// JSX - 다음 미팅 섹션에 버튼 추가
<div className="project-meetings">
  <div className="section-header">
    <h3>다음 미팅</h3>
    <button
      className="btn-primary"
      onClick={() => setIsScheduleModalOpen(true)}
    >
      <span>📅</span> 미팅 예약
    </button>
  </div>

  {/* 기존 미팅 표시 */}
  {upcomingMeetings.length > 0 ? (
    // ... 기존 코드
  ) : (
    <p>예약된 미팅이 없습니다.</p>
  )}
</div>

{/* 미팅 예약 모달 */}
{isScheduleModalOpen && (
  <UniversalScheduleModal
    isOpen={isScheduleModalOpen}
    onClose={() => setIsScheduleModalOpen(false)}
    onSubmit={handleScheduleMeeting}
    mode="create"
    scheduleType="buildup_project"
    initialData={{
      projectId: project.id,
      title: `${project.title} - ${getNextMeetingType(project.phase)} 미팅`,
      type: 'buildup_project'
    }}
  />
)}
```

#### 5.2.2 스타일 추가

```css
/* ProjectDetail.css 또는 styled-components */
.btn-primary {
  background: #4F46E5;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
}

.btn-primary:hover {
  background: #4338CA;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
```

### Step 5.3: 통합 테스트 (1시간)

#### 5.3.1 테스트 시나리오

**시나리오 1: 기본 플로우**
```javascript
// 브라우저 콘솔에서 실행
const testBasicFlow = async () => {
  console.log('🧪 Test 1: 기본 미팅 예약 → Phase 전환');

  // 1. 현재 프로젝트 상태 확인
  const project = window.buildupContext.projects.find(p => p.id === 'PRJ-001');
  console.log('현재 Phase:', project.phase);

  // 2. 가이드 1차 미팅 예약
  const meeting = await window.scheduleContext.createSchedule({
    type: 'buildup_project',
    projectId: 'PRJ-001',
    title: '가이드 1차 미팅',
    date: new Date('2025-01-27T14:00:00'),
    meetingSequence: 'guide_1st'
  });

  // 3. Phase 전환 확인 (1초 대기)
  setTimeout(() => {
    const updatedProject = window.buildupContext.projects.find(p => p.id === 'PRJ-001');
    if (updatedProject.phase === 'planning') {
      console.log('✅ Phase 전환 성공!');
    } else {
      console.log('❌ Phase 전환 실패:', updatedProject.phase);
    }
  }, 1000);
};

window.testBasicFlow = testBasicFlow;
```

**시나리오 2: 연속 미팅 예약**
```javascript
const testSequentialMeetings = async () => {
  console.log('🧪 Test 2: 연속 미팅 예약');

  const projectId = 'PRJ-002';
  const meetings = [
    { type: 'guide_2nd', phase: 'design' },
    { type: 'guide_3rd', phase: 'execution' },
    { type: 'guide_4th', phase: 'review' }
  ];

  for (const meeting of meetings) {
    await window.scheduleContext.createSchedule({
      type: 'buildup_project',
      projectId,
      meetingSequence: meeting.type,
      title: `${meeting.type} 미팅`,
      date: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000)
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    const project = window.buildupContext.projects.find(p => p.id === projectId);
    console.log(`${meeting.type} → Phase: ${project.phase} (예상: ${meeting.phase})`);
  }
};

window.testSequentialMeetings = testSequentialMeetings;
```

#### 5.3.2 자동화 테스트 스위트

**파일**: `src/tests/sprint5Integration.test.ts`

```typescript
export const runSprint5IntegrationTests = () => {
  const tests = {
    // Test 1: Context 연결
    contextConnection: () => {
      const contexts = [
        'scheduleContext',
        'buildupContext',
        'phaseTransitionManager'
      ];

      const results = contexts.map(ctx => ({
        name: ctx,
        exists: !!window[ctx]
      }));

      const passed = results.every(r => r.exists);
      console.log('Context 연결:', passed ? '✅' : '❌', results);
      return passed;
    },

    // Test 2: 미팅 생성
    meetingCreation: async () => {
      try {
        const meeting = await window.scheduleContext.createSchedule({
          type: 'buildup_project',
          title: 'Test Meeting',
          date: new Date(),
          projectId: 'PRJ-001'
        });
        console.log('미팅 생성:', '✅', meeting.id);
        return true;
      } catch (error) {
        console.log('미팅 생성:', '❌', error);
        return false;
      }
    },

    // Test 3: Phase 전환
    phaseTransition: async () => {
      const initialPhase = 'contract_pending';
      const expectedPhase = 'planning';

      // 미팅 예약
      await window.scheduleContext.createSchedule({
        type: 'buildup_project',
        projectId: 'PRJ-TEST',
        meetingSequence: 'guide_1st',
        title: 'Test Phase Transition',
        date: new Date()
      });

      // 대기
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 확인
      const project = window.buildupContext.projects.find(p => p.id === 'PRJ-TEST');
      const passed = project?.phase === expectedPhase;

      console.log('Phase 전환:', passed ? '✅' : '❌',
        `${initialPhase} → ${project?.phase} (예상: ${expectedPhase})`);
      return passed;
    },

    // Test 4: 캘린더 표시
    calendarDisplay: () => {
      const schedules = window.scheduleContext?.schedules || [];
      const buildupMeetings = schedules.filter(s =>
        s.type === 'buildup_project' || s.type === 'buildup_meeting'
      );

      const passed = buildupMeetings.length > 0;
      console.log('캘린더 표시:', passed ? '✅' : '❌',
        `${buildupMeetings.length}개 미팅`);
      return passed;
    }
  };

  // 모든 테스트 실행
  const runAll = async () => {
    console.log('🧪 Sprint 5 통합 테스트 시작');
    console.log('================================');

    let passed = 0;
    let total = 0;

    for (const [name, test] of Object.entries(tests)) {
      total++;
      try {
        const result = await test();
        if (result) passed++;
      } catch (error) {
        console.error(`Test ${name} failed:`, error);
      }
    }

    console.log('================================');
    console.log(`결과: ${passed}/${total} 테스트 통과`);
    console.log(passed === total ? '🎉 모든 테스트 통과!' : '⚠️ 일부 테스트 실패');
  };

  return { tests, runAll };
};

// 전역 등록
if (typeof window !== 'undefined') {
  window.sprint5Tests = runSprint5IntegrationTests();
}
```

### Step 5.4: 최종 정리 및 최적화 (30분)

#### 5.4.1 에러 정리 체크리스트

- [ ] Migration 에러 토스트 제거
- [ ] Context 이름 불일치 해결 ("buildup" → "BuildupContext")
- [ ] 불필요한 console.log 제거
- [ ] 콘솔 경고 메시지 해결
- [ ] Context 재등록 경고 제거

#### 5.4.2 성능 최적화

```typescript
// useMemo로 불필요한 재계산 방지
const upcomingMeetings = useMemo(() => {
  return schedules
    .filter(s => s.projectId === project.id)
    .filter(s => new Date(s.date) > new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}, [schedules, project.id]);

// useCallback으로 함수 재생성 방지
const handleScheduleMeeting = useCallback(async (data) => {
  // ... 구현
}, [createSchedule, project.id]);
```

## ✅ 검증 체크리스트

### 필수 기능
- [ ] 가이드 1차 미팅 예약 → "기획" 단계 전환
- [ ] 가이드 2차 미팅 예약 → "설계" 단계 전환
- [ ] 가이드 3차 미팅 예약 → "실행" 단계 전환
- [ ] 모든 미팅이 BuildupCalendar에 표시
- [ ] ProjectDetail에서 미팅 정보 확인

### 기술 요구사항
- [ ] 콘솔 에러 0개
- [ ] Context 통신 정상
- [ ] localStorage 동기화
- [ ] 이벤트 시스템 작동

### UX 요구사항
- [ ] 미팅 예약 버튼 직관적
- [ ] Phase 전환 시각적 피드백
- [ ] 로딩/에러 상태 처리

## 🚀 실행 가이드

### 1. 개발 서버 시작
```bash
npm run dev
```

### 2. 테스트 페이지 접속
```
http://localhost:5173/pocketbiz-platform/startup/buildup/projects/PRJ-001
```

### 3. 브라우저 콘솔 테스트
```javascript
// 기본 테스트
window.testBasicFlow()

// 연속 미팅 테스트
window.testSequentialMeetings()

// 전체 테스트 스위트
window.sprint5Tests.runAll()
```

### 4. 수동 테스트
1. ProjectDetail 페이지에서 "미팅 예약" 버튼 클릭
2. 미팅 정보 입력 후 저장
3. Phase 자동 전환 확인
4. BuildupCalendar에서 미팅 표시 확인

## 📅 예상 타임라인

| 시간 | 작업 | 체크 |
|------|------|------|
| 0:00-0:30 | Step 5.1 데이터 준비 | ⬜ |
| 0:30-1:30 | Step 5.2 UI 통합 | ⬜ |
| 1:30-2:30 | Step 5.3 테스트 | ⬜ |
| 2:30-3:00 | Step 5.4 최종 정리 | ⬜ |

**총 소요 시간: 3시간**

## 💡 핵심 인사이트

> **"이미 85% 완성되어 있습니다!"**
>
> - ✅ UniversalScheduleModal 이미 구현
> - ✅ ScheduleContext 완전 구현
> - ✅ PhaseTransitionManager 작동 중
> - ✅ 이벤트 시스템 연결됨
>
> **필요한 것은 UI 버튼 추가와 테스트뿐!**

## 🎯 성공 기준

### 최소 성공 (MVP)
✅ ProjectDetail에서 미팅 예약 가능
✅ 미팅 예약 시 Phase 자동 전환
✅ 콘솔 에러 없음

### 완전 성공
⭐ 모든 테스트 통과
⭐ 성능 최적화 완료
⭐ 문서화 완료

---

**이 계획을 따라 Sprint 5를 완료하면 프로젝트가 100% 완성됩니다!** 🎉

> **다음 단계**: Sprint 5 실행 → 프로젝트 완료 → 배포 준비

## 📌 중요 참고사항

### 이미 존재하는 컴포넌트
- `UniversalScheduleModal` - components/schedule/UniversalScheduleModal.tsx
- `BuildupCalendarV3` - pages/startup/buildup/BuildupCalendarV3.tsx
- `PhaseTransitionManager` - utils/phaseTransitionManager.ts
- `ScheduleContext` - contexts/ScheduleContext.tsx
- `BuildupContext` - contexts/BuildupContext.tsx

### Window Context 상태
- `window.scheduleContext` - ✅ 활성화됨 (line 1114)
- `window.buildupContext` - ✅ 활성화됨 (line 2233)
- `window.phaseTransitionManager` - ✅ 사용 가능

### 이벤트 체인 (이미 구현됨)
1. `createSchedule()` 호출
2. `SCHEDULE_EVENTS.BUILDUP_MEETING_CREATED` 이벤트 발생
3. `PhaseTransitionManager.handleMeetingCreated()` 자동 호출
4. 프로젝트 Phase 업데이트
5. UI 자동 갱신

### Migration 관련 주의사항
- `migrationAttemptedRef` 사용하여 중복 실행 방지
- Sprint 5 동안은 임시 비활성화 권장
- 완료 후 재활성화 필요