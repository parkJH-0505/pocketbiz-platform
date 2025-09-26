# Iteration 28: Overview Tab Timeline Redesign

## 개요
프로젝트 상세 페이지의 개요 탭을 세로형 프로그레스바와 브랜치형 활동 피드를 결합한 타임라인 방식으로 전면 재설계

## 목표
- 프로젝트 진행 상황을 시각적으로 직관적이게 표현
- 실시간 프로젝트 활동 로그를 진행 단계와 연결하여 표시
- 기존 탭들의 데이터를 통합하여 하나의 타임라인으로 구성
- 사용자가 프로젝트의 과거, 현재, 미래를 한눈에 파악 가능

## 핵심 컨셉

### 1. 세로형 프로그레스바 (메인 축)
- **기존 헤더 프로그레스바의 로직 재활용**
  - 미팅 단계 기반 진행률 계산
  - 현재 진행 단계 하이라이트
  - 완료/진행중/예정 단계 구분

### 2. 브랜치형 활동 피드 (가로 가지)
- 각 진행 단계 사이에 동적으로 생성
- 시간순으로 아래 방향으로 추가
- 피드 유형별 템플릿화된 표시

## 구조 설계

### 레이아웃 구성
```
[왼쪽: 세로 프로그레스바 (20%)] [중앙: 브랜치 피드 영역 (60%)] [우측: 상세 패널 (20%)]
```

### 프로그레스바 구성 요소
1. **상단 서클**: 전체 진행률 표시 (예: 70%)
2. **단계별 노드**:
   - 완료: ✅ 체크 아이콘
   - 진행중: 🔵 펄스 애니메이션
   - 예정: ⭕ 빈 원
3. **연결선**:
   - 완료 구간: 실선
   - 진행 구간: 그라데이션
   - 예정 구간: 점선

### 브랜치 피드 시스템
```
[미팅 노드]
    |
    |---→ [파일 업로드 카드]
    |---→ [미팅 기록 카드]
    |---→ [TODO 완료 카드]
    |---→ [코멘트 카드]
    ↓ (새 피드는 아래로 추가)
[다음 미팅 노드]
```

## 데이터 연동 계획

### 1. 파일 업로드 피드
- **소스**: `파일` 탭의 업로드 로그
- **API**: `/api/projects/{id}/files`
- **매핑 필드**:
  ```typescript
  {
    fileName: string,
    fileSize: number,
    uploadedBy: string,
    uploadedAt: Date,
    fileType: string,
    downloadUrl: string
  }
  ```

### 2. 미팅 기록 피드
- **소스**: `미팅 기록` 탭 데이터
- **API**: 기존 미팅 데이터 구조 활용
- **매핑 필드**:
  ```typescript
  {
    meetingTitle: string,
    meetingDate: Date,
    participants: string[],
    summary: string,
    nextSteps: string[]
  }
  ```

### 3. TODO 완료 피드
- **소스**: 새로 구현할 TODO 시스템
- **매핑 필드**:
  ```typescript
  {
    taskTitle: string,
    completedBy: string,
    completedAt: Date,
    taskCategory: string
  }
  ```

### 4. 코멘트 피드
- **소스**: 미팅 기록 탭 우측 패널 댓글
- **API**: 댓글 시스템 연동
- **매핑 필드**:
  ```typescript
  {
    author: string,
    message: string,
    timestamp: Date,
    parentId?: string
  }
  ```

### 5. 진행률 업데이트 피드
- **소스**: 프로젝트 진행률 변경 이벤트
- **매핑 필드**:
  ```typescript
  {
    previousProgress: number,
    currentProgress: number,
    updatedAt: Date,
    updatedBy: string
  }
  ```

### 6. 팀원 활동 피드 (더미)
- **소스**: 하드코딩된 더미 데이터
- **매핑 필드**:
  ```typescript
  {
    memberName: string,
    action: string,
    timestamp: Date,
    details?: string
  }
  ```

## 피드 카드 템플릿

### 접힌 상태 (Collapsed)
```
[아이콘] [제목] [시간] [펼치기 버튼]
```

### 펼친 상태 (Expanded)
```
┌─────────────────────────────────┐
│ [아이콘] [제목]           [닫기] │
│ -------------------------------- │
│ [상세 정보 필드들]               │
│ [액션 버튼들]                    │
└─────────────────────────────────┘
```

## 인터랙션 설계

### 자동 펼침/접힘 규칙
1. **항상 펼침**:
   - 오늘 추가된 피드
   - 중요 표시된 항목

2. **조건부 펼침**:
   - 최근 3일 이내 항목 (최대 3개)

3. **자동 접힘**:
   - 7일 이상 지난 항목
   - 같은 유형이 연속 5개 이상일 때

### 무한 스크롤
- 초기 로드: 각 단계별 최근 5개 피드
- 스크롤 시 추가 로드: 10개씩
- 가상 스크롤링으로 성능 최적화

## 기술 구현 요구사항

### 컴포넌트 구조
```
OverviewTab/
├── VerticalProgressBar/
│   ├── ProgressNode.tsx
│   ├── ProgressLine.tsx
│   └── ProgressSummary.tsx
├── BranchFeedSystem/
│   ├── FeedBranch.tsx
│   ├── FeedCard.tsx
│   └── FeedTemplates/
│       ├── FileFeed.tsx
│       ├── MeetingFeed.tsx
│       ├── TodoFeed.tsx
│       ├── CommentFeed.tsx
│       ├── ProgressFeed.tsx
│       └── TeamFeed.tsx
└── DetailPanel/
    └── FeedDetail.tsx
```

### 상태 관리
```typescript
interface TimelineState {
  stages: Stage[];           // 미팅 단계들
  feeds: BranchFeed[];       // 모든 피드 데이터
  expandedFeeds: Set<string>; // 펼쳐진 피드 ID들
  selectedFeed: string | null; // 선택된 피드
  filters: FeedFilter;        // 피드 필터링
}
```

### API 통합
```typescript
// 통합 피드 fetcher
const fetchTimelineFeeds = async (projectId: string) => {
  const [files, meetings, comments] = await Promise.all([
    fetchFileUploads(projectId),
    fetchMeetingRecords(projectId),
    fetchComments(projectId)
  ]);

  return mergeAndSortFeeds(files, meetings, comments);
};
```

## 예상 효과
1. **정보 통합**: 여러 탭에 분산된 정보를 한 곳에서 확인
2. **시각적 직관성**: 프로젝트 진행 상황을 타임라인으로 즉시 파악
3. **컨텍스트 제공**: 각 활동이 어느 단계에서 발생했는지 명확히 표시
4. **효율적 네비게이션**: 중요한 정보는 자동으로 강조되어 빠른 확인 가능

## 구체적인 구현 계획

### **Phase 1: 기존 로직 분석 및 추출 (30분)**
1. **헤더 프로그레스바 로직 파악**
   - `src/pages/startup/buildup/ProjectDetail.tsx`에서 기존 프로그레스 계산 로직 찾기
   - 미팅 단계별 진행률 계산 방식 이해
   - 현재 단계 판단 로직 추출

2. **공통 유틸리티 생성**
   - `src/utils/progressCalculator.ts` 생성
   - 헤더와 개요 탭에서 공통 사용할 함수들 분리

### **Phase 2: 개요 탭 레이아웃 기본 틀 (45분)**
3. **3단 레이아웃 구조 만들기**
   ```tsx
   <div className="grid grid-cols-12 gap-6 h-full">
     {/* 왼쪽: 세로 프로그레스바 */}
     <div className="col-span-3">
       <VerticalProgressBar />
     </div>

     {/* 중앙: 메인 콘텐츠 */}
     <div className="col-span-6">
       {/* 나중에 브랜치 피드 들어갈 자리 */}
     </div>

     {/* 우측: 상세 패널 */}
     <div className="col-span-3">
       {/* 나중에 상세 정보 들어갈 자리 */}
     </div>
   </div>
   ```

### **Phase 3: 세로 프로그레스바 컴포넌트 (1시간)**
4. **VerticalProgressBar 메인 컴포넌트**
   - `src/components/overview/VerticalProgressBar.tsx` 생성
   - 프로젝트 데이터 받아서 단계 리스트 생성

5. **ProgressNode 컴포넌트**
   - `src/components/overview/ProgressNode.tsx` 생성
   - 3가지 상태: 완료(✅), 진행중(🔵), 예정(⭕)
   - 단계명, 예상 기간 표시

6. **ProgressLine 연결선 컴포넌트**
   - `src/components/overview/ProgressLine.tsx` 생성
   - 완료구간: 실선, 진행구간: 그라데이션, 예정구간: 점선

### **Phase 4: 상단 진행률 요약 (30분)**
7. **원형 프로그레스 서클**
   - 전체 진행률 퍼센트
   - D-day 계산 및 표시
   - 프로젝트 상태 표시

### **Phase 5: 브랜치 연결점 준비 (15분)**
8. **각 노드에 연결점 추가**
   - 나중에 피드 브랜치를 붙일 수 있는 구조
   - CSS로 연결점 위치만 미리 정의

### **Phase 6: 브랜치 피드 시스템 구축 (2시간)**
9. **BranchFeed 기본 구조**
   ```tsx
   // src/components/overview/BranchFeed.tsx
   interface BranchFeedProps {
     stageId: string;
     feeds: FeedItem[];
     connectionPoint: { top: number }; // 연결점 위치
   }
   ```

10. **피드 카드 템플릿 시스템**
    ```tsx
    // src/components/overview/FeedCard.tsx
    interface FeedCardProps {
      type: 'file' | 'meeting' | 'todo' | 'comment' | 'progress' | 'team';
      data: any;
      expanded: boolean;
      onToggle: () => void;
    }
    ```

### **Phase 7: 각 피드 타입별 구현 (3시간)**
11. **FileFeed 컴포넌트**
    - 파일 탭 API 연동: `fetchFileUploads(projectId)`
    - 파일 아이콘, 크기, 업로더 표시
    - 미리보기, 다운로드 버튼

12. **MeetingFeed 컴포넌트**
    - 미팅 기록 탭 데이터 연동
    - 참석자, 요약, 다음 단계 표시
    - 회의록 상세 보기 모달

13. **CommentFeed 컴포넌트**
    - 미팅 패널 댓글 API 연동
    - 작성자, 시간, 답글 기능

### **Phase 8: 데이터 통합 및 정렬 시스템 (1.5시간)**
14. **TimelineDataManager**
    ```typescript
    // src/services/timelineDataManager.ts
    class TimelineDataManager {
      async fetchAllFeeds(projectId: string): Promise<FeedItem[]>
      sortFeedsByStageAndTime(feeds: FeedItem[]): StageFeeds[]
      filterFeedsByDate(feeds: FeedItem[], days: number): FeedItem[]
    }
    ```

15. **실시간 데이터 동기화**
    - 각 탭에서 데이터 변경 시 타임라인 업데이트
    - WebSocket 또는 폴링으로 실시간 반영

### **Phase 9: UX 개선 및 인터랙션 (2시간)**
16. **자동 펼침/접힘 로직**
    ```typescript
    // 펼침 우선순위 계산
    const shouldAutoExpand = (feed: FeedItem) => {
      return feed.isToday || feed.isImportant || feed.isRecent;
    }
    ```

17. **무한 스크롤 구현**
    - `react-window` 또는 `react-virtualized` 사용
    - 성능 최적화를 위한 가상 스크롤링

18. **애니메이션 및 트랜지션**
    - 브랜치 확장/축소 애니메이션
    - 새 피드 추가 시 펄스 효과
    - 스크롤 시 프로그레스바 하이라이트 변경

### **Phase 10: 우측 상세 패널 (1.5시간)**
19. **DetailPanel 컴포넌트**
    - 선택된 피드의 상세 정보 표시
    - 관련 액션 버튼들 (수정, 삭제, 공유 등)
    - 파일 미리보기, 댓글 전체 보기

20. **빠른 액션 기능**
    - 새 파일 업로드
    - 코멘트 작성
    - 다음 미팅 예약

### **Phase 11: 테스트 데이터 및 더미 구현 (1시간)**
21. **더미 데이터 생성**
    ```typescript
    // src/data/dummyTimelineData.ts
    export const generateDummyFeeds = (projectId: string) => {
      // 각 피드 타입별 더미 데이터
    }
    ```

22. **TODO 시스템 더미 구현**
    - 완료된 작업 목록 하드코딩
    - 나중에 실제 TODO 시스템과 연동 준비

### **Phase 12: 최적화 및 마무리 (1시간)**
23. **성능 최적화**
    - 메모이제이션 (`useMemo`, `useCallback`)
    - 컴포넌트 lazy loading
    - API 호출 최적화 (배치 처리)

24. **반응형 대응**
    - 모바일에서는 프로그레스바를 상단으로
    - 태블릿에서는 2단 구조로 변경

25. **에러 처리 및 로딩 상태**
    - 각 피드별 로딩 스켈레톤
    - API 에러 시 재시도 로직

## 파일 구조
```
src/
├── components/overview/
│   ├── VerticalProgressBar.tsx      # 메인 컴포넌트
│   ├── ProgressNode.tsx             # 각 단계 노드
│   ├── ProgressLine.tsx             # 연결선
│   ├── ProgressSummary.tsx          # 상단 원형 프로그레스
│   ├── BranchFeed.tsx               # 브랜치 피드 시스템
│   ├── FeedCard.tsx                 # 피드 카드 템플릿
│   └── FeedTemplates/
│       ├── FileFeed.tsx
│       ├── MeetingFeed.tsx
│       ├── TodoFeed.tsx
│       ├── CommentFeed.tsx
│       ├── ProgressFeed.tsx
│       └── TeamFeed.tsx
├── services/
│   └── timelineDataManager.ts       # 데이터 통합 관리
├── utils/
│   └── progressCalculator.ts        # 공통 진행률 계산
├── data/
│   └── dummyTimelineData.ts         # 더미 데이터
└── pages/startup/buildup/
    └── ProjectDetail.tsx            # 개요 탭에 적용
```

## 전체 예상 일정
- **Phase 1-2**: 기본 틀 구축 (1시간 15분)
- **Phase 3-5**: 세로 프로그레스바 완성 (1시간 45분)
- **Phase 6-7**: 브랜치 피드 시스템 (5시간)
- **Phase 8-9**: 데이터 통합 및 UX (3시간 30분)
- **Phase 10-12**: 상세 패널 및 최적화 (3시간 30분)

**총 예상 시간: 약 15시간 (2일)**

## 우선순위
1. **1차 완성**: Phase 1-5 (기본 세로 프로그레스바)
2. **2차 완성**: Phase 6-8 (브랜치 피드 기본 구조)
3. **3차 완성**: Phase 9-12 (UX 개선 및 완성도)