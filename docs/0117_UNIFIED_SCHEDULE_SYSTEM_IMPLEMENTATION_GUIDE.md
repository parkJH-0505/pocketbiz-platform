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
> **목적**: 다음 작업자를 위한 완벽한 구현 가이드
> **예상 작업 기간**: 6-8주 (대형 아키텍처 재설계 프로젝트)
> **연관 문서**: `iteration-21-integrated-phase-transition-system-revised.md`

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

## 🔍 현재 상태 분석 (반드시 확인!)

### **기존 코드베이스 구조**

#### **1. 현재 구현된 컴포넌트들**
```
src/
├── contexts/
│   ├── BuildupContext.tsx        # 프로젝트 관리 (meetings[] 있지만 비어있음)
│   └── ChatContext.tsx            # 채팅 시스템 (프로젝트별 채팅방)
│
├── pages/startup/buildup/
│   ├── BuildupCalendar.tsx       # 캘린더 UI (임시 이벤트만 표시)
│   ├── ProjectDetail.tsx         # 프로젝트 상세 (미팅 탭 미구현)
│   └── BuildupDashboard.tsx      # 대시보드 (Phase Transition 컨트롤)
│
├── components/
│   ├── phaseTransition/          # Phase 전환 UI 컴포넌트들
│   │   └── ProjectPhaseTransition.tsx
│   └── project/
│       ├── ProjectPhaseIndicator.tsx
│       └── PhaseHistoryDisplay.tsx
│
├── hooks/
│   └── usePhaseTransition.ts     # 단계 전환 훅 (수동 전환만 구현)
│
├── core/                         # Phase Transition 엔진 (현재 비활성화)
│   ├── eventBus.ts               # 이벤트 시스템
│   ├── phaseTransitionModule.ts  # 모듈화된 엔진
│   └── index.ts
│
└── types/
    └── buildup.types.ts          # Meeting 인터페이스 정의됨
```

#### **2. 핵심 문제점들**

##### **BuildupContext.tsx**
```typescript
// 현재: meetings 배열이 있지만 비어있음
projects: Project[] = [
  {
    id: 'PRJ-001',
    meetings: [],  // ← 문제: 항상 빈 배열
    ...
  }
]

// 미팅 추가 함수 없음 ❌
// 스케줄 연동 없음 ❌
```

##### **BuildupCalendar.tsx**
```typescript
// 현재: 임시로 이벤트 생성
const allEvents: CalendarEvent[] = [];
activeProjects.forEach(project => {
  if (project.nextMeeting) {  // ← undefined, 작동 안함
    // ...
  }
});

// 실제 데이터 소스 없음 ❌
// 미팅 생성 UI 없음 ❌
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

### **🚀 Phase 1: 통합 스케줄 시스템 아키텍처 (Week 1-3)**

#### **Step 1.1: 데이터 모델 설계**

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

#### **Step 1.2: ScheduleContext 생성**

##### **새로 생성할 파일**: `src/contexts/ScheduleContext.tsx`
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

#### **Step 1.3: BuildupContext와 연동**

##### **수정할 파일**: `src/contexts/BuildupContext.tsx`
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

### **⚙️ Phase 2: 핵심 컴포넌트 구현 (Week 3-5)**

#### **Step 2.1: UniversalScheduleModal 구현**

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

#### **Step 2.2: BuildupCalendar 리팩토링**

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

### **🔗 Phase 3: 시스템 통합 (Week 5-7)**

#### **Step 3.1: 프로젝트 상세 페이지 미팅 탭 구현**

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

## ✅ 체크리스트

### **Phase 1 완료 기준**
- [ ] schedule.types.ts 파일 생성
- [ ] ScheduleContext 구현 및 테스트
- [ ] BuildupContext와 연동
- [ ] 이벤트 시스템 작동 확인

### **Phase 2 완료 기준**
- [ ] UniversalScheduleModal 구현
- [ ] 모든 미팅 타입 지원
- [ ] BuildupCalendar 리팩토링
- [ ] 실제 데이터 표시 확인

### **Phase 3 완료 기준**
- [ ] 미팅 예약 → 단계 전환 자동화
- [ ] 프로젝트 상세 미팅 탭 구현
- [ ] 전체 시스템 통합 테스트
- [ ] 사용자 경험 검증

---

## 🎯 최종 목표 확인

완성되면:
1. **즉시 체험**: 미팅 예약하자마자 단계 변경 확인 ✨
2. **완전 자동화**: PM 수동 작업 없음
3. **실시간 동기화**: 모든 화면 즉시 업데이트
4. **확장 가능**: 새 미팅 타입 쉽게 추가

**성공!** 🎉