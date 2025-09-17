# Iteration 19: 스마트 매칭 - KPI 기반 맞춤 추천 시스템 (전면 재개발)

> 생성일: 2025-01-15
> 최종 업데이트: 2025-01-17
> MASTER_PLAN.md Phase 6 기준
> **상태: 기존 코드 전체 삭제 후 처음부터 재개발**
> **실제 구조: 2탭 시스템 (맞춤 추천 + 전체 기회)**

## 🎯 프로젝트 개요

### 목표
**"KPI 기반 개인화된 추천"** - Core5 점수와 성장단계에 맞는 최적의 정부지원사업/투자 기회를 맞춤 추천

### 철학적 전환
- **기존**: "매칭 점수 기반 선택" (인위적인 점수)
- **신규**: "실제 요구사항 충족도 기반 추천" (실질적인 준비 상태)

### 핵심 차별화 요소
1. **상태 기반 추천**: Core5 충족도로 "추천/준비중/미달" 명확히 구분
2. **투명한 계산 로직**: 호버 툴팁으로 상태 계산 방식 설명
3. **2탭 구조**: 맞춤 추천(CustomRecommendation) + 전체 기회(AllOpportunities)
4. **통합 이벤트 카드**: 왼쪽 메인 콘텐츠 + 오른쪽 상세 스펙 구조

---

## 📐 전체 아키텍처 설계

### 2탭 구조 (실제 구현)
```tsx
<SmartMatchingV3>
  🎯 맞춤 추천      // 레이더 차트 + 이벤트 카드 리스트 + 빌드업 추천
  🔍 전체 기회      // 필터링(지원분야/카테고리/키워드) + 이벤트 그리드
</SmartMatchingV3>
```

### 라우팅 구조
```
/startup/matching              → 맞춤 추천 탭 (기본)
/startup/matching/all          → 전체 기회 탭
```

### 핵심 데이터 플로우
```
사용자 Core5 점수 (GO, EC, PT, PF, TO)
        ↓
KPI 진단 Context에서 실시간 점수 가져오기
        ↓
프로그램 요구사항과 충족도 계산 (5개 축 중 몇 개 충족)
        ↓
상태 결정: 추천(4+) / 준비중(2-3) / 미달(0-1)
        ↓
레이더 차트 시각화 + 이벤트 카드 표시
        ↓
빌드업 서비스 추천 (최대 2개)
```

---

## 🎯 탭 1: "맞춤 추천" 구현 현황

### 실제 구현 구조
```tsx
<CustomRecommendation>
  {/* 왼쪽: 레이더 차트 섹션 */}
  <RadarChartSection>
    <Core5RadarChart
      userScores={userScores}
      selectedEvent={selectedEvent}
      requirements={eventRequirements}
    />
    <ScoreDisplay /> // 5개 축 점수 표시
    <BuildupRecommendations /> // 추천 빌드업 서비스 (최대 2개)
  </RadarChartSection>

  {/* 오른쪽: 이벤트 카드 리스트 */}
  <EventCardList>
    {recommendations.map(rec => (
      <EventCard
        result={rec}
        onSelect={() => setSelectedEvent(rec.event.id)}
        isSelected={selectedEvent === rec.event.id}
        showStatus={true}
        compatibility={calculateCompatibility(userScores, rec.event.category)}
      />
    ))}
      <MatchingAnalysis>
        <Strengths>강점: PT(80점), GO(75점)</Strengths>
        <Weaknesses>보완: PF(55점), EC(65점)</Weaknesses>
        <Reasoning>현재 성장단계에서 정부지원을 통한 규모 확장에 최적화</Reasoning>
      </MatchingAnalysis>
    </RadarChartSection>

    {/* 오른쪽: 대안 추천 카드들 */}
    <AlternativesSection>
      <AlternativeCard>
        <MatchScore>78%</MatchScore>
        <Title>TIPS 프로그램</Title>
        <Organization>기술보증기금</Organization>
        <Description>R&D 특화 지원 프로그램</Description>
        <FundingAmount>최대 3억원</FundingAmount>
        <Deadline>D-45</Deadline>
        <RequiredScores>PT: 70, TO: 60</RequiredScores>
        <Features>R&D 특화, 기술멘토링, 특허지원</Features>
      </AlternativeCard>

      <AlternativeCard>
        <MatchScore>72%</MatchScore>
        <Title>K-Startup 그랜드챌린지</Title>
        <Organization>창업진흥원</Organization>
        <Description>글로벌 진출 지원 프로그램</Description>
        <FundingAmount>최대 2억원</FundingAmount>
        <Deadline>D-60</Deadline>
        <RequiredScores>GO: 75, PF: 60</RequiredScores>
        <Features>해외진출, 글로벌 네트워크, 데모데이</Features>
      </AlternativeCard>
    </AlternativesSection>
  </MainContent>

  {/* 3. 하단: 준비 체크리스트 */}
  <PreparationSection>
    <ChecklistTitle>준비 체크리스트</ChecklistTitle>
    <TaskList>
      <Task completed={true}>
        <Title>사업계획서 작성</Title>
        <Description>창업도약패키지 양식에 맞춘 사업계획서 업데이트</Description>
        <EstimatedHours>16시간</EstimatedHours>
        <Priority>높음</Priority>
      </Task>

      <Task completed={false}>
        <Title>재무제표 준비</Title>
        <Description>최근 3년간 재무제표 및 세무신고서류</Description>
        <EstimatedHours>8시간</EstimatedHours>
        <Priority>높음</Priority>
      </Task>

      <Task completed={false}>
        <Title>기술보호 서류</Title>
        <Description>특허, 상표권, 영업비밀 등 기술보호 관련 서류</Description>
        <EstimatedHours>4시간</EstimatedHours>
        <Priority>보통</Priority>
      </Task>
    </TaskList>

    <ProgressSummary>
      <TotalTasks>3개 태스크</TotalTasks>
      <CompletedTasks>1개 완료</CompletedTasks>
      <RemainingHours>12시간 남음</RemainingHours>
      <EstimatedCompletion>5일 예상</EstimatedCompletion>
    </ProgressSummary>
  </PreparationSection>

  {/* 4. 액션 버튼 */}
  <ActionButtons>
    <PrimaryButton>지금 시작하기</PrimaryButton>
    <SecondaryButton>상세 보기</SecondaryButton>
    <TertiaryButton>나중에 하기</TertiaryButton>
  </ActionButtons>
</CustomRecommendationTab>
```

### 핵심 로직
```typescript
interface NowActionEngine {
  // 로드맵 컨텍스트 분석
  analyzeRoadmap: (profile: UserProfile) => {
    currentQuarter: string;
    quarterGoal: string;
    progress: number;
    milestones: MilestoneStatus;
  };

  // THE ONE 액션 선정
  selectOptimalAction: (roadmap: Roadmap, programs: Program[]) => {
    primary: Program;        // 단 1개만
    alternatives: Program[]; // 접힌 상태로 2-3개
    reason: string;         // 선정 근거
    preparationPlan: Week[];
    expectedImpact: Impact;
  };

  // 체크리스트 매칭 (확률 제거)
  checklistMatching: (profile: UserProfile, program: Program) => {
    passed: string[];    // "Series A 적합"
    failed: string[];    // "매출 10억 필요"
    warnings: string[];  // "특허 보유 우대"
  };
}
```

---

## 📦 이벤트 데이터 구조 (20개 종합)

### 새로운 Mock 데이터 파일
```typescript
// src/data/smartMatching/comprehensiveEvents.ts
export const comprehensiveEvents: MatchingResult[] = [
  // 20개의 다양한 이벤트 포함
  // 카테고리: government_support, tips_program, vc_opportunity,
  //         accelerator, open_innovation, loan_program, bidding
  // 지원분야: '판로·해외진출·글로벌', '시설·공간·보육',
  //         'R&D 및 사업화 자금', '멘토링·컨설팅·교육', '융자'
];
```

### 이벤트 카드 컴포넌트
```typescript
// src/components/smartMatching/EventCard.tsx
interface EventCardProps {
  result: MatchingResult;
  onSelect?: () => void;
  isSelected?: boolean;
  showStatus?: boolean;  // CustomRecommendation에서만 true
  compatibility?: {
    meetCount: number;
    status: 'recommended' | 'preparing' | 'insufficient';
  };
}

// 카드 구조:
// [왼쪽 메인 영역]              [오른쪽 상세정보]
// • 제목 & D-Day               상세 정보
// • 설명                       • 카테고리
// • 신청기간                    • 지원분야
// • 키워드 태그                 • 주관기관
// • 상태 표시 (준비상태)         • 지원규모
// • [원문보기] [빌더상담]      • 수행기간
```

## 🔍 탭 2: "전체 기회" 구현 현황

### 실제 구현 구조
```tsx
<AllOpportunities>
  {/* 필터 영역 */}
  <FilterSection>
    {/* 키워드 검색 */}
    <SearchInput value={searchKeyword} />

    {/* 지원분야 필터 */}
    <SupportFieldFilter
      options={['전체', '판로·해외진출·글로벌', '시설·공간·보육',
               'R&D 및 사업화 자금', '멘토링·컨설팅·교육', '융자']}
      selected={selectedSupportField}
    />

    {/* 카테고리 필터 */}
    <CategoryFilter
      options={categoryOptions}
      selected={selectedCategory}
    />
      <DeadlineFilter
        options={['이번 주', '이번 달', '다음 달', '전체']}
        value={filters.deadlineRange}
        customRange={filters.customDateRange}
      />
      <FundingFilter
        ranges={[
          { label: '1억 이하', min: 0, max: 100000000 },
          { label: '1-3억', min: 100000000, max: 300000000 },
          { label: '3억 이상', min: 300000000, max: null }
        ]}
        selected={filters.fundingRange}
      />
    </FilterRow>

    <FilterRow>
      <DifficultyFilter
        options={[
          { value: 'easy', label: '쉬움', color: 'green' },
          { value: 'medium', label: '보통', color: 'orange' },
          { value: 'hard', label: '어려움', color: 'red' }
        ]}
        selected={filters.difficulties}
      />
      <OrganizationFilter
        options={availableOrganizations}
        selected={filters.organizations}
        showPopular={true}
      />
      <SearchInput
        value={searchQuery}
        placeholder="프로그램명, 기관명, 키워드 검색"
        suggestions={searchSuggestions}
      />
    </FilterRow>
  </FilterSection>

  {/* 2. 정렬 및 뷰 옵션 */}
  <SortingControls>
    <SortDropdown
      options={[
        { value: 'matchScore', label: '매칭도 높은순' },
        { value: 'deadline', label: '마감일 임박순' },
        { value: 'fundingAmount', label: '지원금액 높은순' }
      ]}
      selected={sortBy}
    />
    <ViewToggle
      options={['grid', 'list']}
      selected={viewMode}
    />
  </SortingControls>

  {/* 3. 결과 헤더 */}
  <ResultsHeader>
    <ResultsCount>총 {totalResults}개 프로그램</ResultsCount>
    <ActiveFilters>
      {appliedFilters.map(filter => (
        <FilterChip onRemove={() => removeFilter(filter)}>
          {filter.label}
        </FilterChip>
      ))}
    </ActiveFilters>
    <ClearAllButton onClick={clearAllFilters}>
      모든 필터 초기화
    </ClearAllButton>
  </ResultsHeader>

  {/* 4. 프로그램 그리드 */}
  <ProgramGrid viewMode={viewMode}>
    {programs.map(program => (
      <ProgramCard key={program.id}>
        <CardHeader>
          <MatchScore color={getMatchScoreColor(program.matchScore)}>
            {program.matchScore}%
          </MatchScore>
          <BookmarkButton
            isBookmarked={program.isBookmarked}
            onClick={() => toggleBookmark(program.id)}
          />
          <StatusBadge status={program.status}>
            {program.status === 'closing_soon' && '마감임박'}
            {program.status === 'open' && '접수중'}
          </StatusBadge>
        </CardHeader>

        <CardContent>
          <Title>{program.title}</Title>
          <Organization>{program.organization}</Organization>
          <Description>{program.description}</Description>

          <KeyMetrics>
            <FundingAmount>{program.fundingAmount}</FundingAmount>
            <Deadline urgency={getUrgencyLevel(program.deadline)}>
              D-{calculateDaysLeft(program.deadline)}
            </Deadline>
            <Difficulty level={program.difficulty}>
              {getDifficultyText(program.difficulty)}
            </Difficulty>
          </KeyMetrics>

          <RequirementBars>
            {Object.entries(program.requiredScores).map(([axis, required]) => (
              <RequirementBar
                key={axis}
                axis={axis}
                required={required}
                userScore={userScores[axis]}
                status={userScores[axis] >= required ? 'pass' : 'fail'}
              />
            ))}
          </RequirementBars>

          <Tags>
            {program.tags.slice(0, 3).map(tag => (
              <Tag key={tag} type={getTagType(tag)}>
                {tag}
              </Tag>
            ))}
            {program.tags.length > 3 && (
              <MoreTagsIndicator>+{program.tags.length - 3}</MoreTagsIndicator>
            )}
          </Tags>
        </CardContent>

        <CardActions>
          <SecondaryButton onClick={() => viewDetails(program.id)}>
            상세보기
          </SecondaryButton>
          <PrimaryButton onClick={() => startApplication(program.id)}>
            지원하기
          </PrimaryButton>
        </CardActions>
      </ProgramCard>
    ))}
  </ProgramGrid>

  {/* 5. 페이지네이션 */}
  <Pagination
    currentPage={currentPage}
    totalPages={totalPages}
    onPageChange={setCurrentPage}
    pageSize={pageSize}
    onPageSizeChange={setPageSize}
  />
</AllOpportunitiesTab>
```

### 필터 및 검색 로직
```typescript
interface FilterOptions {
  categories: ProgramCategory[];
  deadlineRange: 'thisWeek' | 'thisMonth' | 'nextMonth' | 'all';
  customDateRange?: { start: Date; end: Date };
  fundingRange?: { min: number; max: number };
  difficulties: Array<'easy' | 'medium' | 'hard'>;
  organizations: string[];
  minMatchScore: number;
  keywords: string[];
}

interface ProgramCard {
  id: string;
  title: string;
  organization: string;
  description: string;
  matchScore: number;
  fundingAmount: string;
  deadline: Date;
  difficulty: 'easy' | 'medium' | 'hard';
  requiredScores: Partial<Core5Scores>;
  tags: string[];
  status: 'open' | 'closing_soon' | 'closed';
  isBookmarked: boolean;
  category: ProgramCategory;
  competitionRate?: string;
}
```

---

## 🌳 상세 컴포넌트 트리 & 데이터 속성

### 맞춤 추천 탭 컴포넌트 트리
```
📁 CustomRecommendationTab
├── 📄 TheOneHeader
│   ├── matchScore: number (89)
│   ├── matchScoreColor: string ('#10B981' for 85+)
│   ├── programTitle: string
│   ├── organization: string
│   └── lastUpdated: Date
│
├── 📄 MainContent
│   ├── 📊 RadarChartSection
│   │   ├── 🎂 Core5RadarChart
│   │   │   ├── userScores: Core5Scores
│   │   │   │   ├── GO: number (75)
│   │   │   │   ├── EC: number (65)
│   │   │   │   ├── PT: number (80)
│   │   │   │   ├── PF: number (55)
│   │   │   │   └── TO: number (70)
│   │   │   ├── targetScores: Core5Scores
│   │   │   │   ├── GO: number (70)
│   │   │   │   ├── EC: number (60)
│   │   │   │   ├── PT: number (75)
│   │   │   │   ├── PF: number (50)
│   │   │   │   └── TO: number (65)
│   │   │   ├── averageScores: Core5Scores
│   │   │   ├── chartConfig
│   │   │   │   ├── size: number (400)
│   │   │   │   ├── strokeWidth: number (2)
│   │   │   │   ├── colors
│   │   │   │   │   ├── user: '#3B82F6' (파란색 실선)
│   │   │   │   │   ├── target: '#EF4444' (빨간색 점선)
│   │   │   │   │   ├── average: '#9CA3AF' (회색 배경)
│   │   │   │   │   ├── match: '#10B981' (녹색 하이라이트)
│   │   │   │   │   └── deficit: '#F59E0B' (주황색 경고)
│   │   │   │   └── animations
│   │   │   │       ├── duration: 800
│   │   │   │       └── easing: 'ease-out'
│   │   │   ├── matchingAreas: string[] (['PT', 'GO'])
│   │   │   ├── deficitAreas: string[] (['PF', 'EC'])
│   │   │   └── hoverData: AxisHoverData
│   │   │       ├── axis: keyof Core5Scores
│   │   │       ├── userScore: number
│   │   │       ├── targetScore: number
│   │   │       ├── gap: number
│   │   │       └── description: string
│   │   │
│   │   └── 🎯 MatchingAnalysis
│   │       ├── overallMatch: number (89)
│   │       ├── strengths: StrengthAnalysis[]
│   │       │   ├── axis: keyof Core5Scores
│   │       │   ├── userScore: number
│   │       │   ├── requiredScore: number
│   │       │   ├── advantage: number
│   │       │   ├── description: string
│   │       │   └── color: string
│   │       ├── weaknesses: WeaknessAnalysis[]
│   │       │   ├── axis: keyof Core5Scores
│   │       │   ├── userScore: number
│   │       │   ├── requiredScore: number
│   │       │   ├── gap: number
│   │       │   ├── improvementSuggestion: string
│   │       │   └── color: string
│   │       ├── reasoning: string
│   │       └── expectedOutcome: string
│   │
│   └── 📚 AlternativesSection
│       ├── sectionTitle: string
│       ├── totalAlternatives: number
│       ├── visibleCount: number (2)
│       ├── showAll: boolean
│       └── alternatives: AlternativeCard[]
│           └── 🃏 AlternativeCard
│               ├── program: AlternativeRecommendation
│               │   ├── id: string
│               │   ├── title: string
│               │   ├── organization: string
│               │   ├── description: string (max 100 chars)
│               │   ├── matchScore: number
│               │   ├── matchScoreTier: 'excellent' | 'good' | 'fair'
│               │   ├── matchScoreColor: string
│               │   ├── fundingAmount: string
│               │   ├── deadline: Date
│               │   ├── daysLeft: number
│               │   ├── urgencyLevel: 'high' | 'medium' | 'low'
│               │   ├── urgencyColor: string
│               │   ├── difficulty: 'easy' | 'medium' | 'hard'
│               │   ├── difficultyColor: string
│               │   ├── difficultyStars: number (1-3)
│               │   └── category: ProgramCategory
│               ├── 🎯 RequiredScoreChips
│               │   └── scoreChips: ScoreChip[]
│               │       ├── axis: keyof Core5Scores
│               │       ├── axisLabel: string
│               │       ├── requiredScore: number
│               │       ├── userScore: number
│               │       ├── status: 'pass' | 'fail' | 'marginal'
│               │       ├── statusColor: string
│               │       ├── gap: number
│               │       └── gapText: string
│               ├── 🏷️ UniqueFeatures
│               │   └── features: FeatureBadge[]
│               │       ├── text: string
│               │       ├── type: 'funding' | 'mentoring' | 'networking' | 'global'
│               │       ├── icon: string
│               │       └── color: string
│               └── 🎬 CardActions
│                   ├── viewDetails: ButtonConfig
│                   ├── bookmark: ButtonConfig
│                   ├── isBookmarked: boolean
│                   └── apply: ButtonConfig
│
├── 📋 PreparationSection
│   ├── sectionTitle: string
│   ├── tasks: PreparationTask[]
│   │   ├── 📝 Task
│   │   │   ├── id: string
│   │   │   ├── title: string
│   │   │   ├── description: string
│   │   │   ├── isCompleted: boolean
│   │   │   ├── completedAt?: Date
│   │   │   ├── estimatedHours: number
│   │   │   ├── priority: 'high' | 'medium' | 'low'
│   │   │   ├── priorityColor: string
│   │   │   ├── dependencies: string[]
│   │   │   ├── requiredDocuments: string[]
│   │   │   ├── status: 'not_started' | 'in_progress' | 'completed'
│   │   │   ├── statusColor: string
│   │   │   ├── statusIcon: string
│   │   │   └── progressPercentage: number
│   │   └── onToggleComplete: (taskId: string) => void
│   │
│   └── 📊 ProgressSummary
│       ├── totalTasks: number
│       ├── completedTasks: number
│       ├── totalEstimatedHours: number
│       ├── remainingHours: number
│       ├── overallProgress: number (0-100)
│       ├── estimatedCompletionDate: Date
│       └── progressBarColor: string
│
└── 🎬 ActionButtons
    ├── primaryAction: ButtonConfig
    │   ├── label: "지금 시작하기"
    │   ├── onClick: () => startApplication(id)
    │   ├── variant: 'primary'
    │   ├── icon: PlayIcon
    │   ├── disabled: boolean
    │   └── loadingState: boolean
    ├── secondaryAction: ButtonConfig
    │   ├── label: "상세 보기"
    │   ├── onClick: () => viewDetails(id)
    │   ├── variant: 'secondary'
    │   └── icon: EyeIcon
    └── tertiaryAction: ButtonConfig
        ├── label: "나중에 하기"
        ├── onClick: () => postpone(id)
        ├── variant: 'ghost'
        └── icon: ClockIcon
```

### 전체 기회 탭 컴포넌트 트리
```
📁 AllOpportunitiesTab
├── 🎛️ FilterSection
│   ├── 🏷️ CategoryFilter
│   │   ├── selectedCategories: ProgramCategory[]
│   │   ├── availableCategories: CategoryOption[]
│   │   │   ├── value: ProgramCategory
│   │   │   ├── label: string
│   │   │   ├── icon: string
│   │   │   ├── color: string
│   │   │   └── count: number
│   │   ├── isMultiSelect: boolean
│   │   ├── placeholder: string
│   │   └── onSelectionChange: (categories: ProgramCategory[]) => void
│   │
│   ├── 📅 DeadlineFilter
│   │   ├── selectedRange: DeadlineRange
│   │   ├── customDateRange?: DateRange
│   │   ├── presets: DatePreset[]
│   │   │   ├── label: string
│   │   │   ├── value: string
│   │   │   └── range: DateRange
│   │   ├── showCustomPicker: boolean
│   │   └── onChange: (range: DeadlineRange) => void
│   │
│   ├── 💰 FundingFilter
│   │   ├── selectedRange?: FundingRange
│   │   ├── ranges: FundingRange[]
│   │   │   ├── label: string
│   │   │   ├── min: number
│   │   │   ├── max: number
│   │   │   └── count: number
│   │   ├── showCustomRange: boolean
│   │   └── onChange: (range: FundingRange) => void
│   │
│   ├── 📊 DifficultyFilter
│   │   ├── selectedDifficulties: Difficulty[]
│   │   ├── options: DifficultyOption[]
│   │   │   ├── value: Difficulty
│   │   │   ├── label: string
│   │   │   ├── icon: string
│   │   │   ├── color: string
│   │   │   └── description: string
│   │   └── onChange: (difficulties: Difficulty[]) => void
│   │
│   ├── 🏢 OrganizationFilter
│   │   ├── selectedOrganizations: string[]
│   │   ├── availableOrganizations: OrganizationOption[]
│   │   │   ├── name: string
│   │   │   ├── type: 'government' | 'public' | 'private'
│   │   │   ├── logo?: string
│   │   │   └── programCount: number
│   │   ├── showPopular: boolean
│   │   └── onChange: (orgs: string[]) => void
│   │
│   └── 🔍 SearchInput
│       ├── query: string
│       ├── placeholder: string
│       ├── suggestions: string[]
│       ├── recentSearches: string[]
│       ├── isSearching: boolean
│       ├── onQueryChange: (query: string) => void
│       └── onSearch: (query: string) => void
│
├── 🎛️ SortingControls
│   ├── sortBy: SortOption
│   ├── sortOrder: 'asc' | 'desc'
│   ├── viewMode: 'grid' | 'list'
│   ├── itemsPerPage: number
│   ├── showFilters: boolean
│   └── onConfigChange: (config: SortConfig) => void
│
├── 📊 ResultsHeader
│   ├── totalResults: number
│   ├── filteredResults: number
│   ├── activeFiltersCount: number
│   ├── appliedFilters: ActiveFilter[]
│   │   ├── type: string
│   │   ├── label: string
│   │   ├── value: any
│   │   └── onRemove: () => void
│   ├── clearAllFilters: () => void
│   └── exportResults: () => void
│
└── 📱 ProgramGrid
    ├── programs: Program[]
    ├── viewMode: 'grid' | 'list'
    ├── isLoading: boolean
    ├── isError: boolean
    ├── errorMessage?: string
    ├── isEmpty: boolean
    │
    └── 🃏 ProgramCard[]
        ├── program: Program
        │   ├── id: string
        │   ├── title: string
        │   ├── organization: string
        │   ├── description: string
        │   ├── matchScore: number
        │   ├── matchScoreTier: ScoreTier
        │   ├── fundingAmount: string
        │   ├── deadline: Date
        │   ├── daysLeft: number
        │   ├── urgencyLevel: UrgencyLevel
        │   ├── difficulty: Difficulty
        │   ├── difficultyStars: number (1-3)
        │   ├── estimatedPreparationDays: number
        │   ├── competitionRate?: string
        │   ├── tags: string[]
        │   ├── status: ProgramStatus
        │   ├── isBookmarked: boolean
        │   ├── category: ProgramCategory
        │   ├── categoryIcon: string
        │   ├── categoryColor: string
        │   └── requiredScores: Partial<Core5Scores>
        │
        ├── 🎯 MatchingInfo
        │   ├── matchScore: number
        │   ├── matchScoreColor: string
        │   ├── isRecommended: boolean
        │   ├── 📊 RequirementBars
        │   │   └── bars: RequirementBar[]
        │   │       ├── axis: keyof Core5Scores
        │   │       ├── axisLabel: string
        │   │       ├── requiredScore: number
        │   │       ├── userScore: number
        │   │       ├── percentage: number
        │   │       ├── status: BarStatus
        │   │       ├── statusColor: string
        │   │       └── barFillColor: string
        │   └── strengthsCount: number
        │
        ├── 🏷️ TagSection
        │   ├── primaryTags: Tag[] (max 3)
        │   │   ├── text: string
        │   │   ├── type: TagType
        │   │   ├── color: string
        │   │   └── icon?: string
        │   ├── hiddenTagsCount: number
        │   └── showAllTags: boolean
        │
        ├── 🕒 TimelineInfo
        │   ├── applicationStartDate: Date
        │   ├── applicationEndDate: Date
        │   ├── selectionDate?: Date
        │   ├── projectStartDate?: Date
        │   ├── currentPhase: Phase
        │   ├── phaseColor: string
        │   └── timeline: TimelinePoint[]
        │       ├── date: Date
        │       ├── label: string
        │       ├── status: 'completed' | 'current' | 'upcoming'
        │       └── isImportant: boolean
        │
        ├── 💼 BenefitsInfo
        │   ├── primaryBenefit: string
        │   ├── additionalBenefits: string[]
        │   ├── totalValue: number
        │   └── benefitIcons: string[]
        │
        ├── 🎯 UserActions
        │   ├── isBookmarked: boolean
        │   ├── bookmarkCount: number
        │   ├── viewCount: number
        │   ├── applicationCount: number
        │   ├── lastViewed?: Date
        │   └── actionHistory: UserAction[]
        │       ├── action: ActionType
        │       ├── timestamp: Date
        │       └── metadata?: any
        │
        └── 🎬 CardActions
            ├── primaryActions: CardAction[]
            │   ├── type: ActionType
            │   ├── label: string
            │   ├── icon: string
            │   ├── onClick: () => void
            │   ├── variant: ButtonVariant
            │   ├── disabled: boolean
            │   └── badge?: string | number
            ├── contextMenuActions: CardAction[]
            └── quickActions: CardAction[]
```

### 색상 및 상태 매핑 시스템
```typescript
// 매칭 점수별 색상 및 티어
const matchScoreMapping = {
  excellent: { min: 85, color: '#10B981', label: '최적 매칭' },
  good: { min: 70, color: '#3B82F6', label: '좋은 매칭' },
  fair: { min: 55, color: '#F59E0B', label: '보통 매칭' },
  poor: { min: 0, color: '#EF4444', label: '낮은 매칭' }
};

// 긴급도별 색상 및 아이콘
const urgencyMapping = {
  high: { maxDays: 7, color: '#EF4444', icon: 'AlertTriangle', label: '긴급' },
  medium: { maxDays: 30, color: '#F59E0B', icon: 'Clock', label: '보통' },
  low: { maxDays: Infinity, color: '#10B981', icon: 'CheckCircle', label: '여유' }
};

// 난이도별 색상, 아이콘, 별점
const difficultyMapping = {
  easy: { stars: 1, color: '#10B981', icon: 'ThumbsUp', label: '쉬움' },
  medium: { stars: 2, color: '#F59E0B', icon: 'Minus', label: '보통' },
  hard: { stars: 3, color: '#EF4444', icon: 'AlertOctagon', label: '어려움' }
};

// 프로그램 상태별 색상 및 아이콘
const statusMapping = {
  open: { color: '#10B981', icon: 'CheckCircle', label: '접수중' },
  closing_soon: { color: '#F59E0B', icon: 'Clock', label: '마감임박' },
  closed: { color: '#6B7280', icon: 'XCircle', label: '마감' }
};

// 카테고리별 색상 및 아이콘
const categoryMapping = {
  government_support: { color: '#3B82F6', icon: 'Building', label: '정부지원사업' },
  tips_rd: { color: '#8B5CF6', icon: 'Flask', label: 'TIPS/R&D' },
  investment: { color: '#10B981', icon: 'TrendingUp', label: '투자/IR' },
  accelerator: { color: '#F59E0B', icon: 'Rocket', label: '액셀러레이터' },
  global: { color: '#06B6D4', icon: 'Globe', label: '해외진출' }
};
```

---

## 🔧 핵심 엔진 구현

### 로드맵 기반 매칭 엔진
```typescript
class RoadmapMatchingEngine {
  // 1. 현재 로드맵 분석
  analyzeCurrentRoadmap(profile: UserProfile): RoadmapContext {
    const cluster = `${profile.stage}-${profile.sector}`;
    const template = this.getClusterTemplate(cluster);

    return {
      currentQuarter: this.getCurrentQuarter(),
      quarterGoal: template.goalDescription,
      progress: this.calculateProgress(template, profile.completedMilestones),
      criticalGaps: this.identifyCriticalGaps(template, profile)
    };
  }

  // 2. 최적 액션 선정 (THE ONE)
  selectOptimalAction(roadmap: RoadmapContext, programs: Program[]): OptimalAction {
    // 단계별 필터링
    const stageFiltered = programs.filter(p =>
      p.requirements.stages.includes(roadmap.currentStage)
    );

    // 점수 계산
    const scored = stageFiltered.map(program => ({
      program,
      score: this.calculateActionScore(program, roadmap)
    }));

    // 정렬 및 선정
    const sorted = scored.sort((a, b) => b.score - a.score);

    return {
      primary: sorted[0].program,
      alternatives: sorted.slice(1, 3),
      reason: this.generateReason(sorted[0], roadmap),
      preparationPlan: this.generatePreparationPlan(sorted[0].program),
      expectedImpact: this.calculateExpectedImpact(sorted[0].program, roadmap)
    };
  }

  // 3. 우선순위 계산 공식
  calculateActionScore(program: Program, roadmap: RoadmapContext): number {
    const roadmapContribution = this.calculateRoadmapContribution(program, roadmap.quarterGoal);
    const urgencyScore = this.calculateUrgency(program.deadline);
    const fitnessScore = this.calculateFitness(program, roadmap.profile);

    // 가중치: 로드맵 기여도 40% + 긴급도 30% + 적합도 30%
    return (roadmapContribution * 0.4) + (urgencyScore * 0.3) + (fitnessScore * 0.3);
  }
}
```

### 알림 시스템
```typescript
interface NotificationSystem {
  // 알림 설정 UI (모달)
  settings: {
    quickSettings: {
      newMatching: boolean;      // 새 THE ONE 알림
      deadlineAlert: boolean;    // 마감 임박 알림
      weeklyReport: boolean;     // 주간 진행 리포트
    };
    channels: {
      email: { enabled: boolean; address: string; };
      sms: { enabled: boolean; number: string; };
      push: { enabled: boolean; };
    };
    preferences: {
      categories: string[];      // 관심 프로그램 카테고리
      keywords: string[];        // 커스텀 키워드
      regions: string[];         // 관심 지역
    };
  };

  // 발송 트리거
  triggers: {
    newOptimalAction: (action: OptimalAction) => void;
    deadlineApproaching: (program: Program, days: number) => void;
    progressUpdate: (progress: ProgramProgress) => void;
    blockerDetected: (blocker: Blocker) => void;
  };
}
```

---

## 🗓️ 개발 로드맵 (4 Phase / 20일) - 2탭 구조

### Phase 1: 기본 구조 및 라우팅 (5일)
**목표**: 2탭 네비게이션 및 기본 레이아웃

#### Day 1-2: 프로젝트 초기화
- [x] 기존 스마트 매칭 코드 완전 삭제
- [ ] 새로운 폴더 구조 생성
```
src/pages/startup/smartMatching/
├── index.tsx                        // 메인 컨테이너
├── tabs/
│   ├── CustomRecommendationTab.tsx  // 맞춤 추천 탭
│   └── AllOpportunitiesTab.tsx      // 전체 기회 탭
├── components/
│   ├── RadarChart.tsx               // Core5 레이더 차트
│   ├── TheOneCard.tsx               // THE ONE 추천 카드
│   ├── AlternativeCard.tsx          // 대안 추천 카드
│   ├── ProgramCard.tsx              // 프로그램 카드
│   ├── FilterSection.tsx            // 필터 영역
│   └── PreparationChecklist.tsx     // 준비 체크리스트
├── services/
│   ├── matchingEngine.ts            // 매칭 엔진
│   ├── filterService.ts             // 필터링 서비스
│   └── programService.ts            // 프로그램 데이터 서비스
└── types/
    ├── smartMatching.types.ts       // 기본 타입들
    └── program.types.ts             // 프로그램 타입들
```

#### Day 3-4: 라우팅 및 네비게이션
- [ ] App.tsx 라우팅 설정
```tsx
<Route path="/startup/matching" element={<SmartMatchingPage />}>
  <Route index element={<CustomRecommendationTab />} />
  <Route path="all" element={<AllOpportunitiesTab />} />
</Route>
```
- [ ] 2탭 네비게이션 UI 구현
- [ ] URL 기반 탭 전환 로직

#### Day 5: 기본 레이아웃 및 컴포넌트
- [ ] 메인 페이지 헤더
- [ ] 2개 탭 기본 레이아웃 (빈 상태)
- [ ] 로딩 상태 및 에러 핸들링

### Phase 2: Core5 기반 매칭 시스템 (5일)
**목표**: 레이더 차트 + THE ONE 추천 엔진

#### Day 6-7: Core5 레이더 차트 구현
- [ ] KPIDiagnosisContext에서 Core5 점수 가져오기
- [ ] RadarChart 컴포넌트 구현 (SVG 기반)
- [ ] 3레이어 시각화 (사용자/요구사항/평균)
- [ ] 호버 인터랙션 및 애니메이션

#### Day 8-9: 매칭 엔진 개발
- [ ] Mock 프로그램 데이터 구조 생성
- [ ] Core5 점수 기반 매칭 알고리즘
- [ ] THE ONE 선정 로직 (최고 매칭도)
- [ ] 대안 추천 2-3개 선정

#### Day 10: 맞춤 추천 탭 완성
- [ ] TheOneCard 컴포넌트
- [ ] AlternativeCard 컴포넌트들
- [ ] 매칭 분석 섹션
- [ ] 준비 체크리스트

### Phase 3: 전체 기회 탐색 시스템 (5일)
**목표**: 필터링 + 검색 + 프로그램 그리드

#### Day 11-12: 필터링 시스템
- [ ] CategoryFilter, DeadlineFilter, FundingFilter 구현
- [ ] DifficultyFilter, OrganizationFilter 구현
- [ ] SearchInput with 자동완성
- [ ] 필터 상태 관리 및 URL 동기화

#### Day 13-14: 프로그램 그리드
- [ ] ProgramCard 컴포넌트 (그리드/리스트 뷰)
- [ ] 매칭도 시각화 (RequirementBars)
- [ ] 북마크, 상세보기, 지원하기 액션
- [ ] 페이지네이션 및 무한스크롤

#### Day 15: 정렬 및 뷰 옵션
- [ ] SortingControls (매칭도/마감일/금액순)
- [ ] ViewToggle (그리드/리스트)
- [ ] ResultsHeader with 활성 필터 표시
- [ ] 전체 기회 탭 완성

### Phase 4: 통합 및 완성 (5일)
**목표**: 데이터 연동 + 최적화 + 테스트

#### Day 16-17: Context 및 상태 관리
- [ ] SmartMatchingContext 구현
- [ ] 실시간 Core5 점수 업데이트 감지
- [ ] 북마크, 지원 상태 관리
- [ ] localStorage 기반 설정 저장

#### Day 18-19: 데이터 서비스 구현
- [ ] mockPrograms.ts 확장 (50+ 프로그램)
- [ ] 실제 정부지원사업 데이터 구조
- [ ] 필터링 성능 최적화
- [ ] 검색 알고리즘 고도화

#### Day 20: 최종 통합 및 테스트
- [ ] 전체 플로우 테스트
- [ ] 반응형 UI 검증
- [ ] 에러 핸들링 보완
- [ ] 성능 최적화 및 배포 준비

---

## 📊 성공 지표

### 정량 지표 (측정 가능)
- **의사결정 시간**: 10분 → 3분 (70% 단축)
- **매칭도 정확성**: 80%+ (사용자 피드백 기준)
- **필터 사용률**: 60%+ (전체 기회 탭)
- **프로그램 지원 전환율**: 25%+
- **북마크 사용률**: 40%+

### 정성 지표 (설문 기반)
- **"추천이 내 상황에 맞다"**: 85%+
- **"원하는 프로그램을 쉽게 찾을 수 있다"**: 80%+
- **"준비해야 할 것이 구체적이다"**: 85%+
- **"다른 선택지도 충분히 검토할 수 있다"**: 80%+

---

## 🎨 UI/UX 가이드라인

### 디자인 원칙
1. **Zero Thinking**: 선택하게 하지 말고 따라하게 만들기
2. **Scannable**: 3초 안에 핵심 정보 파악 가능
3. **Actionable**: 모든 정보에는 구체적인 액션 연결
4. **Progressive**: 기본→고급 정보 단계적 노출

### 색상 시스템
```css
/* 메인 액션 */
--action-primary: #2563eb;      /* 파란색 - THE ONE */
--action-secondary: #10b981;    /* 녹색 - 진행 중 */
--action-warning: #f59e0b;      /* 주황색 - 주의 필요 */
--action-danger: #ef4444;       /* 빨간색 - 긴급 */

/* 상태 표시 */
--status-completed: #22c55e;    /* 완료 */
--status-progress: #3b82f6;     /* 진행 중 */
--status-pending: #6b7280;      /* 대기 중 */
--status-blocked: #f87171;      /* 막힘 */
```

### 타이포그래피
```css
/* 헤더 */
.action-title { font-size: 1.5rem; font-weight: 700; }
.section-title { font-size: 1.125rem; font-weight: 600; }

/* 바디 */
.body-primary { font-size: 0.875rem; line-height: 1.5; }
.body-secondary { font-size: 0.75rem; color: #6b7280; }

/* 강조 */
.highlight { font-weight: 600; color: #2563eb; }
.urgent { font-weight: 700; color: #ef4444; }
```

---

## 🔗 연관 시스템 연동

### KPI 진단 시스템
- Core5 점수 실시간 연동
- 점수 변화 감지 시 매칭 업데이트
- 축별 약점 개선 프로그램 추천

### 포켓빌드업 시스템
- 추천 액션 → 즉시 서비스 구매 연결
- 3주 준비 로드맵 → 단계별 서비스 매칭
- 막힌 부분 → 관련 전문가 추천

### 클러스터 시스템
- 성장단계 변경 시 자동 재매칭
- 섹터별 특화 프로그램 우선 추천
- 마일스톤 완료 시 다음 단계 기회 제안

---

## ⚠️ 주의사항 및 제약

### 기술적 제약
1. **실제 API 연동 전까지 목업 데이터 사용**
2. **알림 발송은 localStorage 저장까지만 구현**
3. **포켓빌더 연계는 버튼 UI만 구현**

### 개발 우선순위
1. **THE ONE 시스템이 최우선** (전체 시스템의 핵심)
2. **진행 관리는 기본 기능까지만** (고도화는 후순위)
3. **파이프라인은 목업 수준에서 시작** (로직은 추후)

### 데이터 의존성
1. **클러스터 마일스톤 시스템 필수 의존**
2. **KPI 점수 Context 연동 필수**
3. **실제 프로그램 데이터는 단계적 구축**

---

## 🎯 최종 목표

스마트 매칭을 **"수백 개 프로그램의 바다"**가 아닌 **"KPI 기반 개인화된 추천 시스템"**으로 완성하여, 스타트업 CEO가 **"내 상황에 딱 맞는 프로그램"**을 바로 찾고 **"체계적으로 준비할 수 있는 도구"**를 제공하는 것입니다.

### 성공 시나리오
```
사용자 로그인
→ 스마트 매칭 진입
→ 레이더 차트로 매칭도 확인 (89%)
→ "이 프로그램이 내게 최적이구나"
→ 준비 체크리스트로 단계별 실행
→ 전체 기회에서 다른 옵션들도 탐색
→ 필터링으로 원하는 조건 검색
→ 북마크로 관심 프로그램 관리
```

이것이 **진정한 개인화 추천 시스템**입니다! 🚀

---

## 📝 구현 완료 체크리스트

### 필수 구현 사항
- [ ] 2탭 구조 (맞춤 추천 + 전체 기회)
- [ ] Core5 레이더 차트 (3레이어)
- [ ] THE ONE 추천 + 대안 2-3개
- [ ] 준비 체크리스트 (태스크 관리)
- [ ] 프로그램 카드 그리드
- [ ] 다중 필터링 시스템
- [ ] 매칭도 시각화
- [ ] KPI Context 연동
- [ ] 북마크 기능
- [ ] 반응형 UI

### 고도화 사항
- [ ] 실시간 점수 업데이트
- [ ] 고급 검색 (자동완성)
- [ ] 프로그램 상세 페이지
- [ ] 지원 진행 상황 추적
- [ ] 알림 시스템
- [ ] 데이터 내보내기
- [ ] 성능 최적화

---

## 🚀 실제 개발 순서 가이드

### 📌 1단계: 기본 골격 구축 (30분)

#### 1-1. 폴더 구조 및 타입 시스템 설정 (10분)
```bash
# 1. 디렉토리 생성
src/pages/startup/smartMatching/
├── index.tsx                    # 메인 컨테이너
├── tabs/
│   ├── CustomRecommendation.tsx # 맞춤 추천 탭
│   └── AllOpportunities.tsx     # 전체 기회 탭
└── types/
    └── index.ts                 # 타입 정의
```

```typescript
// 2. 기본 타입 정의 (types/index.ts)
export interface Core5Scores {
  GO: number;  // Growth Opportunity (성장기회)
  EC: number;  // Execution Capability (실행역량)
  PT: number;  // Product Technology (제품기술)
  PF: number;  // Platform (플랫폼)
  TO: number;  // Team Organization (팀조직)
}

export type TabType = 'custom' | 'all';

export interface Program {
  id: string;
  title: string;
  organization: string;
  matchScore: number;
  deadline: Date;
  fundingAmount: string;
  requiredScores: Partial<Core5Scores>;
}
```

#### 1-2. 라우팅 설정 및 기본 컨테이너 (10분)
```tsx
// 1. App.tsx에 라우팅 추가
<Route path="matching" element={<SmartMatchingContainer />}>
  <Route index element={<Navigate to="custom" replace />} />
  <Route path="custom" element={<CustomRecommendation />} />
  <Route path="all" element={<AllOpportunities />} />
</Route>

// 2. index.tsx - 메인 컨테이너 구현
import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Target, Grid } from 'lucide-react';

const SmartMatchingContainer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname.includes('all') ? 'all' : 'custom';

  const tabs = [
    { id: 'custom', label: '맞춤 추천', icon: Target, path: '/startup/matching/custom' },
    { id: 'all', label: '전체 기회', icon: Grid, path: '/startup/matching/all' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl font-bold py-4">스마트 매칭</h1>
          <nav className="flex gap-8">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={`py-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </div>
    </div>
  );
};

export default SmartMatchingContainer;
```

#### 1-3. 빈 탭 컴포넌트 및 동작 확인 (10분)
```tsx
// tabs/CustomRecommendation.tsx
import React from 'react';

const CustomRecommendation = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">맞춤 추천</h2>
      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
          <p>THE ONE 추천이 여기 표시됩니다</p>
          <p className="text-sm mt-2">레이더 차트 + 매칭 분석</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500">
            대안 추천 1
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500">
            대안 추천 2
          </div>
        </div>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500">
          준비 체크리스트
        </div>
      </div>
    </div>
  );
};

export default CustomRecommendation;

// tabs/AllOpportunities.tsx
import React from 'react';

const AllOpportunities = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">전체 기회</h2>
      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500">
          필터 섹션
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500">
              프로그램 카드 {i}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AllOpportunities;
```

**✅ 체크포인트**
1. `/startup/matching` 접속 시 맞춤 추천 탭 기본 표시
2. 탭 클릭 시 URL 변경 및 컴포넌트 전환 확인
3. 레이아웃 구조 정상 표시 (헤더, 탭, 콘텐츠)
4. 콘솔 에러 없음

**🚨 트러블슈팅**
- Import 에러: `lucide-react` 설치 필요 (`npm install lucide-react`)
- 라우팅 안됨: App.tsx import 경로 확인
- 스타일 안보임: Tailwind CSS 설정 확인

이 단계를 완료하면 기본 골격이 완성되어 이후 컴포넌트 개발이 수월해집니다.

---

### 📌 2단계: 타입 정의 (30분)

#### 2-1. Core 타입 시스템 구축 (10분)
```typescript
// types/index.ts - 핵심 타입 정의
export interface Core5Scores {
  GO: number;  // Growth Opportunity (성장기회) 0-100
  EC: number;  // Execution Capability (실행역량) 0-100
  PT: number;  // Product Technology (제품기술) 0-100
  PF: number;  // Platform (플랫폼) 0-100
  TO: number;  // Team Organization (팀조직) 0-100
}

// 프로그램 카테고리
export type ProgramCategory =
  | 'government_support'  // 정부지원사업
  | 'tips_rd'            // TIPS/R&D
  | 'investment'         // 투자/IR
  | 'accelerator'        // 액셀러레이터
  | 'global';            // 해외진출

// 상태 타입들
export type ProgramStatus = 'open' | 'closing_soon' | 'closed';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Priority = 'high' | 'medium' | 'low';

// 타입 가드 함수
export const isValidCore5Score = (score: number): boolean => {
  return score >= 0 && score <= 100;
};
```

#### 2-2. 프로그램 및 추천 타입 정의 (10분)
```typescript
// types/program.types.ts
import { Core5Scores, ProgramCategory, ProgramStatus, Difficulty, Priority } from './index';

export interface Program {
  // 기본 정보
  id: string;
  title: string;
  organization: string;        // 주관기관
  hostOrganization?: string;   // 운영기관
  description: string;
  category: ProgramCategory;

  // 매칭 정보
  matchScore: number;          // 0-100
  requiredScores: Partial<Core5Scores>;

  // 지원 정보
  fundingAmount: string;       // "최대 5억원"
  supportDuration?: string;    // "12개월"
  deadline: Date;

  // 상태 정보
  status: ProgramStatus;
  difficulty: Difficulty;
  estimatedPreparationDays: number;

  // 추가 정보
  tags: string[];
  competitionRate?: string;    // "5:1"
  benefits?: string[];
}

// THE ONE 추천 (Program 확장)
export interface TheOneRecommendation extends Program {
  isTheOne: true;
  reasoning: string;           // 추천 이유
  expectedOutcome: string;     // 기대 효과
  preparationTasks: PreparationTask[];
}

// 준비 태스크
export interface PreparationTask {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  estimatedHours: number;
  priority: Priority;
  requiredDocuments?: string[];
  dependencies?: string[];     // 다른 태스크 ID들
}

// 매칭 분석
export interface MatchingAnalysis {
  overallMatch: number;        // 89
  strengths: {
    axes: (keyof Core5Scores)[];
    description: string;
  };
  weaknesses: {
    axes: (keyof Core5Scores)[];
    description: string;
    suggestions: string[];
  };
  reasoning: string;
  expectedOutcome: string;
}
```

#### 2-3. UI 컴포넌트 타입 및 상태 관리 타입 (10분)
```typescript
// types/ui.types.ts
import { Core5Scores, ProgramCategory, Difficulty } from './index';
import { Program, TheOneRecommendation, MatchingAnalysis } from './program.types';

// 필터 옵션
export interface FilterOptions {
  categories?: ProgramCategory[];
  deadlineRange?: 'thisWeek' | 'thisMonth' | 'nextMonth' | 'all';
  fundingRange?: { min?: number; max?: number };
  difficulties?: Difficulty[];
  organizations?: string[];
  minMatchScore?: number;
  searchQuery?: string;
}

// 전체 상태 관리
export interface SmartMatchingState {
  // 사용자 정보
  userScores: Core5Scores;
  userStage?: string;           // 성장단계
  userSector?: string;          // 산업분야

  // 맞춤 추천 데이터
  theOne: TheOneRecommendation | null;
  alternatives: Program[];
  matchingAnalysis: MatchingAnalysis | null;

  // 전체 기회 데이터
  allPrograms: Program[];
  filteredPrograms: Program[];
  filters: FilterOptions;

  // UI 상태
  isLoading: boolean;
  error: string | null;
  activeTab: 'custom' | 'all';
  bookmarkedIds: string[];

  // 정렬 및 페이지네이션
  sortBy: 'matchScore' | 'deadline' | 'fundingAmount';
  sortOrder: 'asc' | 'desc';
  currentPage: number;
  pageSize: number;
}

// 색상 매핑 상수
export const SCORE_COLORS = {
  excellent: '#10B981',  // 85+ (녹색)
  good: '#3B82F6',      // 70-84 (파란색)
  fair: '#F59E0B',      // 55-69 (주황색)
  poor: '#EF4444'       // 0-54 (빨간색)
} as const;

// 카테고리별 아이콘 매핑
export const CATEGORY_ICONS = {
  government_support: 'Building',
  tips_rd: 'Flask',
  investment: 'TrendingUp',
  accelerator: 'Rocket',
  global: 'Globe'
} as const;

// 긴급도 계산 유틸리티
export const getUrgencyLevel = (deadline: Date): 'high' | 'medium' | 'low' => {
  const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 7) return 'high';
  if (daysLeft <= 30) return 'medium';
  return 'low';
};

// 매칭 점수 색상 가져오기
export const getMatchScoreColor = (score: number): string => {
  if (score >= 85) return SCORE_COLORS.excellent;
  if (score >= 70) return SCORE_COLORS.good;
  if (score >= 55) return SCORE_COLORS.fair;
  return SCORE_COLORS.poor;
};
```

**✅ 체크포인트**
1. TypeScript 컴파일 에러 없음
2. 모든 필요한 타입이 정의됨
3. 타입 import/export 체인 정상 작동
4. 유틸리티 함수들 포함

**🚨 트러블슈팅**
- 순환 참조 에러: 타입 파일 분리 확인
- 타입 누락: 각 파일의 import 문 확인
- enum vs union type: union type이 더 유연함

**📁 최종 파일 구조**
```
types/
├── index.ts           # Core 타입들
├── program.types.ts   # 프로그램 관련 타입들
└── ui.types.ts        # UI 및 상태 관리 타입들
```

이 단계를 완료하면 전체 애플리케이션의 타입 시스템이 완성되어 타입 안정성이 보장됩니다.

---

### 📌 3단계: Mock 데이터 (45분)

#### 3-1. 사용자 데이터 및 매칭 엔진 기초 (15분)
```typescript
// data/mockUserData.ts
import { Core5Scores } from '../types';

// Mock 사용자 Core5 점수
export const mockUserScores: Core5Scores = {
  GO: 75,  // 성장기회 - 강점
  EC: 65,  // 실행역량 - 보통
  PT: 80,  // 제품기술 - 강점
  PF: 55,  // 플랫폼 - 약점
  TO: 70   // 팀조직 - 보통
};

// 업계 평균 점수 (레이더 차트용)
export const industryAverageScores: Core5Scores = {
  GO: 65,
  EC: 70,
  PT: 65,
  PF: 60,
  TO: 65
};

// 매칭 점수 계산 함수
export const calculateMatchScore = (
  userScores: Core5Scores,
  requiredScores: Partial<Core5Scores>
): number => {
  const axes = Object.keys(requiredScores) as (keyof Core5Scores)[];
  if (axes.length === 0) return 0;

  let totalScore = 0;
  let totalWeight = 0;

  axes.forEach(axis => {
    const required = requiredScores[axis] || 0;
    const user = userScores[axis];

    // 사용자 점수가 요구사항보다 높으면 100%, 낮으면 비율 계산
    const score = user >= required ? 100 : (user / required) * 100;
    totalScore += score;
    totalWeight += 1;
  });

  return Math.round(totalScore / totalWeight);
};

// 매칭 분석 생성
export const generateMatchingAnalysis = (
  userScores: Core5Scores,
  requiredScores: Partial<Core5Scores>
) => {
  const strengths: (keyof Core5Scores)[] = [];
  const weaknesses: (keyof Core5Scores)[] = [];

  Object.keys(requiredScores).forEach(axis => {
    const key = axis as keyof Core5Scores;
    const gap = userScores[key] - (requiredScores[key] || 0);

    if (gap >= 5) {
      strengths.push(key);
    } else if (gap < 0) {
      weaknesses.push(key);
    }
  });

  return {
    strengths,
    weaknesses,
    overallGap: strengths.length - weaknesses.length
  };
};

// D-Day 계산
export const calculateDaysLeft = (deadline: Date): number => {
  const today = new Date();
  const diff = deadline.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
```

#### 3-2. 실제 프로그램 데이터 구축 (15분)
```typescript
// data/mockPrograms.ts
import { Program, ProgramCategory } from '../types/program.types';

export const mockPrograms: Program[] = [
  {
    id: 'prog-1',
    title: '창업도약패키지',
    organization: '중소벤처기업부',
    hostOrganization: '창업진흥원',
    description: '성장단계 스타트업을 위한 최대 5억원 규모의 종합 지원 프로그램. 사업화 자금과 함께 전문 멘토링, 네트워킹 기회를 제공합니다.',
    category: 'government_support' as ProgramCategory,

    matchScore: 0, // 계산될 예정
    requiredScores: {
      GO: 70,  // 성장기회
      EC: 60,  // 실행역량
      PT: 75,  // 제품기술
      PF: 50,  // 플랫폼
      TO: 65   // 팀조직
    },

    fundingAmount: '최대 5억원',
    supportDuration: '12개월',
    deadline: new Date('2024-10-31'),

    status: 'open',
    difficulty: 'medium',
    estimatedPreparationDays: 14,

    tags: ['정부지원', '성장단계', '자금지원', '멘토링', '네트워킹'],
    competitionRate: '5:1',
    benefits: ['사업화 자금', '전문 멘토링', '네트워킹 기회', '해외진출 지원', '마케팅 지원']
  },
  {
    id: 'prog-2',
    title: 'TIPS 프로그램',
    organization: '중소벤처기업부',
    hostOrganization: '기술보증기금',
    description: 'R&D 중심 기술창업 기업을 위한 최대 3억원 지원. 엔젤투자와 정부 매칭 지원을 통해 기술개발을 집중 지원합니다.',
    category: 'tips_rd' as ProgramCategory,

    matchScore: 0,
    requiredScores: {
      PT: 70,  // 제품기술
      TO: 60,  // 팀조직
      EC: 65   // 실행역량
    },

    fundingAmount: '최대 3억원',
    supportDuration: '24개월',
    deadline: new Date('2024-11-15'),

    status: 'open',
    difficulty: 'hard',
    estimatedPreparationDays: 21,

    tags: ['R&D', '기술개발', 'TIPS', '엔젤투자', '매칭투자'],
    competitionRate: '10:1',
    benefits: ['R&D 자금', '엔젤투자 매칭', '기술멘토링', 'TIPS 타운 입주', '특허 지원']
  },
  {
    id: 'prog-3',
    title: 'K-Startup 그랜드챌린지',
    organization: '중소벤처기업부',
    hostOrganization: 'NIPA',
    description: '글로벌 진출을 목표로 하는 스타트업 액셀러레이팅 프로그램. 해외 진출 전략 수립과 현지 네트워킹을 지원합니다.',
    category: 'accelerator' as ProgramCategory,

    matchScore: 0,
    requiredScores: {
      GO: 75,  // 성장기회
      PF: 60   // 플랫폼
    },

    fundingAmount: '최대 2억원',
    supportDuration: '4개월',
    deadline: new Date('2024-12-01'),

    status: 'open',
    difficulty: 'medium',
    estimatedPreparationDays: 14,

    tags: ['글로벌', '액셀러레이팅', '데모데이', '해외진출', '네트워킹'],
    competitionRate: '8:1',
    benefits: ['액셀러레이팅', '글로벌 네트워킹', '해외 VC 연계', '현지 파트너 매칭']
  },
  {
    id: 'prog-4',
    title: '예비창업패키지',
    organization: '중소벤처기업부',
    hostOrganization: '창업진흥원',
    description: '예비창업자 및 초기창업기업을 위한 사업화 지원 프로그램',
    category: 'government_support' as ProgramCategory,

    matchScore: 0,
    requiredScores: {
      GO: 60,
      EC: 50
    },

    fundingAmount: '최대 1억원',
    supportDuration: '10개월',
    deadline: new Date('2024-09-30'),

    status: 'closing_soon',
    difficulty: 'easy',
    estimatedPreparationDays: 7,

    tags: ['예비창업', '초기단계', '사업화'],
    competitionRate: '3:1',
    benefits: ['사업화 자금', '창업교육', '멘토링']
  },
  {
    id: 'prog-5',
    title: 'Series A 투자유치 프로그램',
    organization: '한국벤처투자',
    hostOrganization: 'KVIC',
    description: 'Series A 단계 투자 유치를 위한 IR 준비 및 VC 매칭',
    category: 'investment' as ProgramCategory,

    matchScore: 0,
    requiredScores: {
      GO: 80,
      EC: 75,
      PF: 70
    },

    fundingAmount: '10억-50억원',
    supportDuration: '6개월',
    deadline: new Date('2025-01-15'),

    status: 'open',
    difficulty: 'hard',
    estimatedPreparationDays: 30,

    tags: ['투자유치', 'Series A', 'VC', 'IR'],
    competitionRate: '20:1',
    benefits: ['VC 네트워킹', 'IR 코칭', '실사 준비 지원']
  },
  {
    id: 'prog-6',
    title: '글로벌 액셀러레이팅',
    organization: 'SparkLabs',
    hostOrganization: 'SparkLabs Korea',
    description: '글로벌 진출을 위한 3개월 집중 액셀러레이팅',
    category: 'accelerator' as ProgramCategory,

    matchScore: 0,
    requiredScores: {
      GO: 70,
      PT: 65,
      PF: 65
    },

    fundingAmount: '5천만원 + 투자옵션',
    supportDuration: '3개월',
    deadline: new Date('2024-11-30'),

    status: 'open',
    difficulty: 'medium',
    estimatedPreparationDays: 14,

    tags: ['액셀러레이터', '글로벌', '멘토링'],
    competitionRate: '15:1',
    benefits: ['Seed 투자', '글로벌 멘토링', 'Demo Day']
  },
  {
    id: 'prog-7',
    title: '소셜벤처 육성사업',
    organization: '한국사회적기업진흥원',
    hostOrganization: '소셜벤처스퀘어',
    description: '사회적 가치를 추구하는 소셜벤처 대상 지원',
    category: 'government_support' as ProgramCategory,

    matchScore: 0,
    requiredScores: {
      GO: 60,
      TO: 70
    },

    fundingAmount: '최대 2억원',
    supportDuration: '12개월',
    deadline: new Date('2024-10-15'),

    status: 'open',
    difficulty: 'easy',
    estimatedPreparationDays: 10,

    tags: ['소셜벤처', '사회적기업', '임팩트'],
    competitionRate: '4:1',
    benefits: ['사업개발비', '임팩트 측정', '판로개척']
  },
  {
    id: 'prog-8',
    title: 'AI 스타트업 챌린지',
    organization: '과학기술정보통신부',
    hostOrganization: 'NIPA',
    description: 'AI 기술 기반 스타트업 육성 프로그램',
    category: 'tips_rd' as ProgramCategory,

    matchScore: 0,
    requiredScores: {
      PT: 85,
      EC: 70,
      TO: 65
    },

    fundingAmount: '최대 3억원',
    supportDuration: '12개월',
    deadline: new Date('2024-12-31'),

    status: 'open',
    difficulty: 'hard',
    estimatedPreparationDays: 21,

    tags: ['AI', '딥테크', 'R&D', '기술개발'],
    competitionRate: '12:1',
    benefits: ['R&D 자금', 'GPU 클라우드', 'AI 전문가 멘토링']
  },
  {
    id: 'prog-9',
    title: '스케일업 프로그램',
    organization: '중소벤처기업부',
    hostOrganization: 'KOSME',
    description: '매출 100억 이상 스케일업 기업 지원',
    category: 'government_support' as ProgramCategory,

    matchScore: 0,
    requiredScores: {
      GO: 85,
      EC: 80,
      PF: 75,
      TO: 75
    },

    fundingAmount: '최대 10억원',
    supportDuration: '24개월',
    deadline: new Date('2024-10-20'),

    status: 'open',
    difficulty: 'hard',
    estimatedPreparationDays: 30,

    tags: ['스케일업', '고성장', '유니콘'],
    competitionRate: '7:1',
    benefits: ['대규모 자금', '글로벌 진출', 'IPO 준비 지원']
  },
  {
    id: 'prog-10',
    title: '청년창업사관학교',
    organization: '중소벤처기업부',
    hostOrganization: '창업진흥원',
    description: '39세 이하 청년창업자 집중 육성',
    category: 'government_support' as ProgramCategory,

    matchScore: 0,
    requiredScores: {
      GO: 55,
      EC: 50,
      TO: 55
    },

    fundingAmount: '최대 1억원',
    supportDuration: '12개월',
    deadline: new Date('2024-09-25'),

    status: 'closing_soon',
    difficulty: 'easy',
    estimatedPreparationDays: 7,

    tags: ['청년창업', '사관학교', '초기창업'],
    competitionRate: '5:1',
    benefits: ['창업공간', '사업화자금', '전담멘토']
  }
];

// 유틸리티 함수들
export const filterProgramsByCategory = (
  programs: Program[],
  category: ProgramCategory
): Program[] => {
  return programs.filter(p => p.category === category);
};

export const sortProgramsByDeadline = (programs: Program[]): Program[] => {
  return [...programs].sort((a, b) =>
    a.deadline.getTime() - b.deadline.getTime()
  );
};

export const sortProgramsByMatchScore = (programs: Program[]): Program[] => {
  return [...programs].sort((a, b) => b.matchScore - a.matchScore);
};

export const getClosingSoonPrograms = (programs: Program[], days: number = 7): Program[] => {
  const today = new Date();
  return programs.filter(p => {
    const daysLeft = Math.ceil((p.deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft <= days && daysLeft > 0;
  });
};
```

#### 3-3. THE ONE 추천 및 준비 태스크 데이터 (15분)
```typescript
// data/mockRecommendations.ts
import { TheOneRecommendation, PreparationTask } from '../types/program.types';
import { mockPrograms } from './mockPrograms';
import { mockUserScores, calculateMatchScore, generateMatchingAnalysis } from './mockUserData';

// 준비 태스크 템플릿
const preparationTaskTemplates: PreparationTask[] = [
  {
    id: 'task-1',
    title: '사업계획서 작성',
    description: '프로그램 양식에 맞춘 사업계획서 업데이트. 비즈니스 모델, 시장분석, 재무계획 포함',
    isCompleted: true,
    estimatedHours: 16,
    priority: 'high',
    requiredDocuments: ['사업자등록증', '주주명부', '정관'],
    dependencies: []
  },
  {
    id: 'task-2',
    title: '재무제표 준비',
    description: '최근 3년간 재무제표 및 세무신고서류. 회계사 확인 필요',
    isCompleted: false,
    estimatedHours: 8,
    priority: 'high',
    requiredDocuments: ['재무상태표', '손익계산서', '현금흐름표', '세무신고서'],
    dependencies: []
  },
  {
    id: 'task-3',
    title: '기술보호 서류',
    description: '특허, 상표권 등 지식재산권 증빙. 기술평가 자료 포함',
    isCompleted: false,
    estimatedHours: 4,
    priority: 'medium',
    requiredDocuments: ['특허증', '상표등록증', '기술평가서'],
    dependencies: ['task-1']
  },
  {
    id: 'task-4',
    title: '팀 구성 증빙',
    description: '핵심 인력 이력서 및 근로계약서',
    isCompleted: false,
    estimatedHours: 3,
    priority: 'medium',
    requiredDocuments: ['이력서', '근로계약서', '4대보험 가입증명'],
    dependencies: []
  },
  {
    id: 'task-5',
    title: '온라인 신청서 작성',
    description: 'K-Startup 포털 온라인 신청서 작성 및 제출',
    isCompleted: false,
    estimatedHours: 2,
    priority: 'low',
    requiredDocuments: ['전자인증서'],
    dependencies: ['task-1', 'task-2', 'task-3', 'task-4']
  }
];

// THE ONE 선정 로직
export const selectTheOne = (): TheOneRecommendation => {
  // 모든 프로그램에 매칭 점수 계산
  const programsWithScores = mockPrograms.map(program => ({
    ...program,
    matchScore: calculateMatchScore(mockUserScores, program.requiredScores)
  }));

  // 최고 매칭 점수 프로그램 선택
  const theOne = programsWithScores.reduce((best, current) =>
    current.matchScore > best.matchScore ? current : best
  );

  // 매칭 분석
  const analysis = generateMatchingAnalysis(mockUserScores, theOne.requiredScores);

  return {
    ...theOne,
    isTheOne: true as const,
    reasoning: `Core5 분석 결과, ${theOne.matchScore}% 매칭도로 최적의 프로그램입니다.
                특히 ${analysis.strengths.join(', ')} 영역에서 강점을 보이고 있어
                ${theOne.title} 지원에 적합합니다.`,
    expectedOutcome: `${theOne.fundingAmount} 지원으로 제품 고도화 및 시장 확장이 가능하며,
                     현재 성장 단계에서 다음 단계로 도약할 수 있는 기회입니다.`,
    preparationTasks: preparationTaskTemplates
  };
};

// 대안 추천 선정 (THE ONE 제외 상위 2-3개)
export const selectAlternatives = (excludeId: string, count: number = 2): Program[] => {
  const programsWithScores = mockPrograms
    .filter(p => p.id !== excludeId)
    .map(program => ({
      ...program,
      matchScore: calculateMatchScore(mockUserScores, program.requiredScores)
    }));

  return programsWithScores
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, count);
};

// 전체 프로그램에 매칭 점수 부여
export const getAllProgramsWithScores = (): Program[] => {
  return mockPrograms.map(program => ({
    ...program,
    matchScore: calculateMatchScore(mockUserScores, program.requiredScores)
  }));
};

// 종합 추천 데이터 생성
export const generateRecommendationData = () => {
  const theOne = selectTheOne();
  const alternatives = selectAlternatives(theOne.id, 2);
  const analysis = generateMatchingAnalysis(mockUserScores, theOne.requiredScores);

  const matchingAnalysis = {
    overallMatch: theOne.matchScore,
    strengths: {
      axes: analysis.strengths,
      description: `${analysis.strengths.join(', ')} 영역에서 요구사항을 충족합니다.`
    },
    weaknesses: {
      axes: analysis.weaknesses,
      description: `${analysis.weaknesses.join(', ')} 영역 보완이 필요합니다.`,
      suggestions: [
        '전문가 멘토링을 통한 역량 강화',
        '팀원 추가 채용 검토',
        '외부 파트너십 구축'
      ]
    },
    reasoning: theOne.reasoning,
    expectedOutcome: theOne.expectedOutcome
  };

  return {
    theOne,
    alternatives,
    matchingAnalysis,
    allPrograms: getAllProgramsWithScores()
  };
};

// 체크리스트 진행률 계산
export const calculateTaskProgress = (tasks: PreparationTask[]): number => {
  const completed = tasks.filter(t => t.isCompleted).length;
  return Math.round((completed / tasks.length) * 100);
};

// 남은 시간 계산
export const calculateRemainingHours = (tasks: PreparationTask[]): number => {
  return tasks
    .filter(t => !t.isCompleted)
    .reduce((sum, task) => sum + task.estimatedHours, 0);
};
```

**✅ 체크포인트**
1. Mock 데이터 10개 이상 프로그램 준비
2. 매칭 점수 계산 로직 정상 작동
3. THE ONE 자동 선정 및 대안 추천
4. 준비 태스크 체크리스트 포함

**🚨 트러블슈팅**
- 날짜 관련 에러: `new Date()` 형식 확인
- 매칭 점수 NaN: 0으로 나누기 체크
- 타입 에러: import 경로 확인

**📁 최종 데이터 파일 구조**
```
data/
├── mockUserData.ts      # 사용자 점수 & 매칭 엔진
├── mockPrograms.ts      # 10개+ 실제 프로그램 데이터
└── mockRecommendations.ts # THE ONE 선정 & 추천 로직
```

이 단계를 완료하면 실제 데이터로 화면을 렌더링할 수 있게 됩니다.

내일 이 문서를 바탕으로 정확히 재구현할 수 있습니다! 💪