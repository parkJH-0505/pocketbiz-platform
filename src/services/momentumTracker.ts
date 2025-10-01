/**
 * MomentumTracker - 실제 사용자 활동 추적 서비스
 *
 * 실제 사용자 행동을 localStorage에 기록하여
 * 모멘텀 엔진이 정확한 데이터를 사용할 수 있도록 함
 */

import { emitKPIUpdate, emitTaskComplete, emitDocumentAccess, emitMomentumChange } from '../hooks/useRealtimeUpdates';
import { momentumCache } from './momentumCache';

// 오늘 날짜 키 생성
const getTodayKey = (): string => {
  return new Date().toDateString();
};

// 세션 시작 시간 설정
export const initializeSession = (): void => {
  if (!localStorage.getItem('session-start-time')) {
    localStorage.setItem('session-start-time', Date.now().toString());
  }
};

// KPI 업데이트 추적
export const trackKpiUpdate = (kpiId?: string): void => {
  const today = getTodayKey();
  const currentCount = parseInt(localStorage.getItem('kpi-updates-today') || '0');
  localStorage.setItem('kpi-updates-today', (currentCount + 1).toString());

  // 디버깅용 로그
  console.log(`[MomentumTracker] KPI 업데이트 추적: ${currentCount + 1}번째${kpiId ? ` (${kpiId})` : ''}`);

  // KPI 점수가 변경된 경우 이전 점수 저장
  const currentKpiScore = localStorage.getItem('kpi-average-score');
  if (currentKpiScore && !localStorage.getItem('kpi-previous-score')) {
    localStorage.setItem('kpi-previous-score', currentKpiScore);
  }

  // 캐시 무효화 - KPI 관련
  momentumCache.invalidate('kpi-');

  // 실시간 이벤트 발생
  emitKPIUpdate(kpiId);
  emitMomentumChange();
};

// 작업 완료 추적
export const trackTaskCompletion = (taskId?: string, projectId?: string): void => {
  const today = getTodayKey();
  const taskKey = `tasks-completed-${today}`;
  const currentCount = parseInt(localStorage.getItem(taskKey) || '0');
  localStorage.setItem(taskKey, (currentCount + 1).toString());

  console.log(`[MomentumTracker] 작업 완료 추적: ${currentCount + 1}번째${taskId ? ` (${taskId})` : ''}`);

  // 프로젝트별 마일스톤 추적
  if (projectId) {
    const milestoneKey = `milestones-completed-${today}`;
    const milestoneCount = parseInt(localStorage.getItem(milestoneKey) || '0');
    localStorage.setItem(milestoneKey, (milestoneCount + 1).toString());

    // 오늘의 총 마일스톤 (하위 호환을 위해 유지)
    const todayMilestoneKey = 'milestones-completed-today';
    const todayMilestoneCount = parseInt(localStorage.getItem(todayMilestoneKey) || '0');
    localStorage.setItem(todayMilestoneKey, (todayMilestoneCount + 1).toString());
  }

  // 캐시 무효화 - 작업/마일스톤 관련
  momentumCache.invalidate('tasks-completed');
  momentumCache.invalidate('milestones-completed');

  // 실시간 이벤트 발생
  emitTaskComplete(taskId, projectId);
  emitMomentumChange();
};

// 문서 접근 추적
export const trackDocumentAccess = (documentId?: string, action: 'view' | 'download' | 'edit' = 'view'): void => {
  const today = getTodayKey();
  const accessKey = 'documents-accessed-today';
  const currentCount = parseInt(localStorage.getItem(accessKey) || '0');
  localStorage.setItem(accessKey, (currentCount + 1).toString());

  console.log(`[MomentumTracker] 문서 접근 추적: ${currentCount + 1}번째 (${action}${documentId ? `, ${documentId}` : ''})`);

  // 액션별 세부 추적 (선택적)
  const actionKey = `documents-${action}-today`;
  const actionCount = parseInt(localStorage.getItem(actionKey) || '0');
  localStorage.setItem(actionKey, (actionCount + 1).toString());

  // 캐시 무효화 - 문서 접근 관련
  momentumCache.invalidate('documents-accessed');

  // 실시간 이벤트 발생
  emitDocumentAccess(documentId, action);
  emitMomentumChange();
};

// 세션 활동 업데이트
export const updateSessionActivity = (): void => {
  const today = getTodayKey();
  const activityKey = `activity-${today}`;

  // 활동 기록 생성/업데이트
  const currentActivity = localStorage.getItem(activityKey);
  if (!currentActivity) {
    localStorage.setItem(activityKey, JSON.stringify({
      date: today,
      actions: 1,
      lastAction: Date.now()
    }));
  } else {
    try {
      const activity = JSON.parse(currentActivity);
      activity.actions += 1;
      activity.lastAction = Date.now();
      localStorage.setItem(activityKey, JSON.stringify(activity));
    } catch (error) {
      // 파싱 실패 시 새로 생성
      localStorage.setItem(activityKey, JSON.stringify({
        date: today,
        actions: 1,
        lastAction: Date.now()
      }));
    }
  }
};

// 목표 설정 추적 (향후 확장용)
export const trackGoalSetting = (goalType: string, goalValue: any): void => {
  console.log(`[MomentumTracker] 목표 설정: ${goalType}`, goalValue);

  // 주간 목표 설정
  if (goalType === 'weekly') {
    localStorage.setItem('weekly-goal-progress', '0'); // 새 목표 시작
    localStorage.setItem('weekly-goal-target', JSON.stringify(goalValue));
    localStorage.setItem('weekly-goal-set-date', Date.now().toString());
  }
};

// 목표 달성 추적
export const trackGoalAchievement = (goalType: string): void => {
  console.log(`[MomentumTracker] 목표 달성: ${goalType}`);

  const achievedKey = 'goals-achieved';
  const currentAchieved = parseInt(localStorage.getItem(achievedKey) || '0');
  localStorage.setItem(achievedKey, (currentAchieved + 1).toString());

  // 전체 목표 수 증가
  const totalKey = 'goals-total';
  const currentTotal = parseInt(localStorage.getItem(totalKey) || '1');
  localStorage.setItem(totalKey, Math.max(currentAchieved + 1, currentTotal).toString());
};

// 일일 통계 조회 (디버깅용)
export const getTodayStats = () => {
  const today = getTodayKey();

  return {
    date: today,
    kpiUpdates: parseInt(localStorage.getItem('kpi-updates-today') || '0'),
    tasksCompleted: parseInt(localStorage.getItem(`tasks-completed-${today}`) || '0'),
    documentsAccessed: parseInt(localStorage.getItem('documents-accessed-today') || '0'),
    milestonesCompleted: parseInt(localStorage.getItem(`milestones-completed-${today}`) || '0'),
    sessionDuration: localStorage.getItem('session-start-time')
      ? Math.floor((Date.now() - parseInt(localStorage.getItem('session-start-time')!)) / (1000 * 60))
      : 0
  };
};

// 세션 시작시 자동 호출
initializeSession();