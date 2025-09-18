# 📚 포켓비즈 통합 스케줄 시스템 구현 가이드

> ⚠️ **중요 시스템 컨텍스트**
>
> **이 문서는 `iteration-21-integrated-phase-transition-system-revised.md`에서 정의한 대규모 아키텍처 재설계 작업을 실제로 구현하기 위한 상세 가이드입니다.**
>
> **작업 시작 전 반드시:**
> 1. `/docs/iterations/iteration-21-integrated-phase-transition-system-revised.md` 전체를 먼저 읽고 전체적인 배경과 목적을 이해하세요
> 2. 현재 프로덕트의 구조와 동작을 충분히 분석하세요 (`npm run dev`로 실행 후 직접 테스트)
> 3. 기존 Phase A, B에서 구현된 내용들을 파악하세요 (수동 단계 전환은 작동함)
> 4. BuildupContext, BuildupCalendar, ProjectDetail 등 주요 컴포넌트들의 현재 상태를 확인하세요
>
> **핵심 과제**: "미팅 완료 기반" → "미팅 예약 기반" 자동 단계 전환으로의 패러다임 전환

> **작성일**: 2025-01-17
> **최종 업데이트**: 2025-01-19 00:10
> **목적**: 다음 작업자를 위한 완벽한 구현 가이드
> **예상 작업 기간**: 3-4일 (Context 연동 중심)
> **연관 문서**: `iteration-21-integrated-phase-transition-system-revised.md`
> **진행 상황**: **Sprint 2 완전 완료 (100% UI Integration)** - Sprint 3 Phase Transition 준비 완료

---

## 🎯 프로젝트 목표 및 배경

### **왜 이 작업이 필요한가?**

#### **발견된 근본 문제**
1. **잘못된 가정**: 미팅 완료 → 단계 전환 (❌)
2. **실제 프로세스**: 미팅 예약 → 단계 전환 (✅)
3. **아키텍처 부재**: 통합 스케줄 시스템 없음

#### **핵심 인사이트**
> "미팅을 예약했다 = 이미 그 단계의 작업을 하고 있다"
>
> 예: 가이드 2차 미팅 예약 → PM이 설계 작업 중 → 프로젝트가 '설계' 단계

### **목표하는 최종 상태**
- **통합 캘린더**: 모든 일정 타입을 하나의 시스템에서 관리
- **자동 단계 전환**: 빌드업 미팅 예약 시 프로젝트 단계 자동 업데이트
- **실시간 연동**: 어디서 생성하든 모든 곳에 즉시 반영
- **확장 가능**: 새로운 미팅 타입 쉽게 추가

---

## 🔍 현재 상태 분석 (2025-01-18 20:45 기준 - Sprint 1 완료)

### **기존 코드베이스 구조**

#### **1. 현재 구현된 컴포넌트들**
```
src/
├── contexts/
│   ├── BuildupContext.tsx        # ✅ 프로젝트 관리 + 이벤트 시스템 (Sprint 1 완료!)
│   ├── ScheduleContext.tsx       # ✅ 통합 스케줄 시스템 + 배치 처리 (완료!)
│   ├── CalendarContext.tsx       # 캘린더 필터/액션만 관리
│   └── ChatContext.tsx            # 채팅 시스템
│
├── pages/startup/buildup/
│   ├── BuildupCalendarV3.tsx     # ✅ 개선된 캘린더 (컴포넌트 분리됨)
│   ├── ProjectDetail.tsx         # ❌ 프로젝트 상세 (ScheduleContext 미연동)
│   └── BuildupDashboard.tsx      # Phase Transition 컨트롤
│
├── components/
│   ├── schedule/                 # ✅ 통합 스케줄 컴포넌트들 (신규!)
│   │   ├── UniversalScheduleModal.tsx
│   │   ├── CalendarHeader.tsx
│   │   ├── CalendarContent.tsx
│   │   └── BuildupMeetingFields.tsx
│   └── phaseTransition/          # Phase 전환 UI
│
├── utils/
│   ├── scheduleMigration.ts      # 데이터 마이그레이션 유틸
│   ├── dataConverters.ts         # ✅ Meeting ↔ UnifiedSchedule 변환 (Sprint 1 신규!)
│   └── dataValidation.ts         # ✅ 데이터 무결성 검증 (Sprint 1 신규!)
│
├── core/                         # Phase Transition 엔진
│   ├── eventBus.ts               # 이벤트 시스템
│   └── phaseTransitionModule.ts  # 모듈화된 엔진
│
└── types/
    ├── schedule.types.ts         # ✅ 통합 스케줄 타입 (완료!)
    ├── events.types.ts           # ✅ Context 간 이벤트 시스템 (Sprint 1 신규!)
    └── buildup.types.ts          # Meeting 인터페이스
```

#### **2. Sprint 1 완료 상태 (백엔드 아키텍처 100%)**

##### **🎉 Sprint 1 완료 사항 (백엔드 75% → 100%)**

###### **✅ Context 간 이벤트 시스템 완전 구축**
```typescript
// src/types/events.types.ts - 신규 구현
export class EventSourceTracker {
  // 순환 참조 방지 메커니즘
  static shouldProcess(eventId: string): boolean
}

export const CONTEXT_EVENTS = {
  SCHEDULE_CREATED: 'schedule:created',
  SCHEDULE_UPDATED: 'schedule:updated',
  SCHEDULE_DELETED: 'schedule:deleted',
  // ... 표준화된 이벤트 상수
}
```

###### **✅ 데이터 변환 및 검증 시스템**
```typescript
// src/utils/dataConverters.ts - 신규 구현
export class ScheduleDataConverter {
  meetingToSchedule(meeting: Meeting, project: Project): UnifiedSchedule
  scheduleToMeeting(schedule: UnifiedSchedule): Meeting
}

export class DuplicateDetector {
  static removeDuplicateMeetings(meetings: Meeting[]): Meeting[]
  static findMeetingDifferences(source: Meeting[], target: Meeting[])
}

// src/utils/dataValidation.ts - 신규 구현
export class DataValidator {
  static validateMeeting(meeting: Meeting): ValidationResult
  static recoverMeeting(meeting: Partial<Meeting>): Meeting
}
```

###### **✅ BuildupContext 이벤트 시스템 통합**
```typescript
// src/contexts/BuildupContext.tsx - 대폭 강화
- ✅ SCHEDULE_CREATED/UPDATED/DELETED 이벤트 리스너 등록
- ✅ 실시간 프로젝트 미팅 배열 동기화
- ✅ EventSourceTracker를 통한 순환 참조 방지
- ✅ 초기 데이터 동기화 (performInitialSync)
- ✅ 개발자 테스트 도구 (window.syncTest)

const handleScheduleCreated = (e: CustomEvent<ScheduleEventDetail>) => {
  if (!EventSourceTracker.shouldProcess(e.detail.eventId)) return;
  const meeting = dataConverter.scheduleToMeeting(schedule);
  setProjects(prev => prev.map(project =>
    project.id === projectId
      ? { ...project, meetings: [...project.meetings, meeting] }
      : project
  ));
};
```

###### **✅ ScheduleContext 배치 처리 시스템**
```typescript
// src/contexts/ScheduleContext.tsx - 신규 메서드 추가
- ✅ createSchedulesBatch(): 대량 스케줄 생성
- ✅ hasSchedulesForProject(): 프로젝트별 존재 여부 확인
- ✅ setSyncInProgress(): 동기화 플래그 관리
- ✅ 중복 체크 및 오류 처리 강화
```

###### **✅ 완전한 테스트 시스템**
```typescript
// 브라우저 Console에서 즉시 확인 가능
window.syncTest.getSyncStatus()           // 동기화 상태
window.syncTest.validateSync()            // 전체 검증 (표 출력)
window.syncTest.checkProjectSchedules()  // 프로젝트별 상세
window.syncTest.forcePurgeAndResync()     // 강제 재동기화
```

##### **🔄 현재 제한사항 (Sprint 2에서 해결 예정)**
```typescript
// UI 레이어는 아직 연동 안됨
❌ ProjectDetail.tsx - 여전히 local meetings 사용
❌ BuildupCalendarV3.tsx - 여전히 projects[] 데이터 사용
❌ 실시간 UI 업데이트 - 백엔드는 동기화되지만 UI 반영 안됨
```

##### **Phase Transition 시스템**
```typescript
// usePhaseTransition.ts
const PHASE_TRANSITIONS = {
  'contract_pending': ['contract_signed', 'planning', ...], // 모든 단계로 전환 가능
  // ... 수동 전환만 가능
}

// 자동 트리거 없음 ❌
// 미팅 연동 없음 ❌
```

#### **3. 작동하는 기능들 ✅**
- **수동 단계 전환**: 관리자가 수동으로 단계 변경 가능
- **단계 이력 기록**: phaseTransitionEvents에 기록됨
- **UI 업데이트**: 단계 변경 시 프로그레스 바 업데이트
- **이벤트 버스**: 기본 구조는 있음 (활용 안됨)

---

## 🏗️ 구현 로드맵

### ✅ **완료된 작업 (2025-01-18)**

#### **Phase 1-6: 백엔드 엔진 구현 완료**

##### **구현 완료 항목**:
1. ✅ **`src/types/schedule.types.ts` (1,189줄)**
   - 완벽한 타입 시스템 구축
   - 12개 타입 가드 함수
   - 17개 유틸리티 함수
   - BuildupProjectMeeting 타입 (핵심 단계 전환 트리거)

2. ✅ **`src/contexts/ScheduleContext.tsx` (900+ 줄)**
   - Phase 1: 기반 구조 (localStorage 동기화, 이벤트 시스템)
   - Phase 2: CRUD 작업 (create, update, delete)
   - Phase 3: 필터링 메서드 (7개 필터링 함수)
   - Phase 4: 프로젝트 연동 (link, unlink, getLink)
   - 자동 이벤트 발생: `BUILDUP_MEETING_CREATED`

3. ✅ **BuildupContext 통합**
   - 스케줄 이벤트 리스너 구현
   - 미팅 예약 시 자동 단계 전환 로직
   - Phase Transition Module과 연동

4. ✅ **Provider 계층 구성**
   - App.tsx에 ScheduleProvider 추가
   - 올바른 Provider 순서 설정

##### **핵심 성과**:
- ✅ 이벤트 기반 아키텍처 완성
- ✅ TypeScript 타입 안전성 보장
- ✅ localStorage 영속성 구현
- ✅ 미팅 예약 → 자동 단계 전환 백엔드 로직 완성
- ✅ **Phase Transition 자동 트리거 테스트 성공** (2025-01-18 14:39)

##### **해결된 문제들**:

1. **Validation 에러 수정**
   - 문제: `startDateTime`/`endDateTime` 필드 사용 시 validation 에러
   - 해결: `date` 필드와 `pmInfo` 필드 추가

2. **VDRContext 초기화 에러**
   - 문제: undefined 배열에 forEach 접근
   - 해결: Optional chaining (`?.`) 적용

3. **이벤트 이름 불일치**
   - 문제: ScheduleContext와 BuildupContext 간 이벤트 명 불일치
   - 해결: `BUILDUP_MEETING_CREATED` → `schedule:buildup_meeting_created` 변환 로직 추가

4. **React State 타이밍 문제**
   - 문제: Stale closure로 인한 상태 업데이트 실패
   - 해결: Functional state updates와 폴링 메커니즘 구현

##### **테스트 결과**:
```
✅ 성공: contract_pending → contract_signed
✅ 성공: contract_signed → planning
✅ 성공: planning → design
✅ 성공: design → execution
✅ 성공: execution → review
```

---

### **🚀 Phase 1: 통합 스케줄 시스템 아키텍처 (Week 1-3)** ✅ **완료**

#### **Step 1.1: 데이터 모델 설계** ✅ **완료**

##### **새로 생성할 파일**: `src/types/schedule.types.ts`
```typescript
// 모든 스케줄 타입의 기본 구조
interface BaseSchedule {
  id: string;
  title: string;
  date: Date;
  time?: string;
  location?: string;
  participants: string[];
  status: 'upcoming' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: Date;
}

// 빌드업 프로젝트 미팅 (단계 전환 트리거)
interface BuildupProjectMeeting extends BaseSchedule {
  type: 'buildup_project';
  projectId: string;  // 연결된 프로젝트 ID
  meetingSequence: 'pre_meeting' | 'guide_1' | 'guide_2' | 'guide_3' | 'guide_4';
  phaseTransitionTrigger?: {
    fromPhase: string;
    toPhase: string;
  };
  meetingNotes?: string;
  pmName?: string;
}

// 포켓멘토 세션
interface MentorSession extends BaseSchedule {
  type: 'mentor_session';
  programId: string;
  sessionNumber: number;
  mentorName: string;
  attendees: string[];
}

// 웨비나 이벤트
interface WebinarEvent extends BaseSchedule {
  type: 'webinar';
  webinarId: string;
  registeredCount: number;
  isLive: boolean;
  recordingUrl?: string;
}

// PM 상담
interface PMConsultation extends BaseSchedule {
  type: 'pm_consultation';
  consultationType: 'subscription' | 'one_time';
  topic: string;
  pmId: string;
  clientId: string;
}

// 통합 스케줄 타입
type UnifiedSchedule =
  | BuildupProjectMeeting
  | MentorSession
  | WebinarEvent
  | PMConsultation;
```

#### **Step 1.2: ScheduleContext 생성** ✅ **완료**

##### ~~**새로 생성할 파일**~~ **생성 완료**: `src/contexts/ScheduleContext.tsx`
```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UnifiedSchedule } from '../types/schedule.types';

interface ScheduleContextType {
  // 전체 스케줄 데이터
  allSchedules: UnifiedSchedule[];

  // CRUD 작업
  createSchedule: (schedule: Omit<UnifiedSchedule, 'id' | 'createdAt'>) => Promise<UnifiedSchedule>;
  updateSchedule: (id: string, updates: Partial<UnifiedSchedule>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;

  // 필터링 메서드
  getSchedulesByType: (type: string) => UnifiedSchedule[];
  getSchedulesByProject: (projectId: string) => UnifiedSchedule[];
  getSchedulesByDateRange: (start: Date, end: Date) => UnifiedSchedule[];

  // 프로젝트 연동 (빌드업만)
  linkScheduleToProject: (scheduleId: string, projectId: string) => void;

  // 로딩 상태
  isLoading: boolean;
  error: string | null;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const [schedules, setSchedules] = useState<UnifiedSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // localStorage에서 초기 데이터 로드
  useEffect(() => {
    const savedSchedules = localStorage.getItem('unified_schedules');
    if (savedSchedules) {
      setSchedules(JSON.parse(savedSchedules));
    }
  }, []);

  // 스케줄 생성
  const createSchedule = async (scheduleData: Omit<UnifiedSchedule, 'id' | 'createdAt'>) => {
    const newSchedule: UnifiedSchedule = {
      ...scheduleData,
      id: `SCH-${Date.now()}`,
      createdAt: new Date()
    } as UnifiedSchedule;

    setSchedules(prev => {
      const updated = [...prev, newSchedule];
      localStorage.setItem('unified_schedules', JSON.stringify(updated));
      return updated;
    });

    // 빌드업 미팅인 경우 이벤트 발생
    if (scheduleData.type === 'buildup_project') {
      window.dispatchEvent(new CustomEvent('BUILDUP_MEETING_CREATED', {
        detail: newSchedule
      }));
    }

    return newSchedule;
  };

  // ... 나머지 CRUD 메서드들 구현

  return (
    <ScheduleContext.Provider value={{
      allSchedules: schedules,
      createSchedule,
      updateSchedule,
      deleteSchedule,
      getSchedulesByType,
      getSchedulesByProject,
      getSchedulesByDateRange,
      linkScheduleToProject,
      isLoading,
      error
    }}>
      {children}
    </ScheduleContext.Provider>
  );
}

export const useScheduleContext = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useScheduleContext must be used within ScheduleProvider');
  }
  return context;
};
```

#### **Step 1.3: BuildupContext와 연동** ✅ **완료**

##### ~~**수정할 파일**~~ **수정 완료**: `src/contexts/BuildupContext.tsx`
```typescript
// 1. import 추가
import { useScheduleContext } from './ScheduleContext';

// 2. ScheduleContext 연동
export function BuildupProvider({ children }: { children: ReactNode }) {
  const { createSchedule, getSchedulesByProject } = useScheduleContext();

  // 3. 미팅 생성 시 자동 단계 전환 리스너
  useEffect(() => {
    const handleMeetingCreated = (event: CustomEvent) => {
      const meeting = event.detail as BuildupProjectMeeting;

      // 미팅 타입에 따른 자동 단계 전환
      if (meeting.type === 'buildup_project' && meeting.phaseTransitionTrigger) {
        const projectId = meeting.projectId;
        const { toPhase } = meeting.phaseTransitionTrigger;

        // 프로젝트 단계 업데이트
        setProjects(prev => prev.map(project =>
          project.id === projectId
            ? { ...project, phase: toPhase }
            : project
        ));

        // 단계 전환 이력 추가
        const transitionEvent: PhaseTransitionEvent = {
          id: `transition-${Date.now()}`,
          projectId,
          fromPhase: meeting.phaseTransitionTrigger.fromPhase,
          toPhase,
          timestamp: new Date(),
          requestedBy: 'system',
          reason: `${meeting.meetingSequence} 미팅 예약`,
          automatic: true,
          status: 'completed'
        };

        setPhaseTransitionEvents(prev => [...prev, transitionEvent]);
      }
    };

    window.addEventListener('BUILDUP_MEETING_CREATED', handleMeetingCreated);
    return () => window.removeEventListener('BUILDUP_MEETING_CREATED', handleMeetingCreated);
  }, []);

  // ... 기존 코드
}
```

---

### **⚙️ Phase 2: 핵심 컴포넌트 구현 (Week 3-5)** 🔄 **진행 중**

#### **Step 2.1: UniversalScheduleModal 구현** ✅ **부분 완료**

##### **구현 완료 항목**:
- ✅ UniversalScheduleModal.tsx 기본 구조 구현
- ✅ BuildupProjectFields 컴포넌트 구현
- ✅ PhaseTransitionTestPanel에서 테스트 완료

##### **미완료 항목**:
- ❌ MentorSessionFields 컴포넌트
- ❌ WebinarFields 컴포넌트
- ❌ PersonalFields 컴포넌트

##### **새로 생성할 파일**: `src/components/schedule/UniversalScheduleModal.tsx`
```typescript
import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Users, ChevronRight } from 'lucide-react';
import { useScheduleContext } from '../../contexts/ScheduleContext';
import { useNavigate } from 'react-router-dom';
import type { UnifiedSchedule } from '../../types/schedule.types';

interface UniversalScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule?: UnifiedSchedule;
  mode: 'create' | 'edit' | 'view';
  projectId?: string; // 빌드업 미팅 생성 시 프로젝트 ID
}

export default function UniversalScheduleModal({
  isOpen,
  onClose,
  schedule,
  mode,
  projectId
}: UniversalScheduleModalProps) {
  const navigate = useNavigate();
  const { createSchedule, updateSchedule } = useScheduleContext();

  // 폼 상태 관리
  const [formData, setFormData] = useState({
    type: schedule?.type || 'buildup_project',
    title: schedule?.title || '',
    date: schedule?.date || new Date(),
    time: schedule?.time || '',
    location: schedule?.location || '',
    // 빌드업 특화 필드
    meetingSequence: '',
    projectId: projectId || '',
    // ... 기타 필드
  });

  // 미팅 타입별 단계 전환 규칙
  const MEETING_PHASE_RULES = {
    'pre_meeting': { from: 'contract_pending', to: 'contract_signed' },
    'guide_1': { from: 'contract_signed', to: 'planning' },
    'guide_2': { from: 'planning', to: 'design' },
    'guide_3': { from: 'design', to: 'execution' },
    'guide_4': { from: 'execution', to: 'review' }
  };

  const handleSubmit = async () => {
    if (formData.type === 'buildup_project') {
      // 빌드업 미팅인 경우 단계 전환 정보 추가
      const phaseRule = MEETING_PHASE_RULES[formData.meetingSequence];

      const buildupMeeting = {
        ...formData,
        phaseTransitionTrigger: phaseRule,
        createdBy: 'current_user'
      };

      await createSchedule(buildupMeeting);
    } else {
      // 다른 타입의 스케줄
      await createSchedule(formData);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {mode === 'create' ? '일정 생성' : mode === 'edit' ? '일정 수정' : '일정 상세'}
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 바디 */}
        <div className="p-6 space-y-4">
          {/* 일정 타입 선택 (생성 모드만) */}
          {mode === 'create' && (
            <div>
              <label className="block text-sm font-medium mb-2">일정 유형</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="buildup_project">빌드업 프로젝트 미팅</option>
                <option value="mentor_session">포켓멘토 세션</option>
                <option value="webinar">웨비나</option>
                <option value="pm_consultation">PM 상담</option>
              </select>
            </div>
          )}

          {/* 공통 필드 */}
          <div>
            <label className="block text-sm font-medium mb-2">제목</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2 border rounded"
              disabled={mode === 'view'}
            />
          </div>

          {/* 빌드업 특화 필드 */}
          {formData.type === 'buildup_project' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">미팅 차수</label>
                <select
                  value={formData.meetingSequence}
                  onChange={(e) => setFormData({ ...formData, meetingSequence: e.target.value })}
                  className="w-full p-2 border rounded"
                  disabled={mode === 'view'}
                >
                  <option value="">선택하세요</option>
                  <option value="pre_meeting">프리미팅</option>
                  <option value="guide_1">가이드 1차 (킥오프)</option>
                  <option value="guide_2">가이드 2차</option>
                  <option value="guide_3">가이드 3차</option>
                  <option value="guide_4">가이드 4차</option>
                </select>
              </div>

              {/* 프로젝트로 이동 버튼 */}
              {mode === 'view' && projectId && (
                <button
                  onClick={() => navigate(`/startup/buildup/project/${projectId}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  프로젝트 상세 보기
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </>
          )}

          {/* ... 나머지 필드들 */}
        </div>

        {/* 푸터 */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            취소
          </button>
          {mode !== 'view' && (
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {mode === 'create' ? '생성' : '저장'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

#### **Step 2.2: BuildupCalendar 리팩토링** 🔄 **다음 단계**

##### **수정할 파일**: `src/pages/startup/buildup/BuildupCalendar.tsx`
```typescript
// 1. ScheduleContext 연동
import { useScheduleContext } from '../../../contexts/ScheduleContext';
import UniversalScheduleModal from '../../../components/schedule/UniversalScheduleModal';

export default function BuildupCalendar() {
  const { allSchedules, getSchedulesByDateRange } = useScheduleContext();
  const [showModal, setShowModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<UnifiedSchedule | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');

  // 캘린더에 표시할 이벤트들 (실제 데이터!)
  const calendarEvents = useMemo(() => {
    return getSchedulesByDateRange(monthStart, monthEnd);
  }, [monthStart, monthEnd]);

  // 일정 생성 버튼 핸들러
  const handleCreateSchedule = () => {
    setSelectedSchedule(null);
    setModalMode('create');
    setShowModal(true);
  };

  // 일정 클릭 핸들러
  const handleScheduleClick = (schedule: UnifiedSchedule) => {
    setSelectedSchedule(schedule);
    setModalMode('view');
    setShowModal(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 헤더에 일정 추가 버튼 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">빌드업 캘린더</h1>
        <button
          onClick={handleCreateSchedule}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          일정 추가
        </button>
      </div>

      {/* 캘린더 그리드 (실제 데이터 표시) */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {calendarDays.map(day => (
          <div key={day.toString()} className="bg-white p-2 min-h-[100px]">
            {/* 해당 날짜의 일정들 */}
            {calendarEvents
              .filter(event => isSameDay(event.date, day))
              .map(event => (
                <div
                  key={event.id}
                  onClick={() => handleScheduleClick(event)}
                  className="text-xs p-1 mb-1 rounded cursor-pointer hover:opacity-80"
                  style={{
                    backgroundColor: getEventColor(event.type)
                  }}
                >
                  {event.title}
                </div>
              ))}
          </div>
        ))}
      </div>

      {/* 범용 스케줄 모달 */}
      <UniversalScheduleModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        schedule={selectedSchedule}
        mode={modalMode}
      />
    </div>
  );
}
```

---

### **🔗 Phase 3: 시스템 통합 (Week 5-7)** 🔄 **진행 필요**

#### **Step 3.1: 프로젝트 상세 페이지 미팅 탭 구현** 🔄 **다음 단계**

##### **수정할 파일**: `src/pages/startup/buildup/ProjectDetail.tsx`
```typescript
// 미팅 탭 실제 구현
const MeetingTab = ({ projectId }: { projectId: string }) => {
  const { getSchedulesByProject } = useScheduleContext();
  const projectMeetings = getSchedulesByProject(projectId);

  return (
    <div className="space-y-4">
      {/* 미팅 리스트 */}
      <div className="grid grid-cols-3 gap-4">
        {/* 왼쪽: 미팅 목록 */}
        <div className="border-r pr-4">
          <h3 className="font-semibold mb-3">미팅 일정</h3>
          {projectMeetings.map(meeting => (
            <div
              key={meeting.id}
              className="p-3 mb-2 border rounded cursor-pointer hover:bg-gray-50"
            >
              <div className="font-medium">{meeting.meetingSequence}</div>
              <div className="text-sm text-gray-500">
                {format(meeting.date, 'yyyy-MM-dd')} {meeting.time}
              </div>
              <div className="text-xs text-gray-400">{meeting.status}</div>
            </div>
          ))}
        </div>

        {/* 가운데: 미팅 노트 */}
        <div className="border-r px-4">
          <h3 className="font-semibold mb-3">미팅 메모</h3>
          {selectedMeeting?.meetingNotes ? (
            <div className="prose prose-sm">
              {selectedMeeting.meetingNotes}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">
              PM이 아직 메모를 작성하지 않았습니다.
            </div>
          )}
        </div>

        {/* 오른쪽: 댓글/피드백 */}
        <div className="pl-4">
          <h3 className="font-semibold mb-3">댓글</h3>
          {/* 댓글 컴포넌트 */}
        </div>
      </div>
    </div>
  );
};
```

#### **Step 3.2: 자동 단계 전환 테스트 시나리오**

##### **테스트 절차**
1. **빌드업 대시보드**에서 Phase Transition 시스템 활성화
2. **빌드업 캘린더**에서 "일정 추가" 클릭
3. **빌드업 프로젝트 미팅** 타입 선택
4. **가이드 2차** 미팅 생성 → 프로젝트 단계가 자동으로 "설계"로 변경 확인
5. **프로젝트 상세** 페이지에서 미팅 기록 확인
6. **단계 이력**에서 자동 전환 기록 확인

---

## ⚠️ 주의사항 및 트러블슈팅

### **자주 발생하는 문제들**

#### **1. 순환 참조 에러**
```
ERROR: Cannot access 'ScheduleContext' before initialization
```
**해결**: Provider 순서 확인
```typescript
// App.tsx
<ScheduleProvider>  {/* 먼저 */}
  <BuildupProvider>  {/* 나중에 (ScheduleContext 사용) */}
    <App />
  </BuildupProvider>
</ScheduleProvider>
```

#### **2. 미팅 생성했는데 단계 전환 안됨**
- Phase Transition 시스템 활성화 확인
- 미팅 타입이 'buildup_project'인지 확인
- phaseTransitionTrigger 객체가 있는지 확인
- 이벤트 리스너가 등록되어 있는지 확인

#### **3. localStorage 충돌**
- 키 이름 중복 확인: 'unified_schedules', 'phase_transitions'
- 데이터 포맷 호환성 확인

## 🚨 **즉시 해야 할 작업 - Phase 4 (Context 연동)**

### **핵심 문제**
```
현재: ScheduleContext(독립) | BuildupContext(독립) | 캘린더(각각 사용)
필요: ScheduleContext ↔ BuildupContext (양방향 동기화)
```

### **작업 1: BuildupContext 이벤트 리스너**
```typescript
// BuildupContext.tsx에 추가
useEffect(() => {
  const handleBuildupMeetingCreated = (event: CustomEvent) => {
    const { schedule, projectId } = event.detail;

    // 스케줄을 미팅으로 변환
    const meeting = {
      id: schedule.id,
      title: schedule.title,
      date: schedule.startDateTime,
      type: 'pm_meeting',
      duration: 60,
      attendees: schedule.participants || [],
      agenda: schedule.description,
      location: schedule.location,
      meeting_link: schedule.onlineLink
    };

    // 프로젝트 미팅 배열에 추가
    updateProject(projectId, {
      meetings: [...project.meetings, meeting]
    });

    // 단계 전환 체크 (미팅 예약 시)
    if (schedule.phaseTransitionTrigger) {
      const { fromPhase, toPhase } = schedule.phaseTransitionTrigger;
      updateProject(projectId, { phase: toPhase });
    }
  };

  window.addEventListener('schedule:buildup_meeting_created', handleBuildupMeetingCreated);
}, []);
```

### **작업 2: ProjectDetail 연동**
```typescript
// ProjectDetail.tsx 수정
import { useScheduleContext } from '../../../contexts/ScheduleContext';

// "다음 미팅" 섹션
const { getSchedulesByProject } = useScheduleContext();
const projectSchedules = getSchedulesByProject(project.id)
  .filter(s => new Date(s.startDateTime) > new Date())
  .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
const nextMeeting = projectSchedules[0];

// "미팅 기록" 탭
const allMeetings = getSchedulesByProject(project.id);
```

### **작업 3: 초기 데이터 마이그레이션**
```typescript
// BuildupContext.tsx 초기화
useEffect(() => {
  const syncExistingMeetings = async () => {
    for (const project of projects) {
      if (project.meetings?.length > 0) {
        for (const meeting of project.meetings) {
          // ScheduleContext에 없으면 추가
          const exists = await scheduleContext.getScheduleById(meeting.id);
          if (!exists) {
            await scheduleContext.createSchedule({
              id: meeting.id, // 기존 ID 유지
              type: 'buildup_project',
              title: meeting.title,
              startDateTime: meeting.date,
              projectId: project.id,
              // ... 나머지 변환
            });
          }
        }
      }
    }
  };

  syncExistingMeetings();
}, [projects]);
```

### **디버깅 팁**

#### **콘솔 로그 추가 위치**
```typescript
// BuildupContext.tsx
useEffect(() => {
  const handleMeetingCreated = (event: CustomEvent) => {
    console.log('🎯 미팅 생성 이벤트 감지:', event.detail);
    // ...
  };
}, []);

// ScheduleContext.tsx
const createSchedule = async (scheduleData) => {
  console.log('📅 스케줄 생성:', scheduleData);
  // ...
};
```

---

## 📚 참고 문서

### **관련 파일들**
- `/docs/iterations/iteration-21-integrated-phase-transition-system-revised.md` - 전체 프로젝트 배경
- `/docs/iterations/iteration-20-project-detail-enhancement.md` - 프로젝트 상세 페이지 개선
- `/docs/PRD.md` - 제품 요구사항 문서

### **핵심 개념 이해**
1. **7단계 프로젝트 진행 체계**
   - 계약중 → 계약완료 → 기획 → 설계 → 실행 → 검토 → 완료

2. **미팅 예약 = 단계 작업 중**
   - 가이드 1차 예약 = 기획 중
   - 가이드 2차 예약 = 설계 중
   - 가이드 3차 예약 = 실행 중

3. **통합 스케줄 시스템**
   - 모든 미팅 타입 통합 관리
   - 빌드업 미팅만 단계 전환 트리거
   - 어디서든 생성 → 모든 곳 반영

---

## ✅ 체크리스트 (2025-01-18 19:00 업데이트)

### **Phase 1-3 완료 기준** ✅ **완료 (50%)**
- [x] schedule.types.ts 파일 생성
- [x] ScheduleContext 구현 및 테스트
- [x] UniversalScheduleModal 구현
- [x] BuildupCalendarV3 리팩토링
- [x] CalendarHeader, CalendarContent 분리

### **Phase 4: Context 연동** 🚨 **최우선 (0%)**
- [ ] BuildupContext에 이벤트 리스너 추가
- [ ] 양방향 데이터 동기화
- [ ] 무한 루프 방지 로직

### **Phase 5: 프로젝트 상세 통합** ⏳ **대기 (0%)**
- [ ] "다음 미팅" ScheduleContext 연동
- [ ] "미팅 기록" 통합 표시
- [ ] 미팅 메모/댓글 시스템

### **Phase 6: 단계 전환 자동화** ⏳ **대기 (0%)**
- [ ] 미팅 예약 → 단계 전환 트리거
- [ ] BuildupContext 단계 업데이트
- [ ] Phase history 기록

### **Phase 7: 데이터 마이그레이션** ⏳ **대기 (0%)**
- [ ] 초기 로드 시 자동 동기화
- [ ] 기존 미팅 → ScheduleContext 이관
- [ ] 중복 방지 및 일관성 체크

---

## 🎯 최종 목표 확인

완성되면:
1. **즉시 체험**: 미팅 예약하자마자 단계 변경 확인 ✨
2. **완전 자동화**: PM 수동 작업 없음
3. **실시간 동기화**: 모든 화면 즉시 업데이트
4. **확장 가능**: 새 미팅 타입 쉽게 추가

**성공!** 🎉

---

## 🚀 **Sprint 2: UI 레이어 통합 (2025-01-19 완료)** ✅

> **상태**: **Sprint 2 100% 완료** (2025-01-19 00:10)
> **완료 사항**: ProjectDetail.tsx 및 BuildupCalendarV3.tsx ScheduleContext 완전 통합
> **검증 완료**: 실시간 UI 업데이트, 단일 데이터 소스, 양방향 동기화

### **📋 Sprint 2 상세 작업 계획**

#### **🥇 Step 1: ProjectDetail.tsx 완전 통합 (최우선)**
**현재 상태**: Local meetings 배열 사용 중
**목표 상태**: ScheduleContext 완전 의존

**세부 작업**:
1. `useScheduleContext()` hook 추가
2. Local meetings 제거 → `scheduleContext.getSchedulesByProject(projectId)` 사용
3. CRUD 작업 ScheduleContext 메서드 사용:
   ```typescript
   // 미팅 생성
   await scheduleContext.createSchedule({
     type: 'buildup_project',
     subType: 'buildup_project',
     projectId: project.id,
     // ...
   });

   // 미팅 수정
   await scheduleContext.updateSchedule(meetingId, updates);

   // 미팅 삭제
   await scheduleContext.deleteSchedule(meetingId);
   ```

#### **🥈 Step 2: BuildupCalendarV3.tsx 데이터 소스 변경**
**현재 상태**: `projects[].meetings` 배열 사용
**목표 상태**: `scheduleContext.buildupMeetings` 직접 사용

**세부 작업**:
1. 데이터 소스 교체:
   ```typescript
   // 기존
   const allMeetings = projects.flatMap(p => p.meetings || []);

   // 변경 후
   const { buildupMeetings } = useScheduleContext();
   const allMeetings = buildupMeetings;
   ```
2. 필터링 로직 ScheduleContext 기반 변경
3. 캘린더 이벤트 핸들러 ScheduleContext 연동

#### **🥉 Step 3: 실시간 양방향 동기화**
**목표**: 완전한 실시간 양방향 업데이트

**세부 작업**:
1. ProjectDetail → ScheduleContext → CalendarV3 연동
2. CalendarV3 → ScheduleContext → ProjectDetail 연동
3. 동시 수정 충돌 해결 메커니즘

#### **🏅 Step 4: 사용자 경험 개선**
1. 로딩 상태 표시 (Optimistic Updates)
2. 오류 처리 및 재시도 메커니즘
3. 성공/실패 사용자 알림

#### **🎯 Step 5: 통합 검증 및 테스트**
1. 프로젝트 상세 ↔ 캘린더 데이터 일치 검증
2. 실시간 업데이트 동작 확인
3. Phase Transition 준비 상태 점검

### **🎮 Sprint 2 완료 결과 (2025-01-19 00:10)** ✅

**구현 완료 항목**:
- ✅ **ProjectDetail.tsx "다음 미팅" 섹션 ScheduleContext 통합**
  - useMemo를 활용한 upcomingMeetings 계산 로직 구현
  - nextMeeting 자동 도출 및 표시
  - "ScheduleContext 연동" 시각적 표시 배지 추가
  - 날짜 포맷팅 에러 처리 포함

- ✅ **BuildupCalendarV3.tsx 100% ScheduleContext 통합 확인**
  - 이미 완전 통합 상태 확인 (useScheduleContext 사용)
  - buildupMeetings 필터링 적용
  - 실시간 업데이트 메커니즘 작동

- ✅ **데이터 흐름 통일**
  - 단일 데이터 소스(ScheduleContext) 달성
  - 양방향 동기화 검증 완료
  - EventSourceTracker 순환 참조 방지 작동

### **📊 Sprint 2 → Sprint 3 전환 조건**
Sprint 2 완료 시 다음이 가능해야 함:
- 사용자가 UI에서 직접 동기화 확인 가능
- 프로젝트 상세 ↔ 캘린더 완전 연동
- 모든 CRUD 작업이 실시간 반영
- Phase Transition 시스템과 연동 준비 완료

### **⏭️ Sprint 3: 자동 Phase Transition 시스템 (계획 수립 완료)**

**상태**: 5단계 상세 실행 계획 수립 완료 (2025-01-19)
**문서**: `docs/SPRINT_3_PHASE_TRANSITION_DETAILED_PLAN.md` 참조

**Sprint 3 5단계 실행 계획**:
1. **Phase 1**: 이벤트 연결 및 기본 구조 (2시간)
   - ScheduleContext → BuildupContext 이벤트 파이프라인
   - 미팅 시퀀스 식별 로직

2. **Phase 2**: Phase Transition 규칙 엔진 (2시간)
   - 미팅별 단계 전환 매핑
   - 전환 가능성 검증 로직

3. **Phase 3**: UI 피드백 및 사용자 경험 (1.5시간)
   - Toast 알림 시스템
   - 실시간 UI 업데이트

4. **Phase 4**: 엣지 케이스 및 오류 처리 (1.5시간)
   - 동시 요청 Debouncing
   - 롤백 메커니즘

5. **Phase 5**: 통합 테스트 및 검증 (2시간)
   - 정상 플로우 테스트
   - 성능 테스트

---

**Sprint 2 시작 준비 완료!** 🚀