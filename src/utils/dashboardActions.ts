/**
 * Dashboard Actions Utilities
 *
 * 대시보드 컴포넌트들에서 사용하는 공통 액션 함수들
 * - 이벤트 변환 및 처리
 * - 데이터 변환 유틸리티
 * - 계산 및 분석 함수들
 */

// 축별 라벨 매핑
export const getAxisLabel = (axis: string): string => {
  const labels: Record<string, string> = {
    GO: '사업목표',
    EC: '사업환경',
    PT: '제품기술',
    PF: '성과검증',
    TO: '팀조직'
  };
  return labels[axis] || axis;
};

// 축별 색상 매핑
export const getAxisColor = (axis: string): string => {
  const colors: Record<string, string> = {
    GO: '#3b82f6', // blue
    EC: '#10b981', // green
    PT: '#8b5cf6', // purple
    PF: '#f59e0b', // yellow
    TO: '#ef4444'  // red
  };
  return colors[axis] || '#6b7280';
};

// 카테고리별 라벨 매핑
export const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    'government_support': '정부지원사업',
    'tips_program': 'TIPS/R&D',
    'vc_opportunity': 'VC/투자',
    'accelerator': '액셀러레이터',
    'competition': '공모전/대회',
    'education': '교육/세미나'
  };
  return labels[category] || category;
};

// D-day 계산
export const calculateDDay = (deadline: string | Date): number => {
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const today = new Date();
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// 긴급도 판정
export const getUrgencyLevel = (daysUntilDeadline: number): 'high' | 'medium' | 'low' => {
  if (daysUntilDeadline <= 7) return 'high';
  if (daysUntilDeadline <= 14) return 'medium';
  return 'low';
};

// 점수 변화 계산
export const calculateScoreChange = (current: number, previous: number) => {
  const change = current - previous;
  return {
    value: Math.abs(change),
    trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
    percentage: previous > 0 ? (change / previous) * 100 : 0
  };
};

// 프로젝트 완료율 계산
export const calculateProjectCompletionRate = (activeCount: number, completedCount: number): number => {
  const total = activeCount + completedCount;
  return total > 0 ? (completedCount / total) * 100 : 0;
};

// 긴급 상황 감지
export const detectUrgentSituations = (events: any[], projects: any[], documents: any[]) => {
  const urgentItems = [];

  // 마감임박 이벤트 (D-12 이내)
  const urgentEvents = events.filter(event =>
    event.daysUntilDeadline <= 12 && event.daysUntilDeadline > 0
  );

  urgentItems.push(...urgentEvents.map(event => ({
    type: 'smart_matching_deadline',
    title: event.title,
    deadline: event.daysUntilDeadline,
    priority: event.daysUntilDeadline <= 7 ? 'high' : 'medium',
    action: 'add_to_calendar',
    data: event
  })));

  // 위험 프로젝트 (D-5 이내)
  const riskProjects = projects.filter(project => {
    // TODO: Phase 3에서 실제 getUrgentProjects() 로직 연동
    return false; // 임시
  });

  // VDR 업로드 부족
  const projectsNeedingDocs = projects.filter(project => {
    const projectDocs = documents.filter(doc => doc.projectId === project.id);
    return projectDocs.length < 3;
  });

  return urgentItems.sort((a, b) => (a.deadline || 99) - (b.deadline || 99));
};

// 목표 달성률 계산
export const calculateTargetProgress = (currentScore: number, targetScore: number = 85): number => {
  return Math.min((currentScore / targetScore) * 100, 100);
};

// 성장 모멘텀 분석
export const analyzeGrowthMomentum = (currentScores: Record<string, number>, previousScores: Record<string, number>) => {
  const improvements = [];
  const declines = [];

  Object.entries(currentScores).forEach(([axis, currentScore]) => {
    const previousScore = previousScores[axis] || 0;
    const change = currentScore - previousScore;

    if (change > 0) {
      improvements.push({ axis, change, percentage: (change / previousScore) * 100 });
    } else if (change < 0) {
      declines.push({ axis, change: Math.abs(change), percentage: Math.abs(change / previousScore) * 100 });
    }
  });

  return {
    improvements: improvements.sort((a, b) => b.change - a.change),
    declines: declines.sort((a, b) => b.change - a.change),
    overallTrend: improvements.length > declines.length ? 'positive' :
                  improvements.length < declines.length ? 'negative' : 'neutral'
  };
};

// 디버그 헬퍼 - 실제 데이터 구조 확인용
export const debugDataStructure = (data: any, label: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔍 [DEBUG] ${label} 데이터 구조`);
    console.log('Data:', data);
    console.log('Type:', typeof data);
    if (data && typeof data === 'object') {
      console.log('Keys:', Object.keys(data));
    }
    console.groupEnd();
  }
};