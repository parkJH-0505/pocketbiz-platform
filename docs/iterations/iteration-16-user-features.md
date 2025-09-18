# Iteration 16: 성장 내비게이션 대시보드

> 최종 업데이트: 2025-01-15
> "매일 만나고 싶은 성장 동반자" 철학 기반 전면 재설계

## 목표
**"따뜻한 성장 도우미"** - 재촉하지 않으면서도 자연스럽게 성장을 돕는 대시보드 구현

## 핵심 설계 철학

### 1. **경험 중심 설계**
- 정보 제공 → 성장 경험 제공
- 데이터 나열 → 다음 액션 가이드
- 객관적 분석 → 개인화된 코칭

### 2. **부드러운 챙김**
- 긴급함 대신 → 적절한 타이밍 제안
- 압박감 대신 → 선택권과 이해
- FOMO 대신 → 기회의 자연스러운 소개

### 3. **인지 부하 최소화**
- 한 번에 최대 3개 정보
- 명확한 시각적 계층
- 즉시 만족 가능한 피드백

### 4. **매일 들어오는 이유**
- 새로운 "오늘의 포커스" 기대감
- 성장 스토리의 연속성
- 개인화된 인사이트 발견

## 대시보드 구조

### 전체 레이아웃
```
┌─────────────────────────────────────────────────────────┐
│ 🎯 오늘의 액션 (전체 폭, 임팩트 섹션)                         │
├───────────────────────────┬─────────────────────────────┤
│ 📅 성장 캘린더 (확장, 7열)   │ 📊 성장 현황판 (5열)           │
│ - 주간 뷰 메인             │ - 레벨, 강점, 개선점           │
│ - 호버 상세 정보           │ - 성취 축하                  │
│ - 부드러운 리마인더         │                             │
├───────────────────────────┴─────────────────────────────┤
│ 💡 성장 인사이트 (전체 폭, 접기/펼치기)                       │
│ - 개인 패턴, 벤치마크, 숨은 기회                           │
└─────────────────────────────────────────────────────────┘
```

## 핵심 컴포넌트 설계

### 1. 🎯 오늘의 액션 - 최상단 히어로

#### 설계 철학
- **압도적 단순함**: 오늘 할 일 딱 하나만
- **의사결정 피로 제거**: 생각할 필요 없는 명확한 가이드
- **즉시 만족**: 15분 내 완료 가능한 액션

#### 구현 설계
```jsx
<TodaysAction className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-6">
  <div className="text-center">
    <div className="text-2xl mb-2">🎯</div>
    <h2 className="text-2xl font-bold text-gray-900 mb-2">
      오늘은 이것만 하세요
    </h2>
    <div className="text-lg text-gray-800 mb-3">
      {generateTodaysAction(userKPI, incompletedKPIs)}
    </div>
    <div className="text-sm text-blue-600 mb-4">
      {motivation} · 예상 소요시간: {estimatedTime}
    </div>
    <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
      지금 시작하기
    </button>
  </div>
</TodaysAction>
```

#### 스마트 로직
```typescript
function generateTodaysAction(userKPI: AxisScores, responses: KPIResponses): TodaysAction {
  // 1. 가장 낮은 축 식별
  const lowestAxis = findLowestAxis(userKPI);

  // 2. 해당 축의 미완료 KPI 찾기
  const incompletedKPIs = getIncompleteKPIsForAxis(lowestAxis, responses);

  // 3. 가장 임팩트 큰 KPI 선택
  const targetKPI = selectHighImpactKPI(incompletedKPIs);

  return {
    action: `${lowestAxis.name}(${lowestAxis.code}) 영역 KPI ${targetKPI.count}개 입력`,
    motivation: `완료하면 전체 점수 +${calculateExpectedImpact(targetKPI)}점 상승 예상`,
    estimatedTime: `${targetKPI.estimatedMinutes}분`,
    actionUrl: `/startup/kpi?focus=${lowestAxis.code}&items=${targetKPI.ids.join(',')}`
  };
}
```

### 2. 📅 성장 캘린더 - 좌측 메인 (확장)

#### 설계 철학
- **시간 기반 성장 가이드**: 언제 무엇을 하면 좋을지 제안
- **부드러운 리마인더**: 재촉하지 않는 따뜻한 알림
- **호버 상세**: 필요시에만 더 많은 정보

#### 주간 뷰 중심 설계
```jsx
<GrowthCalendar className="col-span-7 bg-white p-6 rounded-xl shadow-sm">
  <CalendarHeader>
    <h3 className="text-xl font-semibold text-gray-900">이번 주 성장 일정</h3>
    <p className="text-gray-500">차근차근 진행하세요</p>
  </CalendarHeader>

  <WeekGrid className="grid grid-cols-7 gap-3 mb-6">
    {weekDays.map(day => (
      <CalendarDay key={day.date} className="relative group">
        <DayLabel>{day.label}</DayLabel>
        <DateNumber>{day.date}</DateNumber>

        {day.events.map(event => (
          <EventDot
            key={event.id}
            type={event.type}
            className={getEventColor(event.type)}
          />
        ))}

        <HoverTooltip className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <TooltipContent event={day.events[0]} />
        </HoverTooltip>
      </CalendarDay>
    ))}
  </WeekGrid>

  <TodayHighlight>
    <HighlightCard event={todaysEvent} />
  </TodayHighlight>

  <WeeklyMessage className="text-center text-gray-600 text-sm mt-4">
    {generateWeeklyMessage(userProgress, weekEvents)}
  </WeeklyMessage>
</GrowthCalendar>
```

#### 호버 툴팁 시스템
```typescript
interface CalendarEvent {
  id: string;
  type: 'checkup' | 'opportunity' | 'planning';
  title: string;
  description: string;
  estimatedTime: string;
  tone: string; // 부드러운 메시지
  actionUrl?: string;
}

const tooltipTemplates = {
  checkup: {
    icon: "💊",
    title: "KPI 체크업",
    tone: "지난 주 대비 어떤 변화가 있었는지 확인해볼까요?"
  },
  opportunity: {
    icon: "💰",
    title: "새로운 기회",
    tone: "괜찮은 기회 같은데, 시간 될 때 한번 보세요"
  },
  planning: {
    icon: "📝",
    title: "성장 계획",
    tone: "미리 해두면 나중에 편해요"
  }
};
```

#### 스마트 일정 생성
```typescript
function generateWeeklySchedule(userProfile: UserProfile): CalendarEvent[] {
  const schedule: CalendarEvent[] = [];

  // 1. KPI 업데이트 주기 (개인 맞춤)
  if (daysSinceLastKPIUpdate(userProfile) > 7) {
    schedule.push({
      type: 'checkup',
      title: 'KPI 현황 체크',
      description: `${getLowestAxis(userProfile)} 영역 업데이트`,
      estimatedTime: '10분',
      tone: '지난 주 대비 어떤 변화가 있었는지 확인해볼까요?'
    });
  }

  // 2. 높은 매칭률 기회만 (85%+)
  const highMatchOpportunities = getHighMatchOpportunities(userProfile, 85);
  if (highMatchOpportunities.length > 0) {
    schedule.push({
      type: 'opportunity',
      title: highMatchOpportunities[0].name,
      description: `매칭률 ${highMatchOpportunities[0].matchRate}%`,
      estimatedTime: '30분',
      tone: '괜찮은 기회 같은데, 시간 될 때 한번 보세요'
    });
  }

  // 3. 계절성 가이드
  const seasonalGuide = getSeasonalRecommendation(new Date());
  if (seasonalGuide) {
    schedule.push(seasonalGuide);
  }

  return schedule;
}
```

### 3. 📊 성장 현황판 - 우측 사이드

#### 설계 철학
- **성취감 중심**: 발전된 부분을 강조
- **격려와 동기부여**: 작은 성장도 축하
- **다음 단계 가이드**: 목표까지의 거리 명확화

#### 구현 설계
```jsx
<GrowthStatus className="col-span-5 bg-white p-6 rounded-xl shadow-sm">
  <LevelSection className="mb-6">
    <LevelBadge className="text-center">
      <LevelIcon>🌱</LevelIcon>
      <LevelText className="text-2xl font-bold text-blue-600">
        {calculateGrowthLevel(overallScore)}
      </LevelText>
      <NextMilestone className="text-sm text-gray-500">
        {getNextMilestone(overallScore)}
      </NextMilestone>
    </LevelBadge>
  </LevelSection>

  <StrengthsSection className="space-y-3 mb-6">
    <SectionTitle>현재 상태</SectionTitle>

    <StrengthItem type="strong">
      <Icon>💪</Icon>
      <Text>강점: {getStrongestAxis(axisScores)}</Text>
      <Badge>상위 {calculatePercentile(axisScores)}%</Badge>
    </StrengthItem>

    <StrengthItem type="growing">
      <Icon>📈</Icon>
      <Text>성장 중: {getGrowingAxis(axisScores, previousScores)}</Text>
      <Badge>+{calculateRecentGrowth(axisScores)}점 상승</Badge>
    </StrengthItem>

    <StrengthItem type="focus">
      <Icon>🎯</Icon>
      <Text>집중 영역: {getLowestAxis(axisScores)}</Text>
      <Badge>개선 권장</Badge>
    </StrengthItem>
  </StrengthsSection>

  <CelebrationSection>
    <CelebrationCard>
      {generateCelebrationMessage(recentAchievements, overallProgress)}
    </CelebrationCard>
  </CelebrationSection>
</GrowthStatus>
```

#### 성장 레벨 시스템
```typescript
function calculateGrowthLevel(score: number): string {
  const levels = [
    { min: 0, max: 30, name: "새싹 단계", icon: "🌱" },
    { min: 30, max: 50, name: "성장기", icon: "🌿" },
    { min: 50, max: 70, name: "발전기", icon: "🌳" },
    { min: 70, max: 85, name: "도약기", icon: "🚀" },
    { min: 85, max: 100, name: "유니콘 후보", icon: "🦄" }
  ];

  const currentLevel = levels.find(level => score >= level.min && score < level.max);
  return `${currentLevel.icon} ${currentLevel.name}`;
}

function getNextMilestone(score: number): string {
  const nextLevel = levels.find(level => score < level.min);
  if (!nextLevel) return "최고 레벨 달성!";

  const pointsNeeded = nextLevel.min - score;
  return `${nextLevel.name}까지 ${pointsNeeded}점`;
}
```

### 4. 💡 성장 인사이트 - 하단 전체 폭

#### 설계 철학
- **발견의 즐거움**: "아하!" 모멘트 제공
- **개인화된 통찰**: 내 데이터 기반 새로운 관점
- **선택적 탐색**: 접기/펼치기로 부담 없이

#### 구현 설계
```jsx
<GrowthInsights className="col-span-12 bg-white rounded-xl shadow-sm">
  <InsightsHeader className="flex items-center justify-between p-6 border-b">
    <div className="flex items-center gap-2">
      <Icon>💡</Icon>
      <Title className="text-xl font-semibold">성장 인사이트</Title>
    </div>
    <ExpandToggle onClick={toggleExpanded}>
      {isExpanded ? <ChevronUp /> : <ChevronDown />}
    </ExpandToggle>
  </InsightsHeader>

  {isExpanded && (
    <InsightsContent className="p-6">
      <InsightGrid className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PersonalPattern>
          <InsightCard>
            <CardTitle>당신만의 성장 패턴</CardTitle>
            <Insight>
              {generatePersonalPattern(userHistory, kpiData)}
            </Insight>
            <ActionSuggestion>
              {getPatternBasedSuggestion(userPattern)}
            </ActionSuggestion>
          </InsightCard>
        </PersonalPattern>

        <PeerBenchmark>
          <InsightCard>
            <CardTitle>동종업계 위치</CardTitle>
            <Insight>
              {generateBenchmarkInsight(userScores, peerData)}
            </Insight>
            <EncouragementMessage>
              {generateEncouragement(benchmarkResult)}
            </EncouragementMessage>
          </InsightCard>
        </PeerBenchmark>

        <HiddenOpportunity>
          <InsightCard>
            <CardTitle>숨은 기회</CardTitle>
            <Insight>
              {generateOpportunityInsight(userProfile, marketData)}
            </Insight>
            <ExplorationLink>
              {generateExplorationSuggestion(opportunity)}
            </ExplorationLink>
          </InsightCard>
        </HiddenOpportunity>
      </InsightGrid>
    </InsightsContent>
  )}
</GrowthInsights>
```

#### 인사이트 생성 로직
```typescript
function generatePersonalPattern(history: UserHistory[]): string {
  const patterns = analyzeUserBehavior(history);

  const insights = [
    {
      condition: patterns.kpiCompletionRate > 0.8,
      message: "KPI 완성도가 높은 주에 기회 매칭률이 15% 더 높아져요"
    },
    {
      condition: patterns.consistentGrowth,
      message: "꾸준한 성장 패턴을 보이고 있어요. 이 속도면 목표 달성까지 순조로울 것 같아요"
    },
    {
      condition: patterns.weekendActivity,
      message: "주말에도 꾸준히 활동하시는 성실한 스타일이네요"
    }
  ];

  return insights.find(insight => insight.condition)?.message ||
         "아직 패턴을 분석 중이에요. 조금 더 데이터가 쌓이면 인사이트를 드릴게요";
}

function generateBenchmarkInsight(userScores: AxisScores, peerData: PeerData): string {
  const percentile = calculatePercentile(userScores, peerData);
  const strongestAxis = getStrongestAxis(userScores);

  if (percentile >= 80) {
    return `${strongestAxis} 영역에서 특히 우수한 성과를 보이고 있어요. 상위 ${100-percentile}% 수준입니다`;
  } else if (percentile >= 60) {
    return `전반적으로 안정적인 성장을 보이고 있어요. 비슷한 회사들과 비교해도 양호한 편입니다`;
  } else {
    return `성장 잠재력이 큰 시기예요. 지금부터 집중하면 빠르게 발전할 수 있을 것 같아요`;
  }
}
```

## 기술 구현 계획

### 상태 관리
```typescript
// Context 구조
interface DashboardContextType {
  todaysAction: TodaysAction;
  weeklySchedule: CalendarEvent[];
  growthStatus: GrowthStatus;
  insights: GrowthInsights;
  isLoading: boolean;
  lastUpdated: Date;
}

// 데이터 흐름
const DashboardProvider = ({ children }) => {
  const { axisScores, responses } = useKPIDiagnosis();
  const { cluster } = useCluster();
  const { activeProjects } = useBuildupContext();

  const todaysAction = useMemo(() =>
    generateTodaysAction(axisScores, responses),
    [axisScores, responses]
  );

  const weeklySchedule = useMemo(() =>
    generateWeeklySchedule({ axisScores, cluster, activeProjects }),
    [axisScores, cluster, activeProjects]
  );

  // ... 기타 데이터 생성 로직
};
```

### 컴포넌트 구조
```
src/
├── pages/startup/Dashboard.tsx                 # 메인 대시보드 페이지
├── components/dashboard/
│   ├── TodaysAction.tsx                       # 오늘의 액션
│   ├── GrowthCalendar/
│   │   ├── GrowthCalendar.tsx                 # 성장 캘린더 메인
│   │   ├── CalendarDay.tsx                    # 개별 날짜 셀
│   │   ├── EventTooltip.tsx                   # 호버 툴팁
│   │   └── WeeklyMessage.tsx                  # 주간 메시지
│   ├── GrowthStatus/
│   │   ├── GrowthStatus.tsx                   # 성장 현황판 메인
│   │   ├── LevelBadge.tsx                     # 레벨 표시
│   │   ├── StrengthItem.tsx                   # 강점/약점 항목
│   │   └── CelebrationCard.tsx                # 축하 메시지
│   └── GrowthInsights/
│       ├── GrowthInsights.tsx                 # 인사이트 메인
│       ├── PersonalPattern.tsx                # 개인 패턴
│       ├── PeerBenchmark.tsx                  # 벤치마크
│       └── HiddenOpportunity.tsx              # 숨은 기회
├── utils/dashboard/
│   ├── actionGenerator.ts                     # 오늘의 액션 생성
│   ├── scheduleGenerator.ts                   # 일정 생성
│   ├── insightGenerator.ts                    # 인사이트 생성
│   └── celebrationMessages.ts                # 축하 메시지
└── contexts/DashboardContext.tsx              # 대시보드 상태 관리
```

### 데이터 저장
```typescript
// localStorage 구조
interface DashboardStorage {
  weeklyScores: Record<string, AxisScores>;     // 주간별 점수 기록
  userPatterns: UserBehaviorPattern;            // 사용자 패턴 데이터
  completedActions: CompletedAction[];          // 완료한 액션들
  insightHistory: InsightHistory[];             // 인사이트 히스토리
  lastVisit: Date;                             // 마지막 방문
}
```

## 상세 구현 계획

### 📋 전체 일정 개요
- **총 기간**: 25일 (5주)
- **팀 구성**: 프론트엔드 개발자 1명
- **작업 방식**: 단계별 순차 개발 및 테스트

---

## Phase 1: Foundation & Core Components (10일 / 1.5주)

### 🎯 목표
핵심 컴포넌트의 기본 구조와 데이터 연동을 완성하여 MVP 수준의 대시보드 구현

### Day 1-2: 프로젝트 구조 설정
```bash
# 작업 내용
- 대시보드 전용 폴더 구조 생성
- 기본 컴포넌트 파일 생성
- TypeScript 인터페이스 정의
- 스타일링 시스템 구축
```

**파일 구조 생성:**
```
src/
├── pages/startup/Dashboard.tsx
├── components/dashboard/
│   ├── TodaysAction.tsx
│   ├── GrowthCalendar/
│   │   ├── index.tsx
│   │   ├── CalendarDay.tsx
│   │   └── EventTooltip.tsx
│   ├── GrowthStatus/
│   │   ├── index.tsx
│   │   └── LevelBadge.tsx
│   └── GrowthInsights/
│       └── index.tsx
├── utils/dashboard/
│   ├── actionGenerator.ts
│   ├── scheduleGenerator.ts
│   └── levelCalculator.ts
└── contexts/DashboardContext.tsx
```

**핵심 타입 정의:**
```typescript
// types/dashboard.ts
export interface TodaysAction {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  motivation: string;
  actionType: 'kpi' | 'opportunity' | 'buildup';
  actionUrl: string;
  priority: 'high' | 'medium' | 'low';
}

export interface CalendarEvent {
  id: string;
  date: Date;
  type: 'checkup' | 'opportunity' | 'planning' | 'reminder';
  title: string;
  description: string;
  estimatedTime: string;
  tone: string;
  actionUrl?: string;
  matchRate?: number;
}

export interface GrowthLevel {
  current: string;
  icon: string;
  score: number;
  next: {
    name: string;
    requiredScore: number;
    pointsNeeded: number;
  };
}
```

### Day 3-5: 오늘의 액션 컴포넌트
**핵심 기능 구현:**
```typescript
// utils/dashboard/actionGenerator.ts
export function generateTodaysAction(
  kpiData: KPIDiagnosisContextType,
  buildupData: BuildupContextType,
  matchingData: any[]
): TodaysAction {
  const { axisScores, responses } = kpiData;

  // 1. 가장 낮은 축 식별
  const lowestAxis = Object.entries(axisScores)
    .sort(([,a], [,b]) => a - b)[0];

  // 2. 해당 축의 미완료 KPI 계산
  const incompleteCount = calculateIncompleteKPIs(lowestAxis[0], responses);

  // 3. 액션 생성
  if (incompleteCount > 0) {
    return {
      id: `kpi-${lowestAxis[0]}-${Date.now()}`,
      title: `${getAxisName(lowestAxis[0])} 영역 완성하기`,
      description: `${incompleteCount}개 항목 입력으로 점수 향상`,
      estimatedTime: `${incompleteCount * 2}분`,
      motivation: `완료시 +${incompleteCount * 3}점 예상 상승`,
      actionType: 'kpi',
      actionUrl: `/startup/kpi?focus=${lowestAxis[0]}`,
      priority: 'high'
    };
  }

  // 4. 대안 액션들 (buildup, 고매칭 기회 등)
  return generateAlternativeAction(buildupData, matchingData);
}
```

**컴포넌트 구현:**
```jsx
// components/dashboard/TodaysAction.tsx
const TodaysAction: React.FC = () => {
  const { todaysAction, updateTodaysAction } = useDashboard();
  const navigate = useNavigate();

  const handleActionClick = () => {
    // 클릭 이벤트 추적
    trackEvent('todays_action_click', {
      actionType: todaysAction.actionType,
      actionId: todaysAction.id
    });

    // 페이지 이동
    navigate(todaysAction.actionUrl);
  };

  return (
    <motion.div
      className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center">
        <div className="text-3xl mb-3">🎯</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          오늘은 이것만 하세요
        </h2>
        <div className="text-lg text-gray-800 mb-3">
          {todaysAction.title}
        </div>
        <div className="text-sm text-blue-600 mb-4">
          {todaysAction.motivation} · 예상 소요시간: {todaysAction.estimatedTime}
        </div>
        <button
          onClick={handleActionClick}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors transform hover:scale-105"
        >
          지금 시작하기
        </button>
      </div>
    </motion.div>
  );
};
```

### Day 6-8: 성장 캘린더 기본 구조
**주간 뷰 레이아웃:**
```jsx
// components/dashboard/GrowthCalendar/index.tsx
const GrowthCalendar: React.FC = () => {
  const { weeklySchedule, currentWeek, navigateWeek } = useDashboard();
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  return (
    <div className="col-span-7 bg-white p-6 rounded-xl shadow-sm">
      <CalendarHeader>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">이번 주 성장 일정</h3>
            <p className="text-gray-500">차근차근 진행하세요</p>
          </div>
          <WeekNavigation
            currentWeek={currentWeek}
            onNavigate={navigateWeek}
          />
        </div>
      </CalendarHeader>

      <WeekGrid className="grid grid-cols-7 gap-3 mb-6">
        {generateWeekDays(currentWeek).map(day => (
          <CalendarDay
            key={day.dateString}
            day={day}
            events={weeklySchedule.filter(e =>
              isSameDay(e.date, day.date)
            )}
            isToday={isToday(day.date)}
            onHover={setHoveredDay}
            isHovered={hoveredDay === day.dateString}
          />
        ))}
      </WeekGrid>

      <TodayHighlight>
        {getTodaysEvents(weeklySchedule).map(event => (
          <HighlightCard key={event.id} event={event} />
        ))}
      </TodayHighlight>
    </div>
  );
};
```

**호버 툴팁 시스템:**
```jsx
// components/dashboard/GrowthCalendar/EventTooltip.tsx
const EventTooltip: React.FC<{ event: CalendarEvent; isVisible: boolean }> = ({
  event,
  isVisible
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      // 화면 경계 체크 및 위치 조정
      adjustTooltipPosition(tooltipRef.current, rect);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={tooltipRef}
          className="absolute z-50 w-72 p-4 bg-white border border-gray-200 rounded-lg shadow-lg"
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{getEventIcon(event.type)}</span>
            <h4 className="font-semibold text-gray-900">{event.title}</h4>
          </div>

          <p className="text-sm text-gray-600 mb-3">{event.description}</p>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>예상 시간: {event.estimatedTime}</span>
            {event.matchRate && (
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                매칭률 {event.matchRate}%
              </span>
            )}
          </div>

          <div className="mt-3 text-sm text-blue-600 italic">
            "{event.tone}"
          </div>

          {event.actionUrl && (
            <button
              className="mt-3 w-full text-sm bg-blue-50 text-blue-600 py-2 rounded hover:bg-blue-100 transition-colors"
              onClick={() => window.open(event.actionUrl, '_blank')}
            >
              자세히 보기
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```

### Day 9-10: 성장 현황판 & 통합
**레벨 시스템:**
```typescript
// utils/dashboard/levelCalculator.ts
export function calculateGrowthLevel(axisScores: AxisScores): GrowthLevel {
  const totalScore = Object.values(axisScores).reduce((sum, score) => sum + score, 0) / 5;

  const levels = [
    { min: 0, max: 30, name: "새싹 단계", icon: "🌱", color: "green" },
    { min: 30, max: 50, name: "성장기", icon: "🌿", color: "emerald" },
    { min: 50, max: 70, name: "발전기", icon: "🌳", color: "blue" },
    { min: 70, max: 85, name: "도약기", icon: "🚀", color: "purple" },
    { min: 85, max: 100, name: "유니콘 후보", icon: "🦄", color: "gold" }
  ];

  const currentLevel = levels.find(level =>
    totalScore >= level.min && totalScore < level.max
  ) || levels[levels.length - 1];

  const nextLevel = levels.find(level => totalScore < level.min);

  return {
    current: currentLevel.name,
    icon: currentLevel.icon,
    score: Math.round(totalScore),
    next: nextLevel ? {
      name: nextLevel.name,
      requiredScore: nextLevel.min,
      pointsNeeded: Math.round(nextLevel.min - totalScore)
    } : {
      name: "최고 레벨",
      requiredScore: 100,
      pointsNeeded: 0
    }
  };
}
```

**성공 지표:**
- TodaysAction 컴포넌트 동작 확인
- 캘린더 기본 뷰 및 호버 기능 동작
- 성장 현황판 레벨 계산 정확성
- 전체 레이아웃 반응형 작동

---

## Phase 2: Dashboard Integration & Basic Features (8일 / 1.5주)

### 🎯 목표
기존 시스템과의 완전한 데이터 연동 및 스마트 기능 구현

### Day 11-12: 컨텍스트 통합 및 데이터 연동
**DashboardContext 완성:**
```typescript
// contexts/DashboardContext.tsx
export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { axisScores, responses, isCompleted } = useKPIDiagnosis();
  const { cluster, sector, stage } = useCluster();
  const { activeProjects, milestones } = useBuildupContext();
  const { notifications } = useNotification();

  // 오늘의 액션 생성
  const todaysAction = useMemo(() =>
    generateTodaysAction(
      { axisScores, responses, isCompleted },
      { activeProjects, milestones },
      notifications
    ),
    [axisScores, responses, activeProjects, milestones, notifications]
  );

  // 주간 일정 생성
  const weeklySchedule = useMemo(() =>
    generateWeeklySchedule({
      userProfile: { axisScores, cluster, sector, stage },
      activeProjects,
      lastKPIUpdate: getLastKPIUpdate(),
      userPreferences: getUserPreferences()
    }),
    [axisScores, cluster, activeProjects]
  );

  // 성장 현황 계산
  const growthStatus = useMemo(() => ({
    level: calculateGrowthLevel(axisScores),
    strengths: analyzeStrengths(axisScores),
    improvements: analyzeImprovements(axisScores, responses),
    recentProgress: calculateRecentProgress(axisScores)
  }), [axisScores, responses]);

  // 로컬 스토리지 패턴 추적
  useEffect(() => {
    trackUserVisit({
      timestamp: new Date(),
      completedAction: todaysAction.id,
      axisScores,
      sessionDuration: 0
    });
  }, [todaysAction.id]);

  const value = {
    todaysAction,
    weeklySchedule,
    growthStatus,
    currentWeek: startOfWeek(new Date()),
    isLoading: false,
    lastUpdated: new Date()
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
```

### Day 13-14: 스마트 일정 생성 알고리즘
**개인화 일정 생성:**
```typescript
// utils/dashboard/scheduleGenerator.ts
export function generateWeeklySchedule(params: {
  userProfile: UserProfile;
  activeProjects: Project[];
  lastKPIUpdate: Date;
  userPreferences: UserPreferences;
}): CalendarEvent[] {
  const { userProfile, activeProjects, lastKPIUpdate, userPreferences } = params;
  const schedule: CalendarEvent[] = [];
  const currentWeek = startOfWeek(new Date());

  // 1. KPI 업데이트 일정 (개인 맞춤 주기)
  const daysSinceKPI = differenceInDays(new Date(), lastKPIUpdate);
  if (daysSinceKPI >= 7) {
    const suggestedDay = getOptimalKPIDay(userPreferences.activeHours);
    schedule.push({
      id: `kpi-update-${format(suggestedDay, 'yyyy-MM-dd')}`,
      date: suggestedDay,
      type: 'checkup',
      title: 'KPI 현황 체크',
      description: `${getLowestAxis(userProfile.axisScores)} 영역 집중 업데이트`,
      estimatedTime: '15분',
      tone: '지난 주 대비 어떤 변화가 있었는지 확인해볼까요?'
    });
  }

  // 2. 높은 매칭률 기회 (85%+ 매칭만)
  const highMatchOpportunities = await getHighMatchOpportunities(
    userProfile,
    85 // 최소 매칭률
  );

  if (highMatchOpportunities.length > 0) {
    const bestMatch = highMatchOpportunities[0];
    const suggestedDay = getOptimalOpportunityDay(bestMatch.deadline);

    schedule.push({
      id: `opportunity-${bestMatch.id}`,
      date: suggestedDay,
      type: 'opportunity',
      title: bestMatch.title,
      description: `매칭률 ${bestMatch.matchRate}% · ${bestMatch.category}`,
      estimatedTime: '30분',
      tone: '괜찮은 기회 같은데, 시간 될 때 한번 보세요',
      actionUrl: `/startup/smart-matching/detail/${bestMatch.id}`,
      matchRate: bestMatch.matchRate
    });
  }

  // 3. Buildup 프로젝트 체크포인트
  activeProjects.forEach(project => {
    const nextMilestone = getNextMilestone(project);
    if (nextMilestone && isWithinWeek(nextMilestone.deadline, currentWeek)) {
      schedule.push({
        id: `buildup-${project.id}-${nextMilestone.id}`,
        date: subDays(nextMilestone.deadline, 2), // 2일 전 리마인더
        type: 'planning',
        title: `${project.name} 마일스톤 준비`,
        description: nextMilestone.title,
        estimatedTime: '45분',
        tone: '미리 해두면 나중에 편해요',
        actionUrl: `/startup/buildup/${project.id}`
      });
    }
  });

  // 4. 계절성/시기별 가이드
  const seasonalGuide = getSeasonalRecommendation(new Date(), userProfile.sector);
  if (seasonalGuide) {
    schedule.push(seasonalGuide);
  }

  return schedule.sort((a, b) => a.date.getTime() - b.date.getTime());
}
```

### Day 15-16: 고급 캘린더 기능
**주간 네비게이션 및 월별 뷰:**
```jsx
// components/dashboard/GrowthCalendar/WeekNavigation.tsx
const WeekNavigation: React.FC<{
  currentWeek: Date;
  onNavigate: (direction: 'prev' | 'next') => void;
}> = ({ currentWeek, onNavigate }) => {
  const weekRange = {
    start: startOfWeek(currentWeek),
    end: endOfWeek(currentWeek)
  };

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => onNavigate('prev')}
        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="text-center">
        <div className="font-semibold text-gray-900">
          {format(weekRange.start, 'M월 d일')} - {format(weekRange.end, 'd일')}
        </div>
        <div className="text-sm text-gray-500">
          {format(currentWeek, 'yyyy년')}
        </div>
      </div>

      <button
        onClick={() => onNavigate('next')}
        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};
```

### Day 17-18: 성장 현황판 고도화
**강점/약점 분석 및 축하 시스템:**
```typescript
// utils/dashboard/celebrationGenerator.ts
export function generateCelebrationMessage(
  recentProgress: ProgressData,
  achievements: Achievement[]
): CelebrationMessage | null {

  // 1. 최근 성취 확인
  const recentAchievements = achievements.filter(
    a => differenceInDays(new Date(), a.date) <= 7
  );

  // 2. 점수 향상 확인
  const significantImprovement = recentProgress.changes.find(
    change => change.improvement >= 5
  );

  // 3. 축하 메시지 생성
  if (recentAchievements.length > 0) {
    const achievement = recentAchievements[0];
    return {
      type: 'achievement',
      icon: '🎉',
      title: '새로운 성취!',
      message: `${achievement.title}을 완료하셨네요! 정말 대단해요.`,
      subMessage: `이런 꾸준함이 성장의 원동력이에요.`
    };
  }

  if (significantImprovement) {
    return {
      type: 'improvement',
      icon: '📈',
      title: '성장 중!',
      message: `${significantImprovement.axis} 영역이 +${significantImprovement.improvement}점 향상됐어요!`,
      subMessage: '이 속도면 목표 달성이 금세일 것 같아요.'
    };
  }

  // 4. 격려 메시지 (성취가 없을 때)
  return {
    type: 'encouragement',
    icon: '💪',
    title: '꾸준히 성장 중',
    message: '매일 조금씩 발전하고 있어요.',
    subMessage: '작은 변화들이 모여 큰 성장을 만들어요.'
  };
}
```

**성공 지표:**
- 기존 KPI/Buildup/SmartMatching 데이터 완전 연동
- 개인화된 일정 생성 알고리즘 동작
- 실시간 데이터 반영 및 성능 최적화

---

## Phase 3: Advanced Features & Personalization (6일 / 1.5주)

### 🎯 목표
개인화 인사이트, 고급 인터랙션, 사용자 경험 완성

### Day 19-20: 성장 인사이트 구현
**개인 패턴 분석:**
```typescript
// utils/dashboard/insightGenerator.ts
export function generatePersonalPattern(userHistory: UserActivity[]): PersonalInsight {
  const patterns = analyzeUserBehavior(userHistory);

  // 1. 활동 패턴 분석
  const activityPattern = patterns.weeklyActivity;
  const peakDays = Object.entries(activityPattern)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 2)
    .map(([day]) => day);

  // 2. 성장 속도 분석
  const growthRate = calculateGrowthRate(userHistory);

  // 3. 완료율 패턴
  const completionPattern = analyzeCompletionRate(userHistory);

  // 4. 인사이트 메시지 생성
  const insights = [];

  if (completionPattern.kpiRate > 0.8) {
    insights.push({
      type: 'strength',
      title: '높은 KPI 완성도',
      message: 'KPI 완성도가 높은 주에 기회 매칭률이 15% 더 높아져요',
      actionSuggestion: '이런 패턴을 계속 유지해보세요'
    });
  }

  if (peakDays.includes('weekend')) {
    insights.push({
      type: 'pattern',
      title: '주말 성장형',
      message: '주말에도 꾸준히 활동하시는 성실한 스타일이네요',
      actionSuggestion: '주말을 활용한 장기 프로젝트를 고려해보세요'
    });
  }

  if (growthRate.trend === 'increasing') {
    insights.push({
      type: 'growth',
      title: '가속 성장 중',
      message: '최근 성장 속도가 가속화되고 있어요',
      actionSuggestion: '이 멘텀을 유지하며 더 큰 목표에 도전해보세요'
    });
  }

  return {
    primaryInsight: insights[0] || getDefaultInsight(),
    supportingInsights: insights.slice(1),
    confidenceScore: calculateConfidenceScore(userHistory.length),
    nextAnalysisDate: addDays(new Date(), 7)
  };
}
```

**벤치마크 비교 시스템:**
```typescript
// utils/dashboard/benchmarkGenerator.ts
export function generateBenchmarkInsight(
  userScores: AxisScores,
  userProfile: UserProfile,
  peerData: PeerBenchmarkData
): BenchmarkInsight {

  // 1. 동종업계 필터링
  const relevantPeers = peerData.filter(peer =>
    peer.sector === userProfile.sector &&
    peer.stage === userProfile.stage
  );

  // 2. 백분위 계산
  const percentiles = Object.entries(userScores).reduce((acc, [axis, score]) => {
    const peerScores = relevantPeers.map(peer => peer.axisScores[axis]);
    const percentile = calculatePercentile(score, peerScores);
    acc[axis] = percentile;
    return acc;
  }, {} as Record<string, number>);

  // 3. 상대적 강점/약점 분석
  const strongestAxis = Object.entries(percentiles)
    .sort(([,a], [,b]) => b - a)[0];

  const weakestAxis = Object.entries(percentiles)
    .sort(([,a], [,b]) => a - b)[0];

  // 4. 인사이트 메시지 생성
  const overallPercentile = Object.values(percentiles)
    .reduce((sum, p) => sum + p, 0) / 5;

  let message: string;
  let encouragement: string;

  if (overallPercentile >= 80) {
    message = `${getAxisName(strongestAxis[0])} 영역에서 특히 우수한 성과를 보이고 있어요. 상위 ${Math.round(100-overallPercentile)}% 수준입니다`;
    encouragement = '업계 리더로 성장할 잠재력이 충분해요';
  } else if (overallPercentile >= 60) {
    message = '전반적으로 안정적인 성장을 보이고 있어요. 비슷한 회사들과 비교해도 양호한 편입니다';
    encouragement = '몇 가지 영역만 더 개선하면 크게 도약할 수 있을 것 같아요';
  } else {
    message = '성장 잠재력이 큰 시기예요. 지금부터 집중하면 빠르게 발전할 수 있을 것 같아요';
    encouragement = '다른 회사들도 비슷한 과정을 거쳤으니 차근차근 진행해보세요';
  }

  return {
    message,
    encouragement,
    strongestAxis: {
      name: getAxisName(strongestAxis[0]),
      percentile: Math.round(strongestAxis[1])
    },
    improvementArea: {
      name: getAxisName(weakestAxis[0]),
      percentile: Math.round(weakestAxis[1])
    },
    overallRanking: Math.round(overallPercentile)
  };
}
```

### Day 21-22: 애니메이션 및 인터랙션
**Framer Motion 통합:**
```jsx
// components/dashboard/AnimatedComponents.tsx
export const AnimatedCard: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className }) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.4, 0.0, 0.2, 1]
      }}
      whileHover={{
        y: -2,
        transition: { duration: 0.2 }
      }}
    >
      {children}
    </motion.div>
  );
};

export const StaggeredList: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
};

export const PulseIndicator: React.FC<{
  isActive: boolean;
  color?: string;
}> = ({ isActive, color = 'blue' }) => {
  return (
    <motion.div
      className={`w-3 h-3 rounded-full bg-${color}-500`}
      animate={isActive ? {
        scale: [1, 1.2, 1],
        opacity: [1, 0.7, 1]
      } : {}}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
};
```

### Day 23-24: 성능 최적화 및 사용자 경험
**메모이제이션 및 최적화:**
```typescript
// hooks/useDashboardOptimization.ts
export function useDashboardOptimization() {
  // 1. 무거운 계산 메모이제이션
  const memoizedInsights = useMemo(() =>
    generateComplexInsights(userHistory, peerData),
    [userHistory?.length, peerData?.lastUpdated]
  );

  // 2. 컴포넌트 메모이제이션
  const MemoizedCalendar = useMemo(() =>
    React.memo(GrowthCalendar),
    []
  );

  // 3. 가상화된 리스트 (필요시)
  const virtualizedEventList = useVirtualizer({
    count: events.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => 80,
    overscan: 5
  });

  // 4. 이미지 지연 로딩
  const { ref: lazyRef, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  // 5. 로컬 스토리지 최적화
  const debouncedSave = useCallback(
    debounce((data: DashboardData) => {
      localStorage.setItem('dashboard-cache', JSON.stringify(data));
    }, 1000),
    []
  );

  return {
    memoizedInsights,
    MemoizedCalendar,
    virtualizedEventList,
    lazyRef,
    inView,
    debouncedSave
  };
}
```

**성공 지표:**
- 개인화 인사이트 정확성 및 유용성
- 60fps 애니메이션 성능 유지
- 초기 로딩 시간 < 2초

---

## Phase 4: Polish & Deployment Prep (6일 / 1주)

### 🎯 목표
사용자 경험 완성, 테스트, 문서화 및 배포 준비

### Day 25-26: 사용자 경험 완성
**온보딩 시스템:**
```jsx
// components/dashboard/Onboarding.tsx
const DashboardOnboarding: React.FC = () => {
  const { isFirstVisit, completeOnboarding } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(0);

  const onboardingSteps = [
    {
      target: '[data-tour="todays-action"]',
      title: '🎯 오늘의 핵심 액션',
      content: '매일 하나씩, 가장 임팩트가 큰 일부터 시작하세요.',
      placement: 'bottom'
    },
    {
      target: '[data-tour="growth-calendar"]',
      title: '📅 성장 캘린더',
      content: '이번 주 일정을 한눈에 보고, 호버하면 상세 정보를 확인할 수 있어요.',
      placement: 'right'
    },
    {
      target: '[data-tour="growth-status"]',
      title: '📊 성장 현황',
      content: '현재 레벨과 강점을 확인하고, 다음 목표까지의 거리를 파악하세요.',
      placement: 'left'
    },
    {
      target: '[data-tour="growth-insights"]',
      title: '💡 성장 인사이트',
      content: '개인 맞춤 분석과 숨은 기회를 발견해보세요.',
      placement: 'top'
    }
  ];

  if (!isFirstVisit) return null;

  return (
    <TourProvider
      steps={onboardingSteps}
      isOpen={true}
      onRequestClose={completeOnboarding}
      showNavigationNumber={false}
      showButtons={true}
      showCloseButton={true}
      className="tour-custom"
    />
  );
};
```

**에러 바운더리 및 폴백:**
```jsx
// components/dashboard/ErrorBoundary.tsx
class DashboardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Dashboard Error:', error, errorInfo);

    // 에러 추적
    trackError('dashboard_error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl">
          <div className="text-center">
            <div className="text-4xl mb-4">🔧</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              일시적인 문제가 발생했어요
            </h3>
            <p className="text-gray-600 mb-4">
              페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Day 27-28: 테스트 및 품질 관리
**단위 테스트:**
```typescript
// __tests__/utils/actionGenerator.test.ts
describe('generateTodaysAction', () => {
  const mockKPIData = {
    axisScores: { A: 30, B: 45, C: 60, D: 35, E: 50 },
    responses: { /* mock responses */ },
    isCompleted: false
  };

  const mockBuildupData = {
    activeProjects: [],
    milestones: []
  };

  it('should generate KPI action for lowest axis', () => {
    const action = generateTodaysAction(mockKPIData, mockBuildupData, []);

    expect(action.actionType).toBe('kpi');
    expect(action.title).toContain('A'); // 가장 낮은 축
    expect(action.estimatedTime).toMatch(/\d+분/);
    expect(action.actionUrl).toContain('/startup/kpi');
  });

  it('should handle completed KPI case', () => {
    const completedKPIData = { ...mockKPIData, isCompleted: true };
    const action = generateTodaysAction(completedKPIData, mockBuildupData, []);

    expect(action.actionType).not.toBe('kpi');
  });

  it('should prioritize high-match opportunities', () => {
    const highMatchNotifications = [{
      type: 'opportunity',
      matchRate: 90,
      data: { /* mock opportunity */ }
    }];

    const action = generateTodaysAction(
      { ...mockKPIData, isCompleted: true },
      mockBuildupData,
      highMatchNotifications
    );

    expect(action.actionType).toBe('opportunity');
  });
});
```

**통합 테스트:**
```typescript
// __tests__/components/Dashboard.test.tsx
describe('Dashboard Integration', () => {
  const renderDashboard = () => {
    return render(
      <TestProviders>
        <Dashboard />
      </TestProviders>
    );
  };

  it('should load all main components', async () => {
    renderDashboard();

    // 모든 주요 섹션이 로드되는지 확인
    expect(screen.getByText('오늘은 이것만 하세요')).toBeInTheDocument();
    expect(screen.getByText('이번 주 성장 일정')).toBeInTheDocument();
    expect(screen.getByText('성장 인사이트')).toBeInTheDocument();

    // 로딩 상태가 해제되는지 확인
    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-loading')).not.toBeInTheDocument();
    });
  });

  it('should handle calendar interactions', async () => {
    renderDashboard();

    const calendarDay = screen.getByTestId('calendar-day-today');
    fireEvent.mouseEnter(calendarDay);

    // 툴팁 표시 확인
    await waitFor(() => {
      expect(screen.getByTestId('event-tooltip')).toBeInTheDocument();
    });
  });

  it('should track user interactions', async () => {
    const trackSpy = jest.spyOn(analytics, 'track');
    renderDashboard();

    const actionButton = screen.getByText('지금 시작하기');
    fireEvent.click(actionButton);

    expect(trackSpy).toHaveBeenCalledWith('todays_action_click', {
      actionType: expect.any(String),
      actionId: expect.any(String)
    });
  });
});
```

### Day 29-30: 문서화 및 배포 준비
**컴포넌트 문서:**
```markdown
# Dashboard Components Guide

## TodaysAction
가장 임팩트가 큰 하나의 액션을 제안하는 컴포넌트

### Props
- `className?: string` - 추가 CSS 클래스
- `onActionComplete?: () => void` - 액션 완료 콜백

### 사용법
```jsx
<TodaysAction
  className="mb-6"
  onActionComplete={() => console.log('Action completed')}
/>
```

## GrowthCalendar
주간 단위 성장 일정을 표시하는 캘린더

### Props
- `weekOffset?: number` - 현재 주 기준 오프셋 (기본: 0)
- `onEventClick?: (event: CalendarEvent) => void` - 이벤트 클릭 핸들러

### 특징
- 호버 시 상세 툴팁 표시
- 주간 네비게이션 지원
- 반응형 레이아웃

## GrowthStatus
현재 성장 상태와 레벨을 표시

### 계산 방식
- 5개 축 점수의 평균으로 레벨 결정
- 최근 7일간 변화량 기반 성장률 계산
- 동종업계 대비 백분위 표시
```

**성능 체크리스트:**
```markdown
# 성능 최적화 체크리스트

## ✅ 필수 항목
- [ ] React.memo 적용된 컴포넌트: 8개
- [ ] useMemo로 최적화된 계산: 12개
- [ ] useCallback으로 최적화된 함수: 6개
- [ ] 이미지 지연 로딩 구현
- [ ] 번들 크기 < 500KB (gzipped)

## ✅ 성능 지표
- [ ] 초기 로딩 시간 < 2초
- [ ] 인터랙션 응답 시간 < 100ms
- [ ] 메모리 사용량 < 50MB
- [ ] 애니메이션 60fps 유지

## ✅ 사용자 경험
- [ ] 로딩 스켈레톤 구현
- [ ] 에러 바운더리 설정
- [ ] 온보딩 가이드 완성
- [ ] 접근성 점수 > 90
```

**배포 전 최종 점검:**
```bash
# 빌드 및 테스트
npm run build
npm run test:coverage
npm run lint
npm run type-check

# 성능 측정
npm run analyze
npm run lighthouse

# 브라우저 호환성 테스트
npm run test:e2e:chrome
npm run test:e2e:firefox
npm run test:e2e:safari
```

**성공 지표:**
- 모든 테스트 통과 (커버리지 > 80%)
- 성능 지표 달성
- 사용자 경험 완성도 검증
- 문서화 완료

---

## 🎯 전체 프로젝트 성공 지표

### 기술적 지표
- **성능**: 초기 로딩 < 2초, 인터랙션 < 100ms
- **품질**: 테스트 커버리지 > 80%, TypeScript 엄격 모드
- **사용성**: 온보딩 완료율 > 90%, 에러율 < 1%

### 비즈니스 지표
- **참여도**: 일평균 방문 시간 > 2분
- **액션률**: "오늘의 액션" 클릭률 > 60%
- **유지율**: 주간 재방문율 > 80%
- **만족도**: "매일 확인하고 싶다" 응답 > 70%

### 사용자 피드백 목표
- "다음에 뭘 해야 할지 명확하다"
- "성장하고 있다는 느낌을 받는다"
- "압박감 없이 자연스럽게 이용한다"
- "개인화된 인사이트가 유용하다"

이 계획을 통해 25일 내에 **"매일 만나고 싶은 성장 동반자"** 철학을 완벽히 구현한 대시보드를 완성할 수 있습니다.

## 성공 지표

### 정량적 지표
- 대시보드 일평균 방문 시간 > 2분
- "오늘의 액션" 클릭률 > 60%
- 주간 재방문율 > 80%
- 캘린더 인터랙션율 > 40%

### 정성적 지표
- "매일 확인하고 싶다"
- "다음에 뭘 해야 할지 명확하다"
- "성장하고 있다는 느낌을 받는다"
- "압박감 없이 자연스럽게 이용한다"

## 기술 요구사항

### 필수 패키지
```json
{
  "framer-motion": "^10.0.0",      // 애니메이션
  "date-fns": "^2.29.0",           // 날짜 처리
  "recharts": "^2.8.0",            // 차트 (필요시)
  "react-use": "^17.4.0"           // 훅 유틸리티
}
```

### 성능 고려사항
- React.memo를 활용한 불필요한 리렌더링 방지
- useMemo를 활용한 계산 결과 캐싱
- 이미지 최적화 및 지연 로딩
- 번들 스플리팅으로 초기 로딩 시간 단축

이 문서는 "매일 만나고 싶은 성장 동반자" 대시보드 구현을 위한 완전한 가이드입니다.