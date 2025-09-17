# Iteration 21 (2차 개정): 통합 스케줄 시스템 기반 자동 단계 전환

> **최종 업데이트**: 2025-01-17
> **상태**: Phase C 진행 중 → **전면 아키텍처 재설계 필요** 발견

## 📋 개정 배경 및 발견된 근본 문제

### **1차 개정 (이전)**
**문제 발생**: Phase transition 시스템 구현 중 순환 참조 및 모듈 import 에러로 인해 앱이 실행되지 않는 치명적 문제 발생

**해결 방향**: 단계적 접근법으로 전환
- 기본 기능 우선 구현
- Phase transition은 후속 작업으로 진행

### **2차 개정 (현재) - 근본 문제 발견**
**발견된 핵심 이슈**: Phase Transition을 구현하면서 **포켓비즈의 전체 스케줄 시스템 아키텍처 부재** 발견

#### 🚨 **근본 원인 분석**
1. **미팅 완료 기반 자동 단계 전환의 한계**
   - PM이 수동으로 지속적으로 체크해야 하는 복잡성
   - 완료 시간 기반으로는 실제 프로덕트 체험이 어려움 (내일이 되어야 알 수 있는 구조)

2. **포켓비즈의 실제 업무 프로세스와 불일치**
   - **실제 프로세스**: 미팅 **예약**이 되면 해당 단계로 자동 전환
   - **잘못된 가정**: 미팅 완료 후 단계 전환

3. **통합 스케줄 시스템 부재**
   - 여러 유형의 일정이 존재하지만 통합 관리 체계 없음
   - 빌드업 프로젝트 미팅만 단계 전환 트리거가 되어야 하는데 시스템 분리 안됨

## 🎯 **포켓비즈 실제 업무 프로세스 (Phase Transition 트리거 규칙)**

### **7단계 프로젝트 진행 체계**
```
계약중 → 계약완료 → 기획 → 설계 → 실행 → 검토 → 완료
```

### **실제 업무 플로우 기반 자동 전환 규칙**

#### **1. 계약중 → 계약완료**
- **트리거**:
  - (1) 프리미팅 예약 완료 + 견적서 전달
  - (2) 대금 지불 완료 (CRM 확인 or 포켓비즈 결제 완료)
- **의미**: 계약 성사, 프로젝트 시작 가능 상태

#### **2. 계약완료 → 기획**
- **트리거**: 가이드 1차 미팅(킥오프) 예약 완료
- **의미**: 실제 기획 작업 시작 (일정이 잡혔으니 PM이 기획 중)

#### **3. 기획 → 설계**
- **트리거**: 가이드 2차 미팅 예약 완료
- **의미**: 기획 내용 기반으로 구체적 설계 작업 진행

#### **4. 설계 → 실행**
- **트리거**: 가이드 3차 미팅 예약 완료
- **의미**: 설계 완료, 본격적인 실행/개발 단계

#### **5. 실행 → 검토**
- **트리거**: 가이드 4차 미팅 예약 완료
- **의미**: 실행 완료, 최종 검토 및 QA 단계

#### **6. 검토 → 완료**
- **트리거**: 관리자 수동 완료 처리
- **의미**: 프로젝트 최종 완료 및 인도

### **핵심 인사이트**:
> **"미팅 예약 = 해당 단계 작업 중"** 이라는 실제 업무 로직
> 미팅을 예약했다는 것은 이미 그 단계의 작업을 하고 있다는 의미

## 🏗️ **발견된 시스템 아키텍처 문제점**

### **포켓비즈 통합 스케줄 시스템 부재**

#### **현재 상황**:
- **여러 유형의 일정**: 포켓멘토, 빌드업, 웨비나, 외부미팅, PM미팅 등
- **발생 지점 다양**: 사용자 환경, 빌더 환경, 관리자 환경 등
- **통합 표시**: 빌드업 캘린더에서 모든 일정 통합 표시
- **부분 연동**: 빌드업 프로젝트 미팅만 단계 전환 트리거

#### **문제점**:
1. **데이터 소스 분산**: 각 미팅 타입별 독립 관리
2. **연동 인터페이스 부재**: 프로젝트 ↔ 스케줄 매핑 없음
3. **이벤트 시스템 없음**: 어디서 생성되든 자동 연동 불가
4. **범용 UI 부재**: 미팅 타입별 개별 모달/UI

### **필요한 핵심 컴포넌트들**

#### **1. 통합 스케줄 데이터베이스**
```typescript
interface UnifiedScheduleSystem {
  // 모든 타입 통합 관리
  scheduleTypes: {
    buildupProject: BuildupMeeting[];    // 프로젝트 단계 전환 트리거
    mentorSession: MentorSession[];      // 포켓멘토
    webinar: WebinarEvent[];             // 웨비나
    pmConsultation: PMConsultation[];    // PM 미팅
    external: ExternalMeeting[];         // 외부
    general: GeneralSchedule[];          // 기타
  };

  projectLinkage: {
    [projectId: string]: LinkedMeetings[]; // 프로젝트-미팅 연동
  };
}
```

#### **2. 범용 일정 상세 모달**
- **공통 필드**: 제목, 시간, 장소 등
- **타입별 특화**: 빌드업(프리/가이드N차, 프로젝트 이동 버튼, 미팅노트)
- **템플릿 시스템**: 새로운 미팅 타입 쉽게 추가 가능

#### **3. 이벤트 기반 자동 연동**
```typescript
// 어디서든 빌드업 미팅 생성 시 자동 트리거
eventBus.on('BUILDUP_MEETING_CREATED', (meetingData) => {
  // 1. 빌드업 캘린더 업데이트
  // 2. 프로젝트 단계 자동 전환
  // 3. 미팅 기록 추가
});
```

## 💡 **사용자 경험 개선 효과**

### **현재 (문제)**:
- PM이 미팅 완료를 수동 체크해야 함
- 단계 전환을 실시간으로 체험하기 어려움
- 미팅 기록과 프로젝트 단계가 분리됨

### **개선 후 (목표)**:
- **미팅 예약만으로 자동 단계 전환** ✨
- **즉시 체험 가능**: 미팅 생성 즉시 단계 변경 확인
- **완전 통합**: 스케줄 ↔ 프로젝트 ↔ 미팅기록 실시간 연동
- **범용 관리**: 모든 미팅 타입을 하나의 시스템에서 관리

## 🚨 **프로젝트 스코프 재정의**

### **기존 계획**: Phase Transition 기능 구현
### **실제 필요**: 포켓비즈 전체 스케줄 시스템 아키텍처 구축

이는 **6-8주 규모의 대형 아키텍처 재설계 프로젝트**입니다.

---

## 🗂️ **전면 아키텍처 재설계 마스터 플랜**

### **🎯 Phase 1: 통합 스케줄 시스템 아키텍처 (2-3주)**

#### **목표**: 포켓비즈 전체 스케줄 관리의 기반 구조 구축

#### **1.1 통합 스케줄 데이터 모델 설계**
```typescript
// 모든 스케줄 타입을 통합하는 중앙 시스템
interface PocketBizScheduleSystem {
  scheduleTypes: {
    buildupProject: BuildupProjectMeeting[];  // 단계 전환 트리거
    mentorSession: MentorSession[];           // 포켓멘토 강의/캠프
    webinar: WebinarEvent[];                  // 포켓웨비나
    pmConsultation: PMConsultation[];         // PM 미팅 (구독/신청)
    external: ExternalMeeting[];              // 외부미팅
    general: GeneralSchedule[];               // 기타 일정
  };

  projectLinkage: {
    [projectId: string]: {
      linkedMeetings: string[];               // 연결된 미팅 ID들
      meetingSequence: MeetingSequence;       // 프리→가이드1→가이드2...
      phaseTransitionRules: TransitionRule[]; // 자동 전환 규칙
    };
  };

  eventBus: ScheduleEventBus;                 // 이벤트 기반 연동 시스템
}
```

#### **1.2 미팅 타입별 템플릿 시스템**
- **공통 필드**: 제목, 시간, 장소, 참석자
- **타입별 특화 필드**:
  - 빌드업: 프리/가이드N차, 프로젝트ID, 단계전환여부
  - 멘토: 강의/캠프 구분, 수강생 정보
  - 웨비나: 등록자 수, 라이브 여부
  - PM: 구독/신청 구분, 상담 주제
- **확장 가능**: 새로운 미팅 타입 쉽게 추가

#### **1.3 이벤트 기반 자동 연동 시스템**
```typescript
// 어디서든 미팅 생성 시 자동 처리
eventBus.on('SCHEDULE_CREATED', (scheduleData) => {
  if (scheduleData.type === 'buildupProject') {
    // 1. 프로젝트 단계 자동 전환 실행
    phaseTransitionService.trigger(scheduleData);

    // 2. 미팅 기록에 추가
    meetingRecordsService.addRecord(scheduleData);

    // 3. 빌드업 캘린더 실시간 업데이트
    buildupCalendarService.refresh();
  }
});
```

### **⚙️ Phase 2: 핵심 컴포넌트 구현 (2-3주)**

#### **목표**: 통합 시스템의 핵심 기능 구현

#### **2.1 ScheduleContext - 중앙 집중 관리**
```typescript
interface ScheduleContextType {
  // 통합 데이터 관리
  allSchedules: UnifiedSchedule[];

  // CRUD 작업
  createSchedule: (data: NewSchedule) => Promise<Schedule>;
  updateSchedule: (id: string, updates: Partial<Schedule>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;

  // 필터링 & 검색
  getSchedulesByType: (type: ScheduleType) => Schedule[];
  getSchedulesByProject: (projectId: string) => Schedule[];
  getSchedulesByDateRange: (start: Date, end: Date) => Schedule[];

  // 프로젝트 연동 (빌드업만)
  linkScheduleToProject: (scheduleId: string, projectId: string) => void;
  triggerPhaseTransition: (projectId: string, meetingType: string) => void;
}
```

#### **2.2 UniversalScheduleModal - 범용 일정 상세 모달**
```typescript
// 모든 미팅 타입을 지원하는 범용 모달
interface UniversalScheduleModalProps {
  schedule: Schedule;
  type: ScheduleType;
  mode: 'view' | 'edit' | 'create';
  onSave: (data: ScheduleData) => void;
}

// 타입별 렌더링
<UniversalScheduleModal>
  <ScheduleHeader type={type} />                    {/* 타입별 헤더 */}
  <CommonFields />                                  {/* 공통 필드 */}
  <TypeSpecificFields type={type} />               {/* 타입별 특화 */}

  {/* 빌드업 프로젝트만 특별 섹션 */}
  {type === 'buildupProject' && (
    <>
      <MeetingSequenceDisplay />                    {/* 프리/가이드N차 */}
      <ProjectNavigationButton />                   {/* 프로젝트로 이동 */}
      <MeetingNotesSection />                       {/* 미팅 기록 노트 */}
      <PhaseTransitionInfo />                       {/* 단계 전환 정보 */}
    </>
  )}

  <TypeBasedActions type={type} />                  {/* 타입별 액션 */}
</UniversalScheduleModal>
```

#### **2.3 미팅 예약 기반 자동 단계 전환 엔진**
```typescript
// 실제 업무 프로세스 기반 트리거 규칙
const MEETING_PHASE_TRANSITION_RULES = {
  'pre_meeting': {
    from: 'contract_pending',
    to: 'contract_signed',
    trigger: 'MEETING_SCHEDULED',
    description: '프리미팅 예약 → 계약완료'
  },
  'guide_meeting_1': {
    from: 'contract_signed',
    to: 'planning',
    trigger: 'MEETING_SCHEDULED',
    description: '가이드 1차(킥오프) 예약 → 기획단계'
  },
  'guide_meeting_2': {
    from: 'planning',
    to: 'design',
    trigger: 'MEETING_SCHEDULED',
    description: '가이드 2차 예약 → 설계단계'
  },
  // ... 계속
};
```

### **🔗 Phase 3: 기존 시스템 통합 (2-3주)**

#### **목표**: 기존 컴포넌트들을 새 아키텍처에 통합

#### **3.1 BuildupCalendar 전면 리팩토링**
- **기존**: 하드코딩된 임시 이벤트 생성
- **개선**: 통합 스케줄 시스템 기반 실시간 데이터
- **추가**: 타입별 필터링, 범용 모달 연동

#### **3.2 프로젝트 상세 페이지 완전 연동**
- **미팅 기록 탭**: 실제 스케줄 데이터 연동
- **단계 전환 섹션**: 미팅 예약 기반 자동 전환
- **실시간 동기화**: 스케줄 변경 시 즉시 반영

#### **3.3 Phase Transition 시스템 재활성화**
- **이벤트 기반**: 순환 참조 문제 해결
- **미팅 트리거**: 예약 기반 자동 전환
- **실시간 테스트**: 미팅 생성 즉시 단계 변경 확인

### **🧪 Phase 4: 통합 테스트 & 최적화 (1주)**

#### **목표**: 전체 시스템 안정성 확보

#### **4.1 End-to-End 테스트**
- 미팅 생성 → 단계 전환 → UI 업데이트 전 과정
- 다양한 미팅 타입별 동작 확인
- 크로스 브라우저 호환성

#### **4.2 성능 최적화**
- 스케줄 데이터 로딩 최적화
- 실시간 업데이트 성능 개선
- 메모리 사용량 최적화

#### **4.3 문서화**
- API 문서화
- 컴포넌트 사용법 가이드
- 트러블슈팅 가이드

---

## 💰 **프로젝트 리소스 추정**

### **개발 시간**: 6-8주 (풀타임 기준)
### **복잡도**: High (전체 아키텍처 재설계)
### **리스크 요소**:
- **데이터 마이그레이션**: 기존 프로젝트 데이터 호환성
- **기능 연속성**: 기존 기능 유지하면서 점진적 마이그레이션
- **성능 영향**: 통합 시스템의 성능 최적화 필요

### **성공 지표**:
✅ **사용자 경험**: 미팅 예약만으로 즉시 단계 전환 체험
✅ **시스템 통합**: 모든 스케줄 타입 하나의 시스템에서 관리
✅ **확장성**: 새로운 미팅 타입 쉽게 추가 가능
✅ **안정성**: 기존 기능 유지하면서 새 기능 추가

---

## 📝 **기존 Iteration 21 내용 보존**

### Phase A: 기본 인프라 구축 ✅ **완료됨**
**목표**: 앱 안정성 확보 및 기본 데이터 구조 정립

#### ✅ 완료된 작업
1. **타입 정의 완료**
   - `buildup.types.ts`: 모든 phase transition 관련 타입 정의
   - `phaseTransition.types.ts`: 별도 타입 파일 생성 (백업용)

2. **서비스 스켈레톤 생성**
   - `phaseTransitionService.ts`: 엔진 구조 완성 (임시 비활성화)
   - `integrationManager.ts`: 통합 관리자 생성
   - `phaseTransitionUtils.ts`: 유틸리티 함수들
   - `phaseTransitionRules.ts`: 규칙 정의

3. **Context 준비**
   - BuildupContext: Phase transition 함수 stub 구현
   - CalendarContext: 미팅 완료 핸들러 준비

#### ⚠️ 현재 상태
- **Phase Transition 시스템**: 임시 비활성화
- **앱 실행 상태**: 정상 작동 ✅
- **데이터 구조**: 완성됨

### Phase B: UI/UX 기능 완성 ✅ **완료됨**
**목표**: 사용자가 볼 수 있는 기능들 먼저 구현

#### ✅ 완료된 작업

##### B-1: 캘린더 미팅 관리 UI ✅
1. **MeetingCompletionModal 컴포넌트 생성**
   - 미팅 완료 처리를 위한 상세 폼
   - 참석자 확인, 미팅 만족도, 주요 논의사항
   - 미팅 성과 및 다음 단계 액션 아이템 관리
   - `src/components/calendar/MeetingCompletionModal.tsx`

2. **BuildupCalendarV3 통합**
   - 미팅 완료 버튼 UI 활성화
   - 모달 연동 및 데이터 처리
   - Toast 알림 시스템 통합

3. **Toast 알림 시스템**
   - `src/components/ui/Toast.tsx` 생성
   - 성공/에러/경고/정보 타입 지원
   - 애니메이션 및 자동 닫기 기능

##### B-2: 프로젝트 단계 관리 UI ✅
1. **ProjectPhaseIndicator 컴포넌트 생성**
   - 현재 단계와 진행률 시각적 표시
   - 6단계 프로그레스 바 및 다음 단계 정보
   - Compact/Full 모드 지원
   - `src/components/project/ProjectPhaseIndicator.tsx`

2. **PhaseTransitionModal 컴포넌트 생성**
   - 관리자용 수동 단계 전환 기능
   - 단계별 요구사항 표시 및 경고 시스템
   - 변경 사유 필수 입력 및 감사 추적
   - `src/components/project/PhaseTransitionModal.tsx`

3. **PhaseHistoryDisplay 컴포넌트 생성**
   - 단계 변경 이력을 타임라인 형식으로 표시
   - Compact (최근 3개) / Full (전체 이력) 모드
   - 변경 사유 및 담당자 정보 표시
   - `src/components/project/PhaseHistoryDisplay.tsx`

4. **ProjectManagement 페이지 통합**
   - 프로젝트 카드에 "단계 변경" 버튼 추가
   - PhaseTransitionModal 연동
   - 단계 변경 핸들러 및 이력 관리

5. **ProjectDetail 페이지 통합**
   - 사이드바에 ProjectPhaseIndicator 배치
   - 사이드바에 간단한 PhaseHistoryDisplay (compact)
   - "단계 이력" 탭 추가로 전체 이력 확인 가능

#### 🎯 구현된 핵심 기능
- **단계 시각화**: 현재 단계와 진행률을 직관적으로 표시
- **수동 단계 전환**: 관리자가 필요시 단계를 수동으로 변경 가능
- **이력 추적**: 모든 단계 변경 기록과 사유를 추적
- **경고 시스템**: 단계 되돌리기, 건너뛰기 시 경고 및 확인
- **감사 추적**: 변경자, 시간, 사유 등 완전한 감사 로그

### Phase C: 통합 연동 (최종 단계)
**목표**: Phase Transition 시스템 재활성화 및 통합

#### 📝 구현 방법
1. **모듈 격리**
   ```typescript
   // phaseTransition.module.ts
   export class PhaseTransitionModule {
     private static instance: PhaseTransitionEngine;

     static async initialize() {
       // 동적 import로 순환 참조 방지
       const { PhaseTransitionEngine } = await import('./phaseTransitionService');
       this.instance = new PhaseTransitionEngine();
     }
   }
   ```

2. **지연 로딩**
   - React.lazy() 사용
   - 동적 import로 필요 시점에만 로드

3. **이벤트 버스 패턴**
   - 직접 import 대신 이벤트 기반 통신
   - 느슨한 결합 구조

## 🚦 리스크 관리

### 식별된 문제점
1. **순환 참조**: Context들이 서로를 참조하는 구조
2. **타입 의존성**: buildup.types.ts가 너무 많은 책임
3. **초기화 순서**: 서비스들의 초기화 타이밍 이슈

### 해결 방안
1. **인터페이스 분리**
   - 각 도메인별 타입 파일 분리
   - 공통 타입만 buildup.types.ts에 유지

2. **의존성 주입**
   ```typescript
   class PhaseTransitionEngine {
     constructor(
       private projectProvider: () => Project[],
       private projectUpdater: (id: string, data: any) => void
     ) {}
   }
   ```

3. **팩토리 패턴**
   - 서비스 생성을 중앙에서 관리
   - 초기화 순서 보장

## 📅 수정된 일정

### Week 1 ✅ **완료**
- ✅ 기본 인프라 구축
- ✅ UI/UX 기능 완성 (Phase B)

### Week 2 (현재 단계)
- ⏳ Phase B-3: 기본 채팅 시스템 구현
- ⏳ Phase C: Phase Transition 시스템 재활성화 시작

### Week 3
- Phase C: 통합 연동 완성
- 전체 시스템 통합 테스트

● Stage C-4: Final Integration Testing

  🧪 Stage C-4 테스트 단계

  1단계: 대시보드 Phase Transition Controls 테스트

  1. 브라우저에서 /startup/buildup/dashboard로 이동
  2. 페이지 상단에 "Phase Transition System" 섹션이 보이는지 확인
  3. "시스템 활성화" 버튼을 클릭
  4. 상태가 **"활성화됨"**으로 변경되고 초록색으로 표시되는지 확인

  2단계: 시스템 상태 확인

  1. "상태 새로고침" 버튼 클릭
  2. 시스템 상태 정보가 올바르게 표시되는지 확인:
    - ✅ 활성화됨
    - 모듈 상태: loaded
    - 엔진 사용 가능: Yes
    - 상태: 정상

  3단계: 프로젝트 목록에서 단계 표시 확인

  1. 대시보드의 프로젝트 카드들을 확인
  2. 각 프로젝트 카드에 현재 단계가 올바르게 표시되는지 확인:
    - PRJ-001: "실행" (보라색)
    - PRJ-002: "설계" (남색)
    - PRJ-003: "완료" (회색)

  4단계: Phase Transition Controls 동작 확인

  1. "시스템 비활성화" 버튼 클릭
  2. 상태가 **"비활성화됨"**으로 변경되고 회색으로 표시되는지 확인
  3. 다시 "시스템 활성화" 버튼 클릭하여 재활성화

  5단계: 프로젝트 상세 페이지 테스트 ⭐ (이전에 실패한 단계)

  1. 프로젝트 카드 중 하나를 클릭 (예: PRJ-001)
  2. 백색 화면 없이 프로젝트 상세 페이지가 정상 로딩되는지 확인
  3. Overview 탭에서 다음을 확인:
    - 프로젝트 기본 정보 표시
    - 현재 단계 섹션에 Phase Indicator가 올바르게 표시
    - 단계 진행률 바가 정상 작동

  6단계: Phase Transition UI 테스트

  1. 프로젝트 상세 페이지에서 "단계 전환" 섹션 확인
  2. 현재 단계가 올바르게 표시되는지 확인
  3. "가능한 전환" 목록이 표시되는지 확인
  4. "단계 전환" 버튼 클릭
  5. 모달이 열리고 다음을 확인:
    - 전환 가능한 단계 목록
    - 전환 사유 입력 필드

  7단계: 단계 이력 탭 테스트

  1. "단계 이력" 탭 클릭
  2. PhaseHistoryDisplay 컴포넌트가 오류 없이 렌더링되는지 확인
  3. 현재 단계가 타임라인에 올바르게 표시되는지 확인

  8단계: 수동 Phase Transition 테스트

  1. "단계 전환" 버튼 클릭
  2. 다른 단계 선택 (예: "검토")
  3. 전환 사유 입력: "테스트를 위한 수동 전환"
  4. "전환 요청" 버튼 클릭
  5. 오류 없이 처리되는지 확인

  ---
  🔍 확인 포인트

  각 단계에서 다음을 확인해주세요:
  - ❌ 콘솔에 오류가 없는지
  - ❌ 백색 화면이나 크래시가 없는지
  - ✅ UI가 올바르게 렌더링되는지
  - ✅ 버튼과 상호작용이 정상 작동하는지

  어느 단계에서 문제가 발생하면 즉시 알려주세요!

  1단계부터 차례대로 테스트해보시고, 각 단계의 결과를 알려주세요. 특히 5단계가
  이전에 실패했던 지점이므로 중요합니다.


### Week 4
- 최종 검증 및 최적화
- 문서화 완성

## 💡 교훈 (Lessons Learned)

1. **복잡한 시스템은 단계적 구현이 필수**
   - 한 번에 모든 것을 연결하려 하지 말 것
   - MVP 먼저, 그 다음 고급 기능

2. **모듈 의존성 설계의 중요성**
   - 순환 참조는 설계 단계에서 방지
   - 타입과 구현을 분리

3. **사용자 가치 우선**
   - 백엔드 로직보다 UI/UX 우선
   - 작동하는 제품이 완벽한 아키텍처보다 중요

## 🎯 다음 액션 (현재 진행 상황)

### ✅ 완료된 액션
1. **Phase A: 기본 인프라** ✅
   - 타입 정의 및 서비스 스켈레톤 완성
   - Context 준비 및 앱 안정성 확보

2. **Phase B: UI/UX 기능 완성** ✅
   - B-1: 캘린더 미팅 관리 UI 완성
   - B-2: 프로젝트 단계 관리 UI 완성
   - 모든 UI 컴포넌트 및 사용자 인터페이스 구현

### 🎯 다음 우선순위 작업

1. **Phase B-3: 기본 채팅 시스템** (선택적)
   - 메시지 전송/수신 기본 기능
   - 미팅 예약 폼 통합
   - 알림 시스템 구현

2. **Phase C: 통합 연동** (핵심)
   - Phase Transition 시스템 재활성화
   - 모듈 격리 및 지연 로딩 구현
   - 이벤트 버스 패턴 적용
   - 전체 시스템 통합 테스트

## 📝 기술 부채 관리

### 임시 조치 목록
1. `BuildupContext.tsx:748-761` - PhaseTransitionEngine 초기화 주석 처리
2. `BuildupContext.tsx:772-801` - Phase transition 함수들 stub 구현
3. `CalendarContext.tsx:45` - PhaseTransitionService import 주석 처리

### 복구 계획
- 각 임시 조치에 대한 TODO 주석 추가
- Phase C에서 체계적으로 복구
- 테스트 코드 작성 후 활성화

---

**작성일**: 2024-12-17
**최종 수정**: 2024-12-17
**상태**: Phase B 완료 ✅ (다음: Phase C 시작 준비)