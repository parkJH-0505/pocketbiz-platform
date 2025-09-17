# 📅 포켓빌드업 캘린더 데이터 구조 정의

## 1. 핵심 데이터 구조

### CalendarEvent (기본 일정)
```typescript
{
  // === 필수 필드 ===
  id: string;                    // 고유 ID (event-xxxxx)
  title: string;                 // 일정 제목
  type: 'meeting';               // 모든 일정은 meeting 타입
  date: Date;                    // 날짜
  projectId: string;             // 연결된 프로젝트 ID
  projectTitle: string;          // 프로젝트 이름
  status: 'scheduled' | 'completed' | 'cancelled';  // 상태

  // === 선택 필드 (있으면 좋은 것) ===
  time?: string;                 // 시작 시간 (HH:mm)
  duration?: number;             // 소요 시간(분)
  priority: 'high' | 'medium' | 'low';  // 중요도

  // === PM 정보 ===
  pmId: string;                  // PM 고유 ID
  pmName: string;                // PM 이름

  // === 미팅 상세 정보 ===
  meetingData: EnhancedMeetingData;  // 미팅 타입별 상세 데이터
}
```

### EnhancedMeetingData (미팅 상세)
```typescript
{
  // === 공통 필수 ===
  meetingType: MeetingType;      // 5가지 타입 중 하나
  title: string;                 // 미팅 제목
  날짜: Date;                    // 미팅 날짜
  시작시간: string;              // HH:mm
  status: 'scheduled' | 'completed' | 'cancelled';

  // === 선택 (있으면 좋은 것) ===
  종료시간?: string;             // HH:mm
  location?: 'online' | 'offline';
  meetingLink?: string;          // 온라인 미팅 링크

  // === 타입별 전용 데이터 ===
  pmMeetingData?: {              // PM 미팅인 경우
    담당PM: string;
    세션회차: number;
    아젠다: string;
  };

  buildupProjectData?: {         // 프로젝트 미팅인 경우
    프로젝트명: string;
    미팅목적: 'kickoff' | 'progress' | 'review' | 'closing';
    PM명: string;
    아젠다: string;
  };

  // 다른 타입들은 필요시 추가
}
```

## 2. 데이터 저장 구조 (Backend)

### meetings 테이블 (PostgreSQL)
```sql
CREATE TABLE meetings (
  -- 기본 정보
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  meeting_date DATE NOT NULL,
  start_time TIME,
  duration_minutes INTEGER DEFAULT 60,

  -- 연결 정보
  project_id UUID REFERENCES projects(id),
  pm_id UUID REFERENCES users(id),

  -- 상태
  status VARCHAR(20) DEFAULT 'scheduled',
  priority VARCHAR(10) DEFAULT 'medium',

  -- 미팅 타입
  meeting_type VARCHAR(30) NOT NULL,  -- 'pm_meeting', 'buildup_project', etc

  -- 장소 정보
  location_type VARCHAR(20),  -- 'online', 'offline'
  meeting_link TEXT,

  -- JSON으로 저장할 타입별 상세 데이터
  meeting_details JSONB,

  -- 메타데이터
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- 인덱스
CREATE INDEX idx_meetings_date ON meetings(meeting_date);
CREATE INDEX idx_meetings_project ON meetings(project_id);
CREATE INDEX idx_meetings_pm ON meetings(pm_id);
CREATE INDEX idx_meetings_type ON meetings(meeting_type);
```

### meeting_details JSONB 구조 예시
```json
{
  // PM 미팅 예시
  "type": "pm_meeting",
  "data": {
    "담당PM": "김철수",
    "PM직함": "Senior PM",
    "세션회차": 3,
    "아젠다": "3주차 진행상황 점검",
    "미팅노트": "..."
  }
}

{
  // 프로젝트 미팅 예시
  "type": "buildup_project",
  "data": {
    "프로젝트명": "AI 스타트업 플랫폼",
    "프로젝트ID": "proj_123",
    "미팅목적": "kickoff",
    "PM명": "이영희",
    "참여자목록": ["김대표", "박CTO"],
    "아젠다": "프로젝트 킥오프 및 목표 설정"
  }
}
```

## 3. API 응답 구조

### GET /api/meetings
```json
{
  "success": true,
  "data": [
    {
      "id": "evt-001",
      "title": "주간 PM 미팅",
      "type": "meeting",
      "date": "2024-01-20",
      "time": "14:00",
      "duration": 60,
      "projectId": "proj-123",
      "projectTitle": "AI 스타트업 플랫폼",
      "pmId": "pm-001",
      "pmName": "김철수",
      "status": "scheduled",
      "priority": "high",
      "meetingData": {
        "meetingType": "pm_meeting",
        "title": "주간 PM 미팅",
        "날짜": "2024-01-20",
        "시작시간": "14:00",
        "종료시간": "15:00",
        "location": "online",
        "meetingLink": "https://zoom.us/j/xxxxx",
        "status": "scheduled",
        "pmMeetingData": {
          "담당PM": "김철수",
          "세션회차": 3,
          "아젠다": "3주차 진행상황 점검"
        }
      }
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 10
}
```

### POST /api/meetings
```json
{
  "title": "프로젝트 킥오프 미팅",
  "date": "2024-01-25",
  "time": "10:00",
  "duration": 90,
  "projectId": "proj-123",
  "priority": "high",
  "meetingData": {
    "meetingType": "buildup_project",
    "location": "online",
    "meetingLink": "https://meet.google.com/xxx",
    "buildupProjectData": {
      "미팅목적": "kickoff",
      "아젠다": "프로젝트 목표 설정 및 일정 협의"
    }
  }
}
```

## 4. 최소 필수 필드 (MVP)

캘린더가 동작하기 위한 최소 필드:

1. **id**: 고유 식별자
2. **title**: 표시할 제목
3. **date**: 날짜
4. **projectId**: 프로젝트 연결
5. **meetingType**: 5가지 타입 구분
6. **status**: 상태 (예정/완료/취소)

## 5. 향후 확장 가능 필드

나중에 필요시 추가할 수 있는 필드:

- 참여자 목록 (participants)
- 알림 설정 (reminders)
- 반복 일정 (recurring)
- 첨부 파일 (attachments)
- 미팅 녹화 (recording)
- 액션 아이템 (actionItems)
- 피드백 (feedback)

## 6. 색상 및 아이콘 매핑

```typescript
const MEETING_TYPE_STYLES = {
  pm_meeting: {
    color: 'bg-primary-main',      // 파란색
    icon: 'Users',
    label: 'PM 정기미팅'
  },
  pocket_mentor: {
    color: 'bg-accent-purple',     // 보라색
    icon: 'GraduationCap',
    label: '포켓멘토 세션'
  },
  buildup_project: {
    color: 'bg-secondary-main',    // 초록색
    icon: 'Briefcase',
    label: '프로젝트 미팅'
  },
  pocket_webinar: {
    color: 'bg-accent-orange',     // 주황색
    icon: 'Presentation',
    label: '포켓 웨비나'
  },
  external: {
    color: 'bg-neutral-light',     // 회색
    icon: 'Building',
    label: '외부 미팅'
  }
};
```

## 7. 프론트엔드 상태 관리

```typescript
// CalendarContext에서 관리
{
  events: CalendarEvent[];           // 모든 이벤트
  filteredEvents: CalendarEvent[];   // 필터링된 이벤트

  // CRUD
  createEvent: (input) => Promise<CalendarEvent>;
  updateEvent: (id, updates) => Promise<void>;
  deleteEvent: (id) => Promise<void>;

  // 상태 변경
  completeEvent: (id) => Promise<void>;
  cancelEvent: (id, reason) => Promise<void>;

  // 프로젝트 동기화
  syncWithProjects: () => void;
}
```